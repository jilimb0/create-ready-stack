#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import yargs from 'yargs';
import { initCommand } from './commands/init.js';
import { upgradeCommand } from './commands/upgrade.js';

function getVersion(): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

const VERSION = getVersion();
const BANNER = `create-ready-stack v${VERSION} — Production-ready full-stack scaffolding`;

export async function cli() {
  const args = yargs(process.argv.slice(2));

  args
    .scriptName('create-ready-stack')
    .version(VERSION)
    .alias('v', 'version')
    .usage(`${BANNER}\n\nUsage: $0 <command> [options]`)
    .example('$0 init', 'Start interactive scaffolding (default)')
    .example('$0 init --force', 'Overwrite existing directory')
    .example('$0 --version', 'Show version')
    .example('$0 --help', 'Show this help')
    .example('$0 upgrade', 'Check existing project for upgradeable templates')
    .command(upgradeCommand)
    .command({
      ...initCommand,
      builder: {
        force: {
          type: 'boolean',
          describe: 'Overwrite existing directory',
          default: false,
          alias: 'f',
        },
      },
      handler: async (argv) => {
        const force = (argv as { force?: boolean }).force ?? false;
        await initCommand.handler(force, VERSION);
      },
    });

  args.demandCommand(1, '');
  args.help();
  args.strict();
  args.showHelpOnFail(false, 'Specify --help for available options');

  return args.parse();
}
