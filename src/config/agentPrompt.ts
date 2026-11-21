import type { ProjectAnswers } from '../types/project.js';
import { VERSIONS } from './versions.js';

export type AgentPromptContext = Partial<ProjectAnswers> & {
  discoveredSpecs?: string[];
};

export const AI_AGENT_ENV_KEYS = [
  'AI_AGENT',
  'CLAUDECODE',
  'CLAUDE_CODE',
  'ANTIGRAVITY_AGENT',
  'ANTIGRAVITY_CLI',
  'CURSOR_AGENT',
  'CURSOR_TRACE_ID',
  'OPENCODE',
  'CODEX_CLI',
  'AIDER',
] as const;

export interface EcosystemDonorEntry {
  capability: string;
  donors: string;
  reusePattern: string;
}

export const ECOSYSTEM_DONOR_CATALOG: readonly EcosystemDonorEntry[] = [
  {
    capability: 'Core Monorepo & ADLC Baseline',
    donors: 'create-ready-stack (core-infra)',
    reusePattern:
      'Deterministic scaffolding (--template saas|tma|bot|agent|agent-mcp), centralized src/config/versions.ts, Levels 01-06 docs/, .ai/ governance.',
  },
  {
    capability: 'Design System & Agent UI Contracts',
    donors: 'UI-Library (core-infra)',
    reusePattern:
      '@ui-construction-library/{core,tokens,schema,motion,icons}, --ucl-* tokens, WAI-ARIA compliance, SSR window guards, stdio MCP api-snapshot.json.',
  },
  {
    capability: 'Telegram Bots, TMA & Stars Billing',
    donors: 'TGWrapper (core-infra)',
    reusePattern:
      '@tgwrapper/{core,adapter-redis,observability}, tmaHonoMiddleware HMAC-SHA256 initData guard, createStarsInvoiceLink (integer XTR), atomic CAS SessionStorage, FailsafeSessionStorage, ApprovalGateBotBridge, TokenBucket + CircuitBreaker.',
  },
  {
    capability: 'CI Quality & Architecture Gate',
    donors: 'udpa-engine + Gavel (core-infra)',
    reusePattern:
      'jilimb0/udpa-engine@v1 in .github/workflows/udpa-gate.yml (min-score: 85), AST/taint scanners, SARIF 2.1.0, Ed25519/Merkle udpa-zk-passport.json.',
  },
  {
    capability: 'Integer Financial Math & SQLite WAL',
    donors: 'Trader (fintech)',
    reusePattern:
      'FixedDecimal (BigInt ledger, zero IEEE 754 float), node:sqlite DatabaseSync (WAL + PRAGMA secure_delete = ON), resilient undici + CircuitBreaker, @resvg/resvg-js chart rendering.',
  },
  {
    capability: 'Multi-Tenant SaaS & Offline Sync',
    donors: 'C&TLab + RepoRadar (fintech / services)',
    reusePattern:
      'Drizzle multi-tenant schemas (tenants, users, subscriptions), Paddle MoR + CryptoBot webhooks, IndexedDB offline mutation queue, TanStack Query persister.',
  },
  {
    capability: 'Atomic Slot Locks, BullMQ & Blind Indexes',
    donors: 'service-app (services-and-apps)',
    reusePattern:
      'Redis SET NX PX slot locking (acquireSlotLock), BullMQ background reminder queues, AES-256-GCM secret encryption, HMAC-SHA256 blind indexes for PII.',
  },
  {
    capability: 'Worker Isolation & Zero-Upload WASM/Canvas',
    donors: 'Converter + bouquet-constructor (services-and-apps)',
    reusePattern:
      'node:worker_threads timeout isolation for CPU-heavy jobs, zero-upload browser WASM/Canvas processing, layered 2D SVG/Canvas renderer.',
  },
  {
    capability: 'Hybrid ASR, Mobile Kinematics & E2EE',
    donors: 'Speech + MyPersFin (lifestyle-productivity)',
    reusePattern:
      'Hybrid faster-whisper ASR with SHA-256 content-addressed cache, Expo 54 + React Native 0.81 kinematics, client-side WebCrypto PBKDF2 + AES-GCM E2EE backups.',
  },
  {
    capability: 'SSRF-Safe Scraper & Spatial Geohash Cache',
    donors: 'Wishlist + BA (lifestyle / fintech)',
    reusePattern:
      'OpenGraph/JSON-LD scraper with maxRedirects: 0 SSRF protection, two-tier Geohash Base32 LRU cache, vendorized Leaflet (zero external CDN).',
  },
  {
    capability: 'Gamification & TMA Balance Workflows',
    donors: 'LifestyleEcosystem + ratioAndScheduleBot (lifestyle)',
    reusePattern: 'XP/levels/streaks/achievements engine and TMA daily schedule ratio planner.',
  },
  {
    capability: 'Entity SEO, GEO & Offline Fallback',
    donors: 'portfolio + weather-forecast (showcase / services)',
    reusePattern:
      'Single JSON-LD @graph, semantic <noscript> block, public/llms.txt, Service Worker offline synthetic fallback.',
  },
];

