# create-project-cli

Create a production-ready Node.js + Next.js monorepo with Telegram bot support, following a structured 6-level development methodology.

## Development Methodology (6 Levels)

The CLI generates projects following these 6 levels:

1. **Level 01 — Idea & Context**: Define the problem, target audience, usage scenarios, success criteria, and key features
2. **Level 02 — Architecture & Design**: Design modular monolith architecture with domain-driven modules
3. **Level 03 — Implementation**: Generate skeleton codebase (backend + web + optional bot)
4. **Level 04 — Quality**: Set up linting (Biome), TypeScript strict mode, and testing
5. **Level 05 — Release**: Configure release flow, CHANGELOG, and versioning
6. **Level 06 — Deploy**: Prepare Docker/Compose files for VPS deployment

## Installation

### Locally (via npx):

```bash
npx create-project-cli init
```

### Globally:

```bash
npm install -g create-project-cli
create-project-cli init
```

## Usage

### Run the init command:

```bash
create-project-cli init
```

or via npx:

```bash
npx create-project-cli init
```

## Init command flow

1. **CLI starts** → reads current directory
2. **Check if directory is empty** → if not empty, asks for confirmation
3. **Block 1: General settings**:
   - Project name (slug)
   - Project title
   - First version format (web, bot, web+bot)
   - Enable multi-user mode?
   - Use Docker/Compose?

4. **Block 2: Level 01 — Idea & Context**:
   - Problem statement
   - Target audience
   - Main usage scenario
   - Success criteria for v1
   - Key metrics
   - Time budget
   - Financial constraints
   - Stack requirements
   - Integrations
   - Key features for v1
   - Business hypotheses
   - Main risks
   - Critical risk

5. **Block 3: Level 02 — Architecture**:
   - Core domain name

6. **Project generation**:
   - docs/ created (LEVELS, 01-idea, 02-arch, 03-impl, 04-quality, 05-release, 06-deploy)
   - Monorepo created (backend/, web/, bot/, scripts/, .github/workflows)
   - package.json created with commands (lint, typecheck, test, check, validate, release:prep, release:tag)

## What appears on disk

After running `create-project-cli init` in the current folder:

```
<project-name>/
├── docs/
│   ├── LEVELS.md
│   ├── 01-idea/
│   │   ├── brief.md
│   │   └── dod.md
│   ├── 02-arch/
│   │   ├── domains.md
│   │   ├── flows.md
│   │   └── dod.md
│   ├── 03-impl/
│   │   ├── dod.md
│   │   └── commands.md
│   ├── 04-quality/
│   │   ├── task-dod.md
│   │   ├── feature-dod.md
│   │   └── checklist-manual.md
│   ├── 05-release/
│   │   ├── checklist.md
│   │   └── release-flow.md
│   └── 06-deploy/
│       ├── checklist.md
│       ├── deploy-vps-docker.md
│       └── deploy-vps-manual.md
├── backend/
│   ├── src/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── web/
│   ├── pages/
│   │   ├── _app.tsx
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   └── dashboard.tsx
│   ├── next.config.js
│   └── package.json
├── bot/ (optional)
│   ├── src/
│   │   └── index.ts
│   └── package.json
├── scripts/
│   ├── release-tag.sh
│   ├── deploy-docker.sh
│   └── deploy-manual.sh
├── .github/
│   └── workflows/
│       └── ci.yml
├── package.json
├── biome.json
├── tsconfig.base.json
├── .gitignore
├── CHANGELOG.md
└── VERSION
```

## Notes

- The CLI creates a new folder with the project name you provide
- All generated files follow the 6-level development methodology
- Docker/Compose files are optional and created only if you enable them
- The monorepo uses pnpm + Turborepo structure by default
