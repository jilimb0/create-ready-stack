import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { afterEach, describe, expect, it, vi } from 'vitest';

const tempDirs: string[] = [];

afterEach(async () => {
  vi.unstubAllGlobals();
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) await fs.remove(dir);
  }
});

describe('CLI', () => {
  it('exports cli function', async () => {
    const mod = await import('./cli.js');
    expect(typeof mod.cli).toBe('function');
  });

  it('defines command structure correctly', async () => {
    const { initCommand } = await import('./commands/init.js');
    expect(initCommand.command).toBe('init');
    expect(typeof initCommand.describe).toBe('string');
    expect(typeof initCommand.handler).toBe('function');
  });

  it('parses --with-mcp flag in headless --agent init flow', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'crs-cli-mcp-'));
    tempDirs.push(tmpDir);
    const prevArgv = process.argv;
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    vi.stubGlobal('process', {
      ...process,
      cwd: () => tmpDir,
      argv: [
        'node',
        'create-ready-stack',
        'init',
        '--agent',
        '--template',
        'saas',
        '--with-mcp',
        '--name',
        'cli-mcp-saas',
        '--title',
        'CLI MCP SaaS',
      ],
    });

    try {
      const { cli } = await import('./cli.js');
      await cli();

      expect(
        await fs.pathExists(
          path.join(tmpDir, 'cli-mcp-saas', 'packages', 'mcp', 'src', 'server.ts'),
        ),
      ).toBe(true);
      expect(
        await fs.pathExists(
          path.join(tmpDir, 'cli-mcp-saas', 'apps', 'web', 'app', 'dashboard', 'page.tsx'),
        ),
      ).toBe(true);
    } finally {
      process.argv = prevArgv;
      logSpy.mockRestore();
    }
  });
});