function isTruthyEnv(value: string | undefined): boolean {
  if (value === undefined) return false;
  const normalized = value.trim().toLowerCase();
  return normalized !== '' && normalized !== '0' && normalized !== 'false' && normalized !== 'no';
}

export function isAiAgentEnvironment(
  env: NodeJS.ProcessEnv = process.env,
  explicitFlag = false,
): boolean {
  if (explicitFlag) {
    return true;
  }
  return AI_AGENT_ENV_KEYS.some((key) => isTruthyEnv(env[key]));
}

export function detectActiveAgentName(env: NodeJS.ProcessEnv = process.env): string {
  if (isTruthyEnv(env.ANTIGRAVITY_AGENT) || isTruthyEnv(env.ANTIGRAVITY_CLI)) {
    return 'antigravity';
  }
  if (isTruthyEnv(env.CLAUDECODE) || isTruthyEnv(env.CLAUDE_CODE)) {
    return 'claude-code';
  }
  if (isTruthyEnv(env.CURSOR_AGENT) || isTruthyEnv(env.CURSOR_TRACE_ID)) {
    return 'cursor';
  }
  if (isTruthyEnv(env.OPENCODE)) {
    return 'opencode';
  }
  if (isTruthyEnv(env.CODEX_CLI)) {
    return 'codex';
  }
  if (isTruthyEnv(env.AIDER)) {
    return 'aider';
  }
  if (isTruthyEnv(env.AI_AGENT)) {
    return 'generic-ai-agent';
  }
  return 'human';
}

function formatDiscoveredSpecs(discoveredSpecs?: string[]): string {
  if (!discoveredSpecs || discoveredSpecs.length === 0) {
    return 'None (use docs/01-idea/brief.md)';
  }
  return discoveredSpecs.map((file) => `\`${file}\``).join(', ');
}

