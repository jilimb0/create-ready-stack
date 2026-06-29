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
];

export const upgradeCommand = {
  command: 'upgrade',
  describe: 'Upgrade an existing generated project with latest templates',
  handler: async () => {
    console.log('\n Checking project for upgrade...\n');

    const cwd = process.cwd();
    const existingFiles: string[] = [];

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
        message:
          'This will overwrite the listed files with latest templates. Continue?',
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

    for (const section of sections) {
      console.log(`   \u2713 ${section} would be upgraded`);
    }

    console.log(
      '\n Upgrade dry-run complete. Run with --apply to actually overwrite files.',
    );
    console.log(' For now, manually review and update files from the latest template.\n');
  },
};
