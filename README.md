# create-ready-stack

[![npm version](https://img.shields.io/npm/v/create-ready-stack)](https://www.npmjs.com/package/create-ready-stack)
[![CI](https://github.com/anomalyco/Methodology/actions/workflows/ci.yml/badge.svg)](https://github.com/anomalyco/Methodology/actions/workflows/ci.yml)

Scaffold a production-ready full-stack project with your proven stack:

- **Backend:** Hono 4 + Drizzle ORM + Zod
- **Frontend:** React 19 + Vite 8 + TanStack Query 5
- **Bot (optional):** `@tgwrapper/core`
- **UI (optional):** `@ui-construction-library`

## Installation

```bash
pnpm add --global create-ready-stack
create-ready-stack init
```

Or without installing:

```bash
npx create-ready-stack init
```

## What you get

```
<project-name>/
├── backend/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── db/
│   │   │   └── schema.ts
│   │   └── routes/
│   │       └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── web/
│   ├── src/
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
├── bot/ (optional)
├── docs/
├── Dockerfile
├── docker-compose.yml
├── biome.json
└── package.json
```

## Commands

| Command | Description |
|---------|-------------|
| `create-ready-stack init` | Start interactive scaffolding |
| `create-ready-stack --help` | Show help |

## License

MIT
