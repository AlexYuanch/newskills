#!/usr/bin/env node
import { cp, readFile, readdir, mkdir } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = resolve(root, '.agents/skills/skill-scout');
const target = resolve(root, '.claude/skills/skill-scout');
async function files(dir) {
  const list = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isSymbolicLink()) throw new Error('Skill source must not contain symlinks');
    if (item.isDirectory()) list.push(...await files(path));
    else list.push(path);
  }
  return list;
}
try {
  const check = process.argv.includes('--check');
  const sourceFiles = await files(source);
  if (check) {
    const targetFiles = await files(target);
    if (targetFiles.length !== sourceFiles.length) throw new Error('Skill copies differ');
    for (const path of sourceFiles) {
      const other = await readFile(resolve(target, relative(source, path)));
      if (!(await readFile(path)).equals(other)) throw new Error('Skill copies differ');
    }
    process.stdout.write('Skill copies are synchronized.\n');
  } else {
    await mkdir(target, { recursive: true });
    await cp(source, target, { recursive: true, force: true });
    process.stdout.write('Updated Claude Code skill from the canonical source.\n');
  }
} catch {
  process.stderr.write('Skill sync failed; check source, destination and stale files.\n');
  process.exitCode = 1;
}
