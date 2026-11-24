# Architecture: create-ready-stack

## 1. Identity & Domain
create-ready-stack — Automated fullstack CLI generator and project scissoring tool for modern TypeScript, Next.js, and Telegram bot applications.
- **Status:** active
- **Remote:** `git@github.com:jilimb0/create-ready-stack.git`
- **Default Branch:** `main`

## 2. Stack & Runtime
- **Runtime:** TypeScript, Node.js CLI, Inquirer, Yargs, Fs-extra, Biome, Vitest.
- **Directories:** `src`, `tests`, `bin`, `docs`

## 3. Structural Invariants
- Template generation in `src/generators` must produce deterministic, lint-clean projects.
- Generated projects must include `.ai/` architecture baseline and strict privacy defaults.
- Filesystem writes in `src/utils` must validate target directory non-collision before write.
- Presets (`saas`, `tma`, `bot`) must reuse centralized dependency versions from `src/config/versions.ts`.

## 4. Data Flows & External Boundaries
- Inbound requests are validated at perimeter boundaries using strict schemas.
- Outbound third-party calls must employ timeouts, retries with backoff, and circuit breakers.
- Zero secrets or unredacted customer PII in logs or storage snapshots.

## 5. Active ADRs
- **[ADR-0001](.ai/adr/0001-deterministic-monorepo-scaffolding-and-ai-baseline.md)** (`src/**`, `bin/**`, `tests/**`): Deterministic monorepo scaffolding (Hono 4 + Drizzle + React 19 + TanStack Query 5 + TGWrapper), pre-write directory collision guards, and built-in `.ai/` + privacy baseline generation.
- **[ADR-0002](.ai/adr/0002-starter-presets-and-domain-scaffolding.md)** (`src/generators/*.ts`, `src/commands/init.ts`): Built-in specialized starter presets (`--template saas|tma|bot`) with pre-wired payments, Telegram Stars, and webhooks under strict privacy and idempotency invariants.
- **[ADR-0003](.ai/adr/0003-agent-orchestration-template-preset.md)** (`src/generators/*.ts`, `src/config/versions.ts`): In create-ready-stack, facing backlog task #1 to scaffold agentic and MCP applications, we add the --template agent preset with Drizzle trace schema, CAS approval service, SSE broker, and UI Control Room.
- **[ADR-0004](.ai/adr/0004-ai-agent-launch-prompt-and-headless-mode.md)** (`src/config/agentPrompt.ts`, `src/commands/prompt.ts`, `src/commands/init.ts`, `src/generators/docs.ts`, `src/utils/fileSystem.ts`, `src/cli.ts`): Embed canonical English Core-First AI agent launch prompt (`docs/AGENT_LAUNCH_PROMPT.md`), expose `prompt` command and `--agent` / `--in-place` headless `init` mode with spec discovery and auto-generated root `AGENTS.md`, `CLAUDE.md`, and AGENT_PROMPT.md.
- **[ADR-0005](.ai/adr/0005-terminal-ux-and-mcp-context-scaffolding.md)** (`src/generators/terminalKit.ts`, `src/generators/agent.ts`, `src/generators/saas.ts`, `src/generators/web.ts`, `src/config/versions.ts`, `src/commands/init.ts`): Centralize `TerminalShell` (`WidgetLinkProvider`, `CommandPalette`, `SourceLineageDrawer`, 4 WAI-ARIA UI states, SSR guards, integer `amountMinor`/`idempotencyKey`) across `agent`/`saas`/`web`, enforce `VERSIONS` (`uiLibraryTokens`), and add `--with-mcp` with read-only `bds://*/lineage-citations` and PII-scrubbed `bds://*/active-workspace-context`.
- **[ADR-0006](.ai/adr/0006-prd-to-architecture-blueprint-mode.md)** (`src/generators/blueprint.ts`, `src/commands/init.ts`, `src/cli.ts`): Add `--blueprint` PRD-to-Blueprint mode writing `gavel/floorplan@1` (`mode: 'prd_blueprint'`) `architecture-blueprint.json` with `VERSIONS`-locked stack and 6-axis `openDecisions` prior to scaffolding.
