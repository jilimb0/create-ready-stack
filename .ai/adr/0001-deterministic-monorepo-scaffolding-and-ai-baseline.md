# ADR-0001: Deterministic Monorepo Scaffolding & Built-In .ai/ Privacy Baseline

**Status:** Accepted  
**Date:** 2026-10-30  
**Deciders:** Core Engineering Team  
**Applies-To:** `src/**`, `bin/**`, `tests/**`  
**Supersedes:** None  
**Overrides-Global:** None (`GLOBAL-TS-01`, `GLOBAL-TS-02`, `GLOBAL-PRIV-01`, `GLOBAL-PRIV-02`)  

## Y-Summary
In the context of `create-ready-stack` (`src/generators/**`, `src/utils/**`), facing inconsistent boilerplate across new microservices and missing `.ai/` governance in freshly created repos, we decided for **deterministic template generation with Hono 4 + Drizzle ORM + React 19 + TanStack Query 5 + `@tgwrapper/core`, non-collision target path checks, and pre-populated `.ai/` artifacts (with `.ai/artefacts/` git-ignored)** instead of ad-hoc repo cloning, to ensure every new project starts lint-clean and agent-governed out of the box, accepting template maintenance on stack upgrades.

## Context and Problem Statement
Creating new fullstack or Telegram Mini App repositories manually led to configuration drift (inconsistent tsconfig/Biome rules, missing `.ai/` directories, or forgotten `.gitignore` entries for secrets and `.ai/artefacts/`).

## Decision Drivers
- Zero-drift scaffolding for the standard stack (`Hono 4`, `Drizzle ORM`, `React 19`, `TanStack Query 5`, `@tgwrapper/core`)
- Mandatory `.ai/ARCHITECTURE.md`, `.ai/CONVENTIONS.md`, `.ai/COMMON_TASKS.md`, and `.ai/adr/0000-template.md` in every generated project
- Safe filesystem operations in `src/utils` preventing accidental overwrite of non-empty directories

## Imperative Constraints for AI Agents (MUST / MUST NOT)
- **MUST:** Verify target directory non-collision in `src/utils` before writing generated project files.
- **MUST:** Include `.ai/` baseline files and `.ai/artefacts/` in the generated `.gitignore` of every scaffolded project.
- **MUST:** Ensure all generated templates pass `biome check` and `tsc --noEmit` deterministically without network-dependent post-processing.
- **MUST NOT:** Never embed hardcoded secrets, external Google Fonts CDNs, or telemetry trackers in scaffold templates.

## Considered Options & Rejected Alternatives
1. **Option 1 (Chosen): Programmatic generator in `src/generators` with `.ai/` baseline + Vitest snapshot/integration verification**
   - *Why chosen:* Produces deterministic, lint-clean projects and enforces ecosystem conventions from commit zero.
2. **Option 2 (Rejected — DO NOT PROPOSE): Remote `git clone` of a static starter repository**
   - *Why rejected:* Fails offline, retains template git history, and cannot conditionally compose sub-packages (Web/API/Bot).

## Consequences & Trade-offs
- **Positive:** 100% of newly generated projects automatically comply with `docs-sync-check.mjs` and Golden Standards.
- **Negative / Cost:** Generator templates in `src/` must be updated when `.ai/adr/0000-template.md` evolves.

## Verification Gate
- **Check Command:** `pnpm validate`
- **Code Anchors:** `src/`, `bin/create-ready-stack.mjs`
