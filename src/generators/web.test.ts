import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProjectAnswers } from '../types/project.js';
import { generateWeb } from './web.js';

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
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'crs-web-'));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe('generateWeb', () => {
  it('generates web package.json', async () => {
    await generateWeb(tmpDir, baseAnswers);
    const pkg = await fs.readJson(path.join(tmpDir, 'web', 'package.json'));
    expect(pkg.name).toBe('@test-project/web');
    expect(pkg.dependencies.react).toBe('^19.1.0');
    expect(pkg.dependencies['react-dom']).toBe('^19.1.0');
    expect(pkg.dependencies['react-router-dom']).toBe('^7.5.0');
    expect(pkg.dependencies['@tanstack/react-query']).toBe('^5.75.0');
    expect(pkg.dependencies.zod).toBe('^3.24.0');
    expect(pkg.dependencies['@ui-construction-library/core']).toBe('^0.1.0');
  });

  it('generates web package.json without UI library', async () => {
    await generateWeb(tmpDir, { ...baseAnswers, useUILibrary: false });
    const pkg = await fs.readJson(path.join(tmpDir, 'web', 'package.json'));
    expect(pkg.dependencies['@ui-construction-library/core']).toBeUndefined();
  });

  it('generates index.html', async () => {
    await generateWeb(tmpDir, baseAnswers);
    const indexHtml = await fs.readFile(path.join(tmpDir, 'web', 'index.html'), 'utf-8');
    expect(indexHtml).toContain('<!doctype html>');
    expect(indexHtml).toContain('<title>Test Project</title>');
    expect(indexHtml).toContain('<script type="module" src="/src/main.tsx"></script>');
  });

  it('generates src/main.tsx', async () => {
    await generateWeb(tmpDir, baseAnswers);
    const mainTsx = await fs.readFile(path.join(tmpDir, 'web', 'src', 'main.tsx'), 'utf-8');
    expect(mainTsx).toContain("import { StrictMode } from 'react'");
    expect(mainTsx).toContain(
      "import { QueryClient, QueryClientProvider } from '@tanstack/react-query'",
    );
    expect(mainTsx).toContain("createRoot(document.getElementById('root')!).render(");
  });

  it('generates src/App.tsx', async () => {
    await generateWeb(tmpDir, baseAnswers);
    const appTsx = await fs.readFile(path.join(tmpDir, 'web', 'src', 'App.tsx'), 'utf-8');
    expect(appTsx).toContain("import { Routes, Route } from 'react-router-dom'");
    expect(appTsx).toContain('Test Project');
    expect(appTsx).toContain('Count is {count}');
  });

  it('generates src/api.ts', async () => {
    await generateWeb(tmpDir, baseAnswers);
    const apiTs = await fs.readFile(path.join(tmpDir, 'web', 'src', 'api.ts'), 'utf-8');
    expect(apiTs).toContain("const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'");
    expect(apiTs).toContain(
      'export async function api<T>(path: string, init?: RequestInit): Promise<T>',
    );
    expect(apiTs).toContain("headers: { 'Content-Type': 'application/json', ...init?.headers }");
  });

  it('generates vite.config.ts', async () => {
    await generateWeb(tmpDir, baseAnswers);
    const viteConfig = await fs.readFile(path.join(tmpDir, 'web', 'vite.config.ts'), 'utf-8');
    expect(viteConfig).toContain("import { defineConfig } from 'vite'");
    expect(viteConfig).toContain('tailwindcss()');
  });

  it('generates src/App.test.tsx', async () => {
    await generateWeb(tmpDir, baseAnswers);
    const appTest = await fs.readFile(path.join(tmpDir, 'web', 'src', 'App.test.tsx'), 'utf-8');
    expect(appTest).toContain("import { describe, it, expect } from 'vitest'");
    expect(appTest).toContain('render(<MemoryRouter><App /></MemoryRouter>);');
    expect(appTest).toContain('increments counter on button click');
  });

  it('generates tsconfig.json', async () => {
    await generateWeb(tmpDir, baseAnswers);
    const tsconfig = await fs.readJson(path.join(tmpDir, 'web', 'tsconfig.json'));
    expect(tsconfig.extends).toBe('../tsconfig.base.json');
    expect(tsconfig.compilerOptions.jsx).toBe('react-jsx');
    expect(tsconfig.references).toBeDefined();
  });

  it('generates Dockerfile', async () => {
    await generateWeb(tmpDir, baseAnswers);
    const dockerfile = await fs.readFile(path.join(tmpDir, 'web', 'Dockerfile'), 'utf-8');
    expect(dockerfile).toContain('FROM node:26-alpine AS builder');
    expect(dockerfile).toContain('COPY --from=builder /app/dist /usr/share/nginx/html');
  });

  it('creates vitest.config.ts', async () => {
    await generateWeb(tmpDir, baseAnswers);
    const vitestConfig = await fs.readFile(path.join(tmpDir, 'web', 'vitest.config.ts'), 'utf-8');
    expect(vitestConfig).toContain("import { defineConfig } from 'vitest/config'");
    expect(vitestConfig).toContain("environment: 'jsdom'");
  });
});
