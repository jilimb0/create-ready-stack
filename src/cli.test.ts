import { describe, it, expect } from 'vitest';

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
});
