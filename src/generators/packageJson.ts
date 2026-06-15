#!/usr/bin/env node

import fs from 'fs-extra';
import * as path from 'path';
import { ProjectAnswers } from '../types/project.js';

export async function generatePackageJson(cwd: string, answers: ProjectAnswers) {
  // Root package.json
  const packageJsonContent = `{
  "name": "${answers.projectName}",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "build": "turbo build",
    "dev": "turbo dev",
    "check": "pnpm lint && pnpm typecheck && pnpm test",
    "check:fix": "pnpm lint:fix && pnpm typecheck && pnpm test",
    "validate": "pnpm lint && pnpm typecheck && pnpm test && pnpm build",
    "release:prep": "pnpm validate",
    "release:tag": "sh ./scripts/release-tag.sh",
    "db:generate": "turbo db:generate",
    "db:migrate": "turbo db:migrate"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "typescript": "^5.7.2",
    "vitest": "^2.0.0",
    "turbo": "^2.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=9.0.0"
  },
  "pnpm": {
    "onlyBuiltDependencies": ["@biomejs/biome", "esbuild", "prisma", "@prisma/client"]
  }
}
`;
  await fs.writeFile(path.join(cwd, 'package.json'), packageJsonContent);

  // pnpm-workspace.yaml
  const workspace = `packages:
  - 'backend'
  - 'web'
  - 'bot'
`;
  await fs.writeFile(path.join(cwd, 'pnpm-workspace.yaml'), workspace);

  // turbo.json
  const turboJson = `{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {},
    "test": {}
  }
}
`;
  await fs.writeFile(path.join(cwd, 'turbo.json'), turboJson);

  // biome.json
  const biomeContent = `{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "files": {
    "ignore": ["node_modules", "dist", ".next", "coverage"]
  }
}
`;
  await fs.writeFile(path.join(cwd, 'biome.json'), biomeContent);

  // tsconfig.base.json
  const tsconfigBase = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "noEmit": true
  }
}
`;
  await fs.writeFile(path.join(cwd, 'tsconfig.base.json'), tsconfigBase);

  // .gitignore
  const gitignore = `# Dependencies
node_modules
.pnpm-store

# Build outputs
dist
.next

# Environment
.env
.env.local
.env.production
.env.*.local

# Logs
*.log
pm2.log

# Misc
coverage
.turbo
.DS_Store
`;
  await fs.writeFile(path.join(cwd, '.gitignore'), gitignore);

  // .env.example
  const envExample = `# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/${answers.projectName}"

# App
NODE_ENV=development
PORT=3000

# Telegram Bot (if applicable)
TELEGRAM_TOKEN=""

# Next.js
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3001"
`;
  await fs.writeFile(path.join(cwd, '.env.example'), envExample);

  // CHANGELOG.md
  const now = new Date().toISOString().split('T')[0];
  const changelog = `# Changelog

## 0.1.0 (${now})

### Initial release
- backend: Node.js + Express + Prisma skeleton
- web: Next.js + React skeleton
- docs: 6-level development methodology
`;
  await fs.writeFile(path.join(cwd, 'CHANGELOG.md'), changelog);

  // VERSION
  await fs.writeFile(path.join(cwd, 'VERSION'), '0.1.0');

  // README.md — use escaped backticks to avoid template literal conflict
  const cb = '\`\`\`';
  const readme = [
    `# ${answers.projectTitle}`,
    '',
    `${answers.problem}`,
    '',
    '## Quick Start',
    '',
    `${cb}bash`,
    '# Install dependencies',
    'pnpm install',
    '',
    '# Run development servers',
    'pnpm dev',
    '',
    '# Run validation',
    'pnpm check',
    cb,
    '',
    '## Project Structure',
    '',
    cb,
    '├── backend/    # Node.js + Express + Prisma backend',
    '├── web/        # Next.js 15 + React 19 web app',
    '├── bot/        # Telegram bot (if enabled)',
    '├── docs/       # 6-level development methodology',
    '├── scripts/    # Deployment and release scripts',
    '└── .github/    # CI/CD workflows',
    cb,
    '',
    '## Commands',
    '',
    '### Quality',
    '',
    `${cb}bash`,
    'pnpm lint          # Run Biome linter',
    'pnpm lint:fix      # Fix linting issues',
    'pnpm typecheck     # TypeScript type checking',
    'pnpm test          # Run vitest tests',
    'pnpm check         # Full validation (lint + typecheck + test)',
    'pnpm validate      # Full validation + build',
    cb,
    '',
    '### Development',
    '',
    `${cb}bash`,
    'pnpm dev           # Run all dev servers (turbo dev)',
    'pnpm db:studio     # Prisma Studio',
    'pnpm db:migrate    # Run database migrations',
    'pnpm db:generate   # Generate Prisma client',
    cb,
    '',
    '### Build',
    '',
    `${cb}bash`,
    'pnpm build         # Build all packages',
    'pnpm start         # Start production servers',
    cb,
    '',
    '### Release',
    '',
    `${cb}bash`,
    'pnpm release:prep  # Prepare release (validate)',
    'pnpm release:tag   # Create git tag',
    cb,
    '',
    '## Development Methodology',
    '',
    'This project follows a 6-level development methodology:',
    '',
    '1. **Level 01 — Idea & Context**: `docs/01-idea/`',
    '2. **Level 02 — Architecture & Design**: `docs/02-arch/`',
    '3. **Level 03 — Implementation**: `docs/03-impl/`',
    '4. **Level 04 — Quality**: `docs/04-quality/`',
    '5. **Level 05 — Release**: `docs/05-release/`',
    '6. **Level 06 — Deploy**: `docs/06-deploy/`',
    '',
    'Read `docs/LEVELS.md` for details.',
    '',
    '## Environment',
    '',
    'Copy `.env.example` to `.env` and configure:',
    '',
    `${cb}bash`,
    `DATABASE_URL="postgresql://postgres:password@localhost:5432/${answers.projectName}"`,
    'NODE_ENV=development',
    'PORT=3000',
    'TELEGRAM_TOKEN=""',
    'NEXTAUTH_SECRET=""',
    'NEXTAUTH_URL="http://localhost:3001"',
    cb,
    '',
    '## Deployment',
    '',
    '### Docker (recommended)',
    '',
    `${cb}bash`,
    'docker compose up -d',
    cb,
    '',
    '### Manual VPS',
    '',
    `${cb}bash`,
    'bash ./scripts/deploy-manual.sh',
    cb,
    '',
    '## License',
    '',
    'MIT',
    '',
  ].join('\n');
  await fs.writeFile(path.join(cwd, 'README.md'), readme);
}
