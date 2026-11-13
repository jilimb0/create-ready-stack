# ADR-0003: Agent Orchestration Template Preset with Telemetry Schema and Control Room

**Status:** Accepted  
**Date:** 2026-11-09  
**Deciders:** Core Engineering Team  
**Applies-To:** `src/generators/agent.ts`, `src/config/versions.ts`  
**Supersedes:** None  
**Overrides-Global:** None  

## Y-Summary
In create-ready-stack, facing backlog task #1 to scaffold agentic and MCP applications, we add the --template agent preset with Drizzle trace schema, CAS approval service, SSE broker, and UI Control Room.

## Context and Problem Statement
Scaffolding AI agent systems requires a production-grade template with out-of-the-box observability, CAS approval gates, and design-system integration.

## Decision Drivers
- Rapid onboarding for agentic workloads
- Pre-configured UDPA invariants
- Ecosystem package alignment (@ui-construction-library/core ^0.10.0, zod ^4.6.7)

## Imperative Constraints for AI Agents (MUST / MUST NOT)
- **MUST:** Import dependency versions strictly from src/config/versions.ts
- **MUST:** Generate Drizzle schema for runs, nodes, trace spans, and approval gates with integer micro-dollars
- **MUST:** Include stdio MCP server template conforming to MCP 2024-11-05 standard
- **MUST NOT:** Never hardcode dependency version strings in template generator files

## Considered Options & Rejected Alternatives
1. **Option 1 (Chosen): --template agent generator scaffolding complete Drizzle + SSE + CAS + Control Room stack**
   - *Why chosen:* Satisfies all decision drivers and domain invariants.
2. **Option 2 (Rejected — DO NOT PROPOSE): Ad-hoc unvalidated implementation**
   - *Why rejected:* Violates deterministic contract and causes architectural drift.

## Consequences & Trade-offs
- **Positive:** Deterministic enforcement and zero architectural drift.
- **Negative / Cost:** Requires compliance across `src/generators/agent.ts`, `src/config/versions.ts`.

## Verification Gate
- **Check Command:** `pnpm test`
