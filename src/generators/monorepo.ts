import fs from 'fs-extra';
import * as path from 'path';
import { ProjectAnswers } from '../types/project.js';

export async function generateMonorepo(cwd: string, answers: ProjectAnswers) {
  await generateBackend(cwd, answers);
  await generateWeb(cwd, answers);
  if (answers.includeBot) await generateBot(cwd, answers);
  await generateScripts(cwd, answers);
  if (answers.useDocker) await generateDocker(cwd, answers);
  await generateCI(cwd, answers);
}

// ─── BACKEND ───────────────────────────────────────────────────────────────

async function generateBackend(cwd: string, answers: ProjectAnswers) {
  const dir = path.join(cwd, 'backend');
  await fs.ensureDir(path.join(dir, 'src'));

  const isHono = answers.backendFramework === 'hono';
  const isDrizzle = answers.orm === 'drizzle';

  const pkg = isHono ? `{
  "name": "@${answers.projectName}/backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    ${isDrizzle ? `"db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:push": "drizzle-kit push"` : `"db:generate": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:studio": "prisma studio"`}
  },
  "dependencies": {
    ${isHono ? `"hono": "^4.7.0",
    "@hono/node-server": "^1.14.0",
    "zod": "^3.24.0"` : `"express": "^5.2.0",
    "zod": "^3.24.0"`},
    ${isDrizzle ? `"drizzle-orm": "^0.44.0",
    "postgres": "^3.4.0"` : `"@prisma/client": "^5.22.0",
    "prisma": "^5.22.0"`}${answers.multiUser ? `,
    "bcryptjs": "^2.4.3",
    "jose": "^5.9.0"` : ''}
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "vitest": "^3.2.0",
    ${isDrizzle ? `"drizzle-kit": "^0.31.0"${answers.multiUser ? `,\n    "@types/bcryptjs": "^2.4.0"` : ''}` : `"@types/bcryptjs": "^2.4.0"`}
  }
}
` : `{
  "name": "@${answers.projectName}/backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "express": "^5.2.0",
    "zod": "^3.24.0",
    "@prisma/client": "^5.22.0",
    "prisma": "^5.22.0"${answers.multiUser ? ',\n    "bcryptjs": "^2.4.3",\n    "jose": "^5.9.0"' : ''}
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "vitest": "^3.2.0",
    "@types/express": "^5.0.0"${answers.multiUser ? ',\n    "@types/bcryptjs": "^2.4.0"' : ''}
  }
}
`;

  await fs.writeFile(path.join(dir, 'package.json'), pkg);

  // tsconfig
  await fs.writeFile(path.join(dir, 'tsconfig.json'), JSON.stringify({
    extends: '../tsconfig.base.json',
    compilerOptions: { outDir: './dist', rootDir: './src', noEmit: false },
    include: ['src'],
  }, null, 2));

  // Prisma schema
  if (!isDrizzle) {
    const prismaDir = path.join(dir, 'prisma');
    await fs.ensureDir(prismaDir);
    await fs.writeFile(path.join(prismaDir, 'schema.prisma'), `generator client {
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
  }

  // Drizzle config + schema
  if (isDrizzle) {
    await fs.writeFile(path.join(dir, 'drizzle.config.ts'), `import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
`);
    const schemaDir = path.join(dir, 'src/db/schema');
    await fs.ensureDir(schemaDir);
    await fs.writeFile(path.join(schemaDir, 'users.ts'), `import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
`);
    await fs.writeFile(path.join(schemaDir, 'index.ts'), `export * from './users.js';
`);
    await fs.writeFile(path.join(dir, 'src/db/index.ts'), `import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
`);
  }

  // Main app entry
  if (isHono) {
    await fs.writeFile(path.join(dir, 'src/index.ts'), `import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';
${answers.multiUser ? "import { auth } from './auth.js';" : ''}

const app = new Hono();

app.use('*', cors());
app.use('*', logger());

${answers.multiUser ? "app.route('/auth', auth);" : ''}

app.get('/health', (c) => c.json({ status: 'ok', project: '${answers.projectName}' }));

app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse();
  console.error(err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) }, (info) => {
  console.log(\`Backend running on http://localhost:\${info.port}\`);
});
`);
  } else {
    await fs.writeFile(path.join(dir, 'src/index.ts'), `import express from 'express';
${answers.multiUser ? "import authRouter from './auth.js';" : ''}

const app = express();
app.use(express.json());
${answers.multiUser ? "app.use('/auth', authRouter);" : ''}

app.get('/health', (_req, res) => res.json({ status: 'ok', project: '${answers.projectName}' }));

app.listen(Number(process.env.PORT ?? 3000), () => {
  console.log(\`Backend running on http://localhost:\${process.env.PORT ?? 3000}\`);
});
`);
  }

  // Auth routes (if multi-user)
  if (answers.multiUser) {
    if (isHono && isDrizzle) {
      await fs.writeFile(path.join(dir, 'src/auth.ts'), `import { z } from 'zod';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { SignJWT, jwtVerify } from 'jose';
import { hash, compare } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { users } from './db/schema/users.js';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? '${answers.jwtSecret}');
const JWT_ISSUER = '${answers.projectName}';

export const auth = new Hono();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

auth.post('/register', async (c) => {
  const body = registerSchema.parse(await c.req.json());
  const passwordHash = await hash(body.password, 12);
  const [user] = await db.insert(users).values({
    email: body.email,
    passwordHash,
    name: body.name,
  }).returning();
  return c.json({ message: 'User created', id: user.id }, 201);
});

auth.post('/login', async (c) => {
  const body = registerSchema.pick({ email: true, password: true }).parse(await c.req.json());
  const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
  if (!user || !user.passwordHash) throw new HTTPException(401, { message: 'Invalid credentials' });
  const valid = await compare(body.password, user.passwordHash);
  if (!valid) throw new HTTPException(401, { message: 'Invalid credentials' });
  const token = await new SignJWT({ sub: user.id }).setProtectedHeader({ alg: 'HS256' }).setIssuer(JWT_ISSUER).sign(JWT_SECRET);
  return c.json({ token });
});

export async function verifyJWT(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET, { issuer: JWT_ISSUER }); return payload;
}
`);
    } else if (isHono && !isDrizzle) {
      await fs.writeFile(path.join(dir, 'src/auth.ts'), `import { z } from 'zod';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { SignJWT, jwtVerify } from 'jose';
import { hash, compare } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? '${answers.jwtSecret}');
const JWT_ISSUER = '${answers.projectName}';

export const auth = new Hono();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

auth.post('/register', async (c) => {
  const body = registerSchema.parse(await c.req.json());
  const passwordHash = await hash(body.password, 12);
  const user = await prisma.user.create({
    data: { email: body.email, password: passwordHash, name: body.name },
  });
  return c.json({ message: 'User created', id: user.id }, 201);
});

auth.post('/login', async (c) => {
  const body = registerSchema.pick({ email: true, password: true }).parse(await c.req.json());
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user || !user.password) throw new HTTPException(401, { message: 'Invalid credentials' });
  const valid = await compare(body.password, user.password);
  if (!valid) throw new HTTPException(401, { message: 'Invalid credentials' });
  const token = await new SignJWT({ sub: user.id }).setProtectedHeader({ alg: 'HS256' }).setIssuer(JWT_ISSUER).sign(JWT_SECRET);
  return c.json({ token });
});

export async function verifyJWT(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET, { issuer: JWT_ISSUER }); return payload;
}
`);
    } else if (!isHono && isDrizzle) {
      await fs.writeFile(path.join(dir, 'src/auth.ts'), `import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { SignJWT, jwtVerify } from 'jose';
import { hash, compare } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { users } from './db/schema/users.js';

const router = Router();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? '${answers.jwtSecret}');
const JWT_ISSUER = '${answers.projectName}';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);
    const passwordHash = await hash(body.password, 12);
    const [user] = await db.insert(users).values({
      email: body.email,
      passwordHash,
      name: body.name,
    }).returning();
    res.status(201).json({ message: 'User created', id: user.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const body = registerSchema.pick({ email: true, password: true }).parse(req.body);
    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const valid = await compare(body.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = await new SignJWT({ sub: user.id }).setProtectedHeader({ alg: 'HS256' }).setIssuer(JWT_ISSUER).sign(JWT_SECRET);
    res.json({ token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

export async function verifyJWT(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET, { issuer: JWT_ISSUER }); return payload;
}

export default router;
`);
    } else {
      await fs.writeFile(path.join(dir, 'src/auth.ts'), `import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { SignJWT, jwtVerify } from 'jose';
import { hash, compare } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? '${answers.jwtSecret}');
const JWT_ISSUER = '${answers.projectName}';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);
    const passwordHash = await hash(body.password, 12);
    const user = await prisma.user.create({
      data: { email: body.email, password: passwordHash, name: body.name },
    });
    res.status(201).json({ message: 'User created', id: user.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const body = registerSchema.pick({ email: true, password: true }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.password) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const valid = await compare(body.password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = await new SignJWT({ sub: user.id }).setProtectedHeader({ alg: 'HS256' }).setIssuer(JWT_ISSUER).sign(JWT_SECRET);
    res.json({ token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
    } else {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

export async function verifyJWT(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET, { issuer: JWT_ISSUER }); return payload;
}

export default router;
`);
    }
  }

  // Test file
  await fs.writeFile(path.join(dir, 'src/app.test.ts'), `import { describe, it, expect } from 'vitest';

describe('health', () => {
  it('should pass placeholder test', () => {
    expect(1 + 1).toBe(2);
  });
});
`);

  await fs.writeFile(path.join(dir, 'vitest.config.ts'), `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { globals: true, environment: 'node' },
});
`);

  // Dockerfile
  await fs.writeFile(path.join(dir, 'Dockerfile'), `FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY src ./src
RUN npm install
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
RUN npm install --production
EXPOSE 3000
CMD ["node", "dist/index.js"]
`);
}

