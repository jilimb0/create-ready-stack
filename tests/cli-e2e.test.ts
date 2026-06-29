import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { describe, it, expect, beforeAll } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distCliPath = resolve(__dirname, '../dist/cli.js');
const distBuilt = existsSync(distCliPath);

describe.runIf(distBuilt && (process.env.CI || process.env.E2E))('CLI E2E', () => {
  beforeAll(() => {
    if (!existsSync(distCliPath)) {
      execSync('pnpm build', { stdio: 'inherit', env: { ...process.env, COREPACK_ENABLE_STRICT: '0' } });
    }
  });

  it('--help flag shows usage info', () => {
    const output = execSync('node bin/create-ready-stack.mjs --help', {
      encoding: 'utf-8',
      env: { ...process.env, COREPACK_ENABLE_STRICT: '0' },
    });
    expect(output).toContain('Usage:');
    expect(output).toContain('init');
  });

  it('--version flag shows version', () => {
    const output = execSync('node bin/create-ready-stack.mjs --version', {
      encoding: 'utf-8',
      env: { ...process.env, COREPACK_ENABLE_STRICT: '0' },
    });
    expect(output.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('init --help shows init-specific help', () => {
    const output = execSync('node bin/create-ready-stack.mjs init --help', {
      encoding: 'utf-8',
      env: { ...process.env, COREPACK_ENABLE_STRICT: '0' },
    });
    expect(output).toContain('init');
    expect(output).toContain('Create a new project');
  });

  it('dist/cli.js exists and exports cli function', async () => {
    expect(existsSync(distCliPath)).toBe(true);
    const content = readFileSync(distCliPath, 'utf-8');
    expect(content).toContain('cli');
    const require = createRequire(distCliPath);
    const mod = require(distCliPath);
    expect(typeof mod.cli).toBe('function');
  });
});
