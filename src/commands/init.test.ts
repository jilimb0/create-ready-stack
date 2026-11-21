import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAnswers } = vi.hoisted(() => {
  let calls: Record<string, unknown>[] = [];
  return {
    mockAnswers: {
      set(value: Record<string, unknown>[]) {
        calls = value.map((a) => ({ ...a }));
      },
      shift(): Record<string, unknown> | undefined {
        return calls.shift();
      },
    },
  };
});

vi.mock('inquirer', () => {
  const mockPrompt = vi.fn(async () => {
    const a = mockAnswers.shift();
    return a ?? {};
  });
  return {
    default: { prompt: mockPrompt },
    prompt: mockPrompt,
  };
});

const baseAnswers = {
  projectName: 'test-project',
  projectTitle: 'Test Project',
  format: 'web',
  frontend: 'vite-spa',
  multiUser: true,
  useDocker: true,
  useTailwind: true,
  useSentry: false,
  backendFramework: 'hono',
  orm: 'drizzle',
  useUILibrary: true,
  problem: 'Test problem',
  targetAudience: 'Test audience',
  mainScenario: 'Test scenario',
  successCriteria: 'Test success',
  metrics: 'Test metrics',
  timeBudget: '1 week',
  financialConstraints: 'None',
  stackRequirements: 'Node.js',
  integrations: 'None',
  functionsV1: 'CRUD',
  hypotheses: 'H1: test',
  risks: 'R1: test',
  criticalRisk: 'R1',
  coreDomain: 'items',
  jwtSecret: 'test-jwt-secret',
};

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'crs-test-'));
  vi.stubGlobal('process', {
    ...process,
    cwd: () => tmpDir,
  });
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await fs.remove(tmpDir);
});

