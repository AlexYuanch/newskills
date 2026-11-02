#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { collectPublicFiles } from './public-files.mjs';

// Findings never contain matching text. This is a bounded heuristic, not a secret detector guarantee.
export function scanText(text, markers = []) {
  const rules = [
    ['home-path', /\/(?:Users|home)\/[A-Za-z0-9_.-]+/g],
    ['windows-home', /[A-Z]:\\Users\\[A-Za-z0-9_.-]+/gi],
    ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
    ['token-shape', /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/g],
    ['credential-url', /https?:\/\/[^\s/]+:[^\s/]+@[^\s/]+/g],
    ['secret-assignment', /(?:api[_-]?key|access[_-]?token|password|secret)\s*[:=]\s*["'][A-Za-z0-9_+\/-]{12,}["']/gi],
    ['email', /[A-Za-z0-9_.+%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g],
  ];
  const findings = [];
  for (const [rule, regex] of rules) {
    const hits = [...text.matchAll(regex)].filter(hit => !(rule === 'email' && hit[0] === 'contributors@users.noreply.github.com'));
    if (hits.length) findings.push({ rule, count: hits.length });
  }
  for (const marker of markers.filter(value => typeof value === 'string' && value.length >= 3)) {
    if (text.toLowerCase().includes(marker.toLowerCase())) findings.push({ rule: 'private-marker', count: 1 });
  }
  return findings;
}

export async function auditPublic(root, markers = []) {
  const files = await collectPublicFiles(root);
  const findings = [];
  for (const path of files) {
    const issues = scanText(await readFile(resolve(root, path), 'utf8'), markers);
    if (issues.length) findings.push({ path, issues });
  }
  return { scope: 'public-allowlist', filesChecked: files.length, findings };
}

export function auditHistory(root, markers = []) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  const git = args => execFileSync('git', ['-C', root, ...args], { env, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const commits = git(['rev-list', '--all']).trim().split('\n').filter(Boolean);
  const objects = new Set();
  const findings = [];
  for (const commit of commits) {
    const metadata = git(['show', '-s', '--format=%an%n%ae%n%cn%n%ce%n%B', commit]);
    const issues = scanText(metadata, markers);
    if (issues.length) findings.push({ commit: commit.slice(0, 12), kind: 'commit-metadata', issues });
    const tree = git(['ls-tree', '-rz', commit]).split('\0').filter(Boolean);
    for (const row of tree) {
      const [meta, path] = row.split('\t');
      const [mode, type, oid] = meta.split(' ');
      if (type !== 'blob' || objects.has(oid)) continue;
      objects.add(oid);
      if (mode === '120000') findings.push({ commit: commit.slice(0, 12), path, issues: [{ rule: 'symlink', count: 1 }] });
      const contentIssues = scanText(git(['cat-file', 'blob', oid]), markers);
      if (contentIssues.length) findings.push({ commit: commit.slice(0, 12), path, issues: contentIssues });
      if (/(?:^|\/)(?:\.omc|\.env(?:\.[^/]*)?|\.ssh|credentials)(?:\/|$)/.test(path)) {
        findings.push({ commit: commit.slice(0, 12), path, issues: [{ rule: 'private-runtime-path', count: 1 }] });
      }
    }
  }
  return { scope: 'reachable-git-history', commitsChecked: commits.length, blobsChecked: objects.size, findings };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    const index = args.indexOf('--root');
    const root = resolve(index < 0 ? '.' : args[index + 1]);
    const markers = process.env.NEWSKILLS_PRIVATE_MARKERS ? JSON.parse(process.env.NEWSKILLS_PRIVATE_MARKERS) : [];
    if (!Array.isArray(markers)) throw new Error('Invalid markers');
    const reports = [await auditPublic(root, markers)];
    if (args.includes('--history')) reports.push(auditHistory(root, markers));
    process.stdout.write(JSON.stringify({ reports, limits: 'Heuristic scan; ignored runtime state and unreachable Git objects are outside the default scope. No secret values are printed.' }, null, 2) + '\n');
    if (reports.some(report => report.findings.length)) process.exitCode = 1;
  } catch {
    process.stderr.write('Privacy scan failed; check project, marker format and Git availability.\n');
    process.exitCode = 2;
  }
}
