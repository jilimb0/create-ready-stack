# ADR-0005: Terminal Workspace UX & Read-Only MCP Context Scaffolding

**Status:** Accepted  
**Date:** 2026-11-21  
**Deciders:** Core Engineering Team  
**Applies-To:** `src/generators/terminalKit.ts`, `src/generators/agent.ts`, `src/generators/saas.ts`, `src/generators/web.ts`, `src/config/versions.ts`, `src/commands/init.ts`  
**Supersedes:** None  
**Overrides-Global:** None  

## Y-Summary
In the context of `create-ready-stack` (`src/generators/**`, `src/commands/init.ts`), facing duplicated template boilerplate and missing Bloomberg/Koyfin workspace ergonomics and screen-context MCP resources, we decided for **a shared `src/generators/terminalKit.ts` generator (`TerminalShell` with `WidgetLinkProvider`, `CommandPalette` `[Entity] [Mnemonic]`, `SourceLineageDrawer`, integer `amountMinor`/`idempotencyKey`, and 4 WAI-ARIA UI states) plus read-only MCP resources (`bds://*/lineage-citations` and PII-scrubbed `bds://*/active-workspace-context`) enabled via `agent-mcp` or `--with-mcp`** and neglected per-template shell duplication or mutating MCP tools, to achieve deterministic, SSR-safe terminal workspaces and context-aware AI copilots across `agent`, `agent-mcp`, `saas`, and `web`, accepting strict alignment with centralized `VERSIONS` in `src/config/versions.ts`.

## Context and Problem Statement
Generated projects previously included `@ui-construction-library/core` and basic `AgentControlRoom` / `stdio` MCP scaffolding, but lacked out-of-the-box terminal workspace composition (color-linked panels, global `/` and `Cmd+K` mnemonic command palette, click-to-source lineage audit drawer, empty `apps/web/app/dashboard` in `saas`), still contained hardcoded package versions (`^0.9.0`, `^0.6.0`, `^0.1.0`), and did not expose sanitized active workspace state or lineage citation resources to read-only MCP clients.

## Decision Drivers
- **Axis 1 (Idempotency & Deterministic Generation):** All generated dependency versions MUST resolve through `version(...)` from `src/config/versions.ts` (including `uiLibraryTokens`, `next`, `stripe`); SaaS billing schemas enforce `UNIQUE` `idempotencyKey`.
- **Axis 4 (Numeric Precision):** All generated financial, billing, and lineage values strictly use integer minor units (`amountMinor`, `valueMinor`) or `totalCostMicros`/`selfCostMicros`, formatted via `BigInt` arithmetic without IEEE 754 floats.
- **Axis 5 (Zero-Leakage & Read-Only MCP):** Generated MCP servers strictly return `{ tools: [] }`, log only via `process.stderr.write`, return JSON-RPC `-32601` for unknown methods, and filter active workspace context through an explicit allowlist sanitizer (`sanitizeWorkspaceContext`) stripping tokens, cookies, and PII.
- **Axis 6 & 7 (SSR Safety, WAI-ARIA & 4 UI States):** Next.js 15 client wrappers emit `'use client'`, guard browser globals with `typeof window !== 'undefined'`, use semantic `<fieldset>`/`aria-*` controls, and render explicit `default`, `loading`, `empty`, and `error` states.
- **Axis 8 (SEO/GEO):** `saas` and `web` generators emit single `JSON-LD (@graph)`, `<noscript>` navigation, and `public/llms.txt`.

## Imperative Constraints for AI Agents (MUST / MUST NOT)
- **MUST:** Reuse `buildTerminalShellSource` and SEO helpers from `src/generators/terminalKit.ts` rather than duplicating `TerminalShell` code across `agent.ts`, `saas.ts`, and `web.ts`.
- **MUST:** Resolve every generated dependency and devDependency version via `version(...)` in `src/config/versions.ts`, keeping `uiLibraryTokens` in `VERSIONS`.
- **MUST:** Keep generated MCP servers strictly read-only (`tools: []`, `stderr`-only logging, and allowlist-sanitized `active-workspace-context`).
- **MUST NOT:** Never emit `cost_usd` float columns, unguarded `window` accesses in SSR templates, or hardcoded `@ui-construction-library/*` version strings in generators.
- **DO NOT RE-INTRODUCE:** Empty `apps/web/app/dashboard` directories in `saas.ts` or raw `<div role="group">` wrappers where Biome requires `<fieldset>`.

## Considered Options & Rejected Alternatives
1. **Option 1 (Chosen): Shared `src/generators/terminalKit.ts` + centralized `VERSIONS` + read-only 5-URI MCP with `--with-mcp`**
   - *Why chosen:* Eliminates cross-preset duplication, satisfies Axes 1/4/5/6/7/8, and works identically for `agent`, `agent-mcp`, `saas`, and `web`.
2. **Option 2 (Rejected — DO NOT PROPOSE): Copy-pasting `TerminalShell` inline into each generator or adding mutating MCP `tools/call` handlers**
   - *Why rejected:* Causes template divergence, violates DRY, and breaks the read-only MCP security boundary.

## Consequences & Trade-offs
- **Positive:** Every newly generated `agent`, `agent-mcp`, `saas`, and UI-enabled `web` project boots with linked panels, mnemonic command navigation, lineage auditing, and optional read-only MCP context.
- **Negative / Cost:** Generator upgrades to `@ui-construction-library/*` component contracts must be updated in `src/generators/terminalKit.ts` and verified across preset tests.

## Verification Gate
- **Check Command:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build` and `node /Users/jilimbo/Documents/Personal/project-audit/tools/docs-sync-check.mjs`
- **Code Anchors:** `src/generators/terminalKit.ts`, `src/generators/agent.ts`, `src/generators/saas.ts`, `src/generators/web.ts`, `src/config/versions.ts`, `src/commands/init.ts`
