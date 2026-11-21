import { describe, expect, it } from 'vitest';
import {
  AI_AGENT_ENV_KEYS,
  buildProjectAgentsMd,
  buildProjectClaudeMd,
  buildUniversalAgentPrompt,
  detectActiveAgentName,
  ECOSYSTEM_DONOR_CATALOG,
  isAiAgentEnvironment,
} from './agentPrompt.js';

describe('agentPrompt', () => {
  describe('AI agent environment detection', () => {
    it('exports expected AI agent environment variable keys', () => {
      expect(AI_AGENT_ENV_KEYS).toContain('AI_AGENT');
      expect(AI_AGENT_ENV_KEYS).toContain('CLAUDECODE');
      expect(AI_AGENT_ENV_KEYS).toContain('ANTIGRAVITY_AGENT');
      expect(AI_AGENT_ENV_KEYS).toContain('CURSOR_AGENT');
      expect(AI_AGENT_ENV_KEYS).toContain('OPENCODE');
      expect(AI_AGENT_ENV_KEYS).toContain('CODEX_CLI');
      expect(AI_AGENT_ENV_KEYS).toContain('AIDER');
    });

    it('returns false on clean env when explicitFlag is false', () => {
      expect(isAiAgentEnvironment({}, false)).toBe(false);
    });

    it('returns true when explicitFlag is true even on clean env', () => {
      expect(isAiAgentEnvironment({}, true)).toBe(true);
    });

    it('detects truthy AI agent environment variables and ignores falsy values', () => {
      expect(isAiAgentEnvironment({ CLAUDECODE: '1' })).toBe(true);
      expect(isAiAgentEnvironment({ ANTIGRAVITY_AGENT: 'true' })).toBe(true);
      expect(isAiAgentEnvironment({ CURSOR_AGENT: '1' })).toBe(true);
      expect(isAiAgentEnvironment({ AI_AGENT: '0' })).toBe(false);
      expect(isAiAgentEnvironment({ CLAUDE_CODE: 'false' })).toBe(false);
      expect(isAiAgentEnvironment({ OPENCODE: '' })).toBe(false);
    });

    it('identifies active agent name accurately', () => {
      expect(detectActiveAgentName({})).toBe('human');
      expect(detectActiveAgentName({ ANTIGRAVITY_AGENT: '1' })).toBe('antigravity');
      expect(detectActiveAgentName({ ANTIGRAVITY_CLI: '1' })).toBe('antigravity');
      expect(detectActiveAgentName({ CLAUDECODE: '1' })).toBe('claude-code');
      expect(detectActiveAgentName({ CLAUDE_CODE: '1' })).toBe('claude-code');
      expect(detectActiveAgentName({ CURSOR_AGENT: '1' })).toBe('cursor');
      expect(detectActiveAgentName({ CURSOR_TRACE_ID: 'abc' })).toBe('cursor');
      expect(detectActiveAgentName({ OPENCODE: '1' })).toBe('opencode');
      expect(detectActiveAgentName({ CODEX_CLI: '1' })).toBe('codex');
      expect(detectActiveAgentName({ AIDER: '1' })).toBe('aider');
      expect(detectActiveAgentName({ AI_AGENT: '1' })).toBe('generic-ai-agent');
    });
  });

  describe('ECOSYSTEM_DONOR_CATALOG', () => {
    it('covers core-infra and domain donors', () => {
      const donorNames = ECOSYSTEM_DONOR_CATALOG.map((item) => item.donors).join(' ');
      expect(donorNames).toContain('create-ready-stack');
      expect(donorNames).toContain('UI-Library');
      expect(donorNames).toContain('TGWrapper');
      expect(donorNames).toContain('udpa-engine');
      expect(donorNames).toContain('Trader');
      expect(donorNames).toContain('C&TLab');
      expect(donorNames).toContain('service-app');
      expect(donorNames).toContain('Converter');
      expect(donorNames).toContain('Speech');
      expect(donorNames).toContain('MyPersFin');
      expect(donorNames).toContain('Wishlist');
      expect(donorNames).toContain('portfolio');
    });
  });

  describe('buildUniversalAgentPrompt', () => {
    it('builds complete English universal prompt with placeholders and zero-prompt startup', () => {
      const prompt = buildUniversalAgentPrompt();
      expect(prompt).toContain('[ZERO_PROMPT_AUTONOMOUS_STARTUP]');
      expect(prompt).toContain('[PROJECT_CONTEXT]');
      expect(prompt).toContain('[CORE_INFRA_MANDATE]');
      expect(prompt).toContain('[ECOSYSTEM_DONOR_MODULES]');
      expect(prompt).toContain('[EIGHT_INVARIANT_AXES_AND_HARD_GUARDRAILS]');
      expect(prompt).toContain('[EXECUTION_PROTOCOL]');
      expect(prompt).toContain('<project-slug>');
      expect(prompt).toContain('<Project Title>');
      expect(prompt).toContain('Discovered Product Specs:');
      expect(prompt).toContain('@ui-construction-library/core');
      expect(prompt).toContain('@tgwrapper/core');
      expect(prompt).toContain('jilimb0/udpa-engine@v1');
      expect(prompt).toContain('Axis 1');
      expect(prompt).toContain('Axis 8');
      expect(prompt).toContain('Phase 1');
      expect(prompt).toContain('Phase 4');
    });

    it('interpolates project context and discoveredSpecs when provided', () => {
      const prompt = buildUniversalAgentPrompt({
        projectName: 'feedflip',
        projectTitle: 'FeedFlip',
        format: 'tma',
        backendFramework: 'hono',
        orm: 'drizzle',
        frontend: 'vite-spa',
        coreDomain: 'learning_cards',
        problem: 'Turn passive bookmarks into 90-second active recall decks.',
        targetAudience: 'Engineers and founders',
        functionsV1: 'Deck feed, FSRS review, BYOC export',
        discoveredSpecs: ['mvp.md', '40.md'],
      });

      expect(prompt).toContain('feedflip');
      expect(prompt).toContain('FeedFlip');
      expect(prompt).toContain('tma');
      expect(prompt).toContain('learning_cards');
      expect(prompt).toContain('Turn passive bookmarks into 90-second active recall decks.');
      expect(prompt).toContain('Engineers and founders');
      expect(prompt).toContain('Deck feed, FSRS review, BYOC export');
      expect(prompt).toContain('`mvp.md`, `40.md`');
    });
  });

  describe('buildProjectAgentsMd and buildProjectClaudeMd', () => {
    it('generates English root AGENTS.md and CLAUDE.md with zero-prompt protocol and specs', () => {
      const ctx = {
        projectName: 'feedflip',
        projectTitle: 'FeedFlip',
        format: 'tma' as const,
        coreDomain: 'cards',
        problem: 'Micro-learning decks',
        discoveredSpecs: ['mvp.md', '40.md'],
      };

      const agentsMd = buildProjectAgentsMd(ctx);
      expect(agentsMd).toContain('FeedFlip');
      expect(agentsMd).toContain('## 0. Zero-Prompt Autonomous Execution Mandate');
      expect(agentsMd).toContain('## 1. Core-Infra & Ecosystem Reuse Rules');
      expect(agentsMd).toContain('## 2. Eight Invariant Axes & Hard Guardrails');
      expect(agentsMd).toContain('## 3. Quality & Verification Gates');
      expect(agentsMd).toContain('.ai/AGENT_PROMPT.md');
      expect(agentsMd).toContain('`mvp.md`, `40.md`');

      const claudeMd = buildProjectClaudeMd(ctx);
      expect(claudeMd).toContain('FeedFlip');
      expect(claudeMd).toContain('## 0. Zero-Prompt Autonomous Execution Mandate');
      expect(claudeMd).toContain('.ai/AGENT_PROMPT.md');
      expect(claudeMd).toContain('`mvp.md`, `40.md`');
    });
  });
});
