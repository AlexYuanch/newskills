#!/usr/bin/env node
import { cp, mkdir, lstat, rm, realpath } from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute, sep, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { collectPublicFiles } from './public-files.mjs';
import { auditPublic, auditHistory } from './privacy-check.mjs';

export async function preparePublic({ root, output, initializeGit = false, markers = [] }) {
  root = await realpath(resolve(root)); output = resolve(output);
  // Require a real existing parent; canonicalize it before testing containment.
  output = resolve(await realpath(dirname(output)), basename(output));
  const rel = relative(root, output);
  if (!(rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel))) throw new Error('Output must be outside source');
  try { await lstat(output); throw new Error('Output already exists'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const audit = await auditPublic(root, markers);
  if (audit.findings.length) throw new Error('Resolve public privacy findings first');
  const files = await collectPublicFiles(root);
  await mkdir(output);
  let completed = false;
  try {
    for (const file of files) {
      await mkdir(dirname(resolve(output, file)), { recursive: true });
      await cp(resolve(root, file), resolve(output, file), { dereference: false });
    }
    if ((await auditPublic(output, markers)).findings.length) throw new Error('Export audit failed');
    if (initializeGit) {
      // Isolated config: do not inherit user identity, signing, hooks, templates or remotes.
      const baseEnvironment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
      const env = { ...baseEnvironment, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
        GIT_AUTHOR_NAME: 'NewSkills Contributors', GIT_AUTHOR_EMAIL: 'contributors@users.noreply.github.com',
        GIT_COMMITTER_NAME: 'NewSkills Contributors', GIT_COMMITTER_EMAIL: 'contributors@users.noreply.github.com' };
      const git = args => execFileSync('git', ['-C', output, '-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', ...args], { env, stdio: 'pipe' });
      git(['init', '--initial-branch=main', '--template=']);
      git(['add', '--all']);
      git(['commit', '-m', 'Initial public release']);
      if (auditHistory(output, markers).findings.length) throw new Error('Export history audit failed');
    }
    completed = true;
    return { files: files.length, initializedGit: initializeGit, inheritedHistory: false, remoteConfigured: false };
  } finally {
    if (!completed) await rm(output, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const index = process.argv.indexOf('--output');
    if (index < 0 || !process.argv[index + 1]) throw new Error('Output required');
    const root = fileURLToPath(new URL('../', import.meta.url));
    const markers = process.env.NEWSKILLS_PRIVATE_MARKERS ? JSON.parse(process.env.NEWSKILLS_PRIVATE_MARKERS) : [];
    if (!Array.isArray(markers)) throw new Error('Invalid markers');
    const result = await preparePublic({ root, output: process.argv[index + 1], initializeGit: process.argv.includes('--git'), markers });
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch {
    process.stderr.write('Public export failed. Use a new output directory outside this repository and resolve privacy findings.\n');
    process.exitCode = 1;
  }
}
