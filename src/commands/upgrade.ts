import * as path from 'node:path';
import * as fs from 'fs-extra';
import inquirer from 'inquirer';

const UPGRADABLE_FILES = [
  'biome.json',
  'tsconfig.base.json',
  '.gitignore',
  '.dockerignore',
  '.env.example',
  'turbo.json',
  'pnpm-workspace.yaml',
] as const;

type UpgradeFile = (typeof UPGRADABLE_FILES)[number];

/**
 * Standard template content for each upgradable file.
 * Uses defaults that match the standard generated project.
 */
function getTemplateContent(file: UpgradeFile, hasBot: boolean): string {
  switch (file) {
    case 'biome.json':
      return JSON.stringify(
        {
          $schema: 'https://biomejs.dev/schemas/2.5.1/schema.json',
          linter: { enabled: true, rules: { preset: 'recommended' } },
          formatter: { enabled: true, indentStyle: 'space', indentWidth: 2, lineWidth: 100 },
          javascript: {
            formatter: { trailingCommas: 'es5', semicolons: 'always', quoteStyle: 'single' },
          },
          files: { ignore: ['node_modules', 'dist', '.next', 'coverage', '.turbo'] },
        },
        null,
        2,
      ) + '\n';

    case 'tsconfig.base.json':
      return JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'bundler',
            lib: ['ES2022'],
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            resolveJsonModule: true,
            declaration: true,
            declarationMap: true,
            noEmit: true,
          },
        },
        null,
        2,
      ) + '\n';

    case '.gitignore':
      return [
        'node_modules',
        '.pnpm-store',
        'dist',
        '.next',
        '.env',
        '.env.local',
        '.env.production',
        '.env.*.local',
        '*.log',
        'coverage',
        '.turbo',
        '.DS_Store',
        '',
      ].join('\n');

    case '.dockerignore':
      return [
        'node_modules',
        '.pnpm-store',
        'dist',
        '.git',
        '.gitignore',
        '*.md',
        '.env',
        '.env.*',
        '',
      ].join('\n');

    case '.env.example':
      return [
        'DATABASE_URL="postgresql://postgres:password@localhost:5432/my-app"',
        'NODE_ENV=development',
        'PORT=3000',
        'VITE_API_URL="http://localhost:3000"',
        ...(hasBot ? ['TELEGRAM_TOKEN=""'] : []),
        '',
      ].join('\n');

    case 'turbo.json':
      return JSON.stringify(
        {
          $schema: 'https://turbo.build/schema.json',
          tasks: {
            build: { dependsOn: ['^build'], outputs: ['dist/**'] },
            dev: { cache: false, persistent: true },
            lint: {},
            typecheck: {},
            test: {},
          },
        },
        null,
        2,
      ) + '\n';

    case 'pnpm-workspace.yaml': {
      const packages = ['backend', 'web'];
      if (hasBot) packages.push('bot');
      return [
        'packages:',
        ...packages.map((p) => `  - '${p}'`),
        '',
        'onlyBuiltDependencies:',
        "  - '@biomejs/biome'",
        "  - 'esbuild'",
        "  - '@prisma/client'",
        "  - 'prisma'",
        "  - 'sharp'",
        '',
      ].join('\n');
    }
  }
}

async function detectHasBot(cwd: string): Promise<boolean> {
  return fs.pathExists(path.join(cwd, 'bot'));
}

export async function upgradeHandler(apply: boolean): Promise<void> {
  console.log('\n Checking project for upgrade...\n');

  const cwd = process.cwd();
  const existingFiles: UpgradeFile[] = [];

  for (const file of UPGRADABLE_FILES) {
    const filePath = path.join(cwd, file);
    if (await fs.pathExists(filePath)) {
      existingFiles.push(file);
    }
  }

  if (existingFiles.length === 0) {
    console.log(
      ' No upgradable files found. This command must be run from a create-ready-stack generated project root.',
    );
    return;
  }

  console.log(` Found ${existingFiles.length} upgradable files:\n`);
  for (const f of existingFiles) {
    console.log(`   - ${f}`);
  }

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'This will overwrite the listed files with latest templates. Continue?',
      default: false,
    },
  ]);

  if (!confirm) {
    console.log('\n Upgrade cancelled.');
    return;
  }

  const { sections } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'sections',
      message: 'Select files to upgrade:',
      choices: existingFiles.map((f) => ({
        name: f,
        value: f,
        checked: true,
      })),
    },
  ]);

  if (sections.length === 0) {
    console.log('\n No files selected. Upgrade cancelled.');
    return;
  }

  const hasBot = await detectHasBot(cwd);

  for (const section of sections) {
    if (apply) {
      const content = getTemplateContent(section as UpgradeFile, hasBot);
      await fs.writeFile(path.join(cwd, section), content);
      console.log(`   \u2713 ${section} upgraded`);
    } else {
      console.log(`   \u2713 ${section} would be upgraded`);
    }
  }

  if (apply) {
    console.log('\n Upgrade complete. Review changes with `git diff`.');
  } else {
    console.log('\n Upgrade dry-run complete. Run with --apply to actually overwrite files.');
  }
}

export const upgradeCommand = {
  command: 'upgrade',
  describe: 'Upgrade an existing generated project with latest templates',
  handler: async () => {
    const apply = process.argv.includes('--apply');
    await upgradeHandler(apply);
  },
};
