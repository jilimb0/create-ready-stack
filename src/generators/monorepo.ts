import type { ProjectAnswers } from '../types/project.js';
import { generateBackend } from './backend.js';
import { generateBot } from './bot.js';
import { generateCI } from './ci.js';
import { generateDocker } from './docker.js';
import { generateWeb } from './web.js';
import { generateNextWeb } from './nextWeb.js';

export async function generateMonorepo(cwd: string, answers: ProjectAnswers) {
  await generateBackend(cwd, answers);
  if (answers.frontend === 'nextjs') {
    await generateNextWeb(cwd, answers);
  } else {
    await generateWeb(cwd, answers);
  }
  if (answers.includeBot) await generateBot(cwd, answers);
  if (answers.useDocker) await generateDocker(cwd, answers);
  await generateCI(cwd, answers);
}

export { generateBackend, generateBot, generateCI, generateDocker, generateWeb, generateNextWeb };
