# Contributing

## Setup

```bash
git clone https://github.com/jilimb0/create-ready-stack
cd create-ready-stack
pnpm install
```

## Development

```bash
pnpm dev          # Watch mode compilation
pnpm start        # Run the CLI (runs init)
pnpm test         # Run tests
pnpm test:watch   # Tests in watch mode
pnpm lint         # Biome lint
pnpm typecheck    # TypeScript type check
pnpm check        # lint + typecheck + test
pnpm validate     # check + build
```

## Project Structure

```
src/
├── cli.ts              # CLI entry point (yargs setup)
├── commands/
│   └── init.ts         # Interactive scaffolding command
├── config/
│   └── versions.ts     # Centralized dependency versions
├── generators/
│   ├── backend.ts      # Backend project generator
│   ├── web.ts          # React frontend generator
│   ├── bot.ts          # Telegram bot generator
│   ├── docker.ts       # Docker Compose generator
│   ├── ci.ts           # CI workflow generator
│   ├── docs.ts         # 6-level methodology docs generator
│   ├── monorepo.ts     # Orchestrates all generators
│   └── packageJson.ts  # Root config files generator
├── types/
│   └── project.ts      # ProjectAnswers type definition
└── utils/
    └── fileSystem.ts   # File system utilities
```

## Adding a New Generator

1. Create `src/generators/<name>.ts` with a `generate<Name>(cwd, answers)` function
2. If needed, add prompt questions to `QUESTION_BLOCKS` in `src/commands/init.ts`
3. Add new fields to `ProjectAnswers` in `src/types/project.ts`
4. Wire the generator in `src/generators/monorepo.ts`
5. Add new dependency versions to `src/config/versions.ts`
6. Write tests in `src/generators/<name>.test.ts`
7. Add integration variant to `tests/generate-integration.test.ts`

## Testing

- Tests use Vitest with `globals: true`
- Generator tests write to temporary directories (auto-cleaned)
- Run `pnpm test:coverage` to check coverage
- Coverage thresholds: 70% statements, 60% branches, 60% functions, 70% lines

## Release Process

1. Update `version` in `package.json`
2. Update `CHANGELOG.md`
3. Run `pnpm validate` to verify
4. Commit: `git commit -m "chore: release v<version>"`
5. Tag: `git tag v<version>`
6. Push: `git push && git push --tags`
7. GitHub Actions publishes to npm with OIDC provenance
