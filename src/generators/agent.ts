import * as path from 'node:path';
import fs from 'fs-extra';
import { version } from '../config/versions.js';
import type { ProjectAnswers } from '../types/project.js';

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GenerateAgentStackOptions {
  includeMcp?: boolean;
}

export function buildUdpaGateWorkflow(): string {
  return `name: UDPA Gate

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  security-events: write
  actions: read

jobs:
  udpa-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jilimb0/udpa-engine@v1
        with:
          target-path: '.'
          min-score: '85'
          stage: 'Scale'
          sarif-output: 'udpa-audit.sarif'
          passport-output: 'udpa-zk-passport.json'
      - uses: github/codeql-action/upload-sarif@v4
        if: always() && hashFiles('udpa-audit.sarif') != ''
        continue-on-error: true
        with:
          sarif_file: 'udpa-audit.sarif'
`;
}

function buildMcpServerSource(projectName: string): string {
  return `import * as readline from 'node:readline';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';

const MCP_PROTOCOL_VERSION = '2024-11-05';

const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]).optional(),
  method: z.string().min(1),
  params: z.record(z.string(), z.unknown()).optional(),
});

const ReadResourceParamsSchema = z.object({
  uri: z.string().min(1),
});

interface McpResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  read: () => Record<string, unknown>;
}

const RESOURCES: McpResourceDefinition[] = [
  {
    uri: 'bdp://${projectName}/manifest',
    name: 'Project BDP Manifest',
    description: 'Read-only project identity, invariants, and UDPA baseline passport.',
    mimeType: 'application/json',
    read: () => ({
      project: '${projectName}',
      protocolVersion: MCP_PROTOCOL_VERSION,
      mode: 'read-only',
      udpaGate: 'jilimb0/udpa-engine@v1',
    }),
  },
  {
    uri: 'bdh://${projectName}/health',
    name: 'Agent Telemetry Health (BDH)',
    description: 'Read-only runtime health, circuit-breaker defaults, and uptime snapshot.',
    mimeType: 'application/json',
    read: () => ({
      status: 'healthy',
      uptimeSec: Math.floor(process.uptime()),
      circuitState: 'CLOSED',
    }),
  },
  {
    uri: 'bds://${projectName}/schema',
    name: 'Agent Orchestration Schema (BDS)',
    description: 'Read-only Drizzle schema catalog for agentRuns and agentNodes.',
    mimeType: 'application/json',
    read: () => ({
      tables: ['agent_runs', 'agent_nodes'],
      costUnit: 'micros',
    }),
  },
];

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: { code: number; message: string };
}

function logStderr(message: string): void {
  process.stderr.write(\`[mcp:${projectName}] \${message}\\n\`);
}

export async function handleMcpRequest(raw: unknown): Promise<JsonRpcResponse | null> {
  const parsed = JsonRpcRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }

  const { id, method, params } = parsed.data;

  // MCP 2024-11-05: notifications (and requests without id) must never produce a response frame.
  if (method.startsWith('notifications/') || id === undefined) {
    return null;
  }

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {
          resources: {
            listChanged: false,
            subscribe: false,
          },
        },
        serverInfo: {
          name: '${projectName}-mcp',
          version: '0.1.0',
        },
      },
    };
  }

  if (method === 'ping') {
    return { jsonrpc: '2.0', id, result: {} };
  }

  if (method === 'resources/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        resources: RESOURCES.map(({ uri, name, description, mimeType }) => ({
          uri,
          name,
          description,
          mimeType,
        })),
      },
    };
  }

  if (method === 'resources/read') {
    const readParams = ReadResourceParamsSchema.safeParse(params);
    if (!readParams.success) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32602, message: 'Invalid params: uri is required' },
      };
    }

    const resource = RESOURCES.find((item) => item.uri === readParams.data.uri);
    if (!resource) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32002, message: \`Resource not found: \${readParams.data.uri}\` },
      };
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {
        contents: [
          {
            uri: resource.uri,
            mimeType: resource.mimeType,
            text: JSON.stringify(resource.read(), null, 2),
          },
        ],
      },
    };
  }

  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: [] } };
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: \`Method not found: \${method}\` },
  };
}

export function startStdioServer(): void {
  logStderr('Starting read-only MCP 2024-11-05 stdio server');
  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Number.POSITIVE_INFINITY,
  });

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    try {
      const payload: unknown = JSON.parse(trimmed);
      const response = await handleMcpRequest(payload);
      if (response !== null) {
        process.stdout.write(\`\${JSON.stringify(response)}\\n\`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid JSON';
      logStderr(\`Failed to parse JSON-RPC request: \${message}\`);
    }
  });
}

const isEntrypoint =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  startStdioServer();
}
`;
}

