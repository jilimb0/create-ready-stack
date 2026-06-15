#!/usr/bin/env node

import inquirer from 'inquirer';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ProjectAnswers } from '../types/project.js';
import { generateDocs } from '../generators/docs.js';
import { generateMonorepo } from '../generators/monorepo.js';
import { generatePackageJson } from '../generators/packageJson.js';
import { isDirectoryEmpty } from '../utils/fileSystem.js';

const QUESTION_BLOCKS = {
  general: [
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name (slug, e.g. my-project):',
      validate: (input: string) => /^[a-z][a-z0-9-]*$/.test(input) || 'Must start with a letter and contain only letters, digits, hyphens',
    },
    {
      type: 'input',
      name: 'projectTitle',
      message: 'Project title (display name, e.g. My Awesome Project):',
    },
    {
      type: 'list',
      name: 'format',
      message: 'First version format:',
      choices: [
        { name: 'Web app (Next.js)', value: 'web' },
        { name: 'Telegram bot', value: 'bot' },
        { name: 'Web app + Telegram bot', value: 'web+bot' },
      ],
    },
    {
      type: 'confirm',
      name: 'multiUser',
      message: 'Enable multi-user mode?',
      description: 'Multi-user mode = support for multiple users with authentication (login, profiles, per-user data). Skip if this is a single-user or personal tool.',
      default: false,
    },
    {
      type: 'confirm',
      name: 'useDocker',
      message: 'Use Docker / Docker Compose for deployment?',
      default: true,
    },
  ],

  level01: [
    { type: 'input', name: 'problem', message: 'Problem statement (what are we solving?):' },
    { type: 'input', name: 'targetAudience', message: 'Target audience (who is this for?):' },
    { type: 'input', name: 'mainScenario', message: 'Main usage scenario (1-3 steps):' },
    { type: 'input', name: 'successCriteria', message: 'What defines success for v1?:' },
    { type: 'input', name: 'metrics', message: 'Key metrics for 3-6 months:' },
    { type: 'input', name: 'timeBudget', message: 'Time budget (hours / weeks):' },
    { type: 'input', name: 'financialConstraints', message: 'Financial constraints (if any):' },
    { type: 'input', name: 'stackRequirements', message: 'Hard stack / platform requirements (if any):' },
    { type: 'input', name: 'integrations', message: 'Integrations (e.g. GitHub, GitLab, Telegram API, others):' },
    { type: 'input', name: 'functionsV1', message: '3-7 key features for v1:' },
    {
      type: 'input',
      name: 'hypotheses',
      message: 'Business hypotheses (H1-H3):',
      description: 'Hypotheses = testable assumptions about product value. Example: H1: "Devs will pay $10/mo for consolidated repo stats", H2: "GitHub integration will increase retention by 30%".',
    },
    { type: 'input', name: 'risks', message: 'Main risks:' },
    { type: 'input', name: 'criticalRisk', message: 'Most critical risk:' },
  ],

  level02: [
    { type: 'input', name: 'coreDomain', message: 'Core domain name (e.g. repos, projects, tasks):' },
  ],
};

export const initCommand = {
  command: 'init',
  describe: 'Create a new project following the 01-06 level methodology',
  handler: async () => {
    console.log('\n🚀 Initializing new project...\n');

    const cwd = process.cwd();
    console.log(`📁 Working directory: ${cwd}\n`);

    const generalAnswers = await inquirer.prompt(QUESTION_BLOCKS.general);
    const projectName = generalAnswers.projectName;

    // Создаём папку проекта внутри текущей директории
    const projectDir = path.join(cwd, projectName);

    console.log(`\n📦 Creating project folder: ${projectName}\n`);

    try {
      await fs.ensureDir(projectDir);
    } catch (err) {
      console.error(`\n❌ Failed to create project folder: ${(err as any).message}`);
      return;
    }

    const isEmpty = isDirectoryEmpty(projectDir);
    if (!isEmpty) {
      const confirm = await inquirer.prompt([
        { type: 'confirm', name: 'proceed', message: `Project folder "${projectName}" is not empty. Create project here anyway?`, default: false },
      ]);
      if (!confirm.proceed) {
        console.log('\n❌ Project creation cancelled.');
        return;
      }
    }

    const level01Answers = await inquirer.prompt(QUESTION_BLOCKS.level01);
    const level02Answers = await inquirer.prompt(QUESTION_BLOCKS.level02);

    const answers: ProjectAnswers = {
      projectName: projectName,
      projectTitle: generalAnswers.projectTitle,
      format: generalAnswers.format,
      multiUser: generalAnswers.multiUser,
      useDocker: generalAnswers.useDocker,
      problem: level01Answers.problem,
      targetAudience: level01Answers.targetAudience,
      mainScenario: level01Answers.mainScenario,
      successCriteria: level01Answers.successCriteria,
      metrics: level01Answers.metrics,
      timeBudget: level01Answers.timeBudget,
      financialConstraints: level01Answers.financialConstraints,
      stackRequirements: level01Answers.stackRequirements,
      integrations: level01Answers.integrations,
      functionsV1: level01Answers.functionsV1,
      hypotheses: level01Answers.hypotheses,
      risks: level01Answers.risks,
      criticalRisk: level01Answers.criticalRisk,
      coreDomain: level02Answers.coreDomain,
    };

    console.log('\n✅ Generating project...\n');

    await generateDocs(projectDir, answers);
    console.log('   ✓ docs/ created (LEVELS, 01-idea, 02-arch, 03-impl, 04-quality, 05-release, 06-deploy)');

    await generateMonorepo(projectDir, answers);
    console.log('   ✓ Monorepo skeleton created (backend/, web/, scripts/, .github/workflows/)');

    await generatePackageJson(projectDir, answers);
    console.log('   ✓ Root config files created (package.json, biome.json, tsconfig.base.json, .gitignore, CHANGELOG.md, VERSION)');

    console.log(`\n🎉 Project "${answers.projectTitle}" successfully created in "${projectName}/"!`);
    console.log('\nNext steps:');
    console.log(`   cd ${projectName}`);
    console.log('   pnpm install');
    console.log('   pnpm check');
    console.log('   git init && git add . && git commit -m "chore: init project"\n');
  },
};
