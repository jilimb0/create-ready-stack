# Changelog

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
