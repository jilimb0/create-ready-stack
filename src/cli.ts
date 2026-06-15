#!/usr/bin/env node

import yargs from 'yargs';
import { initCommand } from './commands/init.js';

export async function cli() {
  const args = yargs(process.argv.slice(2));

  args.command(initCommand);
  args.help();
  args.strict();

  return args.parse();
}