describe('init command handler', () => {
  it('creates docs directory with all levels', async () => {
    mockAnswers.set([baseAnswers, baseAnswers, baseAnswers]);
    const { initCommand } = await import('./init.js');
    await initCommand.handler();

    const docsDir = path.join(tmpDir, 'test-project', 'docs');
    expect(await fs.pathExists(docsDir)).toBe(true);
    expect(await fs.pathExists(path.join(docsDir, 'LEVELS.md'))).toBe(true);
    expect(await fs.pathExists(path.join(docsDir, '01-idea', 'brief.md'))).toBe(true);
    expect(await fs.pathExists(path.join(docsDir, '01-idea', 'dod.md'))).toBe(true);
    expect(await fs.pathExists(path.join(docsDir, '02-arch', 'domains.md'))).toBe(true);
    expect(await fs.pathExists(path.join(docsDir, '02-arch', 'flows.md'))).toBe(true);
    expect(await fs.pathExists(path.join(docsDir, '02-arch', 'dod.md'))).toBe(true);
    expect(await fs.pathExists(path.join(docsDir, '03-impl', 'dod.md'))).toBe(true);
    expect(await fs.pathExists(path.join(docsDir, '03-impl', 'commands.md'))).toBe(true);
    expect(await fs.pathExists(path.join(docsDir, '04-quality', 'task-dod.md'))).toBe(true);
    expect(await fs.pathExists(path.join(docsDir, '04-quality', 'feature-dod.md'))).toBe(true);
    expect(await fs.pathExists(path.join(docsDir, '04-quality', 'checklist-manual.md'))).toBe(true);
    expect(await fs.pathExists(path.join(docsDir, '05-release', 'checklist.md'))).toBe(true);
    expect(await fs.pathExists(path.join(docsDir, '05-release', 'release-flow.md'))).toBe(true);
    expect(await fs.pathExists(path.join(docsDir, '06-deploy', 'checklist.md'))).toBe(true);
    expect(await fs.pathExists(path.join(docsDir, '06-deploy', 'deploy-vps-docker.md'))).toBe(true);
    expect(await fs.pathExists(path.join(docsDir, '06-deploy', 'deploy-vps-manual.md'))).toBe(true);
  });

  it('creates backend skeleton with correct framework', async () => {
    mockAnswers.set([{ ...baseAnswers, backendFramework: 'express' }, baseAnswers, baseAnswers]);
    const { initCommand } = await import('./init.js');
    await initCommand.handler();

    const backendDir = path.join(tmpDir, 'test-project', 'backend');
    expect(await fs.pathExists(backendDir)).toBe(true);
    expect(await fs.pathExists(path.join(backendDir, 'package.json'))).toBe(true);
  });

  it('creates web directory', async () => {
    mockAnswers.set([baseAnswers, baseAnswers, baseAnswers]);
    const { initCommand } = await import('./init.js');
    await initCommand.handler();

    const webDir = path.join(tmpDir, 'test-project', 'web');
    expect(await fs.pathExists(webDir)).toBe(true);
    expect(await fs.pathExists(path.join(webDir, 'package.json'))).toBe(true);
  });

  it('creates bot directory when format is web+bot', async () => {
    mockAnswers.set([{ ...baseAnswers, format: 'web+bot' }, baseAnswers, baseAnswers]);
    const { initCommand } = await import('./init.js');
    await initCommand.handler();

    const botDir = path.join(tmpDir, 'test-project', 'bot');
    expect(await fs.pathExists(botDir)).toBe(true);
    expect(await fs.pathExists(path.join(botDir, 'package.json'))).toBe(true);
  });

  it('does not create bot directory for web-only format', async () => {
    mockAnswers.set([baseAnswers, baseAnswers, baseAnswers]);
    const { initCommand } = await import('./init.js');
    await initCommand.handler();

    const botDir = path.join(tmpDir, 'test-project', 'bot');
    expect(await fs.pathExists(botDir)).toBe(false);
  });

  it('creates root package.json with correct project name', async () => {
    mockAnswers.set([baseAnswers, baseAnswers, baseAnswers]);
    const { initCommand } = await import('./init.js');
    await initCommand.handler();

    const pkg = await fs.readJson(path.join(tmpDir, 'test-project', 'package.json'));
    expect(pkg.name).toBe('test-project');
    expect(pkg.private).toBe(true);
  });

  it('creates docker-compose.yml when useDocker is true', async () => {
    mockAnswers.set([baseAnswers, baseAnswers, baseAnswers]);
    const { initCommand } = await import('./init.js');
    await initCommand.handler();

    expect(await fs.pathExists(path.join(tmpDir, 'test-project', 'docker-compose.yml'))).toBe(true);
  });

  it('generates correct brief and domains content from answers', async () => {
    mockAnswers.set([baseAnswers, baseAnswers, baseAnswers]);
    const { initCommand } = await import('./init.js');
    await initCommand.handler();

    const brief = await fs.readFile(
      path.join(tmpDir, 'test-project', 'docs', '01-idea', 'brief.md'),
      'utf-8',
    );
    expect(brief).toContain('Test Project');
    expect(brief).toContain('Test problem');
    expect(brief).toContain('Test audience');

    const domains = await fs.readFile(
      path.join(tmpDir, 'test-project', 'docs', '02-arch', 'domains.md'),
      'utf-8',
    );
    expect(domains).toContain('items');
  });

  it('skips non-empty directory check when force=true', async () => {
    const existingDir = path.join(tmpDir, 'existing-project');
    await fs.ensureDir(existingDir);
    await fs.writeFile(path.join(existingDir, 'test.txt'), 'existing content');

    vi.stubGlobal('process', {
      ...process,
      cwd: () => tmpDir,
    });
    mockAnswers.set([
      { ...baseAnswers, projectName: 'existing-project' },
      baseAnswers,
      baseAnswers,
    ]);
    const { initCommand } = await import('./init.js');
    await initCommand.handler(true);

    expect(await fs.pathExists(path.join(existingDir, 'docs'))).toBe(true);
  });

  it('scaffolds agent-mcp preset with MCP server and UDPA gate workflow', async () => {
    mockAnswers.set([baseAnswers, baseAnswers, baseAnswers]);
    const { initCommand } = await import('./init.js');
    await initCommand.handler(false, undefined, 'agent-mcp');

    const projectDir = path.join(tmpDir, 'test-project');
    expect(await fs.pathExists(path.join(projectDir, 'packages', 'mcp', 'src', 'server.ts'))).toBe(
      true,
    );
    expect(
      await fs.pathExists(path.join(projectDir, '.github', 'workflows', 'udpa-gate.yml')),
    ).toBe(true);
    expect(await fs.pathExists(path.join(projectDir, '.github', 'workflows', 'ci.yml'))).toBe(true);
  });

  it('runs non-interactively in AI agent mode, scaffolds TMA + .ai/AGENT_PROMPT.md, and emits English prompt', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const inquirerMod = await import('inquirer');
    const promptMock = vi.mocked(inquirerMod.default.prompt);
    promptMock.mockClear();

    const { initCommand } = await import('./init.js');
    await initCommand.handler(true, '0.5.1', 'tma', {
      agent: true,
      name: 'agent-tma-app',
      title: 'Agent TMA App',
      domain: 'cards',
      problem: 'Micro-learning cards',
    });

    expect(promptMock).not.toHaveBeenCalled();

    const projectDir = path.join(tmpDir, 'agent-tma-app');
    expect(
      await fs.pathExists(path.join(projectDir, 'apps', 'tma-server', 'src', 'index.ts')),
    ).toBe(true);
    expect(await fs.pathExists(path.join(projectDir, '.ai', 'AGENT_PROMPT.md'))).toBe(true);

    const promptFile = await fs.readFile(path.join(projectDir, '.ai', 'AGENT_PROMPT.md'), 'utf-8');
    expect(promptFile).toContain('Agent TMA App');
    expect(promptFile).toContain('Micro-learning cards');
    expect(promptFile).toContain('@tgwrapper/core');

    const consoleOutput = logSpy.mock.calls.map((args) => args.join(' ')).join('\n');
    expect(consoleOutput).toContain('[AI_AGENT_MODE_DETECTED]');
    expect(consoleOutput).toContain('# Universal Core-First Project Launch Prompt');
    logSpy.mockRestore();
  });

  it('emits [AI_AGENT_MODE_DETECTED] when AI agent environment variable is set', async () => {
    const prevAntigravity = process.env.ANTIGRAVITY_AGENT;
    process.env.ANTIGRAVITY_AGENT = '1';
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      mockAnswers.set([baseAnswers, baseAnswers, baseAnswers]);
      const { initCommand } = await import('./init.js');
      await initCommand.handler();

      const consoleOutput = logSpy.mock.calls.map((args) => args.join(' ')).join('\n');
      expect(consoleOutput).toContain('[AI_AGENT_MODE_DETECTED]');
      expect(consoleOutput).toContain('antigravity');
      expect(consoleOutput).toContain('.ai/AGENT_PROMPT.md');
    } finally {
      logSpy.mockRestore();
      if (prevAntigravity === undefined) {
        delete process.env.ANTIGRAVITY_AGENT;
      } else {
        process.env.ANTIGRAVITY_AGENT = prevAntigravity;
      }
    }
  });

  it('scaffolds in-place inside a spec-only directory without force, preserves specs, and writes root AGENTS.md + CLAUDE.md', async () => {
    const specDir = path.join(tmpDir, 'feedflip');
    await fs.ensureDir(specDir);
    await fs.writeFile(path.join(specDir, 'mvp.md'), '# FeedFlip MVP Spec');
    vi.stubGlobal('process', {
      ...process,
      cwd: () => specDir,
    });

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const inquirerMod = await import('inquirer');
    const promptMock = vi.mocked(inquirerMod.default.prompt);
    promptMock.mockClear();

    const { initCommand } = await import('./init.js');
    await initCommand.handler(false, '0.5.1', 'tma', {
      agent: true,
      inPlace: true,
      title: 'FeedFlip',
      domain: 'cards',
      problem: 'Active recall cards',
    });

    expect(promptMock).not.toHaveBeenCalled();
    expect(await fs.readFile(path.join(specDir, 'mvp.md'), 'utf-8')).toBe('# FeedFlip MVP Spec');
    expect(await fs.pathExists(path.join(specDir, 'AGENTS.md'))).toBe(true);
    expect(await fs.pathExists(path.join(specDir, 'CLAUDE.md'))).toBe(true);
    expect(await fs.pathExists(path.join(specDir, '.ai', 'AGENT_PROMPT.md'))).toBe(true);
    expect(await fs.pathExists(path.join(specDir, 'apps', 'tma-server', 'src', 'index.ts'))).toBe(
      true,
    );

    const agentsMd = await fs.readFile(path.join(specDir, 'AGENTS.md'), 'utf-8');
    expect(agentsMd).toContain('`mvp.md`');
    logSpy.mockRestore();
  });
});
