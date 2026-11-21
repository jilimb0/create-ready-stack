import * as path from 'node:path';
import fs from 'fs-extra';
import { version } from '../config/versions.js';
import type { ProjectAnswers } from '../types/project.js';
import { buildMcpPackageFiles } from './agent.js';
import {
  buildEntityJsonLd,
  buildLlmsTxt,
  buildTerminalShellSource,
} from './terminalKit.js';

export async function generateSaas(cwd: string, answers: ProjectAnswers) {
  // 1. Next.js 15 Fullstack SaaS Web App
  const webDir = path.join(cwd, 'apps', 'web');
  await fs.ensureDir(path.join(webDir, 'app', 'pricing'));
  await fs.ensureDir(path.join(webDir, 'app', 'dashboard'));
  await fs.ensureDir(path.join(webDir, 'app', 'api', 'webhooks', 'stripe'));
  await fs.ensureDir(path.join(webDir, 'app', 'api', 'webhooks', 'paddle'));
  await fs.ensureDir(path.join(webDir, 'components'));
  await fs.ensureDir(path.join(webDir, 'public'));

  await fs.writeFile(
    path.join(webDir, 'package.json'),
    JSON.stringify(
      {
        name: `@${answers.projectName}/web`,
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'next dev -p 3000',
          build: 'next build',
          start: 'next start -p 3000',
          typecheck: 'tsc --noEmit',
          test: 'vitest run',
        },
        dependencies: {
          next: version('next'),
          react: version('react'),
          'react-dom': version('reactDom'),
          '@ui-construction-library/core': version('uiLibraryCore'),
          '@ui-construction-library/schema': version('uiLibrarySchema'),
          '@ui-construction-library/tokens': version('uiLibraryTokens'),
          'drizzle-orm': version('drizzleOrm'),
          postgres: version('postgres'),
          stripe: version('stripe'),
        },
        devDependencies: {
          '@types/node': version('@types/node'),
          '@types/react': version('@types/react'),
          '@types/react-dom': version('@types/react-dom'),
          tailwindcss: version('tailwindcss'),
          typescript: version('typescript'),
          vitest: version('vitest'),
        },
      },
      null,
      2,
    ),
  );

  // Entity SEO / GEO Artifacts (Axis 8)
  const entityJsonLd = JSON.stringify(
    buildEntityJsonLd({
      projectName: answers.projectName,
      projectTitle: answers.projectTitle,
      problem: answers.problem,
    }),
  );

  await fs.writeFile(
    path.join(webDir, 'app', 'layout.tsx'),
    `import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '${answers.projectTitle}',
  description: '${answers.projectTitle} (${answers.projectName}) is a SaaS platform for ${answers.problem}.',
};

const ENTITY_GRAPH_JSON = ${JSON.stringify(entityJsonLd)};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ENTITY_GRAPH_JSON }}
        />
      </head>
      <body className="min-h-screen bg-[#0b0f19] text-slate-100">
        <noscript>
          <h1>${answers.projectTitle} (${answers.projectName})</h1>
          <p>${answers.projectTitle} (${answers.projectName}) is a SaaS platform for ${answers.problem}.</p>
          <nav aria-label="Primary routes">
            <a href="/">Home</a>
            <a href="/pricing">Pricing</a>
            <a href="/dashboard">Dashboard</a>
          </nav>
        </noscript>
        {children}
      </body>
    </html>
  );
}
`,
  );

  await fs.writeFile(
    path.join(webDir, 'public', 'llms.txt'),
    buildLlmsTxt({
      projectName: answers.projectName,
      projectTitle: answers.projectTitle,
      problem: answers.problem,
      routes: ['/', '/pricing', '/dashboard'],
    }),
  );

  // Client TerminalShell (Next.js 15 "use client")
  await fs.writeFile(
    path.join(webDir, 'components', 'TerminalShell.tsx'),
    buildTerminalShellSource({
      projectName: answers.projectName,
      projectTitle: answers.projectTitle,
      useClientDirective: true,
      defaultGroup: 'green',
      defaultEntity: 'SUB-001',
    }),
  );

  // Terminal Dashboard Page (4 UI states + Green-linked Panels + Minor-Unit Audit)
  await fs.writeFile(
    path.join(webDir, 'app', 'dashboard', 'page.tsx'),
    `'use client';

import { useEffect, useState } from 'react';
import { LinkedPanel, WidgetLinkProvider } from '@ui-construction-library/core';
import type { FundamentalLineageCitation } from '@ui-construction-library/schema';
import {
  TerminalShell,
  buildLineageDatasetProps,
  formatMinorUsd,
} from '../../components/TerminalShell';

type DashboardViewState = 'default' | 'loading' | 'empty' | 'error';

interface SubscriptionRecord {
  id: string;
  symbol: string;
  planName: string;
  status: 'active' | 'trialing';
  amountMinor: number;
  idempotencyKey: string;
  citation: FundamentalLineageCitation;
}

const SAMPLE_SUBSCRIPTIONS: SubscriptionRecord[] = [
  {
    id: 'sub-001',
    symbol: 'SUB-001',
    planName: 'Pro Monthly',
    status: 'active',
    amountMinor: 4900,
    idempotencyKey: 'idem-sub-001-2026-01',
    citation: {
      accessionNumber: 'ACC-SAAS-001',
      metricCode: 'MRR_PRO_MINOR',
      valueMinor: 4900,
      sourceByteOffset: 128,
      sourceByteLength: 24,
    },
  },
  {
    id: 'sub-002',
    symbol: 'SUB-002',
    planName: 'Enterprise Annual',
    status: 'active',
    amountMinor: 190000,
    idempotencyKey: 'idem-sub-002-2026-01',
    citation: {
      accessionNumber: 'ACC-SAAS-002',
      metricCode: 'ARR_ENT_MINOR',
      valueMinor: 190000,
      sourceByteOffset: 512,
      sourceByteLength: 32,
    },
  },
];

export default function DashboardPage() {
  const [viewState, setViewState] = useState<DashboardViewState>('default');
  const [selectedSymbol, setSelectedSymbol] = useState<string>(
    SAMPLE_SUBSCRIPTIONS[0]?.symbol ?? 'SUB-001',
  );
  const [inspectedCitation, setInspectedCitation] = useState<FundamentalLineageCitation | null>(
    null,
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const symbolParam = params.get('symbol');
      if (symbolParam && SAMPLE_SUBSCRIPTIONS.some((item) => item.symbol === symbolParam)) {
        setSelectedSymbol(symbolParam);
      }
    }
  }, []);

  const activeSubscription =
    SAMPLE_SUBSCRIPTIONS.find((item) => item.symbol === selectedSymbol) ?? SAMPLE_SUBSCRIPTIONS[0];

  const totalMrrMinor = SAMPLE_SUBSCRIPTIONS.reduce((acc, item) => acc + item.amountMinor, 0);

  return (
    <WidgetLinkProvider syncUrl={true}>
      <TerminalShell
        withProvider={false}
        onInspectLineage={(citation) => setInspectedCitation(citation)}
        onExecuteMnemonic={(cmd) => {
          const matched = SAMPLE_SUBSCRIPTIONS.find((item) => item.symbol === cmd.entity);
          if (matched) {
            setSelectedSymbol(matched.symbol);
          }
        }}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-50">${answers.projectTitle} Terminal</h1>
              <p className="text-xs text-slate-400">
                Green-linked billing entities, integer minor-unit KPIs, and source lineage audit
              </p>
            </div>
            <fieldset aria-label="Dashboard state switcher" className="flex items-center gap-2 border-0 p-0 m-0">
              {(['default', 'loading', 'empty', 'error'] as const).map((stateKey) => (
                <button
                  key={stateKey}
                  type="button"
                  aria-pressed={viewState === stateKey}
                  onClick={() => setViewState(stateKey)}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-mono text-slate-200 hover:bg-slate-800"
                >
                  {stateKey}
                </button>
              ))}
            </fieldset>
          </div>

          {viewState === 'loading' && (
            <section
              role="status"
              aria-busy="true"
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300"
            >
              Loading subscription ledger and billing KPIs...
            </section>
          )}

          {viewState === 'empty' && (
            <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center space-y-3">
              <p className="text-sm text-slate-300">No active subscriptions or billing transactions yet.</p>
              <button
                type="button"
                onClick={() => setViewState('default')}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
              >
                Restore Sample Ledger
              </button>
            </section>
          )}

          {viewState === 'error' && (
            <section
              role="alert"
              className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-6 flex items-center justify-between gap-4"
            >
              <p className="text-sm text-rose-200">
                Unable to reach billing read model. Retry or inspect webhook dead-letter queue.
              </p>
              <button
                type="button"
                onClick={() => setViewState('default')}
                className="rounded-lg border border-rose-400/50 px-3 py-1.5 text-xs font-medium text-rose-100"
              >
                Retry
              </button>
            </section>
          )}

          {viewState === 'default' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5">
                <LinkedPanel group="green" title="Subscriptions &amp; Billing Entities">
                  <ul className="space-y-2" aria-label="Subscription ledger">
                    {SAMPLE_SUBSCRIPTIONS.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedSymbol(item.symbol)}
                            aria-current={item.symbol === selectedSymbol ? 'true' : undefined}
                            className="text-left font-mono text-xs font-semibold text-emerald-300 hover:underline"
                          >
                            {item.symbol} · {item.planName}
                          </button>
                          <span className="font-mono text-xs text-slate-200">
                            {formatMinorUsd(item.amountMinor)}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] font-mono text-slate-400">
                          Key: {item.idempotencyKey}
                        </p>
                      </li>
                    ))}
                  </ul>
                </LinkedPanel>
              </div>

              <div className="lg:col-span-7">
                <LinkedPanel group="green" title="KPI &amp; Click-to-Source Audit">
                  {activeSubscription ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                          <div className="text-xs text-slate-400">Selected Plan Minor Units</div>
                          <div className="mt-1 text-xl font-mono font-bold text-slate-50">
                            {formatMinorUsd(activeSubscription.amountMinor)}
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                          <div className="text-xs text-slate-400">Total Ledger Minor Units</div>
                          <div className="mt-1 text-xl font-mono font-bold text-emerald-300">
                            {formatMinorUsd(totalMrrMinor)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                        <div>
                          <div className="text-xs font-mono text-slate-300">
                            {activeSubscription.citation.metricCode}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Accession {activeSubscription.citation.accessionNumber}
                          </div>
                        </div>
                        <button
                          type="button"
                          {...buildLineageDatasetProps(activeSubscription.citation)}
                          className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-mono text-emerald-300 hover:bg-emerald-500/20"
                        >
                          Inspect Source Lineage
                        </button>
                      </div>

                      {inspectedCitation && (
                        <p className="text-xs font-mono text-emerald-300">
                          Auditing {inspectedCitation.accessionNumber} ({formatMinorUsd(inspectedCitation.valueMinor)})
                        </p>
                      )}
                    </div>
                  ) : null}
                </LinkedPanel>
              </div>
            </div>
          )}
        </div>
      </TerminalShell>
    </WidgetLinkProvider>
  );
}
`,
  );

  // Pricing Page with UI-Library PricingTable
  await fs.writeFile(
    path.join(webDir, 'app', 'pricing', 'page.tsx'),
    `import { PricingTable, type PricingPlan } from '@ui-construction-library/core';

const SAAS_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for side-projects and individual developers',
    priceMonthly: 19,
    priceAnnual: 180,
    features: ['Up to 3 Projects', '10,000 monthly events', 'Community support', 'Basic analytics'],
    ctaText: 'Get Started',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing businesses and professional products',
    priceMonthly: 49,
    priceAnnual: 470,
    isPopular: true,
    isRecommended: true,
    features: [
      'Unlimited Projects',
      '500,000 monthly events',
      'Priority 24/7 support',
      'Dark Glassmorphism themes',
      'Custom domains & webhooks',
    ],
    ctaText: 'Upgrade to Pro',
    ctaVariant: 'gradient',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Dedicated infrastructure, custom SLAs and compliance',
    priceMonthly: 199,
    priceAnnual: 1900,
    features: [
      'Dedicated cluster',
      'Unlimited events & users',
      '99.99% uptime guarantee',
      'Custom SSO & SAML',
      'Dedicated account manager',
    ],
    ctaText: 'Contact Sales',
    ctaVariant: 'outline',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[rgba(18,21,31,0.95)] text-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <PricingTable
          plans={SAAS_PLANS}
          title="${answers.projectTitle} Plans & Pricing"
          subtitle="Choose the plan that fits your growth. Switch or cancel anytime."
          annualDiscountPercent={20}
        />
      </div>
    </div>
  );
}
`,
  );

  // Stripe Webhook Route Handler
  await fs.writeFile(
    path.join(webDir, 'app', 'api', 'webhooks', 'stripe', 'route.ts'),
    `import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
  apiVersion: '2025-01-27.acacia' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch (err) {
    return NextResponse.json({ error: \`Webhook Error: \${(err as Error).message}\` }, { status: 400 });
  }

  // Handle billing lifecycle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const clientReferenceId = session.client_reference_id;
      console.log(\`[Stripe Webhook] Customer \${customerId} upgraded subscription for user \${clientReferenceId}\`);
      // Update Drizzle DB user tier here:
      // await db.update(users).set({ subscriptionTier: 'pro', stripeCustomerId: customerId }).where(eq(users.id, clientReferenceId));
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(\`[Stripe Webhook] Subscription canceled: \${subscription.id}\`);
      // Downgrade user tier to 'free'
      break;
    }
    default:
      console.log(\`[Stripe Webhook] Unhandled event type \${event.type}\`);
  }

  return NextResponse.json({ received: true });
}
`,
  );

  // Paddle Webhook Route Handler
  await fs.writeFile(
    path.join(webDir, 'app', 'api', 'webhooks', 'paddle', 'route.ts'),
    `import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const eventType = payload.event_type;

    console.log(\`[Paddle Webhook] Received event: \${eventType}\`);

    if (eventType === 'subscription.activated') {
      console.log('[Paddle Webhook] Subscription activated:', payload.data?.id);
    } else if (eventType === 'subscription.canceled') {
      console.log('[Paddle Webhook] Subscription canceled:', payload.data?.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
`,
  );

  // Landing Page
  await fs.writeFile(
    path.join(webDir, 'app', 'page.tsx'),
    `import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[rgba(18,21,31,0.95)] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-3xl space-y-6">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#6C7BFF]/20 text-[#6C7BFF] border border-[#6C7BFF]/30">
          Production Micro-SaaS
        </span>
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl text-slate-50">
          ${answers.projectTitle}
        </h1>
        <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Built with Next.js 15, Drizzle ORM, PostgreSQL, and @ui-construction-library/core.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/pricing"
            className="px-6 py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-[#6C7BFF] to-[#828FFF] text-white shadow-lg hover:opacity-95"
          >
            View Pricing & Plans
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl font-medium text-sm border border-[rgba(108,123,255,0.24)] hover:bg-[rgba(108,123,255,0.08)] text-slate-200"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
`,
  );

  // 2. Database Schema (packages/db with Drizzle ORM & Postgres)
  const dbDir = path.join(cwd, 'packages', 'db');
  await fs.ensureDir(path.join(dbDir, 'src'));

  await fs.writeFile(
    path.join(dbDir, 'package.json'),
    JSON.stringify(
      {
        name: `@${answers.projectName}/db`,
        version: '0.1.0',
        private: true,
        type: 'module',
        main: './src/index.ts',
        scripts: {
          'db:generate': 'drizzle-kit generate',
          'db:migrate': 'drizzle-kit migrate',
          'db:push': 'drizzle-kit push',
          'db:studio': 'drizzle-kit studio',
        },
        dependencies: {
          'drizzle-orm': version('drizzleOrm'),
          postgres: version('postgres'),
        },
        devDependencies: {
          'drizzle-kit': version('drizzleKit'),
          typescript: version('typescript'),
        },
      },
      null,
      2,
    ),
  );

  await fs.writeFile(
    path.join(dbDir, 'src/schema.ts'),
    `import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  subscriptionTier: text('subscription_tier').default('free').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  subscriptionStatus: text('subscription_status').default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(), // Stripe or Paddle sub ID
  userId: uuid('user_id').references(() => users.id).notNull(),
  planId: text('plan_id').notNull(),
  status: text('status').notNull(),
  amountMinor: integer('amount_minor').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const billingTransactions = pgTable('billing_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  subscriptionId: text('subscription_id').references(() => subscriptions.id).notNull(),
  provider: text('provider').notNull(),
  amountMinor: integer('amount_minor').notNull(),
  currency: text('currency').notNull().default('USD'),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  status: text('status').notNull().default('recorded'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
`,
  );

  await fs.writeFile(
    path.join(dbDir, 'src/index.ts'),
    `import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/${answers.projectName}';
export const client = postgres(connectionString);
export const db = drizzle(client, { schema });
export * from './schema.js';
`,
  );

  // 3. Docker Compose for Local PostgreSQL
  await fs.writeFile(
    path.join(cwd, 'docker-compose.yml'),
    `services:
  postgres:
    image: postgres:16-alpine
    container_name: ${answers.projectName}-db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ${answers.projectName}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
`,
  );

  // 4. GitHub Actions CI Workflow (.github/workflows/ci.yml)
  const ciDir = path.join(cwd, '.github', 'workflows');
  await fs.ensureDir(ciDir);
  await fs.writeFile(
    path.join(ciDir, 'ci.yml'),
    `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint and Format Check (Biome)
        run: pnpm biome check .

      - name: Typecheck
        run: pnpm -r typecheck

      - name: Run Tests (Vitest)
        run: pnpm -r test
`,
  );

  // 5. Optional Read-Only MCP Server + UDPA Gate (--with-mcp)
  if (answers.includeMcp) {
    const mcpFiles = buildMcpPackageFiles(answers.projectName);
    for (const file of mcpFiles) {
      const targetPath = path.join(cwd, file.path);
      await fs.ensureDir(path.dirname(targetPath));
      await fs.writeFile(targetPath, file.content);
    }
  }
}
