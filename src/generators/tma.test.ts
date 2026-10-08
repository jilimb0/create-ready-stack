import * as path from 'node:path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProjectAnswers } from '../types/project.js';
import { generateTma } from './tma.js';

describe('generateTma', () => {
  const tmpDir = path.join(process.cwd(), 'tmp-test-tma');

  const sampleAnswers: ProjectAnswers = {
    projectName: 'test-tma',
    projectTitle: 'Test TMA App',
    format: 'web',
    frontend: 'vite-spa',
    multiUser: false,
    useDocker: false,
    useTailwind: true,
    useSentry: false,
    backendFramework: 'hono',
    orm: 'drizzle',
    useUILibrary: true,
    includeBot: false,
    problem: 'Test',
    targetAudience: 'Test',
    mainScenario: 'Test',
    successCriteria: 'Test',
    metrics: 'Test',
    timeBudget: 'Test',
    financialConstraints: 'Test',
    stackRequirements: 'Test',
    integrations: 'Test',
    functionsV1: 'Test',
    hypotheses: 'Test',
    risks: 'Test',
    criticalRisk: 'Test',
    coreDomain: 'tma',
    jwtSecret: 'secret',
  };

  beforeEach(async () => {
    await fs.ensureDir(tmpDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it('generates tma client, server, and tunnel script', async () => {
    await generateTma(tmpDir, sampleAnswers);

    // Client checks
    const clientPkg = await fs.readJson(path.join(tmpDir, 'apps/tma-client/package.json'));
    expect(clientPkg.name).toBe('@test-tma/tma-client');
    expect(clientPkg.dependencies['@ui-construction-library/core']).toBeDefined();

    const appCode = await fs.readFile(path.join(tmpDir, 'apps/tma-client/src/App.tsx'), 'utf-8');
    expect(appCode).toContain('Telegram Stars Payment');
    expect(appCode).toContain('Test TMA App');

    // Server checks
    const serverPkg = await fs.readJson(path.join(tmpDir, 'apps/tma-server/package.json'));
    expect(serverPkg.dependencies['@tgwrapper/core']).toBeDefined();

    const serverCode = await fs.readFile(path.join(tmpDir, 'apps/tma-server/src/index.ts'), 'utf-8');
    expect(serverCode).toContain('tmaHonoMiddleware');
    expect(serverCode).toContain('createStarsInvoiceLink');

    // Tunnel script
    const tunnelScript = await fs.readFile(path.join(tmpDir, 'scripts/tunnel.sh'), 'utf-8');
    expect(tunnelScript).toContain('cloudflared');
    expect(tunnelScript).toContain('ngrok');
  });
});
