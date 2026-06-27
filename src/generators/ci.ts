import fs from 'fs-extra';
import * as path from 'path';
import type { ProjectAnswers } from '../types/project.js';

export async function generateCI(cwd: string, answers: ProjectAnswers) {
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
