# Changelog

## 0.5.1 (2026-10-15)

### Added
- Automated CI failure reporting integration
- Safe Sentry telemetry defaults without PII collection and strict referrer policy in templates
- Built-in `.ai/` architecture baseline and ADR scaffolding in generated projects (`.ai/ARCHITECTURE.md`, `.ai/CONVENTIONS.md`, `.ai/COMMON_TASKS.md`, `.ai/adr/`)

### Changed
- Standardized generated `.gitignore` to ignore environment secrets, debug logs, and `.ai/artefacts/`
- Refined starter presets documentation and relaxed Node.js engine compatibility to `>=22.0.0`
- Aligned ambient package manager configuration with pnpm v10

## 0.5.0 (2026-07-12)

### Added
- Starter template presets via `--template` (`-t`) flag (`saas`, `tma`, `bot`):
  - **SaaS Starter (`saas`):** Next.js 15 + Drizzle ORM + Auth + `@ui-construction-library` PricingTable + Stripe/Paddle webhook routes
  - **Telegram Mini App (`tma`):** React 19 + Hono 4 + `@tgwrapper/core` + Telegram Stars payments
  - **Telegram Bot (`bot`):** Modern `@tgwrapper/core` webhook and polling serverless starter
- Unit and snapshot tests for TMA and SaaS generators (`src/generators/tma.test.ts`, `src/generators/saas.test.ts`)
- Upgraded Biome linter configuration to 2.5.3

### Changed
- CLI `init` command updated to accept `--template` option with preset validation

## 0.4.0 (2026-07-11)

### Added
- Next.js 15 frontend option (`nextWeb.ts`) alongside React 19 + Vite 8
- Comprehensive 6-level methodology documentation generator (`docs/LEVELS.md`, `01-idea`, `02-arch`, `03-impl`, `04-quality`, `05-release`, `06-deploy`)
- Added `.nvmrc` and updated integration test matrix for Next.js generator variants

## 0.3.0 (2026-07-09)

### Added
- `create-ready-stack upgrade --apply` command to overwrite outdated template configs in existing projects
- Centralized dependency versions registry in `src/config/versions.ts`
- GitHub Pages landing page deployment workflow (`.github/workflows/pages.yml`)
- OIDC trusted publishing support (`--provenance`) for automated npm releases

### Changed
- Lowered Node.js engine requirement from `>=26` to `>=22`
- Replaced legacy grammY references with `@tgwrapper/core`

## 0.2.1 (2026-06-30)

### Fixed
- CLI E2E tests no longer fail in CI with vitest ESM resolution error
- E2E tests now verify `dist/` exists before running, with `pnpm build` fallback
- `import()` replaced with `createRequire` for vitest-compatible module loading

## 0.2.0 (2026-06-30)

### Added
- `create-ready-stack upgrade` command for re-applying templates to existing projects
- Changesets config (`.changeset/config.json`) for automated release versioning
- 5 additional integration test variants (now 8/8 all combos covered)
- Snapshot tests for generated output (package.json, docker-compose, CI, README)
- CLI E2E tests (run in CI: `--help`, `--version`, `init --help`, dist export)
- Benchmark test verifying full generation under 500ms
- `test:bench` script (`pnpm test:bench`)
- CI `bench` stage for regression detection
- `version.test.ts` (100% coverage on versions module)
- `fileSystem.test.ts` (100% coverage on fileSystem utility)
- GitHub Pages landing page at `docs/landing/index.html`
- `pnpm install` timeout increased to 120s in build verification test

### Changed
- Integration tests expanded from 3 to 8 variants (all Hono/Express × Drizzle/Prisma × web/web+bot combos)
- Test count grew from 86 to 160 across 12 test files
- CI workflow now builds before running tests (fixes CLI E2E in CI)
- CI benchmark job disables coverage to avoid false threshold failures
- `coverage/` added to `.gitignore`

### Fixed
- CLI E2E tests no longer fail in CI (build step moved before test step)
- Benchmark coverage thresholds no longer fail on isolated test runs

## 0.1.1 (2026-06-30)

### Added
- `--force` (`-f`) flag for overwriting existing directories
- `--version` flag with current version output
- Self-update check on `init` (checks npm registry for newer version)
- Tailwind CSS v4 support as optional prompt
- Sentry error tracking as optional prompt
- GitHub Dependabot configuration in generated projects
- Docker health checks (pg_isready for DB, wget /health for backend)
- `.dockerignore` files for backend, web, and bot packages
- Coverage thresholds (70/60/60/70) with `@vitest/coverage-v8`
- Working health-check test in generated backend projects (replaced placeholder)
- Enhanced App.test.tsx with 3 tests (render, welcome, counter click)
- `useTailwind` and `useSentry` fields in ProjectAnswers type
- Version exports for `@sentry/node`, `@sentry/react`, `@tailwindcss/vite`, `tailwindcss`
- CHANGELOG.md, CONTRIBUTING.md, API_STABILITY.md for the tool itself
- `.gitignore` and `.dockerignore` entries for generated projects
- `test:coverage`, `test:watch`, `check`, `validate`, `lint:fix` scripts

### Changed
- Upgraded CLI help output with banner, usage examples, and formatted help
- Enhanced generated App.tsx with useState counter demo
- DB health check now uses proper `sql\`SELECT 1\`` syntax for Drizzle
- DB health check now uses proper `prisma.$queryRaw\`SELECT 1\`` for Prisma
- Upgraded moduleResolution to "bundler" for better ESM compatibility
- Included `bin/` in tsconfig compiler scope
- Generated backend server includes Sentry initialization when enabled
- Generated web index includes Sentry.init + withProfiler when enabled

### Fixed
- Health check endpoint now reports DB connectivity status correctly
- Generated backend test no longer uses import attributes (ESM compat)
- Non-empty directory check now properly respects --force flag

## 0.1.0 (2026-06-25)

### Added
- Interactive CLI scaffolding via `create-ready-stack init`
- Project type selection: backend (Hono/Drizzle), web (React/Vite), bot (Telegraf)
- Optional Sentry error tracking integration
- Optional Tailwind CSS v4 integration
- PostgreSQL service with configurable port
- Docker Compose setup for all services
- GitHub Actions CI workflow
- 6-level methodology documentation generator
- Prisma ORM support as optional prompt
- Automated test generation for scaffolds
- Health check endpoints for generated backends
- `--help` flag with usage examples
