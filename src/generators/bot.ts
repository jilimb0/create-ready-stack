import * as path from 'node:path';
import fs from 'fs-extra';
import type { ProjectAnswers } from '../types/project.js';
import { version } from '../config/versions.js';

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
    "@tgwrapper/core": "${version('tgwrapperCore')}",
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
    `import { Bot, Router, session } from '@tgwrapper/core';

const bot = new Bot(process.env.TELEGRAM_TOKEN!);

bot.use(session({ storage: 'memory' }));

const router = new Router(bot);

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

bot.start();
console.log('Bot running...');
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
