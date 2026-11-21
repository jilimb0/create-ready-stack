import type { Argv } from 'yargs';
import { buildUniversalAgentPrompt } from '../config/agentPrompt.js';
import type { ProjectAnswers } from '../types/project.js';

export interface PromptCommandArgs {
  template?: ProjectAnswers['format'];
  name?: string;
  title?: string;
  domain?: string;
  problem?: string;
}

export const promptCommand = {
  command: 'prompt',
  describe: 'Output the universal AI agent launch prompt (Core-First & Ecosystem Donors)',
  builder: (yargs: Argv) =>
    yargs
      .option('template', {
        type: 'string',
        alias: 't',
        choices: ['saas', 'tma', 'bot', 'agent', 'agent-mcp'] as const,
        describe: 'Target starter preset to embed in the prompt',
      })
      .option('name', {
        type: 'string',
        alias: 'n',
        describe: 'Project slug (e.g. my-app)',
      })
      .option('title', {
        type: 'string',
        describe: 'Project display title',
      })
      .option('domain', {
        type: 'string',
        alias: 'd',
        describe: 'Core domain entity name',
      })
      .option('problem', {
        type: 'string',
        alias: 'p',
        describe: 'Short painkiller problem statement',
      }),
  handler: async (argv: PromptCommandArgs = {}) => {
    const context: Partial<ProjectAnswers> = {};
    if (argv.template) context.format = argv.template;
    if (argv.name) context.projectName = argv.name;
    if (argv.title) context.projectTitle = argv.title;
    if (argv.domain) context.coreDomain = argv.domain;
    if (argv.problem) context.problem = argv.problem;
    if (argv.template === 'saas') {
      context.frontend = 'nextjs';
    }

    console.log(buildUniversalAgentPrompt(context));
  },
};
