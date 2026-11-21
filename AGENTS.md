# create-ready-stack

CLI scaffolding tool that generates production-ready full-stack projects with the proven stack: Hono 4 or Express 5 + Drizzle ORM or Prisma + Zod, React 19 + Vite 8 or Next.js 15 + TanStack Query 5, optional `@tgwrapper/core` bot, optional `@ui-construction-library`.

## Commands
- `pnpm build` — `tsc` (src/ → dist/)
- `pnpm dev` — `pnpm build --watch`
- `pnpm start` — `node bin/create-ready-stack.mjs init`
- `pnpm lint` — `biome lint src/`
- `pnpm lint:fix` — `biome check --write src/`
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm test` — `vitest run`
- `pnpm test:bench` — `vitest run tests/benchmark.test.ts --coverage.enabled=false`
- `pnpm validate` — `pnpm check && pnpm build`

## Release Flow
- Bump `version` in `package.json`
- Update `CHANGELOG.md`
- Commit → `git tag v<version>` → push → GitHub Actions (`release.yml`) publishes to npm
- Uses OIDC trusted publishing (`--provenance`) — no local tokens

## Conventions
- Generates flat `backend/`, `web/` (or `apps/web`), optional `bot/` structure
- File generation uses template literals + `fs.writeFile()` in `src/generators/`
- Dependency versions are centralized in `src/config/versions.ts` — always update that file, not per-generator strings
- Every project gets `docs/` with 6-level methodology markdown and `.ai/` architectural baseline
- Generated projects include CI workflows, Docker/Compose, Biome, and privacy-first defaults

## Starter Presets (Templates) & AI Agent Mode
- `--template saas` — Micro-SaaS with Next.js 15, Drizzle ORM, Stripe/Paddle billing webhooks, and `@ui-construction-library` PricingTable
- `--template tma` — Telegram Mini App with React 19, Hono, `@tgwrapper/core`, and Telegram Stars payments
- `--template bot` — Telegram Bot with `@tgwrapper/core` serverless webhook and polling handlers
- `--template agent` / `--template agent-mcp` — Agent orchestration platform with Drizzle traces, CAS approval gates, Control Room UI, and stdio MCP server
- `npx create-ready-stack prompt` — Prints the canonical universal English AI agent launch prompt (Core-First & Ecosystem Donors); canonical reference saved in `docs/AGENT_LAUNCH_PROMPT.md`
- `npx create-ready-stack init --agent --template <saas|tma|bot|agent|agent-mcp> --name <slug>` — Non-interactive AI agent scaffolding (supports `--in-place` for spec-only folders); automatically discovers top-level `*.md` specs, generates root `AGENTS.md`, `CLAUDE.md`, and `.ai/AGENT_PROMPT.md`, and emits `[AI_AGENT_MODE_DETECTED]` guidance when invoked by an AI agent

## Architecture Governance & Upgrades
- `src/commands/upgrade.ts` supports `--apply` flag to overwrite configuration files (`biome.json`, `tsconfig.base.json`, etc.)
- Architecture decisions tracked in `.ai/ARCHITECTURE.md` and `.ai/adr/` (ADR-0001 through ADR-0004)
