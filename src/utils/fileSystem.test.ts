import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isDirectoryEmpty } from './fileSystem.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'crs-fs-'));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe('isDirectoryEmpty', () => {
  it('returns true for empty directory', () => {
    expect(isDirectoryEmpty(tmpDir)).toBe(true);
  });

  it('returns false for directory with files', async () => {
    await fs.writeFile(path.join(tmpDir, 'test.txt'), 'content');
    expect(isDirectoryEmpty(tmpDir)).toBe(false);
  });

  it('ignores dotfiles when checking emptiness', async () => {
    await fs.writeFile(path.join(tmpDir, '.hidden'), 'content');
    expect(isDirectoryEmpty(tmpDir)).toBe(true);
  });

  it('does not ignore .git directory', async () => {
    const gitDir = path.join(tmpDir, '.git');
    await fs.ensureDir(gitDir);
    await fs.writeFile(path.join(gitDir, 'HEAD'), 'ref: refs/heads/main');
    expect(isDirectoryEmpty(tmpDir)).toBe(false);
  });

  it('returns true for non-existent directory', () => {
    expect(isDirectoryEmpty(path.join(tmpDir, 'nonexistent'))).toBe(true);
  });
});
