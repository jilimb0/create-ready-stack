import * as path from 'node:path';
import fs from 'fs-extra';
import type { ProjectAnswers } from '../types/project.js';

export async function generateDocs(cwd: string, answers: ProjectAnswers) {
  const docsBase = path.join(cwd, 'docs');

  // 1. Level 01 - Idea
  const ideaDir = path.join(docsBase, '01-idea');
  await fs.ensureDir(ideaDir);

  const briefContent = `# Brief - ${answers.projectTitle}

## Problem
${answers.problem}

## Target Audience
${answers.targetAudience}

## Main Scenario
${answers.mainScenario}

## Success Criteria for v1
${answers.successCriteria}

## Key Metrics (3-6 months)
${answers.metrics}

## Time Budget
${answers.timeBudget}

## Financial Constraints
${answers.financialConstraints}

## Hard Requirements
${answers.stackRequirements}

## Integrations
${answers.integrations}

## Features for v1
${answers.functionsV1}

## Business Hypotheses
${answers.hypotheses}

## Risks
${answers.risks}

## Critical Risk
${answers.criticalRisk}
`;
  await fs.writeFile(path.join(ideaDir, 'brief.md'), briefContent);

  const dod01 = `# Definition of Done - Level 01 (Idea & Context)

## Completion criteria for Level 01:
- [ ] brief.md filled with answers to all questions
- [ ] Product problem is clearly described
- [ ] Target audience is defined
- [ ] Main scenario is described (1-3 steps)
- [ ] Success criteria for v1 are defined
- [ ] Metrics for 3-6 months are set
- [ ] Time and financial budgets are estimated
- [ ] Stack requirements are captured
- [ ] Integrations are listed
- [ ] Features for v1 (3-7) are described
- [ ] Hypotheses (H1-H3) are formulated
- [ ] Risks are assessed, critical risk highlighted
`;
  await fs.writeFile(path.join(ideaDir, 'dod.md'), dod01);

  // 2. Level 02 - Architecture
  const archDir = path.join(docsBase, '02-arch');
  await fs.ensureDir(archDir);

  const _hasUsers = answers.multiUser;
  const domainsContent = `# Domains - Level 02 (Architecture & Design)

## Core Domain: ${answers.coreDomain}

## Domain List:

### auth
**Responsibility:** Authentication and authorization management
**Entities:** User, Session, Token
**Use cases:** login, logout, register, refreshToken

### users
**Responsibility:** User profile management
**Entities:** User, Profile
**Use cases:** getProfile, updateProfile

### ${answers.coreDomain}
**Responsibility:** Core domain of the project
**Entities:** ${answers.coreDomain}, ${answers.coreDomain}Item
**Use cases:** create${answers.coreDomain}, get${answers.coreDomain}, update${answers.coreDomain}, delete${answers.coreDomain}

### integrations
**Responsibility:** Integration with external services
**Entities:** Integration, IntegrationConfig
**Use cases:** connectIntegration, syncData

### activity
**Responsibility:** User activity logging
**Entities:** Activity, ActivityLog
**Use cases:** logActivity, getActivity

### analytics
**Responsibility:** Analytics and metrics
**Entities:** Metric, AnalyticsReport
**Use cases:** trackMetric, getAnalytics

### notes
**Responsibility:** Notes and documentation system
**Entities:** Note, Document
**Use cases:** createNote, getNote, updateNote
`;
  await fs.writeFile(path.join(archDir, 'domains.md'), domainsContent);

  const flowsContent = `# User and Integration Flows - Level 02

## Main User Flow

1. **Login** → User signs into the system
   - Login via email/password or OAuth
   - Token retrieval

2. **Dashboard** → User sees the main panel
   - Statistics overview
   - Quick actions

3. **${answers.coreDomain}** → Work with core domain
   - create ${answers.coreDomain}
   - view list
   - edit
   - delete

## Integration Flow

1. **Connect External Service** → User connects an integration
   - Choose service (GitHub, GitLab, Telegram)
   - Authorize with the service
   - Save config

2. **Data Synchronization** → System syncs data
   - Periodic data pull
   - Change processing
   - Save to database
`;
  await fs.writeFile(path.join(archDir, 'flows.md'), flowsContent);

  const dod02 = `# Definition of Done - Level 02 (Architecture & Design)

## Completion criteria for Level 02:
- [ ] domains.md filled with domain list
- [ ] Each domain has a described responsibility
- [ ] Domain entities are listed
- [ ] Use cases for domains are described (draft)
- [ ] flows.md contains user flows
- [ ] flows.md contains integration flows
- [ ] Modular monolith architecture is documented
`;
  await fs.writeFile(path.join(archDir, 'dod.md'), dod02);

  // 3. LEVELS.md
  const levelsContent = `# Development Methodology - Levels 01-06

## Level 01 - Idea & Context
**Artifacts:**
- docs/01-idea/brief.md - brief with answers to questions
- docs/01-idea/dod.md - Definition of Done

**Goal:** Clearly describe the problem, target audience, scenarios, goals, v1 features

## Level 02 - Architecture & Design
**Artifacts:**
- docs/02-arch/domains.md - domain list, responsibilities, entities
- docs/02-arch/flows.md - user and integration flows
- docs/02-arch/dod.md - Level 02 DoD

**Goal:** Document modular monolith architecture, domains, use cases

## Level 03 - Implementation (Skeleton)
**Artifacts:**
- docs/03-impl/dod.md - Level 03 DoD
- docs/03-impl/commands.md - quality/release commands

**Stack:** backend (Node.js + Hono/Express + Drizzle/Prisma), web (Vite + React or Next.js 15), ORM (Drizzle/Prisma), DB (Postgres)

**Goal:** Create repository skeleton without business logic

## Level 04 - Quality
**Artifacts:**
- docs/04-quality/task-dod.md - Task DoD
- docs/04-quality/feature-dod.md - Feature DoD
- docs/04-quality/checklist-manual.md - Manual smoke checklist

**Standard:** Biome (linter+formatter), TypeScript strict, unit/integration tests

**Goal:** Set up quality standards and verification commands

## Level 05 - Releases
**Artifacts:**
- docs/05-release/checklist.md - Release checklist
- docs/05-release/release-flow.md - Step-by-step release flow
- CHANGELOG.md, VERSION

**Goal:** Set up release process

## Level 06 - Deploy
**Artifacts:**
- docs/06-deploy/checklist.md - General deploy checklist
- docs/06-deploy/deploy-vps-docker.md - Deploy via Docker/Compose
- docs/06-deploy/deploy-vps-manual.md - Deploy without Docker
- docker-compose.example.yml, Dockerfile.example

**Default:** Deploy to VPS, Docker/Compose as default

**Goal:** Set up deployment
`;
  await fs.writeFile(path.join(docsBase, 'LEVELS.md'), levelsContent);

  // 4. Level 03 - Impl
  const implDir = path.join(docsBase, '03-impl');
  await fs.ensureDir(implDir);

  const dod03 = `# Definition of Done - Level 03 (Implementation)

## Completion criteria for Level 03:
- [ ] Repository skeleton created
- [ ] backend/ Node.js + ORM scaffold
- [ ] web/ minimal React + Vite project
- [ ] bot/ (if format includes bot) minimal entry point
- [ ] docs/ structure with LEVELS.md
- [ ] scripts/ template scripts
- [ ] package.json with quality/release commands
- [ ] biome.json, tsconfig.base.json
- [ ] .github/workflows/ci.yml
`;
  await fs.writeFile(path.join(implDir, 'dod.md'), dod03);

  const commandsContent = `## Quality Commands:
- \`pnpm lint\` - Biome linting
- \`pnpm lint:fix\` - Lint with auto-fix
- \`pnpm typecheck\` - TypeScript type checking
- \`pnpm test\` - Run tests
- \`pnpm check\` - lint + typecheck + test
- \`pnpm check:fix\` - lint:fix + typecheck + test
- \`pnpm validate\` - lint + typecheck + test + build

## Release Commands:
- \`pnpm build\` - Build project
- \`pnpm release:prep\` - Validate before release
- \`pnpm release:tag\` - Create git tag hook
`;
  await fs.writeFile(path.join(implDir, 'commands.md'), commandsContent);

  // 5. Level 04 - Quality
  const qualityDir = path.join(docsBase, '04-quality');
  await fs.ensureDir(qualityDir);

  await fs.writeFile(
    path.join(qualityDir, 'task-dod.md'),
    `# Definition of Done - Task

## Task completion criteria:
- [ ] Code is written and meets standards
- [ ] TypeScript strict - no errors
- [ ] Biome lint - no errors
- [ ] Unit tests are written and passing
- [ ] Integration tests (if needed) are written and passing
- [ ] Code is committed
- [ ] Pull request is created
- [ ] Code review is completed
`,
  );

  await fs.writeFile(
    path.join(qualityDir, 'feature-dod.md'),
    `# Definition of Done - Feature

## Feature completion criteria:
- [ ] All feature tasks are completed (task DoD passed)
- [ ] Unit test coverage >= 80%
- [ ] Integration tests pass
- [ ] Smoke tests (checklist-manual.md) passed
- [ ] Documentation is updated
- [ ] CHANGELOG is updated
- [ ] Feature is in master/main branch
`,
  );

  await fs.writeFile(
    path.join(qualityDir, 'checklist-manual.md'),
    `# Manual Smoke Checklist

## Run before release:
- [ ] Application starts (pnpm dev)
- [ ] Login page works
- [ ] Dashboard page works
- [ ] Core domain works (create, read, update, delete)
- [ ] TypeScript typecheck passes (pnpm typecheck)
- [ ] Lint passes (pnpm lint)
- [ ] Tests pass (pnpm test)
- [ ] Build passes (pnpm build)
`,
  );

  // 6. Level 05 - Release
  const releaseDir = path.join(docsBase, '05-release');
  await fs.ensureDir(releaseDir);

  await fs.writeFile(
    path.join(releaseDir, 'checklist.md'),
    `# Release Checklist

## Before release:prep:
- [ ] All features are completed (feature DoD passed)
- [ ] Smoke tests passed
- [ ] CHANGELOG is updated
- [ ] VERSION is updated

## After release:prep:
- [ ] pnpm validate passes
- [ ] Git tag is created (release:tag)
- [ ] Release published to npm/Vercel/other platform
`,
  );

  await fs.writeFile(
    path.join(releaseDir, 'release-flow.md'),
    `# Release Flow

1. **release:prep** → pnpm validate
   - lint + typecheck + test + build

2. **release:tag** → git tag v<VERSION>

3. **Publish** → Publish to npm/Vercel

4. **CHANGELOG** → Update CHANGELOG.md
`,
  );

  // 7. Level 06 - Deploy
  const deployDir = path.join(docsBase, '06-deploy');
  await fs.ensureDir(deployDir);

  await fs.writeFile(
    path.join(deployDir, 'checklist.md'),
    `# Deploy Checklist

## General:
- [ ] RELEASE checklist passed
- [ ] Docker images built (if using Docker)
- [ ] VPS ready (SSH access, ports open)

## Docker/Compose:
- [ ] docker-compose.yml created
- [ ] DB migrations run
- [ ] Applications are running

## Manual:
- [ ] Node.js installed on VPS
- [ ] PM2/systemd configured
- [ ] Postgres installed
- [ ] Migrations run
`,
  );

  const dockerDeployContent = `# Deploy via Docker/Compose to VPS

## Steps:
1. Copy docker-compose.yml to VPS
2. \`docker-compose up -d\`
3. \`docker-compose ps\` - check health
4. \`docker-compose logs\` - check logs
5. DB migrations: \`docker-compose exec backend pnpm db:migrate\`
`;
  await fs.writeFile(path.join(deployDir, 'deploy-vps-docker.md'), dockerDeployContent);

  const manualDeployContent = `# Deploy without Docker to VPS

## Steps:
1. Install Node.js on VPS
2. Install PM2: \`npm install -g pm2\`
3. Copy project to VPS
4. \`pnpm install\`
5. \`pnpm build\`
6. DB migrations: \`pnpm db:migrate\`
7. \`pm2 start dist/server.js --name app\`
8. \`pm2 save\`
9. \`pm2 startup\` - configure systemd
`;
  await fs.writeFile(path.join(deployDir, 'deploy-vps-manual.md'), manualDeployContent);

  // 8. .ai Project Artifacts (ADLC Infrastructure)
  const aiDir = path.join(cwd, '.ai');
  const adrDir = path.join(aiDir, 'adr');
  await fs.ensureDir(adrDir);

  const aiArch = `# Architecture: ${answers.projectTitle}

## 1. Identity & Domain
${answers.projectTitle} (${answers.projectName}) — ${answers.problem}
- Core Domain: \`${answers.coreDomain}\`
- Target Audience: ${answers.targetAudience}

## 2. Stack & Runtime
- Backend: ${answers.backendFramework}
- ORM: ${answers.orm}
- Frontend: ${answers.frontend}

## 3. Structural Invariants
- Enforce strict domain boundaries around \`${answers.coreDomain}\`.
- Sensitive credentials and keys must never be logged or tracked in git.
- Client components must not import server models or database adapters directly.

## 4. Data Flows
- Inbound requests validate schemas via Zod before business logic processing.
- Outbound third-party calls must employ timeouts and backoff.
`;
  await fs.writeFile(path.join(aiDir, 'ARCHITECTURE.md'), aiArch);

  const aiConv = `# Engineering Conventions: ${answers.projectTitle}

## 1. Code Standards
- Strict TypeScript: no any, explicit returns on public functions.
- Biome for formatting and linting.

## 2. Error Handling & Logging
- Zero unredacted PII in production logs.
- Map external errors to typed domain exceptions.

## 3. Testing
- TDD-first approach for new features.
- Unit and integration tests must pass before pull requests.
`;
  await fs.writeFile(path.join(aiDir, 'CONVENTIONS.md'), aiConv);

  const aiTasks = `# Common Development Tasks: ${answers.projectTitle}

## 1. Standard Commands
- \`pnpm dev\` — Start development server
- \`pnpm typecheck\` — Run TypeScript type checking
- \`pnpm test\` — Run Vitest suite
- \`pnpm lint\` — Run Biome linter
- \`pnpm build\` — Build production artifacts

## 2. Feature Workflow
1. Write reproduction/acceptance test.
2. Implement feature fulfilling domain invariants.
3. Validate with \`pnpm typecheck\` and \`pnpm test\`.
`;
  await fs.writeFile(path.join(aiDir, 'COMMON_TASKS.md'), aiTasks);

  const adrTemplate = `# ADR-0000: Title of Architectural Decision

**Status:** Proposed | Accepted | Deprecated | Superseded  
**Date:** YYYY-MM-DD  
**Deciders:** Core Engineering Team  

## Context and Problem Statement
Context and problem description.

## Decision Outcome
Chosen option and trade-offs.
`;
  await fs.writeFile(path.join(adrDir, '0000-template.md'), adrTemplate);

  const adr0001 = `# ADR-0001: Initial Stack and Privacy Baseline

**Status:** Accepted  
**Date:** 2026-10-27  
**Deciders:** Core Engineering Team  

## Context and Problem Statement
Initial project scaffolding requiring modern type-safe runtime and zero-leakage privacy baseline.

## Decision Outcome
Adopted ${answers.backendFramework} + ${answers.orm} + ${answers.frontend} with strict Biome linting and .ai architecture governance.
`;
  await fs.writeFile(path.join(adrDir, '0001-initial-stack-and-privacy-baseline.md'), adr0001);

  console.log('   → docs/ and .ai/ created');
}
