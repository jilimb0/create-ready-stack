import * as path from 'node:path';
import fs from 'fs-extra';
import type { ProjectAnswers } from '../types/project.js';

export async function generateBackend(cwd: string, answers: ProjectAnswers) {
  const dir = path.join(cwd, 'backend');
  await fs.ensureDir(path.join(dir, 'src'));

  const isHono = answers.backendFramework === 'hono';
  const isDrizzle = answers.orm === 'drizzle';

  const pkg = isHono
    ? `{
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
    ${
      isDrizzle
        ? `"db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:push": "drizzle-kit push"`
        : `"db:generate": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:studio": "prisma studio"`
    }
  },
  "dependencies": {
    ${
      isHono
        ? `"hono": "^4.7.0",
    "@hono/node-server": "^1.14.0",
    "zod": "^3.24.0"`
        : `"express": "^5.2.0",
    "zod": "^3.24.0"`
    },
    ${
      isDrizzle
        ? `"drizzle-orm": "^0.44.0",
    "postgres": "^3.4.0"`
        : `"@prisma/client": "^5.22.0",
    "prisma": "^5.22.0"`
    }${
      answers.multiUser
        ? `,
    "bcryptjs": "^2.4.3",
    "jose": "^5.9.0"`
        : ''
    }${answers.useSentry ? ',\n    "@sentry/node": "^9.0.0"' : ''}
  },
  "devDependencies": {
    "@types/node": "^26.0.0",
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "vitest": "^3.2.0",
    ${isDrizzle ? `"drizzle-kit": "^0.31.0"${answers.multiUser ? `,\n    "@types/bcryptjs": "^2.4.0"` : ''}` : `"@types/bcryptjs": "^2.4.0"`}
  }
}
`
    : `{
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
    "prisma": "^5.22.0"${answers.multiUser ? ',\n    "bcryptjs": "^2.4.3",\n    "jose": "^5.9.0"' : ''}${answers.useSentry ? ',\n    "@sentry/node": "^9.0.0"' : ''}
  },
  "devDependencies": {
    "@types/node": "^26.0.0",
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "vitest": "^3.2.0",
    "@types/express": "^5.0.0"${answers.multiUser ? ',\n    "@types/bcryptjs": "^2.4.0"' : ''}
  }
}
`;

  await fs.writeFile(path.join(dir, 'package.json'), pkg);

  await fs.writeFile(
    path.join(dir, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: '../tsconfig.base.json',
        compilerOptions: { outDir: './dist', rootDir: './src', noEmit: false },
        include: ['src'],
      },
      null,
      2,
    ),
  );

  if (!isDrizzle) {
    const prismaDir = path.join(dir, 'prisma');
    await fs.ensureDir(prismaDir);
    await fs.writeFile(
      path.join(prismaDir, 'schema.prisma'),
      `generator client {
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
`,
    );
  }

  if (isDrizzle) {
    await fs.writeFile(
      path.join(dir, 'drizzle.config.ts'),
      `import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
`,
    );
    const schemaDir = path.join(dir, 'src/db/schema');
    await fs.ensureDir(schemaDir);
    await fs.writeFile(
      path.join(schemaDir, 'users.ts'),
      `import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
`,
    );
    await fs.writeFile(
      path.join(schemaDir, 'index.ts'),
      `export * from './users.js';
`,
    );
    await fs.writeFile(
      path.join(dir, 'src/db/index.ts'),
      `import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
`,
    );
  }

  if (isHono) {
    const sentryImport = answers.useSentry
      ? "import * as Sentry from '@sentry/node';\n"
      : '';
    const sentryInit = answers.useSentry
      ? "\nSentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV });\n"
      : '';

    await fs.writeFile(
      path.join(dir, 'src/index.ts'),
      `${sentryImport}import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';
${answers.multiUser ? "import { auth } from './auth.js';" : ''}
${sentryInit}const app = new Hono();

app.use('*', cors());
app.use('*', logger());

${answers.multiUser ? "app.route('/auth', auth);" : ''}

app.get('/health', async (c) => {
  const health = { status: 'ok', project: '${answers.projectName}', timestamp: new Date().toISOString() };
  try {${isDrizzle ? `
    const { sql } = await import('drizzle-orm');
    const { db } = await import('./db/index.js');
    await db.execute(sql\`SELECT 1\`);` : `
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.\$queryRaw\`SELECT 1\`;`}
    return c.json({ ...health, db: 'connected' });
  } catch {
    return c.json({ ...health, db: 'disconnected' }, 503);
  }
});

app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse();
  console.error(err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) }, (info) => {
  console.log(\`Backend running on http://localhost:\${info.port}\`);
});
`,
    );
  } else {
    const sentryImportEx = answers.useSentry
      ? "import * as Sentry from '@sentry/node';\n"
      : '';
    const sentryInitEx = answers.useSentry
      ? "\nSentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV });\n"
      : '';
    const sentryMiddleware = answers.useSentry
      ? "\napp.use(Sentry.Handlers.requestHandler());\napp.use(Sentry.Handlers.tracingHandler());"
      : '';

    await fs.writeFile(
      path.join(dir, 'src/index.ts'),
      `${sentryImportEx}import express from 'express';
${answers.multiUser ? "import authRouter from './auth.js';" : ''}
${sentryInitEx}const app = express();
app.use(express.json());
${answers.multiUser ? "app.use('/auth', authRouter);" : ''}${sentryMiddleware}

app.get('/health', async (_req, res) => {
  const health = { status: 'ok', project: '${answers.projectName}', timestamp: new Date().toISOString() };
  try {${isDrizzle ? `
    const { sql } = await import('drizzle-orm');
    const { db } = await import('./db/index.js');
    await db.execute(sql\`SELECT 1\`);` : `
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.\$queryRaw\`SELECT 1\`;`}
    res.json({ ...health, db: 'connected' });
  } catch {
    res.status(503).json({ ...health, db: 'disconnected' });
  }
});

app.listen(Number(process.env.PORT ?? 3000), () => {
  console.log(\`Backend running on http://localhost:\${process.env.PORT ?? 3000}\`);
});
`,
    );
  }

  if (answers.multiUser) {
    if (isHono && isDrizzle) {
      await fs.writeFile(
        path.join(dir, 'src/auth.ts'),
        `import { z } from 'zod';
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
`,
      );
    } else if (isHono && !isDrizzle) {
      await fs.writeFile(
        path.join(dir, 'src/auth.ts'),
        `import { z } from 'zod';
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
`,
      );
    } else if (!isHono && isDrizzle) {
      await fs.writeFile(
        path.join(dir, 'src/auth.ts'),
        `import { Router, Request, Response } from 'express';
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
`,
      );
    } else {
      await fs.writeFile(
        path.join(dir, 'src/auth.ts'),
        `import { Router, Request, Response } from 'express';
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
`,
      );
    }
  }

  await fs.writeFile(
    path.join(dir, 'src/app.test.ts'),
    `import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

describe('app setup', () => {
  it('has package.json with correct name', () => {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));
    expect(pkg.name).toBe('@${answers.projectName}/backend');
  });
});
`,
  );

  await fs.writeFile(
    path.join(dir, 'vitest.config.ts'),
    `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { globals: true, environment: 'node' },
});
`,
  );

  await fs.writeFile(
    path.join(dir, 'Dockerfile'),
    `FROM node:26-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY src ./src
RUN npm install
RUN npm run build

FROM node:26-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
RUN npm install --production
EXPOSE 3000
CMD ["node", "dist/index.js"]
`,
  );
}
