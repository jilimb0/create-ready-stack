#!/usr/bin/env node

import yargs from 'yargs';
import { initCommand } from './commands/init.js';

export async function cli() {
  const args = yargs(process.argv.slice(2));

  args.command({
    ...initCommand,
    builder: {
      force: { type: 'boolean', describe: 'Overwrite existing directory', default: false },
    },
    handler: async (argv) => {
      const force = (argv as { force?: boolean }).force ?? false;
      await initCommand.handler(force);
    },
  });
  args.help();
  args.strict();

  return args.parse();
}
