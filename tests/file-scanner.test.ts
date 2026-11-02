import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanProject } from '../src/scanner/file-scanner.js';

describe('scanner privacy boundaries', () => {
  it('collects safe source and config presence without secret or binary contents', async () => {
    const root = await mkdtemp(join(tmpdir(), 'newskills-scan-'));
    try {
      await writeFile(join(root, 'package.json'), JSON.stringify({ dependencies: { react: '1' }, scripts: { start: 'not-for-output' } }));
      await writeFile(join(root, '.env'), 'PRIVATE-FIXTURE');
      await writeFile(join(root, 'credentials.json'), 'PRIVATE-FIXTURE');
      await writeFile(join(root, 'report.pdf'), 'BINARY-FIXTURE');
      await writeFile(join(root, 'safe.ts'), 'export const value = 1');
      await mkdir(join(root, '.omc'));
      await writeFile(join(root, '.omc/state.json'), 'PRIVATE-RUNTIME');
      const result = await scanProject(root);
      expect(result.dependencies).toEqual(['react']);
      expect(result.scripts).toEqual(['start']);
      expect(result.files.find(file => file.path === 'safe.ts')?.content).toContain('value');
      for (const name of ['.env', 'credentials.json', 'report.pdf']) {
        expect(result.files.find(file => file.path === name)).toBeDefined();
        expect(result.files.find(file => file.path === name)?.content).toBeUndefined();
      }
      expect(JSON.stringify(result)).not.toContain('PRIVATE');
      expect(JSON.stringify(result)).not.toContain('BINARY-FIXTURE');
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  it('does not read linked files, directories or a linked dependency manifest', async () => {
    const root = await mkdtemp(join(tmpdir(), 'newskills-link-'));
    const outside = await mkdtemp(join(tmpdir(), 'newskills-outside-'));
    try {
      await writeFile(join(outside, 'private.ts'), 'OUTSIDE-PRIVATE');
      await writeFile(join(outside, 'package.json'), JSON.stringify({ dependencies: { secretPackage: '1' } }));
      await symlink(join(outside, 'private.ts'), join(root, 'linked.ts'));
      await symlink(outside, join(root, 'linked-dir'));
      await symlink(join(outside, 'package.json'), join(root, 'package.json'));
      const result = await scanProject(root);
      expect(result.dependencies).toEqual([]);
      expect(result.files).toEqual([]);
    } finally { await rm(root, { recursive: true, force: true }); await rm(outside, { recursive: true, force: true }); }
  });
});
