# create-ready-stack

[![npm version](https://img.shields.io/npm/v/create-ready-stack)](https://www.npmjs.com/package/create-ready-stack)
[![npm downloads](https://img.shields.io/npm/dm/create-ready-stack)](https://www.npmjs.com/package/create-ready-stack)
[![CI](https://github.com/jilimb0/create-ready-stack/actions/workflows/ci.yml/badge.svg)](https://github.com/jilimb0/create-ready-stack/actions/workflows/ci.yml)
[![License](https://img.shields.io/npm/l/create-ready-stack)](https://github.com/jilimb0/create-ready-stack/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)](https://www.typescriptlang.org/)
[![Biome](https://img.shields.io/badge/ lint-Biome-60a5fa)](https://biomejs.dev)

Scaffold a **production-ready full-stack project** in under a minute.

Your proven stack, automated:
- **Backend:** Hono 4 or Express 5 + Drizzle ORM or Prisma + Zod
- **Frontend:** React 19 + Vite 8 + TanStack Query 5 + Tailwind CSS v4 (optional)
- **Bot (optional):** `@tgwrapper/core` Telegram bot framework
- **UI (optional):** `@ui-construction-library` design system
- **Infrastructure:** Docker Compose, GitHub Actions CI, Dependabot

## Comparison

| Feature | create-ready-stack | create-t3-app | create-next-app | create-vite |
|---------|:-:|:-:|:-:|:-:|
| Full-stack (backend + frontend) | ✅ | ✅ | ❌ | ❌ |
| Hono 4 support | ✅ | ❌ | ❌ | ❌ |
| Drizzle ORM + Prisma choice | ✅ | ✅ (Drizzle only) | ❌ | ❌ |
| React 19 + Vite 8 | ✅ | ❌ | ❌ | ✅ |
| TanStack Query 5 | ✅ | ❌ | ❌ | ❌ |
| Telegram bot option | ✅ | ❌ | ❌ | ❌ |
| Tailwind CSS v4 | ✅ | ❌ | ✅ | ✅ |
| Docker Compose | ✅ | ❌ | ❌ | ❌ |
| CI workflow with PostgreSQL | ✅ | ❌ | ❌ | ❌ |
| 6-level methodology docs | ✅ | ❌ | ❌ | ❌ |
| Sentry integration | ✅ | ❌ | ❌ | ❌ |
| Multi-user auth scaffold | ✅ | ✅ | ❌ | ❌ |

## Quick Start

```bash
npx create-ready-stack init
```

Or install globally:

```bash
pnpm add --global create-ready-stack
create-ready-stack init
```

## What you get

```
<project-name>/
├── backend/             # Hono 4 or Express 5 API server
│   ├── src/
│   │   ├── index.ts     # Server entry + health check
│   │   ├── auth.ts      # JWT auth (if multi-user)
│   │   ├── db/
│   │   │   ├── index.ts # DB client
│   │   │   └── schema/  # Drizzle or Prisma schema
│   │   └── app.test.ts  # Working health check test
│   ├── package.json
│   ├── Dockerfile
│   └── tsconfig.json
├── web/                 # React 19 + Vite 8 SPA
│   ├── src/
│   │   ├── main.tsx     # Entry with QueryClient + Router
│   │   ├── App.tsx      # Routes + Home/Dashboard
│   │   ├── App.test.tsx # 3 working tests
│   │   ├── api.ts       # Typed fetch wrapper
│   │   └── index.css    # Tailwind (if enabled)
│   ├── package.json
│   ├── Dockerfile
│   ├── .dockerignore
│   └── vite.config.ts   # Proxy + Tailwind plugin
├── bot/                 # @tgwrapper/core bot (optional)
│   ├── src/index.ts
│   └── Dockerfile
├── docs/                # 6-level methodology docs
│   ├── LEVELS.md
│   ├── 01-idea/         # Brief + DoD
│   ├── 02-arch/         # Domains + Flows
│   ├── 03-impl/         # Commands + DoD
│   ├── 04-quality/      # Quality checklists
│   ├── 05-release/      # Release flow
│   └── 06-deploy/       # Deploy guides
├── docker-compose.yml   # With health checks
├── .github/
│   ├── workflows/ci.yml # CI with PostgreSQL
│   └── dependabot.yml   # Weekly updates
├── biome.json           # Lint + format config
├── tsconfig.base.json   # Shared strict config
├── turbo.json           # Turborepo pipeline
├── .env.example
├── .gitignore
├── .dockerignore
├── CHANGELOG.md
└── README.md
```

## Prompt Options

| Option | Description | Default |
|--------|-------------|---------|
| Project name | Slug (e.g. `my-project`) | — |
| Project title | Display name | — |
| Format | `web` or `web+bot` | `web` |
| Multi-user | JWT auth + bcrypt + jose | `false` |
| Docker | Docker Compose with health checks | `true` |
| Backend | Hono 4 or Express 5 | Hono 4 |
| ORM | Drizzle ORM or Prisma | Drizzle ORM |
| Tailwind CSS | Tailwind CSS v4 + Vite plugin | `true` |
| UI Library | @ui-construction-library | `true` |
| Sentry | Error tracking (backend + frontend) | `false` |

## Generated Stack

| Layer | Technology |
|-------|-----------|
| Backend | Hono 4 / Express 5 |
| ORM | Drizzle ORM / Prisma |
| Database | PostgreSQL 16 |
| Frontend | React 19 + Vite 8 |
| Client state | TanStack React Query 5 |
| Routing | react-router-dom 7 |
| CSS | Tailwind CSS v4 (optional) |
| Bot | @tgwrapper/core (optional) |
| UI | @ui-construction-library (optional) |
| Auth | bcryptjs + jose (JWT) |
| Lint/Format | Biome 2 |
| Tests | Vitest + Testing Library |
| CI | GitHub Actions + PostgreSQL |
| Docker | Docker Compose + health checks |

## Commands

| Command | Description |
|---------|-------------|
| `create-ready-stack init` | Start interactive scaffolding |
| `create-ready-stack init --force` | Overwrite existing directory |
| `create-ready-stack --help` | Show help with examples |
| `create-ready-stack --version` | Show version |

## Projects using this stack

- [RepoRadar](https://github.com/jilimb0/RepoRadar) — Multi-provider engineering dashboard
- [C&TLab](https://github.com/jilimb0/Coffee-Tea-Lab) — Coffee shop POS platform

## License

MIT — see [LICENSE](LICENSE)
