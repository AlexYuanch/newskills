import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { scanText, auditPublic, auditHistory } from '../scripts/privacy-check.mjs';
import { preparePublic } from '../scripts/prepare-public.mjs';
import { collectPublicFiles } from '../scripts/public-files.mjs';

const dirs: string[] = [];
afterEach(async () => { await Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true }))); });
async function fixture() {
  const base = await mkdtemp(join(tmpdir(), 'newskills-public-')); dirs.push(base);
  const root = join(base, 'source'); await mkdir(root);
  await writeFile(join(root, 'README.md'), '# Public fixture\n');
  await mkdir(join(root, '.omc')); await writeFile(join(root, '.omc/state.json'), 'LOCAL-RUNTIME');
  return { root, output: join(base, 'public'), base };
}

describe('public export privacy', () => {
  it('reports issue classes without leaking matched secret values', () => {
    const secret = 'gh' + 'p_' + 'X'.repeat(36);
    const report = scanText(secret + ' identity-marker', ['identity-marker']);
    expect(report.map(issue => issue.rule)).toContain('token-shape');
    expect(report.map(issue => issue.rule)).toContain('private-marker');
    expect(JSON.stringify(report)).not.toContain(secret);
    expect(JSON.stringify(report)).not.toContain('identity-marker');
  });
  it('exports only allowlisted files with one generic commit and no remote or old state', async () => {
    const { root, output } = await fixture();
    await mkdir(join(root, '.git')); await writeFile(join(root, '.git/local-private'), 'OLD-HISTORY');
    const result = await preparePublic({ root, output, initializeGit: true });
    expect(result.inheritedHistory).toBe(false);
    expect((await readdir(output)).sort()).toEqual(['.git', 'README.md']);
    const git = (args: string[]) => execFileSync('git', ['-C', output, ...args], { encoding: 'utf8' }).trim();
    expect(git(['rev-list', '--count', 'HEAD'])).toBe('1');
    expect(git(['remote', '-v'])).toBe('');
    expect(git(['log', '-1', '--format=%an'])).toBe('NewSkills Contributors');
    expect(auditHistory(output).findings).toEqual([]);
  });
  it('fails on privacy findings without producing a partial export', async () => {
    const { root, output, base } = await fixture();
    await writeFile(join(root, 'README.md'), 'not-for-release-marker');
    await expect(preparePublic({ root, output, markers: ['not-for-release-marker'] })).rejects.toThrow();
    expect(await readdir(base)).not.toContain('public');
  });
  it('never overwrites or deletes an existing output', async () => {
    const { root, output } = await fixture();
    await mkdir(output); await writeFile(join(output, 'keep'), 'existing');
    await expect(preparePublic({ root, output })).rejects.toThrow();
    expect(await readFile(join(output, 'keep'), 'utf8')).toBe('existing');
  });
  it('rejects a disguised path inside source and source links', async () => {
    const { root, base } = await fixture();
    await expect(preparePublic({ root, output: join(root, '..inside') })).rejects.toThrow();
    await symlink(root, join(base, 'linked-parent'));
    await expect(preparePublic({ root, output: join(base, 'linked-parent/nested') })).rejects.toThrow();
    await mkdir(join(root, 'docs')); await symlink(join(root, 'README.md'), join(root, 'docs/linked.md'));
    await expect(collectPublicFiles(root)).rejects.toThrow();
  });
  it('rejects secret-bearing files nested inside allowed directories', async () => {
    const { root } = await fixture();
    await mkdir(join(root, 'docs')); await writeFile(join(root, 'docs/.env'), 'short-value');
    await expect(auditPublic(root)).rejects.toThrow();
  });
});
