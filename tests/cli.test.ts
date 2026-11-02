import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';

describe('offline CLI machine-readable output', () => {
  it('emits pure JSON and applies result limits and low-confidence visibility', async () => {
    const root = await mkdtemp(join(tmpdir(), 'newskills-cli-'));
    try {
      await writeFile(join(root, 'package.json'), JSON.stringify({ dependencies: { react: '1', d3: '1', playwright: '1' } }));
      await writeFile(join(root, 'app.tsx'), 'export const x = 1');
      const run = (args: string[]) => JSON.parse(execFileSync(process.execPath, [resolve('node_modules/tsx/dist/cli.mjs'), resolve('src/index.ts'), root, '--json', ...args], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }));
      const result = run(['--limit', '1']);
      expect(result.skills).toHaveLength(1);
      expect(result.candidatesVerified).toBe(false);
      expect(run([]).skills.every((skill: { confidence: string }) => skill.confidence !== 'low')).toBe(true);
      expect(run(['--all']).skills.length).toBeGreaterThanOrEqual(run([]).skills.length);
      const invalid = spawnSync(process.execPath, [resolve('node_modules/tsx/dist/cli.mjs'), resolve('src/index.ts'), root, '--limit', 'NaN']);
      expect(invalid.status).not.toBe(0);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});
