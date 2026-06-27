import fs from 'fs-extra';
import * as path from 'path';
import type { ProjectAnswers } from '../types/project.js';

export async function generateDocker(cwd: string, answers: ProjectAnswers) {
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
