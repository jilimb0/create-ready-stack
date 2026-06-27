import crypto from 'node:crypto';
import * as path from 'node:path';
import * as fs from 'fs-extra';
import inquirer from 'inquirer';
import { generateDocs } from '../generators/docs.js';
import { generateMonorepo } from '../generators/monorepo.js';
import { generatePackageJson } from '../generators/packageJson.js';
import type { ProjectAnswers } from '../types/project.js';
import { isDirectoryEmpty } from '../utils/fileSystem.js';

const QUESTION_BLOCKS = {
  general: [
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name (slug, e.g. my-project):',
      validate: (input: string) =>
        /^[a-z][a-z0-9-]*$/.test(input) ||
        'Must start with a letter and contain only letters, digits, hyphens',
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
        { name: 'Web app (React 19 + Vite 8 + TanStack Query)', value: 'web' },
        { name: 'Web app + Telegram bot', value: 'web+bot' },
      ],
    },
    {
      type: 'confirm',
      name: 'multiUser',
      message: 'Enable multi-user mode?',
      description: 'Multi-user mode = support for multiple users with authentication',
      default: false,
    },
    {
      type: 'confirm',
      name: 'useDocker',
      message: 'Use Docker / Docker Compose for deployment?',
      default: true,
    },
    {
      type: 'list',
      name: 'backendFramework',
      message: 'Backend framework:',
      choices: [
        { name: 'Hono 4 (lightweight, fast — recommended)', value: 'hono' },
        { name: 'Express 5 (mature, ecosystem)', value: 'express' },
      ],
    },
    {
      type: 'list',
      name: 'orm',
      message: 'Database ORM:',
      choices: [
        { name: 'Drizzle ORM (type-safe, SQL-like — recommended)', value: 'drizzle' },
        { name: 'Prisma (declarative schema, migrations)', value: 'prisma' },
      ],
    },
    {
      type: 'confirm',
      name: 'useUILibrary',
      message: 'Include @ui-construction-library components?',
      description: 'UI-Library is your personal design system — atoms, primitives, Tailwind v4',
      default: true,
    },
  ],

  level01: [
    { type: 'input', name: 'problem', message: 'Problem statement (what are we solving?):' },
    { type: 'input', name: 'targetAudience', message: 'Target audience:' },
    { type: 'input', name: 'mainScenario', message: 'Main usage scenario (1-3 steps):' },
    { type: 'input', name: 'successCriteria', message: 'What defines success for v1?:' },
    { type: 'input', name: 'metrics', message: 'Key metrics for 3-6 months:' },
    { type: 'input', name: 'timeBudget', message: 'Time budget:' },
    { type: 'input', name: 'financialConstraints', message: 'Financial constraints:' },
    { type: 'input', name: 'stackRequirements', message: 'Hard stack / platform requirements:' },
    { type: 'input', name: 'integrations', message: 'Integrations:' },
    { type: 'input', name: 'functionsV1', message: '3-7 key features for v1:' },
    { type: 'input', name: 'hypotheses', message: 'Business hypotheses:' },
    { type: 'input', name: 'risks', message: 'Main risks:' },
    { type: 'input', name: 'criticalRisk', message: 'Most critical risk:' },
  ],

  level02: [
    {
      type: 'input',
      name: 'coreDomain',
      message: 'Core domain name (e.g. repos, projects, tasks):',
    },
  ],
};

export const initCommand = {
  command: 'init',
  describe: 'Create a new project following the proven stack pattern',
  handler: async (force = false) => {
    console.log('\n Initializing new project...\n');

    const cwd = process.cwd();
    const generalAnswers = await inquirer.prompt(QUESTION_BLOCKS.general);
    const projectName = generalAnswers.projectName;
    const projectDir = path.join(cwd, projectName);

    console.log(`\n Creating project folder: ${projectName}\n`);

    try {
      await fs.ensureDir(projectDir);
    } catch (err) {
      console.error(`\n Failed to create project folder: ${(err as Error).message}`);
      return;
    }

    if (!force && !isDirectoryEmpty(projectDir)) {
      const confirm = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: `Folder "${projectName}" is not empty. Continue?`,
          default: false,
        },
      ]);
      if (!confirm.proceed) {
        console.log('\n Project creation cancelled.');
        return;
      }
    }

    const level01Answers = await inquirer.prompt(QUESTION_BLOCKS.level01);
    const level02Answers = await inquirer.prompt(QUESTION_BLOCKS.level02);

    const includeBot = generalAnswers.format === 'web+bot';

    const answers: ProjectAnswers = {
      projectName,
      projectTitle: generalAnswers.projectTitle,
      format: generalAnswers.format,
      multiUser: generalAnswers.multiUser,
      useDocker: generalAnswers.useDocker,
      backendFramework: generalAnswers.backendFramework,
      orm: generalAnswers.orm,
      useUILibrary: generalAnswers.useUILibrary,
      includeBot,
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
      jwtSecret: crypto.randomBytes(32).toString('hex'),
    };

    console.log('\n Generating project...\n');

    await generateDocs(projectDir, answers);
    console.log(
      '   \u2713 docs/ created (LEVELS, 01-idea, 02-arch, 03-impl, 04-quality, 05-release, 06-deploy)',
    );

    await generateMonorepo(projectDir, answers);
    console.log('   \u2713 Project skeleton created');

    await generatePackageJson(projectDir, answers);
    console.log('   \u2713 Root config files created');

    console.log(`\n Project "${answers.projectTitle}" created in "${projectName}/"!`);
    console.log('\nNext steps:');
    console.log(`   cd ${projectName}`);
    console.log('   pnpm install');
    console.log('   pnpm check');
    console.log('   git init && git add . && git commit -m "chore: init project"');
    console.log('\nStack used:');
    console.log(`   Backend:   ${answers.backendFramework === 'hono' ? 'Hono 4' : 'Express 5'}`);
    console.log(`   ORM:       ${answers.orm === 'drizzle' ? 'Drizzle ORM' : 'Prisma'}`);
    console.log(`   Frontend:  React 19 + Vite 8 + TanStack Query 5`);
    if (answers.includeBot) console.log(`   Bot:       @tgwrapper/core`);
    if (answers.useUILibrary) console.log(`   UI:        @ui-construction-library`);
    console.log('');
  },
};
