#!/usr/bin/env node
import { readFile, mkdir, lstat, realpath, rename, writeFile, unlink } from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';

const paths = {
  codex: { skill: '.agents/skills/skill-scout', config: '.codex/hooks.json' },
  'claude-code': { skill: '.claude/skills/skill-scout', config: '.claude/settings.local.json' },
};
const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function mergeHook(config, command, remove = false) {
  if (!object(config) || (config.hooks !== undefined && !object(config.hooks))) throw new Error('Invalid config');
  const next = structuredClone(config);
  const hooks = next.hooks ?? {};
  const groups = hooks.UserPromptSubmit ?? [];
  if (!Array.isArray(groups) || groups.some(group => !object(group) || !Array.isArray(group.hooks) || group.hooks.some(hook => !object(hook)))) {
    throw new Error('Invalid hook entries');
  }
  if (remove) {
    hooks.UserPromptSubmit = groups.map(group => ({ ...group, hooks: group.hooks.filter(hook => hook.command !== command) }))
      .filter(group => group.hooks.length > 0);
    if (hooks.UserPromptSubmit.length === 0) delete hooks.UserPromptSubmit;
  } else if (!groups.some(group => group.hooks.some(hook => hook.type === 'command' && hook.command === command))) {
    hooks.UserPromptSubmit = [...groups, { hooks: [{ type: 'command', command, timeout: 3 }] }];
  }
  if (Object.keys(hooks).length > 0 || next.hooks !== undefined) next.hooks = hooks;
  return next;
}

async function inside(project, path) {
  // Reject linked config ancestors and linked files, including links back inside the project.
  const rel = relative(project, path);
  if (rel.startsWith(`..${sep}`) || rel === '..' || isAbsolute(rel)) throw new Error('Outside project');
  let cursor = project;
  for (const part of rel.split(sep)) {
    cursor = resolve(cursor, part);
    try { if ((await lstat(cursor)).isSymbolicLink()) throw new Error('Linked path not allowed'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

export async function configure({ project, hosts, apply = false, remove = false }) {
  if (!Array.isArray(hosts) || !hosts.length || hosts.some(host => !paths[host])) throw new Error('Unknown host');
  const root = await realpath(resolve(project));
  if (!(await lstat(root)).isDirectory()) throw new Error('Project must be a directory');
  const plans = [];
  for (const host of [...new Set(hosts)]) {
    const configPath = resolve(root, paths[host].config);
    const script = resolve(root, paths[host].skill, 'scripts/context-hook.mjs');
    await inside(root, configPath);
    await inside(root, script);
    if (!remove) {
      if (!(await lstat(script)).isFile() || !(await lstat(resolve(root, paths[host].skill, 'SKILL.md'))).isFile()) throw new Error('Install skill first');
    }
    let content = null;
    try { content = await readFile(configPath, 'utf8'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const config = content === null ? {} : JSON.parse(content);
    const command = `node ${quote(script)}`;
    const result = mergeHook(config, command, remove);
    plans.push({ host, configPath, previous: content, config: result, command });
  }
  // Validate every target before applying any mutation.
  if (apply) {
    for (const plan of plans) {
      await inside(root, plan.configPath);
      let current = null;
      try { current = await readFile(plan.configPath, 'utf8'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (current !== plan.previous) throw new Error('Config changed; preview again');
    }
    for (const plan of plans) {
      if (JSON.stringify(plan.config) === JSON.stringify(plan.previous === null ? {} : JSON.parse(plan.previous))) continue;
      await mkdir(dirname(plan.configPath), { recursive: true });
      const temporary = `${plan.configPath}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporary, JSON.stringify(plan.config, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
        await rename(temporary, plan.configPath);
      } finally { await unlink(temporary).catch(() => {}); }
    }
  }
  return plans.map(({ host, configPath, command }) => ({ host, configPath,
    event: 'UserPromptSubmit', command, timeout: 3, remove, applied: apply }));
}

export async function runCli(args = process.argv.slice(2)) {
  const value = key => { const i = args.indexOf(key); return i < 0 ? undefined : args[i + 1]; };
  const host = value('--host');
  const project = value('--project');
  if (!project || !host || !['codex', 'claude-code', 'both'].includes(host)) {
    process.stderr.write('Usage: node scripts/configure-hooks.mjs --host codex|claude-code|both --project PATH [--apply] [--remove]\n');
    process.exitCode = 1;
  } else {
    try {
      const plans = await configure({ project, hosts: host === 'both' ? ['codex', 'claude-code'] : [host], apply: args.includes('--apply'), remove: args.includes('--remove') });
      process.stdout.write(JSON.stringify(plans, null, 2) + '\n');
    } catch {
      process.stderr.write('Configuration failed. Check installed skills, JSON format, linked paths and permissions. No global configuration was requested.\n');
      process.exitCode = 1;
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await runCli();
