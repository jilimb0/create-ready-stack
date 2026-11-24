#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yargs from 'yargs';
import { type InitAgentOptions, initCommand } from './commands/init.js';
import { promptCommand } from './commands/prompt.js';
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
    .example(
      '$0 init --agent --template saas --name my-app',
      'Non-interactive AI agent scaffolding with .ai/AGENT_PROMPT.md',
    )
    .example('$0 prompt', 'Print universal English AI agent launch prompt')
    .example('$0 init --force', 'Overwrite existing directory')
    .example('$0 --version', 'Show version')
    .example('$0 --help', 'Show this help')
    .example('$0 upgrade', 'Check existing project for upgradeable templates')
    .command(upgradeCommand)
    .command(promptCommand)
    .command({
      ...initCommand,
      builder: {
        force: {
          type: 'boolean',
          describe: 'Overwrite existing directory',
          default: false,
          alias: 'f',
        },
        template: {
          type: 'string',
          describe: 'Starter template preset (saas, tma, bot, agent, agent-mcp)',
          choices: ['saas', 'tma', 'bot', 'agent', 'agent-mcp'] as const,
          alias: 't',
        },
        agent: {
          type: 'boolean',
          describe: 'Run non-interactively in AI agent mode and output launch prompt',
          default: false,
          alias: 'a',
        },
        'in-place': {
          type: 'boolean',
          describe: 'Initialize directly inside the current working directory',
          default: false,
        },
        'with-mcp': {
          type: 'boolean',
          describe: 'Include read-only stdio MCP server (packages/mcp) and UDPA gate workflow',
          default: false,
        },
        blueprint: {
          type: 'boolean',
          describe:
            'Generate architecture-blueprint.json and open decisions before scaffolding files',
          default: false,
        },
        'print-prompt': {
          type: 'boolean',
          describe: 'Print the universal AI agent launch prompt after scaffolding',
          default: false,
        },
        name: {
          type: 'string',
          describe: 'Project slug for non-interactive agent mode',
          alias: 'n',
        },
        title: {
          type: 'string',
          describe: 'Project title for non-interactive agent mode',
        },
        domain: {
          type: 'string',
          describe: 'Core domain entity for non-interactive agent mode',
          alias: 'd',
        },
        problem: {
          type: 'string',
          describe: 'Problem statement for non-interactive agent mode',
          alias: 'p',
        },
      },
      handler: async (argv) => {
        const parsed = argv as {
          force?: boolean;
          template?: 'saas' | 'tma' | 'bot' | 'agent' | 'agent-mcp';
          agent?: boolean;
          inPlace?: boolean;
          withMcp?: boolean;
          blueprint?: boolean;
          printPrompt?: boolean;
          name?: string;
          title?: string;
          domain?: string;
          problem?: string;
        };
        const force = parsed.force ?? false;
        const agentOptions: InitAgentOptions = {
          agent: parsed.agent,
          inPlace: parsed.inPlace,
          withMcp: parsed.withMcp,
          blueprint: parsed.blueprint,
          printPrompt: parsed.printPrompt,
          name: parsed.name,
          title: parsed.title,
          domain: parsed.domain,
          problem: parsed.problem,
        };
        await initCommand.handler(force, VERSION, parsed.template, agentOptions);
      },
    });

  args.demandCommand(1, '');
  args.help();
  args.strict();
  args.showHelpOnFail(false, 'Specify --help for available options');

  return args.parse();
}