// ─── WEB ───────────────────────────────────────────────────────────────────

async function generateWeb(cwd: string, answers: ProjectAnswers) {
  const dir = path.join(cwd, 'web');
  await fs.ensureDir(path.join(dir, 'src'));
  await fs.ensureDir(path.join(dir, 'public'));

  const uilibDep = answers.useUILibrary
    ? ',\n    "@ui-construction-library/core": "^0.1.0"'
    : '';

  await fs.writeFile(path.join(dir, 'package.json'), `{
  "name": "@${answers.projectName}/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.5.0",
    "@tanstack/react-query": "^5.75.0",
    "zod": "^3.24.0"${uilibDep}
  },
  "devDependencies": {
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^4.4.0",
    "typescript": "^5.7.0",
    "vite": "^8.0.0",
    "vitest": "^3.2.0",
    "@testing-library/react": "^16.3.0",
    "jsdom": "^26.0.0"
  }
}
`);

  // Layout + Router
  await fs.writeFile(path.join(dir, 'index.html'), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${answers.projectTitle}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

  await fs.writeFile(path.join(dir, 'src/main.tsx'), `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
`);

  await fs.writeFile(path.join(dir, 'src/App.tsx'), `import { Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

function Home() {
  return (
    <main>
      <h1>${answers.projectTitle}</h1>
      <p>Welcome to your new project.</p>
    </main>
  );
}

function Dashboard() {
  return <h1>Dashboard</h1>;
}
`);

  // API client (TanStack Query pattern)
  await fs.writeFile(path.join(dir, 'src/api.ts'), `const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(\`\${BASE}\${path}\`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(\`API error: \${res.status}\`);
  return res.json();
}
`);

  // Vite config
  await fs.writeFile(path.join(dir, 'vite.config.ts'), `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } },
});
`);

  // TypeScript config
  await fs.writeFile(path.join(dir, 'tsconfig.json'), JSON.stringify({
    extends: '../tsconfig.base.json',
    compilerOptions: { jsx: 'react-jsx', noEmit: true },
    include: ['src'],
    references: [{ path: './tsconfig.node.json' }],
  }, null, 2));

  await fs.writeFile(path.join(dir, 'tsconfig.node.json'), JSON.stringify({
    extends: '../tsconfig.base.json',
    compilerOptions: { noEmit: true },
    include: ['vite.config.ts'],
  }, null, 2));

  // Test setup
  await fs.writeFile(path.join(dir, 'vitest.config.ts'), `import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { globals: true, environment: 'jsdom' },
});
`);

  await fs.writeFile(path.join(dir, 'src/App.test.tsx'), `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App', () => {
  it('renders project title', () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('${answers.projectTitle}')).toBeInTheDocument();
  });
});
`);

  // Dockerfile
  await fs.writeFile(path.join(dir, 'Dockerfile'), `FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY . ./
RUN npm install
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`);
}

// ─── BOT (TGWrapper) ──────────────────────────────────────────────────────

async function generateBot(cwd: string, answers: ProjectAnswers) {
  const dir = path.join(cwd, 'bot');
  await fs.ensureDir(path.join(dir, 'src'));

  await fs.writeFile(path.join(dir, 'package.json'), `{
  "name": "@${answers.projectName}/bot",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@tgwrapper/core": "^0.17.0",
    "@tgwrapper/adapter-redis": "^0.8.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0",
    "tsx": "^4.19.0"
  }
}
`);

  await fs.writeFile(path.join(dir, 'tsconfig.json'), JSON.stringify({
    extends: '../tsconfig.base.json',
    compilerOptions: { outDir: './dist', rootDir: './src', noEmit: false },
    include: ['src'],
  }, null, 2));

  await fs.writeFile(path.join(dir, 'src/index.ts'), `import { Bot, Router, session } from '@tgwrapper/core';

const bot = new Bot(process.env.TELEGRAM_TOKEN!);

// FSM session storage (uses in-memory by default; swap to Redis adapter for production)
bot.use(session({ storage: 'memory' }));

// Router with FSM
const router = new Router(bot);

// States
const IDLE = 'idle';

router.on('start', IDLE, async (ctx) => {
  await ctx.reply('Hello from ${answers.projectTitle}! Use /help to see commands.');
});

router.on('help', IDLE, async (ctx) => {
  await ctx.reply(\`Available commands:
/start - Start the bot
/help  - Show this help
/about - About this bot\`);
});

router.on('about', IDLE, async (ctx) => {
  await ctx.reply('${answers.projectTitle} bot powered by @tgwrapper/core');
});

// Start polling
bot.start();
console.log('Bot running...');
`);

  await fs.writeFile(path.join(dir, 'Dockerfile'), `FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
RUN npm install && npm run build
CMD ["node", "dist/index.js"]
`);
}

// ─── SCRIPTS ──────────────────────────────────────────────────────────────

async function generateScripts(_cwd: string, _answers: ProjectAnswers) {
  // Scripts are generated by packageJson generator
}

// ─── DOCKER ───────────────────────────────────────────────────────────────

async function generateDocker(cwd: string, answers: ProjectAnswers) {
  const compose: Record<string, unknown> = {
    services: {
      db: {
        image: 'postgres:16-alpine',
        ports: ['5432:5432'],
        environment: {
          POSTGRES_USER: '${POSTGRES_USER:-postgres}',
          POSTGRES_PASSWORD: '${POSTGRES_PASSWORD:-postgres}',
          POSTGRES_DB: '${POSTGRES_DB:-' + answers.projectName + '}',
        },
        volumes: ['postgres_data:/var/lib/postgresql/data'],
        restart: 'unless-stopped',
      },
      backend: {
        build: { context: './backend', dockerfile: './Dockerfile' },
        ports: ['3000:3000'],
        environment: {
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@db:5432/${POSTGRES_DB:-' + answers.projectName + '}',
        },
        depends_on: ['db'],
        restart: 'unless-stopped',
      },
      web: {
        build: { context: './web', dockerfile: './Dockerfile' },
        ports: ['5173:80'],
        environment: { NODE_ENV: 'production' },
        depends_on: ['backend'],
        restart: 'unless-stopped',
      },
    },
    volumes: { postgres_data: {} },
  };

  if (answers.includeBot) {
    (compose.services as Record<string, unknown>).bot = {
      build: { context: './bot', dockerfile: './Dockerfile' },
      environment: {
        NODE_ENV: 'production',
        TELEGRAM_TOKEN: '${TELEGRAM_TOKEN}',
      },
      restart: 'unless-stopped',
    };
  }

  await fs.writeFile(path.join(cwd, 'docker-compose.yml'), JSON.stringify(compose, null, 2));
}

// ─── CI ───────────────────────────────────────────────────────────────────

async function generateCI(cwd: string, answers: ProjectAnswers) {
  const workflowsDir = path.join(cwd, '.github', 'workflows');
  await fs.ensureDir(workflowsDir);

  await fs.writeFile(path.join(workflowsDir, 'ci.yml'), `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 26, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm check

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: ${answers.projectName}
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports: [5432:5432]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 26, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/${answers.projectName}
`);
}
