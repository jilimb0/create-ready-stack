# Architecture: create-ready-stack

## 1. Identity & Domain
create-ready-stack — Automated fullstack CLI generator and project scissoring tool for modern TypeScript, Next.js, and Telegram bot applications.
- **Status:** active
- **Remote:** `git@github.com:jilimb0/create-ready-stack.git`
- **Default Branch:** `main`

## 2. Stack & Runtime
- **Runtime:** TypeScript, Node.js CLI, Inquirer, Fs-extra, Biome, Vitest.
- **Directories:** `src`, `tests`, `bin`

## 3. Structural Invariants
- Template generation in `src/generators` must produce deterministic, lint-clean projects.
- Generated projects must include `.ai/` architecture baseline and strict privacy defaults.
- Filesystem writes in `src/utils` must validate target directory non-collision before write.

## 4. Data Flows & External Boundaries
- Inbound requests are validated at perimeter boundaries using strict schemas.
- Outbound third-party calls must employ timeouts, retries with backoff, and circuit breakers.
- Zero secrets or unredacted customer PII in logs or storage snapshots.
