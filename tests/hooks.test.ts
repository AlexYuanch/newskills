import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, mkdir, cp, readFile, writeFile, readdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { configure, mergeHook } from '../scripts/configure-hooks.mjs';
import { hookOutput } from '../.agents/skills/skill-scout/scripts/context-hook.mjs';

const dirs: string[] = [];
afterEach(async () => { await Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true }))); });
async function project() {
  const root = await mkdtemp(join(tmpdir(), "newskills test 'quoted-")); dirs.push(root);
  for (const hostDir of ['.agents', '.claude']) {
    await mkdir(join(root, hostDir, 'skills'), { recursive: true });
    await cp(resolve('.agents/skills/skill-scout'), join(root, hostDir, 'skills/skill-scout'), { recursive: true });
  }
  return root;
}

describe('shared hook protocol', () => {
  it('returns fixed additionalContext without reflecting prompts or transcript paths', () => {
    const output = hookOutput({ hook_event_name: 'UserPromptSubmit', prompt: 'DO-NOT-REFLECT-PRIVATE-TEXT', transcript_path: '/private/not-real' });
    expect(output.hookSpecificOutput.hookEventName).toBe('UserPromptSubmit');
    expect(JSON.stringify(output)).not.toContain('DO-NOT-REFLECT');
    expect(JSON.stringify(output)).not.toContain('/private/not-real');
    expect(hookOutput({ hook_event_name: 'PostToolUse', prompt: 'x' })).toEqual({});
  });
  it('fails open for malformed, oversized and missing-event input without logs', () => {
    const script = resolve('.agents/skills/skill-scout/scripts/context-hook.mjs');
    for (const input of ['{', '{}', JSON.stringify({ hook_event_name: 'Other', prompt: 'x' }), 'x'.repeat(1024 * 1024 + 1)]) {
      const text = execFileSync(process.execPath, [script], { input, encoding: 'utf8', timeout: 3000 });
      expect(JSON.parse(text)).toEqual({});
    }
  });
});

describe('project-only configuration', () => {
  it('merges idempotently and removes only its own command', () => {
    const config = { env: { privateValue: 'keep-in-file' }, hooks: { Stop: [{ hooks: [] }], UserPromptSubmit: [{ hooks: [{ type: 'command', command: 'other' }] }] } };
    const merged = mergeHook(config, 'ours');
    expect(merged.hooks.UserPromptSubmit).toHaveLength(2);
    expect(mergeHook(merged, 'ours')).toEqual(merged);
    expect(mergeHook(merged, 'ours', true)).toEqual(config);
    expect(config.hooks.UserPromptSubmit).toHaveLength(1);
    expect(() => mergeHook({ hooks: { UserPromptSubmit: {} } }, 'ours')).toThrow();
  });
  it('previews without writing, applies both hosts, runs their commands and restores others', async () => {
    const root = await project();
    const path = join(root, '.claude/settings.local.json');
    const config = { env: { privateValue: 'do-not-print-unchanged-config' }, hooks: { Stop: [] } };
    await writeFile(path, JSON.stringify(config));
    const before = await readdir(root);
    const preview = await configure({ project: root, hosts: ['codex', 'claude-code'] });
    expect(await readdir(root)).toEqual(before);
    expect(JSON.stringify(preview)).not.toContain('do-not-print-unchanged-config');
    expect(await readFile(path, 'utf8')).toBe(JSON.stringify(config));
    await configure({ project: root, hosts: ['codex', 'claude-code'], apply: true });
    for (const configPath of ['.codex/hooks.json', '.claude/settings.local.json']) {
      const json = JSON.parse(await readFile(join(root, configPath), 'utf8'));
      const command = json.hooks.UserPromptSubmit[0].hooks[0].command;
      const output = execFileSync('/bin/sh', ['-c', command], { input: JSON.stringify({ hook_event_name: 'UserPromptSubmit', prompt: 'private' }), encoding: 'utf8', timeout: 3000 });
      expect(JSON.parse(output).hookSpecificOutput.hookEventName).toBe('UserPromptSubmit');
    }
    await configure({ project: root, hosts: ['codex', 'claude-code'], apply: true });
    expect(JSON.parse(await readFile(path, 'utf8')).hooks.UserPromptSubmit).toHaveLength(1);
    await configure({ project: root, hosts: ['codex', 'claude-code'], apply: true, remove: true });
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual(config);
  });
  it('rejects linked config directories and does not overwrite invalid JSON', async () => {
    const root = await project();
    await symlink(join(root, '.claude'), join(root, '.codex'));
    await expect(configure({ project: root, hosts: ['codex'], apply: true })).rejects.toThrow();
    const path = join(root, '.claude/settings.local.json');
    await writeFile(path, '{invalid');
    await expect(configure({ project: root, hosts: ['claude-code'], apply: true })).rejects.toThrow();
    expect(await readFile(path, 'utf8')).toBe('{invalid');
  });
});
