import * as path from 'node:path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
    expect(webPkg.dependencies.next).toBeDefined();
    expect(webPkg.dependencies['@ui-construction-library/core']).toBeDefined();
    expect(webPkg.dependencies.stripe).toBeDefined();

    const pricingPage = await fs.readFile(path.join(tmpDir, 'apps/web/app/pricing/page.tsx'), 'utf-8');
    expect(pricingPage).toContain('PricingTable');
    expect(pricingPage).toContain('Test SaaS Platform Plans & Pricing');

    const stripeWebhook = await fs.readFile(
      path.join(tmpDir, 'apps/web/app/api/webhooks/stripe/route.ts'),
      'utf-8'
    );
    expect(stripeWebhook).toContain('checkout.session.completed');
    expect(stripeWebhook).toContain('customer.subscription.deleted');

    // DB checks
    const dbPkg = await fs.readJson(path.join(tmpDir, 'packages/db/package.json'));
    expect(dbPkg.dependencies['drizzle-orm']).toBeDefined();

    const schema = await fs.readFile(path.join(tmpDir, 'packages/db/src/schema.ts'), 'utf-8');
    expect(schema).toContain('subscription_tier');
    expect(schema).toContain('stripe_customer_id');

    // Docker Compose
    const dockerCompose = await fs.readFile(path.join(tmpDir, 'docker-compose.yml'), 'utf-8');
    expect(dockerCompose).toContain('postgres:16-alpine');

    // CI
    const ci = await fs.readFile(path.join(tmpDir, '.github/workflows/ci.yml'), 'utf-8');
    expect(ci).toContain('pnpm biome check');
  });
});