export function buildUniversalAgentPrompt(context: AgentPromptContext = {}): string {
  const projectName = context.projectName || '<project-slug>';
  const projectTitle = context.projectTitle || '<Project Title>';
  const format = context.format || '<saas|tma|bot|web+bot|agent|agent-mcp>';
  const backend =
    context.backendFramework === 'express'
      ? `Express 5 (${VERSIONS.express})`
      : `Hono 4 (${VERSIONS.hono})`;
  const orm =
    context.orm === 'prisma'
      ? `Prisma (${VERSIONS.prismaClient})`
      : `Drizzle ORM (${VERSIONS.drizzleOrm})`;
  const frontend =
    context.frontend === 'nextjs'
      ? 'Next.js 15 App Router + React 19'
      : `Vite 8 (${VERSIONS.vite}) + React 19 (${VERSIONS.react}) + TanStack Query 5 (${VERSIONS.tanstackQuery})`;
  const coreDomain = context.coreDomain || '<core-domain>';
  const problem =
    context.problem || '<1-2 sentences defining the high-pain problem and value proposition>';
  const targetAudience = context.targetAudience || '<primary buyer / ICP>';
  const functionsV1 = context.functionsV1 || '<3-5 core v1 capabilities>';
  const specsLine = formatDiscoveredSpecs(context.discoveredSpecs);

  const donorRows = ECOSYSTEM_DONOR_CATALOG.map(
    (entry) => `| ${entry.capability} | ${entry.donors} | ${entry.reusePattern} |`,
  ).join('\n');

  return `# Universal Core-First Project Launch Prompt

You are the Principal Ecosystem Architect for \`/Users/jilimbo/Documents/Personal/\`.
Your mission is to design, scaffold, and ship a production-ready application strictly on top of \`core-infra\` packages and verified ecosystem donor modules.

## [ZERO_PROMPT_AUTONOMOUS_STARTUP]
- **Trigger:** When an AI agent session starts in this folder with no user prompt or a minimal trigger (\`"start"\`, \`"go"\`, \`"continue"\`, \`"implement"\`, \`"build"\`), DO NOT ask the user what to do.
- **Immediate Action:**
  1. Read \`.ai/AGENT_PROMPT.md\`, \`.ai/ARCHITECTURE.md\`, \`.ai/CONVENTIONS.md\`, \`.ai/COMMON_TASKS.md\`, and all active \`.ai/adr/NNNN-*.md\`.
  2. Read \`docs/01-idea/brief.md\`, \`docs/02-arch/domains.md\`, \`docs/02-arch/flows.md\`, and all discovered product spec files listed in \`[PROJECT_CONTEXT]\` (\`Discovered Product Specs\`).
  3. Inspect the repository state against \`docs/LEVELS.md\` and \`docs/01-idea/dod.md\` through \`docs/06-deploy/checklist.md\`.
  4. Automatically execute the first incomplete phase in \`[EXECUTION_PROTOCOL]\` (Phase 1 -> Phase 2 -> Phase 3 -> Phase 4) using \`core-infra\` (\`@ui-construction-library/*\`, \`@tgwrapper/*\`, \`create-ready-stack\`, \`jilimb0/udpa-engine@v1\`) and ecosystem donor modules.
  5. Pause to ask the user ONLY if an unsettled Domain Invariant Axis (Axes 1-8) triggers the Architectural Decision Trap.

## [PROJECT_CONTEXT]
- **Project Slug:** \`${projectName}\`
- **Project Title:** ${projectTitle}
- **Template Preset:** \`${format}\`
- **Backend / Runtime:** Node.js >=24, TypeScript strict, ${backend}, Zod ${VERSIONS.zod}
- **Data Layer:** ${orm} (PostgreSQL 16 or built-in \`node:sqlite\` WAL mode)
- **Frontend:** ${frontend} + Tailwind CSS v4 + \`@ui-construction-library/core\` (${VERSIONS.uiLibraryCore})
- **Bot / TMA Layer:** \`@tgwrapper/core\` (${VERSIONS.tgwrapperCore}) + \`@tgwrapper/adapter-redis\` (${VERSIONS.tgwrapperRedis})
- **Core Domain:** \`${coreDomain}\`
- **Problem (Painkiller):** ${problem}
- **Target Audience:** ${targetAudience}
- **v1 Scope:** ${functionsV1}
- **Discovered Product Specs:** ${specsLine}
- **Monetization ("2+1" Stack):** Paddle MoR (global cards/tax) + Telegram Stars (\`XTR\`, integer units) + CryptoBot USDT (fallback/crypto)

## [CORE_INFRA_MANDATE]
Never reinvent infrastructure already solved in \`core-infra/\`:
1. **\`create-ready-stack\`**: Use centralized versions from \`core-infra/create-ready-stack/src/config/versions.ts\`, Biome 2, Turbo, and Levels 01-06 documentation.
2. **\`UI-Library\`**: Build all UI from \`@ui-construction-library/core\` and \`@ui-construction-library/tokens\` (\`--ucl-*\` tokens, \`PricingTable\`, \`AgentControlRoom\`). Inspect \`packages/core/api-snapshot.json\` or query the \`ui-library\` MCP server before writing JSX.
3. **\`TGWrapper\`**: Use \`tmaHonoMiddleware(botToken, { optional: false })\` for TMA \`/api/*\`, \`createStarsInvoiceLink\` for XTR payments, atomic CAS \`SessionStorage\` (\`FailsafeSessionStorage\`), and built-in \`TokenBucket\` / \`CircuitBreaker\`.
4. **\`udpa-engine\`**: Enforce \`.github/workflows/udpa-gate.yml\` running \`jilimb0/udpa-engine@v1\` (\`min-score: '85'\`) with SARIF + ZK passport outputs.

## [ECOSYSTEM_DONOR_MODULES]
Adopt and adapt battle-tested patterns from existing repositories instead of writing ad-hoc code:

| Capability | Ecosystem Donors | Verified Pattern to Reuse |
|---|---|---|
${donorRows}

## [EIGHT_INVARIANT_AXES_AND_HARD_GUARDRAILS]
Every commit MUST satisfy all applicable axes and ban historical ecosystem anti-patterns:

- **Axis 1 (Idempotency & Retry Safety):** Mutating endpoints, orders, bookings, and payment webhooks MUST enforce \`Idempotency-Key\` persisted atomically in DB (\`UNIQUE\` constraint) or \`Redis SET NX PX 120000\`. **FORBIDDEN:** in-memory \`Map\` or \`Set\` for idempotency, webhook deduplication, or distributed locks.
- **Axis 2 (Offline / Local-First Sync):** POS, ledger, and mobile clients queue mutations in IndexedDB/SQLite with \`last-write-wins\` reconciliation and strict \`tenant_id\` isolation.
- **Axis 3 (Resilience, Rate Limits & Queues):** Wrap all outbound HTTP calls with \`3000ms\` connect and \`5000-10000ms\` response timeouts (\`AbortSignal.timeout\`), max 3 retries for idempotent calls with Full Jitter ($T_{wait} = \\text{random}(0, \\min(10000, 500 \\times 2^{\\text{attempt}}))$), and stateful \`CircuitBreaker\` (\`CLOSED/OPEN/HALF_OPEN\`). Offload work >500ms to BullMQ or \`node:worker_threads\` returning \`202 Accepted\`.
- **Axis 4 (Financial & Numeric Precision):** **FORBIDDEN:** IEEE 754 \`Float\` / \`real\` columns or float arithmetic for money, balances, commissions, or token costs. Strictly use integer minor units (\`priceCents\`, \`starsPrice\`, \`costMicros\`), \`BigInt\` (\`FixedDecimal\`), or \`Decimal(10,2)\`.
- **Axis 5 (Privacy & Zero-Leakage):** Validate all required secrets at boot via Zod (fail fast; zero hardcoded fallback keys). Verify webhook signatures exclusively with \`crypto.timingSafeEqual\` (never \`!==\`). Encrypt stored bot/API tokens with \`AES-256-GCM\`. Use \`HMAC-SHA256\` blind indexes for PII lookup. Scrub PII/tokens from logs, log \`stdio\` MCP servers to \`stderr\` only, self-host fonts/assets (no external Google Fonts/CDN), and **never auto-\`git push\`**.
- **Axis 6 (Accessibility & SSR Safety):** Enforce WAI-ARIA roles, keyboard navigation, WCAG AAA contrast, and \`typeof window !== 'undefined'\` guards around browser globals.
- **Axis 7 (Appllama UI & Mobile Kinematics):** Benchmark top market leaders before drawing screens. Use \`4/8/16/24/32px\` spacing, \`100-180ms\` spring physics respecting \`prefers-reduced-motion\`, and verify 4 UI states (\`Default\`, \`Loading/Optimistic\`, \`Empty Actionable\`, \`Error + Retry\`). On Expo/React Native, mandate \`react-native-safe-area-context\`, UI-thread \`Reanimated\` (\`useSharedValue\`), and \`@shopify/flash-list\` for >20 items.
- **Axis 8 (Entity SEO & GEO):** Public web apps MUST include a single \`JSON-LD (@graph)\` in \`<head>\`, the anchor definition \`BrandName (domain.tld) is a [category] for [audience] that [key value]...\` in the lead paragraph, \`README.md\`, semantic \`<noscript>\`, and \`public/llms.txt\`. Private TMAs MUST set \`noindex, nofollow\`.

## [EXECUTION_PROTOCOL]
Execute sequentially without skipping gates:

1. **Phase 1 — ADLC & Product Specs (\`.ai/\` + \`docs/\`):**
   - Maintain \`.ai/ARCHITECTURE.md\`, \`.ai/CONVENTIONS.md\`, \`.ai/COMMON_TASKS.md\` (combined size <= 15 KB, zero \`TODO\`/\`TBD\`, every backticked repo path must exist on disk).
   - Maintain \`.ai/adr/0000-template.md\` and active \`.ai/adr/NNNN-*.md\` with \`**Applies-To:**\` indexed under \`## 5. Active ADRs\` in \`.ai/ARCHITECTURE.md\`.
   - Complete \`docs/01-idea/brief.md\` (with Copy & Adapt 0-40 scorecard), \`docs/02-arch/domains.md\`, and \`docs/02-arch/flows.md\`.
2. **Phase 2 — Core-First Wiring & Donors:**
   - Wire \`@ui-construction-library/*\`, \`@tgwrapper/*\`, Zod perimeter validation, Drizzle/Prisma integer-money schemas, and \`2+1\` payment webhooks with \`timingSafeEqual\`.
   - Include \`Dockerfile\`, \`docker-compose.yml\` with healthchecks, \`.github/workflows/ci.yml\`, and \`.github/workflows/udpa-gate.yml\`.
3. **Phase 3 — TDD-First Implementation (Red -> Green -> Refactor):**
   - Write failing Vitest tests BEFORE production logic for: domain math (integer precision), \`Idempotency-Key\` replay protection, webhook signature / TMA \`initData\` verification, \`CircuitBreaker\`, and Zod validation boundaries.
   - Implement minimal clean TypeScript (no \`any\`, Biome clean) and verify all 4 UI states in runtime.
4. **Phase 4 — Verification & Ecosystem Sync:**
   - Run \`pnpm lint && pnpm typecheck && pnpm test && pnpm build\`.
   - Promote durable task decisions from \`.ai/artefacts/<TASK-ID>/decisions.md\` to \`.ai/adr/NNNN-*.md\`.
   - Register the new project in \`/Users/jilimbo/Documents/Personal/project-audit/PROJECTS.yaml\`.
   - Run \`node /Users/jilimbo/Documents/Personal/project-audit/tools/docs-sync-check.mjs\` and \`node /Users/jilimbo/Documents/Personal/project-audit/tools/inventory.mjs\` (require 0 errors).
   - Output concise final summary: file tree, active ADRs, test results, and run commands. Do NOT run \`git push\`.
`;
}

