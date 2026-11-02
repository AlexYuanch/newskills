import { lstat, readdir } from 'node:fs/promises';
import { resolve, relative, join, sep } from 'node:path';

export const PUBLIC_ENTRIES = [
  '.agents/skills/skill-scout', '.claude/skills/skill-scout', '.gitignore',
  'src', 'tests', 'scripts', 'docs', 'README.md', 'ARCHITECTURE.md', 'PRIVACY.md',
  'LICENSE', 'package.json', 'package-lock.json', 'tsconfig.json', 'vitest.config.ts',
];

export async function collectPublicFiles(root) {
  const files = [];
  const walk = async path => {
    const rel = relative(root, path).split(sep).join('/');
    if (rel.split('/').some(part => /^(?:\.git|\.omc|node_modules|\.env(?:\..*)?|credentials(?:\..*)?|secrets?(?:\..*)?)$/i.test(part)) ||
        /\.(?:pem|key|p12|pfx|log|zip|tgz)$/i.test(rel)) throw new Error('Private or generated file in public allowlist');
    const info = await lstat(path);
    if (info.isSymbolicLink()) throw new Error('Public export rejects symlinks');
    if (info.isDirectory()) {
      for (const name of (await readdir(path)).sort()) await walk(join(path, name));
    } else if (info.isFile()) files.push(relative(root, path).split(sep).join('/'));
    else throw new Error('Public export requires regular files');
  };
  for (const entry of PUBLIC_ENTRIES) {
    const path = resolve(root, entry);
    try { await walk(path); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return files.sort();
}
