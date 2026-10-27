# Common Development Tasks: create-ready-stack

## 1. Standard Commands
- **Build CLI:** `pnpm build` — Compiles TypeScript CLI binary to dist.
- **Run tests:** `pnpm test` — Executes generator test suite with Vitest.
- **Typecheck:** `pnpm typecheck` — Typechecks CLI sources.
- **Lint code:** `pnpm lint` — Runs Biome linting.

## 2. Recipe: Adding a New Feature
1. Review requirements against invariants in `.ai/ARCHITECTURE.md`.
2. Write a failing test in test directory verifying expected behavior.
3. Implement minimal clean code to satisfy the test.
4. Run `pnpm test` and `pnpm typecheck`.
5. Run `pnpm lint` to ensure code style compliance.

## 3. Recipe: Fixing a Bug
1. Reproduce defect with an automated regression test.
2. Verify test failure matches reported symptoms.
3. Apply targeted fix without modifying unrelated code.
4. Verify all tests pass with `pnpm typecheck`.