function buildSharedProjectGuideBody(context: AgentPromptContext = {}): string {
  const projectName = context.projectName || '<project-slug>';
  const projectTitle = context.projectTitle || '<Project Title>';
  const format = context.format || '<saas|tma|bot|web+bot|agent|agent-mcp>';
  const coreDomain = context.coreDomain || '<core-domain>';
  const problem = context.problem || '<problem statement>';
  const specsLine = formatDiscoveredSpecs(context.discoveredSpecs);

  return `- **Project:** ${projectTitle} (\`${projectName}\`)
- **Preset:** \`${format}\` | **Core Domain:** \`${coreDomain}\`
- **Problem:** ${problem}
- **Discovered Product Specs:** ${specsLine}

## 0. Zero-Prompt Autonomous Execution Mandate
When an AI coding agent opens this repository with no detailed user prompt (or a short trigger like \`"start"\`, \`"go"\`, \`"continue"\`, \`"implement"\`, \`"build"\`), immediately execute without asking what to build:

1. **State A — Spec-Only / Fresh Skeleton (no domain business logic yet):**
   - Read \`.ai/AGENT_PROMPT.md\`, \`.ai/ARCHITECTURE.md\`, \`.ai/CONVENTIONS.md\`, \`docs/01-idea/brief.md\`, \`docs/02-arch/{domains,flows}.md\`, and all Discovered Product Specs (${specsLine}).
   - Immediately execute Phase 1 (ADRs for touched invariant axes) -> Phase 2 (Core-First & donor wiring) -> Phase 3 (TDD-First implementation).
2. **State B — Domain & UI Implementation:**
   - Write failing Vitest tests first for domain logic, integer precision, idempotency, webhook \`timingSafeEqual\`, and \`CircuitBreaker\`.
   - Implement minimal TypeScript and verify all 4 UI states (\`Default\`, \`Loading/Optimistic\`, \`Empty Actionable\`, \`Error + Retry\`).
3. **State C — Verification & Ecosystem Sync:**
   - Run \`pnpm lint && pnpm typecheck && pnpm test && pnpm build\`, promote durable ADRs from \`.ai/artefacts/<TASK-ID>/decisions.md\`, register in \`/Users/jilimbo/Documents/Personal/project-audit/PROJECTS.yaml\`, and run \`node /Users/jilimbo/Documents/Personal/project-audit/tools/docs-sync-check.mjs\`.
   - Pause to ask the user ONLY if an unsettled Domain Invariant Axis (Axes 1-8) requires an architectural decision.

## 1. Core-Infra & Ecosystem Reuse Rules
- **UI:** Use \`@ui-construction-library/core\` (${VERSIONS.uiLibraryCore}) + \`@ui-construction-library/tokens\` (\`--ucl-*\`). Inspect \`api-snapshot.json\` or the \`ui-library\` MCP server before writing JSX.
- **Telegram / TMA / Stars:** Use \`@tgwrapper/core\` (${VERSIONS.tgwrapperCore}), \`tmaHonoMiddleware\`, \`createStarsInvoiceLink\`, CAS \`SessionStorage\`, and \`TokenBucket\`/\`CircuitBreaker\`.
- **Versions & CI:** Keep dependency versions aligned with \`create-ready-stack/src/config/versions.ts\` and enforce \`jilimb0/udpa-engine@v1\` in \`.github/workflows/udpa-gate.yml\`.
- **Donors:** Reuse verified modules from \`Trader\` (\`FixedDecimal\` / \`node:sqlite\` WAL), \`C&TLab\` / \`RepoRadar\` (Paddle/CryptoBot + offline sync), \`service-app\` (Redis \`SET NX PX\`, BullMQ, \`AES-256-GCM\`, blind indexes), \`Speech\` (Whisper + SHA-256 cache), and \`portfolio\` (Entity SEO/GEO). See \`.ai/AGENT_PROMPT.md\` for the full donor matrix.

## 2. Eight Invariant Axes & Hard Guardrails
1. **Idempotency:** \`Idempotency-Key\` persisted in DB (\`UNIQUE\`) or \`Redis SET NX PX 120000\`. Never use in-memory \`Map\`/\`Set\`.
2. **Offline Sync:** IndexedDB/SQLite queue with \`last-write-wins\` and strict \`tenant_id\` isolation.
3. **Resilience:** \`3000ms\` connect / \`5000-10000ms\` response timeouts, max 3 retries with Full Jitter, stateful \`CircuitBreaker\`, and BullMQ/\`node:worker_threads\` (\`202 Accepted\`) for jobs >500ms.
4. **Numeric Precision:** Zero IEEE 754 \`Float\`/\`real\` for money, balances, or token costs; use integer minor units (\`priceCents\`, \`starsPrice\`, \`costMicros\`) or \`BigInt\`/\`Decimal(10,2)\`.
5. **Privacy & Zero-Leakage:** Startup Zod env validation (no hardcoded fallback secrets), \`crypto.timingSafeEqual\` for webhook signatures, \`AES-256-GCM\` + \`HMAC-SHA256\` blind indexes, scrubbed logs, \`stderr\`-only \`stdio\` MCP logs, zero external CDN/Google Fonts, no auto-\`git push\`.
6. **A11y & SSR Safety:** WAI-ARIA roles, WCAG AAA contrast, \`typeof window !== 'undefined'\` guards.
7. **Appllama UI & Mobile Kinematics:** \`4/8/16/24/32px\` grid, \`100-180ms\` spring physics (\`prefers-reduced-motion\`), 4 UI states; Expo/RN uses \`react-native-safe-area-context\`, UI-thread \`Reanimated\`, and \`@shopify/flash-list\`.
8. **Entity SEO & GEO:** Single \`JSON-LD (@graph)\`, anchor formula in lead paragraph/\`README.md\`/\`<noscript>\`/\`public/llms.txt\` (or \`noindex, nofollow\` for private TMAs).

## 3. Quality & Verification Gates
- \`pnpm lint\` (Biome — 0 errors)
- \`pnpm typecheck\` (\`tsc --noEmit\` — 0 errors)
- \`pnpm test\` (Vitest TDD suite)
- \`pnpm build\` (clean build)
- \`node /Users/jilimbo/Documents/Personal/project-audit/tools/docs-sync-check.mjs\` (0 errors)
- Never execute automatic \`git push\`.
`;
}

export function buildProjectAgentsMd(context: AgentPromptContext = {}): string {
  const projectTitle = context.projectTitle || '<Project Title>';
  return `# AGENTS.md — ${projectTitle}

Autonomous coding-agent contract for Antigravity, Claude Code, Cursor, Codex CLI, OpenCode, Windsurf, and Cline.

${buildSharedProjectGuideBody(context)}`;
}

export function buildProjectClaudeMd(context: AgentPromptContext = {}): string {
  const projectTitle = context.projectTitle || '<Project Title>';
  return `# CLAUDE.md — ${projectTitle}

Autonomous Claude Code instructions synchronized with \`AGENTS.md\` and \`.ai/AGENT_PROMPT.md\`.

${buildSharedProjectGuideBody(context)}`;
}
