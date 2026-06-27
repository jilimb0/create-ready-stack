# create-ready-stack

CLI scaffolding tool that generates production-ready full-stack projects with the proven stack: Hono 4 + Drizzle ORM + Zod, React 19 + Vite 8 + TanStack Query 5, optional `@tgwrapper/core` bot, optional `@ui-construction-library`.

## Commands
- `pnpm build` — `tsc` (src/ → dist/)
- `pnpm dev` — `pnpm build --watch`
- `pnpm start` — `node bin/create-ready-stack.mjs init`
- `pnpm lint` — `biome lint src/`
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm test` — `vitest run`

## Publish Flow
- Bump `version` in `package.json`
- Commit → `git tag v<version>` → push → GitHub Actions publishes to npm
- Uses OIDC trusted publishing (`--provenance`) — no local tokens

## Conventions
- Generates flat `backend/`, `web/`, optional `bot/` structure
- EJS templating for file generation
- Every project gets `docs/` with level-specific markdown
- Generated projects include CI workflows, Docker/Compose, Biome
