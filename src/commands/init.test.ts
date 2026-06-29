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
});
