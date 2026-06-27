import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProjectAnswers } from '../types/project.js';
import { generateDocs } from './docs.js';

const defaultAnswers: ProjectAnswers = {
  projectName: 'test-project',
  projectTitle: 'Test Project',
  format: 'web',
  multiUser: true,
  useDocker: true,
  backendFramework: 'hono',
  orm: 'drizzle',
  useUILibrary: true,
  includeBot: false,
  problem: 'Test problem statement',
  targetAudience: 'Developers',
  mainScenario: 'User logs in and manages items',
  successCriteria: 'All CRUD operations work',
  metrics: '100 users in 3 months',
  timeBudget: '2 weeks',
  financialConstraints: '$0',
  stackRequirements: 'Node.js + PostgreSQL',
  integrations: 'GitHub OAuth',
  functionsV1: 'Create, read, update, delete',
  hypotheses: 'Users need this tool',
  risks: 'Low adoption',
  criticalRisk: 'Low adoption',
  coreDomain: 'items',
  jwtSecret: 'test-jwt-secret',
};

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'crs-docs-'));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe('generateDocs', () => {
  it('creates docs directory', async () => {
    await generateDocs(tmpDir, defaultAnswers);
    expect(await fs.pathExists(path.join(tmpDir, 'docs'))).toBe(true);
  });

  it('creates LEVELS.md', async () => {
    await generateDocs(tmpDir, defaultAnswers);
    const content = await fs.readFile(path.join(tmpDir, 'docs', 'LEVELS.md'), 'utf-8');
    expect(content).toContain('Level 01');
    expect(content).toContain('Level 02');
    expect(content).toContain('Level 03');
    expect(content).toContain('Level 04');
    expect(content).toContain('Level 05');
    expect(content).toContain('Level 06');
  });

  it('creates brief.md with project title and answers', async () => {
    await generateDocs(tmpDir, defaultAnswers);
    const brief = await fs.readFile(path.join(tmpDir, 'docs', '01-idea', 'brief.md'), 'utf-8');
    expect(brief).toContain('Test Project');
    expect(brief).toContain('Test problem statement');
    expect(brief).toContain('Developers');
    expect(brief).toContain('User logs in and manages items');
  });

  it('creates domains.md with core domain name', async () => {
    await generateDocs(tmpDir, defaultAnswers);
    const domains = await fs.readFile(path.join(tmpDir, 'docs', '02-arch', 'domains.md'), 'utf-8');
    expect(domains).toContain('items');
    expect(domains).toContain('auth');
    expect(domains).toContain('users');
  });

  it('creates all definition of done files', async () => {
    await generateDocs(tmpDir, defaultAnswers);
    const files = [
      '01-idea/dod.md',
      '02-arch/dod.md',
      '03-impl/dod.md',
      '04-quality/task-dod.md',
      '04-quality/feature-dod.md',
      '04-quality/checklist-manual.md',
      '05-release/checklist.md',
      '05-release/release-flow.md',
      '06-deploy/checklist.md',
      '06-deploy/deploy-vps-docker.md',
      '06-deploy/deploy-vps-manual.md',
    ];
    for (const f of files) {
      expect(await fs.pathExists(path.join(tmpDir, 'docs', f)), `docs/${f} should exist`).toBe(
        true,
      );
    }
  });

  it('creates commands.md with quality commands', async () => {
    await generateDocs(tmpDir, defaultAnswers);
    const commands = await fs.readFile(
      path.join(tmpDir, 'docs', '03-impl', 'commands.md'),
      'utf-8',
    );
    expect(commands).toContain('pnpm lint');
    expect(commands).toContain('pnpm typecheck');
    expect(commands).toContain('pnpm test');
  });
});
