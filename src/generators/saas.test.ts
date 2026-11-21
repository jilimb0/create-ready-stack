import * as path from 'node:path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { VERSIONS } from '../config/versions.js';
import type { ProjectAnswers } from '../types/project.js';
import { generateSaas } from './saas.js';

describe('generateSaas', () => {
  const tmpDir = path.join(process.cwd(), 'tmp-test-saas');

  const sampleAnswers: ProjectAnswers = {
    projectName: 'test-saas',
    projectTitle: 'Test SaaS Platform',
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
    targetAudience: 'Developers',
    mainScenario: 'Register, pay, use product',
    successCriteria: 'Conversion',
    metrics: 'MRR',
    timeBudget: '1 month',
    financialConstraints: 'None',
    stackRequirements: 'TypeScript',
    integrations: 'Stripe',
    functionsV1: 'Pricing, Dashboard',
    hypotheses: 'Users pay for speed',
    risks: 'Churn',
    criticalRisk: 'Security',
    coreDomain: 'billing',
    jwtSecret: 'secret',
  };

  beforeEach(async () => {
    await fs.ensureDir(tmpDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it('generates saas web app, drizzle schema, stripe webhook, and docker-compose', async () => {
    await generateSaas(tmpDir, sampleAnswers);

    // Web app checks
    const webPkg = await fs.readJson(path.join(tmpDir, 'apps/web/package.json'));
    expect(webPkg.dependencies.next).toBe(VERSIONS.next);
    expect(webPkg.dependencies['@ui-construction-library/core']).toBe(VERSIONS.uiLibraryCore);
    expect(webPkg.dependencies['@ui-construction-library/tokens']).toBe(VERSIONS.uiLibraryTokens);
    expect(webPkg.dependencies['@ui-construction-library/schema']).toBe(VERSIONS.uiLibrarySchema);
    expect(webPkg.dependencies.stripe).toBe(VERSIONS.stripe);

    const versionValues = new Set<string>(Object.values(VERSIONS));
    for (const ver of Object.values(webPkg.dependencies as Record<string, string>)) {
      expect(versionValues.has(ver)).toBe(true);
    }
    for (const ver of Object.values(webPkg.devDependencies as Record<string, string>)) {
      expect(versionValues.has(ver)).toBe(true);
    }

    const pricingPage = await fs.readFile(path.join(tmpDir, 'apps/web/app/pricing/page.tsx'), 'utf-8');
    expect(pricingPage).toContain('PricingTable');
    expect(pricingPage).toContain('Test SaaS Platform Plans & Pricing');

    const terminalShell = await fs.readFile(
      path.join(tmpDir, 'apps/web/components/TerminalShell.tsx'),
      'utf-8',
    );
    expect(terminalShell.startsWith("'use client';")).toBe(true);
    expect(terminalShell).toContain('WidgetLinkProvider');
    expect(terminalShell).toContain('CommandPalette');
    expect(terminalShell).toContain('SourceLineageDrawer');

    const dashboardPage = await fs.readFile(
      path.join(tmpDir, 'apps/web/app/dashboard/page.tsx'),
      'utf-8',
    );
    expect(dashboardPage.startsWith("'use client';")).toBe(true);
    expect(dashboardPage).toContain('WidgetLinkProvider');
    expect(dashboardPage).toContain('LinkedPanel');
    expect(dashboardPage).toContain('group="green"');
    expect(dashboardPage).toContain('amountMinor');
    expect(dashboardPage).toContain('idempotencyKey');
    expect(dashboardPage).toContain("typeof window !== 'undefined'");
    expect(dashboardPage).toContain("'loading'");
    expect(dashboardPage).toContain("'empty'");
    expect(dashboardPage).toContain("'error'");
    expect(dashboardPage).toContain("'default'");

    const llmsTxt = await fs.readFile(path.join(tmpDir, 'apps/web/public/llms.txt'), 'utf-8');
    expect(llmsTxt).toContain('Test SaaS Platform');

    const layoutPage = await fs.readFile(path.join(tmpDir, 'apps/web/app/layout.tsx'), 'utf-8');
    expect(layoutPage).toContain('application/ld+json');
    expect(layoutPage).toContain('@graph');

    const stripeWebhook = await fs.readFile(
      path.join(tmpDir, 'apps/web/app/api/webhooks/stripe/route.ts'),
      'utf-8'
    );
    expect(stripeWebhook).toContain('checkout.session.completed');
    expect(stripeWebhook).toContain('customer.subscription.deleted');

    // DB checks
    const dbPkg = await fs.readJson(path.join(tmpDir, 'packages/db/package.json'));
    expect(dbPkg.dependencies['drizzle-orm']).toBe(VERSIONS.drizzleOrm);

    const schema = await fs.readFile(path.join(tmpDir, 'packages/db/src/schema.ts'), 'utf-8');
    expect(schema).toContain('subscription_tier');
    expect(schema).toContain('stripe_customer_id');
    expect(schema).toContain('idempotencyKey');
    expect(schema).toContain('amountMinor');
    expect(schema).not.toContain('cost_usd');

    // Docker Compose
    const dockerCompose = await fs.readFile(path.join(tmpDir, 'docker-compose.yml'), 'utf-8');
    expect(dockerCompose).toContain('postgres:16-alpine');

    // CI
    const ci = await fs.readFile(path.join(tmpDir, '.github/workflows/ci.yml'), 'utf-8');
    expect(ci).toContain('pnpm biome check');
  });

  it('scaffolds read-only MCP server and UDPA gate when includeMcp is true', async () => {
    await generateSaas(tmpDir, { ...sampleAnswers, includeMcp: true });

    const mcpServer = await fs.readFile(path.join(tmpDir, 'packages/mcp/src/server.ts'), 'utf-8');
    expect(mcpServer).toContain('bds://test-saas/lineage-citations');
    expect(mcpServer).toContain('bds://test-saas/active-workspace-context');
    expect(mcpServer).toContain('tools: []');
    expect(mcpServer).toContain('process.stderr');
    expect(mcpServer).not.toContain('console.log(');

    const udpaGate = await fs.readFile(
      path.join(tmpDir, '.github/workflows/udpa-gate.yml'),
      'utf-8',
    );
    expect(udpaGate).toContain('uses: jilimb0/udpa-engine@v1');
  });
});
