import * as path from 'node:path';
import fs from 'fs-extra';
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
          POSTGRES_DB: `\${POSTGRES_DB:-${answers.projectName}}`,
        },
        volumes: ['postgres_data:/var/lib/postgresql/data'],
        restart: 'unless-stopped',
        healthcheck: {
          test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-postgres}'],
          interval: '10s',
          timeout: '5s',
          retries: 5,
        },
      },
      backend: {
        build: { context: './backend', dockerfile: './Dockerfile' },
        ports: ['3000:3000'],
        environment: {
          NODE_ENV: 'production',
          DATABASE_URL:
            'postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@db:5432/${POSTGRES_DB:-' +
            answers.projectName +
            '}',
        },
        depends_on: {
          db: { condition: 'service_healthy' },
        },
        restart: 'unless-stopped',
        healthcheck: {
          test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost:3000/health'],
          interval: '30s',
          timeout: '10s',
          retries: 3,
          start_period: '10s',
        },
      },
      web: {
        build: { context: './web', dockerfile: './Dockerfile' },
        ports: ['5173:80'],
        environment: { NODE_ENV: 'production' },
        depends_on: {
          backend: { condition: 'service_started' },
        },
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
      depends_on: {
        backend: { condition: 'service_started' },
      },
    };
  }

  await fs.writeFile(path.join(cwd, 'docker-compose.yml'), JSON.stringify(compose, null, 2));
}