export function generateAgentStack(
  projectName: string,
  options: GenerateAgentStackOptions = {},
): GeneratedFile[] {
  const files: GeneratedFile[] = [
    {
      path: 'packages/db/src/agent-orchestration.schema.ts',
      content: `import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const agentRuns = sqliteTable('agent_runs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  traceId: text('trace_id').notNull(),
  status: text('status').notNull().default('RUNNING'),
  totalCostMicros: integer('total_cost_micros').notNull().default(0),
  totalTokensUsed: integer('total_tokens_used').notNull().default(0),
  startedAtMs: integer('started_at_ms').notNull().default(sql\`(unixepoch() * 1000)\`),
  completedAtMs: integer('completed_at_ms'),
}, (table) => [
  index('idx_agent_runs_tenant_status').on(table.tenantId, table.status),
  uniqueIndex('idx_agent_runs_trace_id').on(table.traceId),
]);

export const agentNodes = sqliteTable('agent_nodes', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull().references(() => agentRuns.id, { onDelete: 'cascade' }),
  parentAgentId: text('parent_agent_id'),
  agentRole: text('agent_role').notNull(),
  stepStatus: text('step_status').notNull().default('IDLE'),
  circuitState: text('circuit_state').notNull().default('CLOSED'),
  retryAttempt: integer('retry_attempt').notNull().default(0),
  subtreeCostMicros: integer('subtree_cost_micros').notNull().default(0),
  selfCostMicros: integer('self_cost_micros').notNull().default(0),
  tokensUsed: integer('tokens_used').notNull().default(0),
  contextLimitTokens: integer('context_limit_tokens').notNull().default(128000),
  contextUsageBps: integer('context_usage_bps').notNull().default(0),
  compactedTokensSaved: integer('compacted_tokens_saved').notNull().default(0),
  durationMs: integer('duration_ms').notNull().default(0),
  updatedAtMs: integer('updated_at_ms').notNull().default(sql\`(unixepoch() * 1000)\`),
}, (table) => [
  index('idx_agent_nodes_run_parent').on(table.runId, table.parentAgentId),
]);
`,
    },
    {
      path: 'apps/web/package.json',
      content: JSON.stringify(
        {
          name: `${projectName}-web`,
          version: '0.1.0',
          private: true,
          dependencies: {
            '@ui-construction-library/core': version('uiLibraryCore'),
            '@ui-construction-library/schema': version('uiLibrarySchema'),
            '@ui-construction-library/motion': version('uiLibraryMotion'),
            zod: version('zod'),
            react: version('react'),
            'react-dom': version('reactDom'),
          },
        },
        null,
        2,
      ),
    },
  ];

  if (options.includeMcp) {
    files.push(
      {
        path: 'packages/mcp/package.json',
        content: JSON.stringify(
          {
            name: `@${projectName}/mcp`,
            version: '0.1.0',
            private: true,
            type: 'module',
            scripts: {
              start: 'tsx src/server.ts',
              typecheck: 'tsc --noEmit',
              test: 'vitest run',
            },
            dependencies: {
              zod: version('zod'),
            },
            devDependencies: {
              '@types/node': version('@types/node'),
              tsx: version('tsx'),
              typescript: version('typescript'),
              vitest: version('vitest'),
            },
          },
          null,
          2,
        ),
      },
      {
        path: 'packages/mcp/src/server.ts',
        content: buildMcpServerSource(projectName),
      },
      {
        path: '.github/workflows/udpa-gate.yml',
        content: buildUdpaGateWorkflow(),
      },
    );
  }

  return files;
}

export async function generateAgent(cwd: string, answers: ProjectAnswers): Promise<void> {
  const files = generateAgentStack(answers.projectName, {
    includeMcp: answers.format === 'agent-mcp',
  });

  for (const file of files) {
    const targetPath = path.join(cwd, file.path);
    await fs.ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, file.content);
  }
}
