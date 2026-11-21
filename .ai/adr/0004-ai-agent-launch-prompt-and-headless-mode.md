# ADR-0004: Universal English AI Agent Launch Prompt & Headless Agent Mode

**Status:** Accepted  
**Date:** 2026-11-21  
**Deciders:** Core Engineering Team  
**Applies-To:** `src/config/agentPrompt.ts`, `src/commands/prompt.ts`, `src/commands/init.ts`, `src/generators/docs.ts`, `src/utils/fileSystem.ts`, `src/cli.ts`  
**Supersedes:** None  
**Overrides-Global:** None (`GLOBAL-TS-01`, `GLOBAL-PRIV-01`, `GLOBAL-FIN-01`)  

## Y-Summary
In `create-ready-stack`, facing repeated manual prompt engineering to align AI agents with `core-infra`, the 8 invariant axes, and ecosystem donor modules, we embed a centralized English prompt builder (`src/config/agentPrompt.ts`), generate `.ai/AGENT_PROMPT.md` plus root `AGENTS.md` and `CLAUDE.md` with automatic spec `.md` discovery in every scaffolded repository, expose `create-ready-stack prompt`, and support headless `--agent` and `--in-place` / env-detected agent guidance in `init`, instead of maintaining external ad-hoc prompts, ensuring zero-prompt autonomous core-first execution from commit zero.

## Context and Problem Statement
When an AI coding agent initializes a new project in the ecosystem, interactive Inquirer prompts block automation, and ad-hoc launch prompts drift from `src/config/versions.ts`, the 8 domain invariant axes, and reusable donor modules across the 19 ecosystem repositories.

## Decision Drivers
- Single source of truth for the English AI agent launch prompt synced with `VERSIONS` (`src/config/versions.ts`)
- Non-interactive `--agent` scaffolding (`--name`, `--title`, `--domain`, `--problem`, `--template`) without breaking interactive CLI flows
- Automatic detection of AI agent execution environments (`AI_AGENT`, `CLAUDECODE`, `ANTIGRAVITY_AGENT`, `CURSOR_AGENT`, `OPENCODE`, `CODEX_CLI`, `AIDER`)
- Automatic creation of `.ai/AGENT_PROMPT.md` and valid ADR-0001 indexing in every generated repository

## Imperative Constraints for AI Agents (MUST / MUST NOT)
- **MUST:** Keep the canonical prompt in concise, unambiguous English inside `src/config/agentPrompt.ts` and mirror it in `docs/AGENT_LAUNCH_PROMPT.md`.
- **MUST:** Preserve interactive `inquirer.prompt` behavior when neither `--agent`, `--name`, nor `CRS_AGENT_HEADLESS=1` is set.
- **MUST:** Generate `.ai/AGENT_PROMPT.md`, root `AGENTS.md` and `CLAUDE.md`, discover existing `*.md` specs in `cwd`, support `--in-place` inside spec-only directories, and index `0001-initial-stack-and-privacy-baseline.md` under `## 5. Active ADRs` in generated `.ai/ARCHITECTURE.md`.
- **MUST NOT:** Never trigger interactive prompts when running in `--agent` headless mode or overwrite pre-existing user `*.md` spec files during `--in-place` scaffolding.

## Considered Options & Rejected Alternatives
1. **Option 1 (Chosen): Embedded TypeScript prompt builder + `prompt` subcommand + `--agent` headless `init` mode + generated `.ai/AGENT_PROMPT.md`**
   - *Why chosen:* Zero version drift, works offline, testable with Vitest, and activates automatically for AI agents.
2. **Option 2 (Rejected — DO NOT PROPOSE): Standalone static markdown prompt outside the npm package**
   - *Why rejected:* Not distributed with `npx create-ready-stack` and cannot interpolate `ProjectAnswers` or `VERSIONS`.

## Consequences & Trade-offs
- **Positive:** Both `npx create-ready-stack prompt` and every newly generated repo carry the exact core-first English execution contract.
- **Negative / Cost:** `docs/AGENT_LAUNCH_PROMPT.md` should stay aligned when `ECOSYSTEM_DONOR_CATALOG` or `buildUniversalAgentPrompt` evolves.

## Verification Gate
- **Check Command:** `pnpm validate`
- **Code Anchors:** `src/config/agentPrompt.ts`, `src/commands/prompt.ts`, `src/commands/init.ts`, `src/generators/docs.ts`, `src/cli.ts`
