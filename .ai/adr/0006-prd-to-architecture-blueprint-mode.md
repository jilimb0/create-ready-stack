# ADR-0006: PRD-to-Architecture Blueprint Mode (`--blueprint`)

**Status:** Accepted  
**Date:** 2026-11-24  
**Deciders:** Core Engineering Team  
**Applies-To:** `src/generators/blueprint.ts`, `src/commands/init.ts`, `src/cli.ts`  
**Supersedes:** None  
**Overrides-Global:** None  

## Y-Summary
In the context of `create-ready-stack` project initialization, facing the need to validate system boundaries and UDPA invariants before writing monorepo boilerplate, we decided for `--blueprint` mode generating `architecture-blueprint.json` (`gavel/floorplan@1`, `mode: 'prd_blueprint'`, `VERSIONS`-locked stack, and 6-axis `openDecisions`), neglecting blind full-monorepo generation prior to boundary review, to achieve deterministic pre-scaffold review, accepting an extra command step before code generation.

## Context and Problem Statement
Scaffolding a full monorepo immediately from a PRD can lock in wrong transport, ORM, or multi-tenant assumptions before the architect reviews module boundaries.

## Decision Drivers
- **ADR-0001:** Respect non-empty directory pre-write collision guards (`!force && !isDirectoryEmpty && !isSpecOnlyDirectory`).
- **Centralized Versions:** Pull all recommended dependency versions exclusively from `VERSIONS` in `src/config/versions.ts`.
- **6 UDPA Axes:** Surface unresolved architectural decisions (`openDecisions`) explicitly across Axes 1–6 using integer `bps` metrics.

## Imperative Constraints for AI Agents (MUST / MUST NOT)
- **MUST:** Emit `architecture-blueprint.json` with `schemaTag: 'gavel/floorplan@1'`, `mode: 'prd_blueprint'`, and `VERSIONS` from `src/config/versions.ts`.
- **MUST NOT:** Write monorepo files (`package.json`, `apps/`, `packages/`) when `--blueprint` is passed.
- **DO NOT RE-INTRODUCE:** Hardcoded dependency version strings in `src/generators/blueprint.ts`.

## Considered Options & Rejected Alternatives
1. **Option 1 (Chosen): `--blueprint` pre-scaffold artifact (`architecture-blueprint.json`)**
   - *Why chosen:* Zero-cost boundary validation before writing files; compatible with `gavel/floorplan@1`.
2. **Option 2 (Rejected — DO NOT PROPOSE): Always scaffolding full monorepo then deleting unwanted apps**
   - *Why rejected:* Wasteful disk/git churn and risks partial cleanup bugs.

## Consequences & Trade-offs
- **Positive:** Fast PRD-to-Blueprint review across `saas`, `tma`, `bot`, `agent`, and `agent-mcp`.
- **Negative / Cost:** Requires a follow-up `init` run (without `--blueprint`) to materialize code.

## Verification Gate
- **Check Command:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- **Code Anchors:** `src/generators/blueprint.ts`, `src/commands/init.ts`, `src/cli.ts`.
