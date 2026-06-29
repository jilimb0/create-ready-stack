import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProjectAnswers } from '../types/project.js';
import { generateBackend } from './backend.js';

const baseAnswers: ProjectAnswers = {
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
  hypotheses: 'H1',
  risks: 'R1',
  criticalRisk: 'R1',
  coreDomain: 'items',
  jwtSecret: 'test-jwt-secret',
};

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'crs-backend-'));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe('generateBackend', () => {
  it('generates backend package.json with hono+drizzle', async () => {
    await generateBackend(tmpDir, baseAnswers);
    const pkg = await fs.readJson(path.join(tmpDir, 'backend', 'package.json'));
    expect(pkg.name).toBe('@test-project/backend');
    expect(pkg.dependencies.hono).toBe('^4.7.0');
    expect(pkg.dependencies['@hono/node-server']).toBe('^1.14.0');
    expect(pkg.dependencies['drizzle-orm']).toBe('^0.44.0');
    expect(pkg.dependencies.postgres).toBe('^3.4.0');
    expect(pkg.dependencies.bcryptjs).toBe('^2.4.3');
    expect(pkg.dependencies.jose).toBe('^5.9.0');
  });

  it('generates backend package.json with express+prisma', async () => {
    await generateBackend(tmpDir, { ...baseAnswers, backendFramework: 'express', orm: 'prisma' });
    const pkg = await fs.readJson(path.join(tmpDir, 'backend', 'package.json'));
    expect(pkg.name).toBe('@test-project/backend');
    expect(pkg.dependencies.express).toBe('^5.2.0');
    expect(pkg.dependencies['@prisma/client']).toBe('^5.22.0');
    expect(pkg.dependencies.prisma).toBe('^5.22.0');
    expect(pkg.dependencies.bcryptjs).toBe('^2.4.3');
    expect(pkg.dependencies.jose).toBe('^5.9.0');
    expect(pkg.devDependencies['@types/express']).toBe('^5.0.0');
  });

  it('does not include auth dependencies when multiUser is false', async () => {
    await generateBackend(tmpDir, { ...baseAnswers, multiUser: false });
    const pkg = await fs.readJson(path.join(tmpDir, 'backend', 'package.json'));
    expect(pkg.dependencies.bcryptjs).toBeUndefined();
    expect(pkg.dependencies.jose).toBeUndefined();
    expect(pkg.devDependencies['@types/bcryptjs']).toBeUndefined();
  });

  it('generates hono package.json with db scripts', async () => {
    await generateBackend(tmpDir, baseAnswers);
    const pkg = await fs.readJson(path.join(tmpDir, 'backend', 'package.json'));
    expect(pkg.scripts['db:generate']).toBe('drizzle-kit generate');
    expect(pkg.scripts['db:migrate']).toBe('drizzle-kit migrate');
    expect(pkg.scripts['db:studio']).toBe('drizzle-kit studio');
    expect(pkg.scripts['db:push']).toBe('drizzle-kit push');
  });

  it('generates express package.json with db scripts', async () => {
    await generateBackend(tmpDir, { ...baseAnswers, backendFramework: 'express' });
    const pkg = await fs.readJson(path.join(tmpDir, 'backend', 'package.json'));
    expect(pkg.scripts['db:generate']).toBe('prisma generate');
    expect(pkg.scripts['db:migrate']).toBe('prisma migrate deploy');
    expect(pkg.scripts['db:studio']).toBe('prisma studio');
  });

  it('creates drizzle config file', async () => {
    await generateBackend(tmpDir, baseAnswers);
    const configExists = await fs.pathExists(path.join(tmpDir, 'backend', 'drizzle.config.ts'));
    expect(configExists).toBe(true);
    const config = await fs.readFile(path.join(tmpDir, 'backend', 'drizzle.config.ts'), 'utf-8');
    expect(config).toContain("schema: './src/db/schema/*'");
  });

  it('creates prisma schema when using prisma', async () => {
    await generateBackend(tmpDir, { ...baseAnswers, orm: 'prisma' });
    const schemaExists = await fs.pathExists(
      path.join(tmpDir, 'backend', 'prisma', 'schema.prisma'),
    );
    expect(schemaExists).toBe(true);
    const schema = await fs.readFile(
      path.join(tmpDir, 'backend', 'prisma', 'schema.prisma'),
      'utf-8',
    );
    expect(schema).toContain('model User');
  });

  it('creates drizzle schema when using drizzle', async () => {
    await generateBackend(tmpDir, baseAnswers);
    const usersExists = await fs.pathExists(
      path.join(tmpDir, 'backend', 'src', 'db', 'schema', 'users.ts'),
    );
    expect(usersExists).toBe(true);
    const users = await fs.readFile(
      path.join(tmpDir, 'backend', 'src', 'db', 'schema', 'users.ts'),
      'utf-8',
    );
    expect(users).toContain('export const users = pgTable');
  });

  it('creates Hono index file when using hono', async () => {
    await generateBackend(tmpDir, baseAnswers);
    const indexExists = await fs.pathExists(path.join(tmpDir, 'backend', 'src', 'index.ts'));
    expect(indexExists).toBe(true);
    const index = await fs.readFile(path.join(tmpDir, 'backend', 'src', 'index.ts'), 'utf-8');
    expect(index).toContain("import { serve } from '@hono/node-server'");
    expect(index).toContain("import { Hono } from 'hono'");
  });

  it('creates Express index file when using express', async () => {
    await generateBackend(tmpDir, { ...baseAnswers, backendFramework: 'express' });
    const indexExists = await fs.pathExists(path.join(tmpDir, 'backend', 'src', 'index.ts'));
    expect(indexExists).toBe(true);
    const index = await fs.readFile(path.join(tmpDir, 'backend', 'src', 'index.ts'), 'utf-8');
    expect(index).toContain("import express from 'express';");
    expect(index).toContain('const app = express();');
  });

  it('creates auth file when multiUser is true', async () => {
    await generateBackend(tmpDir, baseAnswers);
    const authExists = await fs.pathExists(path.join(tmpDir, 'backend', 'src', 'auth.ts'));
    expect(authExists).toBe(true);
    const auth = await fs.readFile(path.join(tmpDir, 'backend', 'src', 'auth.ts'), 'utf-8');
    expect(auth).toContain("import { z } from 'zod'");
    expect(auth).toContain("import { SignJWT, jwtVerify } from 'jose'");
  });

  it('does not create auth file when multiUser is false', async () => {
    await generateBackend(tmpDir, { ...baseAnswers, multiUser: false });
    const authExists = await fs.pathExists(path.join(tmpDir, 'backend', 'src', 'auth.ts'));
    expect(authExists).toBe(false);
  });

  it('creates test files', async () => {
    await generateBackend(tmpDir, baseAnswers);
    const appTestExists = await fs.pathExists(path.join(tmpDir, 'backend', 'src', 'app.test.ts'));
    expect(appTestExists).toBe(true);
    const vitestConfigExists = await fs.pathExists(
      path.join(tmpDir, 'backend', 'vitest.config.ts'),
    );
    expect(vitestConfigExists).toBe(true);
    const dockerfileExists = await fs.pathExists(path.join(tmpDir, 'backend', 'Dockerfile'));
    expect(dockerfileExists).toBe(true);
  });

  it('creates tsconfig.json', async () => {
    await generateBackend(tmpDir, baseAnswers);
    const tsconfigExists = await fs.pathExists(path.join(tmpDir, 'backend', 'tsconfig.json'));
    expect(tsconfigExists).toBe(true);
    const tsconfig = await fs.readJson(path.join(tmpDir, 'backend', 'tsconfig.json'));
    expect(tsconfig.extends).toBe('../tsconfig.base.json');
    expect(tsconfig.include).toContain('src');
  });
});
