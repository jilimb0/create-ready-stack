#!/usr/bin/env node

import fs from 'fs-extra';
import * as path from 'path';
import { ProjectAnswers } from '../types/project.js';

export async function generateMonorepo(cwd: string, answers: ProjectAnswers) {
  // ─── backend/ ───────────────────────────────────────────────────────────────
  const backendDir = path.join(cwd, 'backend');
  await fs.ensureDir(path.join(backendDir, 'src'));
  await fs.ensureDir(path.join(backendDir, 'prisma'));

  await fs.writeFile(path.join(backendDir, 'package.json'), `{
  "name": "@${answers.projectName}/backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "db:migrate": "prisma migrate deploy",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "express": "^4.21.0",
    "@prisma/client": "^5.22.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "typescript": "^5.7.2",
    "tsx": "^4.19.0",
    "prisma": "^5.22.0",
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0"
  },
  "pnpm": {
    "onlyBuiltDependencies": ["@prisma/client", "prisma"]
  }
}
`);

  await fs.writeFile(path.join(backendDir, 'tsconfig.json'), `{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false
  },
  "include": ["src"]
}
`);

  await fs.writeFile(path.join(backendDir, 'src/app.ts'), `import express from 'express';

export const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', project: '${answers.projectName}' });
});

// ─── Auth Middleware (placeholder) ───────────────────────────────────────────
export const authMiddleware = (req: express.Request, res: express.Response, next: any) => {
  // TODO: Implement JWT verification middleware
  // Example: const token = req.headers.authorization?.split(' ')[1];
  //          const user = verifyJWT(token);
  //          if (!user) return res.status(401).json({ error: 'Invalid token' });
  next();
};

// ─── Auth Routes (placeholder) ──────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  // TODO: Implement registration with email + password
  // 1. Validate email + password
  //    - Email: regex validation (e.g. /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  //    - Password: min length 8, require alphanumeric
  // 2. Hash password (bcrypt)
  // 3. Create user in DB
  // 4. Return JWT token
  res.json({ message: 'Registration endpoint - implement auth logic here' });
});

app.post('/auth/login', async (req, res) => {
  // TODO: Implement login with email + password, return JWT
  // 1. Find user by email
  // 2. Verify password (bcrypt)
  // 3. Generate JWT token
  // 4. Return token + user data
  res.json({ message: 'Login endpoint - implement auth logic here' });
});

// ─── Helper: Email validation ───────────────────────────────────────────────
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ─── Helper: Password validation ─────────────────────────────────────────────
const isValidPassword = (password: string): boolean => {
  return password.length >= 8 && /^[a-zA-Z0-9]+$/.test(password);
};

app.get('/auth/me', authMiddleware, (req, res) => {
  // TODO: Implement middleware to verify JWT, return current user
  // JWT verification should be in authMiddleware
  res.json({ message: 'Auth me endpoint - implement JWT verification here' });
});

// ─── User Routes (placeholder) ───────────────────────────────────────────────
app.get('/users', (req, res) => {
  // TODO: Implement fetch all users (with pagination)
  // 1. Get pagination params (page, limit)
  // 2. Fetch users from DB with pagination
  res.json({ users: [], page: 1, limit: 10 });
});

app.get('/users/:id', (req, res) => {
  // TODO: Implement fetch user by ID
  // 1. Get user ID from params
  // 2. Fetch user from DB
  res.json({ user: null });
});
app.put('/users/:id', authMiddleware, (req, res) => {
  // TODO: Implement update user by ID (with auth check)
  res.json({ message: 'Update user endpoint - implement auth + update logic here' });
});
`);

  await fs.writeFile(path.join(backendDir, 'src/server.ts'), `import { app } from './app.js';

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log('Backend running on http://localhost:' + PORT);
});
`);

  await fs.writeFile(path.join(backendDir, 'prisma/schema.prisma'), `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String?
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`);

  await fs.writeFile(path.join(backendDir, 'src/app.test.ts'), `import { describe, it, expect } from 'vitest';
import { app } from './app.js';

describe('app', () => {
  it('GET /health returns 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      status: 'ok',
      project: '${answers.projectName}',
    });
  });
});
`);

  await fs.writeFile(path.join(backendDir, 'vitest.config.ts'), `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
`);

  // ─── web/ ────────────────────────────────────────────────────────────────────
  if (answers.format === 'web' || answers.format === 'web+bot') {
    const webDir = path.join(cwd, 'web');
    await fs.ensureDir(path.join(webDir, 'app'));
    await fs.ensureDir(path.join(webDir, 'components'));

    await fs.writeFile(path.join(webDir, 'package.json'), `{
  "name": "@${answers.projectName}/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/node": "^22.0.0",
    "typescript": "^5.7.2",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^24.0.0"
  }
}
`);

    await fs.writeFile(path.join(webDir, 'tsconfig.json'), `{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "noEmit": true,
    "plugins": [{"name": "next"}]
  },
  "include": ["."],
  "exclude": ["node_modules"]
}
`);

    await fs.writeFile(path.join(webDir, 'next.config.ts'), `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Add your Next.js configuration here
};

export default nextConfig;
`);

    await fs.writeFile(path.join(webDir, 'app/layout.tsx'), `import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${answers.projectTitle}',
  description: '${answers.projectTitle} app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`);

    await fs.writeFile(path.join(webDir, 'app/page.tsx'), `export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">${answers.projectTitle}</h1>
      <p className="mt-4 text-gray-600">Welcome to your new project.</p>
    </main>
  );
}
`);

    await fs.writeFile(path.join(webDir, 'app/dashboard/page.tsx'), `export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-4 text-gray-600">Dashboard placeholder for ${answers.projectTitle}.</p>
    </main>
  );
}
`);

    await fs.writeFile(path.join(webDir, 'app/login/page.tsx'), `export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center">Login</h1>
        <p className="mt-4 text-center text-gray-600">Sign in to your account</p>
        <form className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded"
          >
            Login
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          <a href="/register" className="text-blue-600">
            Register instead
          </a>
        </p>
      </div>
    </main>
  );
}
`);

    await fs.writeFile(path.join(webDir, 'app/register/page.tsx'), `export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center">Register</h1>
        <p className="mt-4 text-center text-gray-600">Create your account</p>
        <form className="mt-8 space-y-4">
          <input
            type="text"
            placeholder="Name"
            className="w-full px-4 py-2 border rounded"
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded"
          >
            Register
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          <a href="/login" className="text-blue-600">
            Login instead
          </a>
        </p>
      </div>
    </main>
  );
}
`);

    await fs.writeFile(path.join(webDir, 'vitest.config.ts'), `import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
`);

    await fs.writeFile(path.join(webDir, 'app/page.test.tsx'), `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

describe('HomePage', () => {
  it('renders project title', () => {
    render(<HomePage />);
    expect(screen.getByText('${answers.projectTitle}')).toBeInTheDocument();
  });

  it('renders welcome message', () => {
    render(<HomePage />);
    expect(screen.getByText('Welcome to your new project.')).toBeInTheDocument();
  });
});
`);
  }

  // ─── bot/ ────────────────────────────────────────────────────────────────────
  if (answers.format === 'bot' || answers.format === 'web+bot') {
    const botDir = path.join(cwd, 'bot');
    await fs.ensureDir(path.join(botDir, 'src'));

    await fs.writeFile(path.join(botDir, 'package.json'), `{
  "name": "@${answers.projectName}/bot",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "grammy": "^1.30.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.7.2",
    "tsx": "^4.19.0"
  }
}
`);

    await fs.writeFile(path.join(botDir, 'tsconfig.json'), `{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false
  },
  "include": ["src"]
}
`);

    await fs.writeFile(path.join(botDir, 'src/index.ts'), `import { Bot } from 'grammy';

const bot = new Bot(process.env.TELEGRAM_TOKEN ?? '');

bot.command('start', (ctx) => ctx.reply('Hello from ${answers.projectTitle}!'));
bot.command('help', (ctx) => ctx.reply('Available commands: start, help'));

bot.start();
console.log('Bot is running...');
`);
  }

  // ─── scripts/ ────────────────────────────────────────────────────────────────
  const scriptsDir = path.join(cwd, 'scripts');
  await fs.ensureDir(scriptsDir);

  await fs.writeFile(path.join(scriptsDir, 'release-tag.sh'), `#!/bin/bash
set -e
VERSION=$(cat VERSION)
echo "Creating git tag v$VERSION..."
git tag -a "v$VERSION" -m "Release v$VERSION"
git push origin "v$VERSION"
echo "Tagged v$VERSION successfully."
`);

  await fs.writeFile(path.join(scriptsDir, 'deploy-docker.sh'), `#!/bin/bash
set -e
echo "Deploying with Docker Compose..."
docker compose pull
docker compose up -d --build
echo "Deployment complete."
`);

  await fs.writeFile(path.join(scriptsDir, 'deploy-manual.sh'), `#!/bin/bash
set -e
echo "Deploying manually..."
pnpm install --frozen-lockfile
pnpm build
pm2 restart all || pm2 start dist/server.js --name ${answers.projectName}
echo "Deployment complete."
`);

  // ─── docker-compose.yml (if useDocker === true) ──────────────────────────────
  if (answers.useDocker) {
    const dockerCompose = `version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: ./Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/${answers.projectName}
    depends_on:
      - db
    restart: unless-stopped

  web:
    build:
      context: ./web
      dockerfile: ./Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://localhost:3000
    depends_on:
      - backend
    restart: unless-stopped

  bot:
    build:
      context: ./bot
      dockerfile: ./Dockerfile
    environment:
      - NODE_ENV=production
      - TELEGRAM_TOKEN=${answers.projectName}-token
    restart: unless-stopped
    depends_on:
      - backend

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=${answers.projectName}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
`;
    await fs.writeFile(path.join(cwd, 'docker-compose.yml'), dockerCompose);

    // backend/Dockerfile
    await fs.writeFile(path.join(backendDir, 'Dockerfile'), `FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm install --production
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
RUN npm install --production
EXPOSE 3000
CMD ["node", "dist/server.js"]
`);

    // web/Dockerfile
    if (answers.format === 'web' || answers.format === 'web+bot') {
      const webDir = path.join(cwd, 'web');
      await fs.writeFile(path.join(webDir, 'Dockerfile'), `FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY . ./
RUN npm install
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./
COPY --from=builder /app/public ./public
RUN npm install --production
EXPOSE 3001
CMD ["npm", "start"]
`);
    }

    // bot/Dockerfile
    if (answers.format === 'bot' || answers.format === 'web+bot') {
      const botDir = path.join(cwd, 'bot');
      await fs.writeFile(path.join(botDir, 'Dockerfile'), `FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
`);
    }
  }

  // ─── .github/workflows/ci.yml ────────────────────────────────────────────────
  const workflowsDir = path.join(cwd, '.github', 'workflows');
  await fs.ensureDir(workflowsDir);

  await fs.writeFile(path.join(workflowsDir, 'ci.yml'), `name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  validate:
    name: Validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Validate
        run: pnpm validate
`);
}
