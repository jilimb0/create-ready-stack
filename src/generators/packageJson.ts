import * as path from 'node:path';
import fs from 'fs-extra';
import type { ProjectAnswers } from '../types/project.js';
import { version } from '../config/versions.js';

export async function generatePackageJson(cwd: string, answers: ProjectAnswers) {
  const hasBot = answers.includeBot;

  // Root package.json
  await fs.writeFile(
    path.join(cwd, 'package.json'),
    JSON.stringify(
      {
        name: answers.projectName,
        version: '0.1.0',
        private: true,
        type: 'module',
        packageManager: 'pnpm@11.0.0',
        scripts: {
          lint: 'biome check .',
          'lint:fix': 'biome check --write .',
          typecheck: 'tsc --noEmit',
          test: 'vitest run',
          build: 'turbo build',
          dev: 'turbo dev',
          check: 'pnpm lint && pnpm typecheck && pnpm test',
          validate: 'pnpm lint && pnpm typecheck && pnpm test && pnpm build',
          format: 'biome format --write .',
        },
        devDependencies: {
          '@biomejs/biome': version('@biomejs/biome'),
          typescript: version('typescript'),
          vitest: version('vitest'),
          turbo: version('turbo'),
        },
        engines: { node: '>=22.0.0', pnpm: '>=11.0.0' },
      },
      null,
      2,
    ),
  );

  // pnpm-workspace.yaml
  const packages = ['backend', 'web'];
  if (hasBot) packages.push('bot');
  await fs.writeFile(
    path.join(cwd, 'pnpm-workspace.yaml'),
    `packages:
${packages.map((p) => `  - '${p}'`).join('\n')}

onlyBuiltDependencies:
  - '@biomejs/biome'
  - 'esbuild'
  - '@prisma/client'
  - 'prisma'
  - 'sharp'
`,
  );

  // turbo.json
  await fs.writeFile(
    path.join(cwd, 'turbo.json'),
    JSON.stringify(
      {
        $schema: 'https://turbo.build/schema.json',
        tasks: {
          build: { dependsOn: ['^build'], outputs: ['dist/**'] },
          dev: { cache: false, persistent: true },
          lint: {},
          typecheck: {},
          test: {},
        },
      },
      null,
      2,
    ),
  );

  // biome.json
  await fs.writeFile(
    path.join(cwd, 'biome.json'),
    JSON.stringify(
      {
        $schema: 'https://biomejs.dev/schemas/2.5.1/schema.json',
        linter: { enabled: true, rules: { preset: 'recommended' } },
        formatter: { enabled: true, indentStyle: 'space', indentWidth: 2, lineWidth: 100 },
        javascript: {
          formatter: { trailingCommas: 'es5', semicolons: 'always', quoteStyle: 'single' },
        },
        files: { ignore: ['node_modules', 'dist', '.next', 'coverage', '.turbo'] },
      },
      null,
      2,
    ),
  );

  // tsconfig.base.json
  await fs.writeFile(
    path.join(cwd, 'tsconfig.base.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          lib: ['ES2022'],
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
          declaration: true,
          declarationMap: true,
          noEmit: true,
        },
      },
      null,
      2,
    ),
  );

  // .gitignore
  await fs.writeFile(
    path.join(cwd, '.gitignore'),
    `node_modules
.pnpm-store
dist
.next
.env
.env.local
.env.production
.env.*.local
*.log
coverage
.turbo
.DS_Store
`,
  );

  // .dockerignore
  await fs.writeFile(
    path.join(cwd, '.dockerignore'),
    `node_modules
.pnpm-store
dist
.git
.gitignore
*.md
.env
.env.*
`,
  );

  // .github/dependabot.yml
  const dependabotDir = path.join(cwd, '.github');
  await fs.ensureDir(dependabotDir);
  await fs.writeFile(
    path.join(dependabotDir, 'dependabot.yml'),
    `version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
`,
  );

  // .env.example
  const jwtLine = answers.multiUser ? `JWT_SECRET="${answers.jwtSecret}"` : '';
  const sentryLine = answers.useSentry ? '\nSENTRY_DSN=""' : '';
  const sentryViteLine = answers.useSentry ? '\nVITE_SENTRY_DSN=""' : '';
  await fs.writeFile(
    path.join(cwd, '.env.example'),
    `DATABASE_URL="postgresql://postgres:password@localhost:5432/${answers.projectName}"
NODE_ENV=development
PORT=3000
${jwtLine}${sentryLine}${sentryViteLine}
VITE_API_URL="http://localhost:3000"
${hasBot ? 'TELEGRAM_TOKEN=""' : ''}
`,
  );

  // CHANGELOG.md
  const now = new Date().toISOString().split('T')[0];
  await fs.writeFile(
    path.join(cwd, 'CHANGELOG.md'),
    `# Changelog

## 0.1.0 (${now})

### Initial release
- backend: Hono 4 + Drizzle ORM + PostgreSQL
- web: React 19 + Vite 8 + TanStack Query 5
${hasBot ? '- bot: @tgwrapper/core Telegram bot' : ''}
- ui: ${answers.useUILibrary ? '@ui-construction-library' : 'none'}
- ci: GitHub Actions (validate + test with PostgreSQL)
- docker: Docker Compose (Postgres + backend + web${hasBot ? ' + bot' : ''})
`,
  );

  // README.md
  const cb = '```';
  const readmeEnvBlock = answers.multiUser
    ? `DATABASE_URL="postgresql://postgres:password@localhost:5432/${answers.projectName}"
JWT_SECRET="${answers.jwtSecret}"
VITE_API_URL="http://localhost:3000"`
    : `DATABASE_URL="postgresql://postgres:password@localhost:5432/${answers.projectName}"
VITE_API_URL="http://localhost:3000"`;
  const readme = `# ${answers.projectTitle}

${answers.problem}

## Quick Start

${cb}bash
pnpm install
pnpm dev
pnpm check
${cb}

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | ${answers.backendFramework === 'hono' ? 'Hono 4' : 'Express 5'} |
| ORM | ${answers.orm === 'drizzle' ? 'Drizzle ORM' : 'Prisma'} |
| Database | PostgreSQL 16 |
| Frontend | React 19 + Vite 8 |
| Client state | TanStack React Query 5 |
| Routing | react-router-dom 7${hasBot ? '\n| Bot | @tgwrapper/core |' : ''}${answers.useUILibrary ? '\n| UI | @ui-construction-library |' : ''}
| Lint/Format | Biome 2 |
| Tests | Vitest |
| CI | GitHub Actions |

## Project Structure

${cb}
├── backend/     # API server
├── web/         # React SPA
${hasBot ? '├── bot/         # Telegram bot\n' : ''}├── docs/        # 6-level methodology
└── .github/     # CI workflows
${cb}

## Commands

${cb}bash
pnpm dev          # Run all dev servers
pnpm build        # Build all packages
pnpm check        # Lint + typecheck + test
pnpm validate     # check + build
pnpm lint         # Biome lint
pnpm format       # Biome format
pnpm test         # Run tests
pnpm typecheck    # TypeScript check
${cb}

## Environment

Copy \`.env.example\` to \`.env\` and configure:

${cb}bash
${readmeEnvBlock}
${cb}

## Deployment

${cb}bash
docker compose up -d
${cb}
`;
  await fs.writeFile(path.join(cwd, 'README.md'), readme);
}
