import { afterEach, describe, expect, it, vi } from 'vitest';
import { promptCommand } from './prompt.js';

describe('prompt command', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defines command metadata for yargs', () => {
    expect(promptCommand.command).toBe('prompt');
    expect(typeof promptCommand.describe).toBe('string');
    expect(typeof promptCommand.handler).toBe('function');
  });

  it('prints universal English agent launch prompt with defaults', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await promptCommand.handler({});

    expect(logSpy).toHaveBeenCalledTimes(1);
    const output = String(logSpy.mock.calls[0]?.[0] ?? '');
    expect(output).toContain('# Universal Core-First Project Launch Prompt');
    expect(output).toContain('[CORE_INFRA_MANDATE]');
    expect(output).toContain('[ECOSYSTEM_DONOR_MODULES]');
    expect(output).toContain('[EIGHT_INVARIANT_AXES_AND_HARD_GUARDRAILS]');
    expect(output).toContain('[EXECUTION_PROTOCOL]');
  });

  it('prints customized English prompt when CLI options are provided', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await promptCommand.handler({
      template: 'tma',
      name: 'feedflip',
      title: 'FeedFlip',
      domain: 'cards',
      problem: 'Convert saved articles into 90-second micro-learning cards.',
    });

    const output = String(logSpy.mock.calls[0]?.[0] ?? '');
    expect(output).toContain('feedflip');
    expect(output).toContain('FeedFlip');
    expect(output).toContain('tma');
    expect(output).toContain('cards');
    expect(output).toContain('Convert saved articles into 90-second micro-learning cards.');
  });
});
