import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { describe, expect, it } from 'vitest';
import { generateDocs } from '../src/generators/docs.js';
import { generateMonorepo } from '../src/generators/monorepo.js';
import { generatePackageJson } from '../src/generators/packageJson.js';
import type { ProjectAnswers } from '../src/types/project.js';

const baseAnswers: ProjectAnswers = {
  projectName: 'snapshot-test',
  projectTitle: 'Snapshot Test',
  format: 'web+bot',
  multiUser: true,
  useDocker: true,
  useTailwind: true,
  useSentry: true,
  backendFramework: 'hono',
  orm: 'drizzle',
  useUILibrary: true,
  includeBot: true,
  problem: 'Snapshot testing',
  targetAudience: 'Developers',
  mainScenario: 'Test scenario',
  successCriteria: 'All snapshots match',
  metrics: 'N/A',
  timeBudget: '1 day',
  financialConstraints: '$0',
  stackRequirements: 'Node.js',
  integrations: 'None',
  functionsV1: 'CRUD',
  hypotheses: 'H1',
  risks: 'R1',
  criticalRisk: 'R1',
  coreDomain: 'items',
  jwtSecret: 'snapshot-secret',
};

async function generateFullProject(tmpDir: string, answers: ProjectAnswers) {
  const projectDir = path.join(tmpDir, answers.projectName);
  await fs.ensureDir(projectDir);
  await generateDocs(projectDir, answers);
  await generateMonorepo(projectDir, answers);
  await generatePackageJson(projectDir, answers);
  return projectDir;
}

describe('generated output snapshots', () => {
  it('root package.json matches snapshot', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'crs-snap-'));
    const projectDir = await generateFullProject(tmpDir, baseAnswers);
    const pkg = await fs.readJson(path.join(projectDir, 'package.json'));
    expect(pkg.name).toBe('snapshot-test');
    expect(pkg.scripts).toMatchSnapshot('root-scripts');
    expect(pkg.devDependencies).toMatchSnapshot('root-dev-deps');
    await fs.remove(tmpDir);
  });

  it('docker-compose.yml matches snapshot', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'crs-snap-'));
    const projectDir = await generateFullProject(tmpDir, baseAnswers);
    const compose = await fs.readFile(path.join(projectDir, 'docker-compose.yml'), 'utf-8');
    expect(JSON.parse(compose)).toMatchSnapshot('docker-compose');
    await fs.remove(tmpDir);
  });

  it('biome.json matches expected structure', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'crs-snap-'));
    const projectDir = await generateFullProject(tmpDir, baseAnswers);
    const biome = await fs.readJson(path.join(projectDir, 'biome.json'));
    expect(biome.linter.enabled).toBe(true);
    expect(biome.formatter.indentStyle).toBe('space');
    expect(biome.files.ignore).toContain('node_modules');
    await fs.remove(tmpDir);
  });

  it('CI workflow matches snapshot', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'crs-snap-'));
    const projectDir = await generateFullProject(tmpDir, baseAnswers);
    const ci = await fs.readFile(path.join(projectDir, '.github', 'workflows', 'ci.yml'), 'utf-8');
    expect(ci).toMatchSnapshot('ci-workflow');
    await fs.remove(tmpDir);
  });

  it('generated README contains project title', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'crs-snap-'));
    const projectDir = await generateFullProject(tmpDir, baseAnswers);
    const readme = await fs.readFile(path.join(projectDir, 'README.md'), 'utf-8');
    expect(readme).toContain('Snapshot Test');
    expect(readme).toContain('Drizzle ORM');
    expect(readme).toContain('@tgwrapper/core');
    await fs.remove(tmpDir);
  });
});
