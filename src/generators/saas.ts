import * as path from 'node:path';
import fs from 'fs-extra';
import { version } from '../config/versions.js';
import type { ProjectAnswers } from '../types/project.js';

export async function generateSaas(cwd: string, answers: ProjectAnswers) {
  // 1. Next.js 15 Fullstack SaaS Web App
  const webDir = path.join(cwd, 'apps', 'web');
  await fs.ensureDir(path.join(webDir, 'app', 'pricing'));
  await fs.ensureDir(path.join(webDir, 'app', 'dashboard'));
  await fs.ensureDir(path.join(webDir, 'app', 'api', 'webhooks', 'stripe'));
  await fs.ensureDir(path.join(webDir, 'app', 'api', 'webhooks', 'paddle'));
  await fs.ensureDir(path.join(webDir, 'components'));

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
          next: '^15.3.0',
          react: version('react'),
          'react-dom': version('reactDom'),
          '@ui-construction-library/core': '^0.9.0',
          '@ui-construction-library/tokens': '^0.6.0',
          'drizzle-orm': version('drizzleOrm'),
          postgres: version('postgres'),
          stripe: '^17.5.0',
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
    `import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
  currentPeriodEnd: timestamp('current_period_end'),
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
}
