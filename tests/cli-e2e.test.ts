import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { describe, it, expect } from 'vitest';

// These tests require the CLI to be built first
describe.runIf(process.env.CI || process.env.E2E)('CLI E2E', () => {
  it('--help flag shows usage info', async () => {
    const { execSync } = await import('node:child_process');
    const output = execSync('node bin/create-ready-stack.mjs --help', {
      encoding: 'utf-8',
      env: { ...process.env, COREPACK_ENABLE_STRICT: '0' },
    });
    expect(output).toContain('Usage:');
    expect(output).toContain('Commands:');
    expect(output).toContain('init');
  });

  it('--version flag shows version', async () => {
    const { execSync } = await import('node:child_process');
    const output = execSync('node bin/create-ready-stack.mjs --version', {
      encoding: 'utf-8',
      env: { ...process.env, COREPACK_ENABLE_STRICT: '0' },
    });
    expect(output.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('init --help shows init-specific help', async () => {
    const { execSync } = await import('node:child_process');
    const output = execSync('node bin/create-ready-stack.mjs init --help', {
      encoding: 'utf-8',
      env: { ...process.env, COREPACK_ENABLE_STRICT: '0' },
    });
    expect(output).toContain('init');
    expect(output).toContain('Create a new project');
  });

  it('dist/cli.js exists and exports cli function', async () => {
    const mod = await import('../dist/cli.js');
    expect(typeof mod.cli).toBe('function');
  });
});
