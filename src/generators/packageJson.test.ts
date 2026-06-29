import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProjectAnswers } from '../types/project.js';
import { generatePackageJson } from './packageJson.js';

const defaultAnswers: ProjectAnswers = {
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
  includeBot: false,
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
  risks: 'R1',
  criticalRisk: 'R1',
  coreDomain: 'items',
  jwtSecret: 'test-jwt-secret',
};

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'crs-pkg-'));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe('generatePackageJson', () => {
  it('creates root package.json with correct name', async () => {
    await generatePackageJson(tmpDir, defaultAnswers);
    const pkg = await fs.readJson(path.join(tmpDir, 'package.json'));
    expect(pkg.name).toBe('test-project');
    expect(pkg.version).toBe('0.1.0');
  });

  it('includes bot in workspace packages when includeBot is true', async () => {
    await generatePackageJson(tmpDir, { ...defaultAnswers, includeBot: true });
    const workspace = await fs.readFile(path.join(tmpDir, 'pnpm-workspace.yaml'), 'utf-8');
    expect(workspace).toContain("'bot'");
  });

  it('omits bot from workspace when not included', async () => {
    await generatePackageJson(tmpDir, defaultAnswers);
    const workspace = await fs.readFile(path.join(tmpDir, 'pnpm-workspace.yaml'), 'utf-8');
    expect(workspace).not.toContain("'bot'");
  });

  it('creates biome.json with valid schema', async () => {
    await generatePackageJson(tmpDir, defaultAnswers);
    const biome = await fs.readJson(path.join(tmpDir, 'biome.json'));
    expect(biome.$schema).toContain('biomejs.dev');
    expect(biome.linter.enabled).toBe(true);
    expect(biome.formatter.indentStyle).toBe('space');
  });

  it('creates tsconfig.base.json with strict mode', async () => {
    await generatePackageJson(tmpDir, defaultAnswers);
    const tsconfig = await fs.readJson(path.join(tmpDir, 'tsconfig.base.json'));
    expect(tsconfig.compilerOptions.strict).toBe(true);
    expect(tsconfig.compilerOptions.target).toBe('ES2022');
  });

  it('creates .gitignore with standard entries', async () => {
    await generatePackageJson(tmpDir, defaultAnswers);
    const gitignore = await fs.readFile(path.join(tmpDir, '.gitignore'), 'utf-8');
    expect(gitignore).toContain('node_modules');
    expect(gitignore).toContain('.env');
    expect(gitignore).toContain('dist');
  });

  it('creates .env.example with JWT_SECRET', async () => {
    await generatePackageJson(tmpDir, defaultAnswers);
    const env = await fs.readFile(path.join(tmpDir, '.env.example'), 'utf-8');
    expect(env).toContain('JWT_SECRET');
    expect(env).toContain('DATABASE_URL');
    expect(env).not.toContain('TELEGRAM_TOKEN');
  });

  it('includes TELEGRAM_TOKEN in env.example when bot enabled', async () => {
    await generatePackageJson(tmpDir, { ...defaultAnswers, includeBot: true });
    const env = await fs.readFile(path.join(tmpDir, '.env.example'), 'utf-8');
    expect(env).toContain('TELEGRAM_TOKEN');
  });

  it('creates README.md with project title', async () => {
    await generatePackageJson(tmpDir, defaultAnswers);
    const readme = await fs.readFile(path.join(tmpDir, 'README.md'), 'utf-8');
    expect(readme).toContain('Test Project');
    expect(readme).toContain('Hono 4');
    expect(readme).toContain('Drizzle ORM');
  });

  it('creates turbo.json with build task', async () => {
    await generatePackageJson(tmpDir, defaultAnswers);
    const turbo = await fs.readJson(path.join(tmpDir, 'turbo.json'));
    expect(turbo.tasks.build).toBeDefined();
    expect(turbo.tasks.build.dependsOn).toContain('^build');
  });
});
