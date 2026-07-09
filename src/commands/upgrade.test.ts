import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Mock inquirer
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

import inquirer from 'inquirer';

// Must import after mock
const { upgradeHandler } = await import('./upgrade.js');

describe('upgradeHandler', () => {
  let tmpDir: string;
  const mockPrompt = vi.mocked(inquirer.prompt);

  beforeEach(() => {
    tmpDir = join(tmpdir(), `upgrade-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    // Change cwd to tmpDir
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('reports no upgradable files when project is not a generated project', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await upgradeHandler(false);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('No upgradable files found'),
    );
    logSpy.mockRestore();
  });

  it('detects existing upgradable files and dry-runs', async () => {
    // Create some upgradable files
    writeFileSync(join(tmpDir, 'biome.json'), '{}');
    writeFileSync(join(tmpDir, 'turbo.json'), '{}');

    mockPrompt
      .mockResolvedValueOnce({ confirm: true })
      .mockResolvedValueOnce({ sections: ['biome.json', 'turbo.json'] });

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await upgradeHandler(false);

    // Should print "would be upgraded" messages (dry-run)
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('would be upgraded'));
    logSpy.mockRestore();
  });

  it('cancels when user declines confirmation', async () => {
    writeFileSync(join(tmpDir, 'biome.json'), '{}');

    mockPrompt.mockResolvedValueOnce({ confirm: false });

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await upgradeHandler(false);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Upgrade cancelled'));
    logSpy.mockRestore();
  });

  it('actually overwrites files when --apply is passed', async () => {
    writeFileSync(join(tmpDir, '.gitignore'), 'old-content');

    mockPrompt
      .mockResolvedValueOnce({ confirm: true })
      .mockResolvedValueOnce({ sections: ['.gitignore'] });

    await upgradeHandler(true);

    const content = readFileSync(join(tmpDir, '.gitignore'), 'utf-8');
    // Should now contain the standard template, not "old-content"
    expect(content).not.toBe('old-content');
    expect(content).toContain('node_modules');
    expect(content).toContain('.DS_Store');
  });
});
