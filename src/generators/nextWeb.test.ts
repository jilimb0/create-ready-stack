import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProjectAnswers } from '../types/project.js';
import { generateNextWeb } from './nextWeb.js';

const baseAnswers: ProjectAnswers = {
  projectName: 'test-project',
  projectTitle: 'Test Project',
  format: 'web',
  frontend: 'nextjs',
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
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'crs-next-'));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe('generateNextWeb', () => {
  it('generates web package.json with next dependency', async () => {
    await generateNextWeb(tmpDir, baseAnswers);
    const pkg = await fs.readJson(path.join(tmpDir, 'web', 'package.json'));
    expect(pkg.name).toBe('@test-project/web');
    expect(pkg.dependencies.next).toBe('^15.3.0');
    expect(pkg.dependencies.react).toBe('^19.1.0');
    expect(pkg.dependencies['react-dom']).toBe('^19.1.0');
    expect(pkg.dependencies['@tanstack/react-query']).toBe('^5.75.0');
    expect(pkg.devDependencies['@ui-construction-library/core']).toBeUndefined();
  });

  it('generates web package.json without UI library', async () => {
    await generateNextWeb(tmpDir, { ...baseAnswers, useUILibrary: false });
    const pkg = await fs.readJson(path.join(tmpDir, 'web', 'package.json'));
    expect(pkg.dependencies['@ui-construction-library/core']).toBeUndefined();
    expect(pkg.dependencies.next).toBe('^15.3.0');
  });

  it('generates app/layout.tsx', async () => {
    await generateNextWeb(tmpDir, baseAnswers);
    const layout = await fs.readFile(path.join(tmpDir, 'web', 'app', 'layout.tsx'), 'utf-8');
    expect(layout).toContain("import type { Metadata } from 'next'");
    expect(layout).toContain("title: 'Test Project'");
    expect(layout).toContain(
      'export default function RootLayout({ children }: { children: React.ReactNode })',
    );
    expect(layout).toContain('<html lang="en">');
  });

  it('generates app/page.tsx with project title', async () => {
    await generateNextWeb(tmpDir, baseAnswers);
    const page = await fs.readFile(path.join(tmpDir, 'web', 'app', 'page.tsx'), 'utf-8');
    expect(page).toContain('export default function HomePage()');
    expect(page).toContain('Test Project');
    expect(page).toContain('Welcome to your new project.');
  });

  it('generates app/dashboard/page.tsx', async () => {
    await generateNextWeb(tmpDir, baseAnswers);
    const dashboard = await fs.readFile(
      path.join(tmpDir, 'web', 'app', 'dashboard', 'page.tsx'),
      'utf-8',
    );
    expect(dashboard).toContain('export default function DashboardPage()');
    expect(dashboard).toContain('Dashboard');
    expect(dashboard).toContain('Dashboard placeholder for Test Project.');
  });

  it('generates app/login/page.tsx', async () => {
    await generateNextWeb(tmpDir, baseAnswers);
    const login = await fs.readFile(path.join(tmpDir, 'web', 'app', 'login', 'page.tsx'), 'utf-8');
    expect(login).toContain('export default function LoginPage()');
    expect(login).toContain('Sign in to your account');
    expect(login).toContain('<a href="/register"');
  });

  it('generates app/register/page.tsx', async () => {
    await generateNextWeb(tmpDir, baseAnswers);
    const register = await fs.readFile(
      path.join(tmpDir, 'web', 'app', 'register', 'page.tsx'),
      'utf-8',
    );
    expect(register).toContain('export default function RegisterPage()');
    expect(register).toContain('Create your account');
    expect(register).toContain('<a href="/login"');
  });

  it('generates next.config.ts', async () => {
    await generateNextWeb(tmpDir, baseAnswers);
    const config = await fs.readFile(path.join(tmpDir, 'web', 'next.config.ts'), 'utf-8');
    expect(config).toContain("import type { NextConfig } from 'next'");
    expect(config).toContain('const nextConfig: NextConfig');
    expect(config).toContain('export default nextConfig');
  });

  it('generates tsconfig.json', async () => {
    await generateNextWeb(tmpDir, baseAnswers);
    const tsconfig = await fs.readJson(path.join(tmpDir, 'web', 'tsconfig.json'));
    expect(tsconfig.extends).toBe('../tsconfig.base.json');
    expect(tsconfig.compilerOptions.jsx).toBe('preserve');
    expect(tsconfig.compilerOptions.plugins).toEqual([{ name: 'next' }]);
  });

  it('generates vitest.config.ts', async () => {
    await generateNextWeb(tmpDir, baseAnswers);
    const vitestConfig = await fs.readFile(
      path.join(tmpDir, 'web', 'vitest.config.ts'),
      'utf-8',
    );
    expect(vitestConfig).toContain("import { defineConfig } from 'vitest/config'");
    expect(vitestConfig).toContain("environment: 'jsdom'");
  });

  it('generates Dockerfile', async () => {
    await generateNextWeb(tmpDir, baseAnswers);
    const dockerfile = await fs.readFile(path.join(tmpDir, 'web', 'Dockerfile'), 'utf-8');
    expect(dockerfile).toContain('FROM node:26-alpine AS builder');
    expect(dockerfile).toContain('COPY --from=builder /app/.next ./');
  });

  it('generates app/page.test.tsx', async () => {
    await generateNextWeb(tmpDir, baseAnswers);
    const pageTest = await fs.readFile(
      path.join(tmpDir, 'web', 'app', 'page.test.tsx'),
      'utf-8',
    );
    expect(pageTest).toContain("import { describe, it, expect } from 'vitest'");
    expect(pageTest).toContain('render(<HomePage />)');
    expect(pageTest).toContain('renders project title');
    expect(pageTest).toContain('renders welcome message');
  });
});
