import * as path from 'node:path';
import fs from 'fs-extra';
import { version } from '../config/versions.js';
import type { ProjectAnswers } from '../types/project.js';

export async function generateBot(cwd: string, answers: ProjectAnswers) {
  const dir = path.join(cwd, 'bot');
  await fs.ensureDir(path.join(dir, 'src'));

  await fs.writeFile(
    path.join(dir, 'package.json'),
    `{
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
    "@tgwrapper/core": "^0.20.0",
    "@tgwrapper/adapter-redis": "${version('tgwrapperRedis')}"
  },
  "devDependencies": {
    "@types/node": "${version('@types/node')}",
    "typescript": "${version('typescript')}",
    "tsx": "${version('tsx')}"
  }
}
`,
  );

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

  await fs.writeFile(
    path.join(dir, 'src/index.ts'),
    `import { CircuitBreaker, MemorySessionStorage, createBotClient } from '@tgwrapper/core';

const token = process.env.TELEGRAM_TOKEN || 'dummy_token';

// 1. Circuit breaker for outbound Telegram API calls
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  cooldownMs: 10_000,
  halfOpenMaxRequests: 2,
});

// 2. Storage with Memory / Redis state support
const storage = new MemorySessionStorage<{ state: string }>();

// 3. Resilient Bot Client
const client = createBotClient({
  token,
  circuitBreaker,
});

console.log('🤖 ${answers.projectTitle} bot initialized with @tgwrapper/core');

// 4. Graceful Shutdown
const handleShutdown = (signal: string) => {
  console.log(\`Received \${signal}. Performing graceful shutdown...\`);
  process.exit(0);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
`,
  );

  await fs.writeFile(
    path.join(dir, 'Dockerfile'),
    `FROM node:26-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
RUN npm install && npm run build
CMD ["node", "dist/index.js"]
`,
  );
}
