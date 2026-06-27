import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { generateDocs } from '../src/generators/docs.js';
import { generateMonorepo } from '../src/generators/monorepo.js';
import { generatePackageJson } from '../src/generators/packageJson.js';
import type { ProjectAnswers } from '../src/types/project.js';

const baseAnswers: ProjectAnswers = {
  projectName: 'integration-test',
  projectTitle: 'Integration Test',
  format: 'web+bot',
  multiUser: true,
  useDocker: true,
  backendFramework: 'hono',
  orm: 'drizzle',
  useUILibrary: true,
  includeBot: true,
  problem: 'Testing the generator',
  targetAudience: 'Developers',
  mainScenario: 'Test scenario',
  successCriteria: 'All files generated',
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
  jwtSecret: 'test-jwt-secret-for-integration',
};

const variants: { name: string; answers: ProjectAnswers }[] = [
  { name: 'hono-drizzle-web', answers: { ...baseAnswers, format: 'web', includeBot: false, orm: 'drizzle', backendFramework: 'hono' } },
  { name: 'express-prisma-web', answers: { ...baseAnswers, format: 'web', includeBot: false, orm: 'prisma', backendFramework: 'express' } },
  { name: 'hono-drizzle-web+bot', answers: { ...baseAnswers, format: 'web+bot', includeBot: true, orm: 'drizzle', backendFramework: 'hono' } },
];

describe('full generation integration', () => {
  for (const variant of variants) {
    describe(variant.name, () => {
      let projectDir: string;

      beforeEach(async () => {
        const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'crs-int-'));
        projectDir = path.join(tmpRoot, variant.answers.projectName);
        await fs.ensureDir(projectDir);
        await generateDocs(projectDir, variant.answers);
        await generateMonorepo(projectDir, variant.answers);
        await generatePackageJson(projectDir, variant.answers);
      });

      it('creates the root project directory', () => {
        expect(fs.pathExistsSync(projectDir)).toBe(true);
      });

      it('generates docs directory', () => {
        expect(fs.pathExistsSync(path.join(projectDir, 'docs'))).toBe(true);
      });

      it('generates all doc levels', () => {
        const levels = ['01-idea', '02-arch', '03-impl', '04-quality', '05-release', '06-deploy'];
        for (const level of levels) {
          expect(fs.pathExistsSync(path.join(projectDir, 'docs', level)), `docs/${level} should exist`).toBe(true);
        }
      });

      it('generates backend directory with package.json', () => {
        expect(fs.pathExistsSync(path.join(projectDir, 'backend'))).toBe(true);
        const pkg = fs.readJsonSync(path.join(projectDir, 'backend', 'package.json'));
        expect(pkg.name).toBeDefined();
      });

      it('generates web directory with package.json', () => {
        expect(fs.pathExistsSync(path.join(projectDir, 'web'))).toBe(true);
        const pkg = fs.readJsonSync(path.join(projectDir, 'web', 'package.json'));
        expect(pkg.name).toBeDefined();
      });

      it('generates bot directory only when bot is included', () => {
        const botExists = fs.pathExistsSync(path.join(projectDir, 'bot'));
        if (variant.answers.includeBot) {
          expect(botExists).toBe(true);
        } else {
          expect(botExists).toBe(false);
        }
      });

      it('generates root config files', () => {
        const files = ['package.json', 'pnpm-workspace.yaml', 'turbo.json', 'biome.json', 'tsconfig.base.json', '.gitignore', '.env.example', 'CHANGELOG.md', 'README.md'];
        for (const f of files) {
          expect(fs.pathExistsSync(path.join(projectDir, f)), `root/${f} should exist`).toBe(true);
        }
      });

      it('generates Dockerfile for backend', () => {
        expect(fs.pathExistsSync(path.join(projectDir, 'backend', 'Dockerfile'))).toBe(true);
      });

      it('generates CI workflow', () => {
        expect(fs.pathExistsSync(path.join(projectDir, '.github', 'workflows', 'ci.yml'))).toBe(true);
      });

      it('generates root package.json with workspace scripts', () => {
        const pkg = fs.readJsonSync(path.join(projectDir, 'package.json'));
        expect(pkg.scripts).toBeDefined();
        expect(pkg.scripts.lint).toBeDefined();
        expect(pkg.scripts.test).toBeDefined();
        expect(pkg.scripts.build).toBeDefined();
      });

      it('generates docker-compose.yml', () => {
        expect(fs.pathExistsSync(path.join(projectDir, 'docker-compose.yml'))).toBe(true);
      });
    });
  }

  describe('build verification', () => {
    it('generates a project that installs and builds', { timeout: 180000 }, async () => {
      const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'crs-build-'));
      const projectDir = path.join(tmpRoot, 'build-test');
      await fs.ensureDir(projectDir);

      const answers: ProjectAnswers = {
        projectName: 'build-test',
        projectTitle: 'Build Test',
        format: 'web',
        multiUser: true,
        useDocker: false,
        backendFramework: 'hono',
        orm: 'drizzle',
        useUILibrary: false,
        includeBot: false,
        problem: 'Build verification',
        targetAudience: 'CI',
        mainScenario: 'Test',
        successCriteria: 'Build passes',
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
        jwtSecret: 'build-test-secret',
      };

      await generateDocs(projectDir, answers);
      await generateMonorepo(projectDir, answers);
      await generatePackageJson(projectDir, answers);

      execSync('pnpm install --ignore-scripts', { cwd: projectDir, timeout: 120000, env: { ...process.env, COREPACK_ENABLE_STRICT: '0' } });
      execSync('pnpm exec tsc -p backend/tsconfig.json', { cwd: projectDir, timeout: 60000, env: { ...process.env, COREPACK_ENABLE_STRICT: '0' } });
    });
  });
});
