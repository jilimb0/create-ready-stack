# ADR-0002: Starter Presets & Domain Scaffolding Architecture (SaaS, TMA, Bot)

**Status:** Accepted  
**Date:** 2026-11-02  
**Deciders:** Core Engineering Team  
**Applies-To:** `src/generators/*.ts`, `src/commands/init.ts`  
**Supersedes:** None  
**Overrides-Global:** None (`GLOBAL-TS-01`, `GLOBAL-TS-02`, `GLOBAL-PRIV-01`, `GLOBAL-FIN-01`)  

## Y-Summary
In the context of `create-ready-stack` (`src/generators/**`, `src/commands/init.ts`), facing repetitive boilerplate setup for common fullstack topologies (Micro-SaaS with payments, Telegram Mini Apps with Stars, and Telegram bots), we decided for **built-in preset templates (`--template saas|tma|bot`) composing modern frameworks (Next.js 15, Hono, `@tgwrapper/core`, `@ui-construction-library`) with pre-wired billing webhooks and safe environment fallbacks** instead of separate generator binaries or external repos, to ensure instant time-to-market while strictly adhering to privacy and idempotency standards, accepting maintenance of specialized preset templates.

## Context and Problem Statement
Developers frequently build standard product archetypes:
1. Micro-SaaS applications requiring Next.js 15, Drizzle ORM, authentication, responsive pricing tables, and Stripe/Paddle billing webhooks.
2. Telegram Mini Apps (TMA) requiring React 19, Hono backend, `@tgwrapper/core`, and Telegram Stars monetization.
3. Standalone Telegram Bots requiring serverless webhook routing and polling modes.
Configuring these architectures manually via generic prompts caused repetitive manual assembly and configuration errors.

## Decision Drivers
- High-velocity scaffolding for the 3 primary ecosystem product topologies (`saas`, `tma`, `bot`)
- Zero PII leaks and dummy fallback secrets in generated webhooks (`process.env.STRIPE_WEBHOOK_SECRET || ''`)
- Safe financial & payment handling aligning with `GLOBAL-FIN-01` (idempotent webhook events) and `GLOBAL-FIN-02` (integer minor units / stars)
- Full compatibility with the existing CLI flags (`--force`, `--template`) and automated testing suite

## Imperative Constraints for AI Agents (MUST / MUST NOT)
- **MUST:** Centralize dependency version numbers for all presets in `src/config/versions.ts`.
- **MUST:** Implement signature validation guards for external webhooks (Stripe `constructEvent`, Paddle payload checks).
- **MUST:** Provide unit and integration test coverage for each generator preset (`src/generators/*.test.ts`).
- **MUST NOT:** Never commit hardcoded production secrets, actual Stripe API keys, or bot tokens inside preset generator strings.

## Considered Options & Rejected Alternatives
1. **Option 1 (Chosen): Integrated preset generators (`src/generators/{saas,tma,bot}.ts`) activated by `--template` CLI flag**
   - *Why chosen:* Provides immediate, deterministic project generation without extra network roundtrips, reusing shared config and test harnesses.
2. **Option 2 (Rejected — DO NOT PROPOSE): Separate standalone CLI packages (`create-ready-saas`, `create-ready-tma`)**
   - *Why rejected:* Increases maintenance overhead across multiple repositories and fragments shared toolchains.
3. **Option 3 (Rejected — DO NOT PROPOSE): Interactive-only questions without CLI flags**
   - *Why rejected:* Prevents headless automation, CI validation, and one-command scripting.

## Consequences & Trade-offs
- **Positive:** Complete Micro-SaaS, TMA, and Bot scaffolds are ready for production in seconds with correct architectural patterns.
- **Negative / Cost:** When upstream libraries update (e.g. Next.js, Stripe SDK), generator templates must be updated and re-verified.

## Verification Gate
- **Check Command:** `pnpm test`
- **Code Anchors:** `src/generators/saas.ts`, `src/generators/tma.ts`, `src/generators/bot.ts`, `src/commands/init.ts`
