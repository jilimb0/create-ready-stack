import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { describe, it, expect } from 'vitest';
import { generateDocs } from '../src/generators/docs.js';
import { generateMonorepo } from '../src/generators/monorepo.js';
import { generatePackageJson } from '../src/generators/packageJson.js';
import type { ProjectAnswers } from '../src/types/project.js';

const answers: ProjectAnswers = {
  projectName: 'bench-test',
  projectTitle: 'Bench Test',
  format: 'web+bot',
  frontend: 'vite-spa',
  multiUser: true,
  useDocker: true,
  useTailwind: true,
  useSentry: false,
  backendFramework: 'hono',
  orm: 'drizzle',
  useUILibrary: true,
  includeBot: true,
  problem: 'Benchmark',
  targetAudience: 'Developers',
  mainScenario: 'Test',
  successCriteria: 'Fast generation',
  metrics: 'N/A',
  timeBudget: 'N/A',
  financialConstraints: 'N/A',
  stackRequirements: 'Node.js',
  integrations: 'None',
  functionsV1: 'CRUD',
  hypotheses: 'H1',
  risks: 'R1',
  criticalRisk: 'R1',
  coreDomain: 'items',
  jwtSecret: 'bench-secret',
};

describe('generation benchmark', () => {
  it('generates full project under 500ms', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'crs-bench-'));
    const projectDir = path.join(tmpDir, 'bench-test');
    await fs.ensureDir(projectDir);

    const start = performance.now();
    await generateDocs(projectDir, answers);
    await generateMonorepo(projectDir, answers);
    await generatePackageJson(projectDir, answers);
    const elapsed = performance.now() - start;

    await fs.remove(tmpDir);

    expect(elapsed).toBeLessThan(500);
  });
});
