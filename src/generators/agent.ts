import * as path from 'node:path';
import fs from 'fs-extra';
import { version } from '../config/versions.js';
import type { ProjectAnswers } from '../types/project.js';
import { buildTerminalShellSource } from './terminalKit.js';

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GenerateAgentStackOptions {
  includeMcp?: boolean;
  projectTitle?: string;
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

export function buildMcpServerSource(projectName: string): string {
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

export interface WorkspaceGroupSnapshot {
  entityType: string;
  symbol: string;
  timeframe: string;
}

export interface SanitizedWorkspaceContext {
  project: string;
  mode: 'read-only';
  activeGroup: 'green' | 'blue' | 'red';
  groups: {
    green: WorkspaceGroupSnapshot;
    blue: WorkspaceGroupSnapshot;
  };
  entityType: string;
  symbol: string;
  timeframe: string;
  sanitized: true;
}

const ALLOWED_GROUPS = new Set(['green', 'blue', 'red']);

function sanitizeGroupSnapshot(
  raw: unknown,
  fallback: WorkspaceGroupSnapshot,
): WorkspaceGroupSnapshot {
  if (typeof raw !== 'object' || raw === null) {
    return fallback;
  }
  const obj = raw as Record<string, unknown>;
  return {
    entityType: typeof obj.entityType === 'string' && obj.entityType ? obj.entityType : fallback.entityType,
    symbol: typeof obj.symbol === 'string' && obj.symbol ? obj.symbol : fallback.symbol,
    timeframe: typeof obj.timeframe === 'string' && obj.timeframe ? obj.timeframe : fallback.timeframe,
  };
}

export function sanitizeWorkspaceContext(raw: unknown): SanitizedWorkspaceContext {
  const defaultGreen: WorkspaceGroupSnapshot = {
    entityType: 'run',
    symbol: 'RUN-001',
    timeframe: '24h',
  };
  const defaultBlue: WorkspaceGroupSnapshot = {
    entityType: 'subscription',
    symbol: 'SUB-001',
    timeframe: '30d',
  };

  if (typeof raw !== 'object' || raw === null) {
    return {
      project: '${projectName}',
      mode: 'read-only',
      activeGroup: 'green',
      groups: { green: defaultGreen, blue: defaultBlue },
      entityType: defaultGreen.entityType,
      symbol: defaultGreen.symbol,
      timeframe: defaultGreen.timeframe,
      sanitized: true,
    };
  }

  const input = raw as Record<string, unknown>;
  const rawGroups =
    typeof input.groups === 'object' && input.groups !== null
      ? (input.groups as Record<string, unknown>)
      : {};
  const green = sanitizeGroupSnapshot(rawGroups.green, defaultGreen);
  const blue = sanitizeGroupSnapshot(rawGroups.blue, defaultBlue);
  const activeGroup =
    typeof input.activeGroup === 'string' && ALLOWED_GROUPS.has(input.activeGroup)
      ? (input.activeGroup as 'green' | 'blue' | 'red')
      : 'green';

  return {
    project: '${projectName}',
    mode: 'read-only',
    activeGroup,
    groups: { green, blue },
    entityType: typeof input.entityType === 'string' && input.entityType ? input.entityType : green.entityType,
    symbol: typeof input.symbol === 'string' && input.symbol ? input.symbol : green.symbol,
    timeframe: typeof input.timeframe === 'string' && input.timeframe ? input.timeframe : green.timeframe,
    sanitized: true,
  };
}

function readWorkspaceContextFromEnv(): SanitizedWorkspaceContext {
  const rawJson = process.env.MCP_WORKSPACE_CONTEXT_JSON;
  if (!rawJson) {
    return sanitizeWorkspaceContext(null);
  }
  try {
    return sanitizeWorkspaceContext(JSON.parse(rawJson));
  } catch {
    logStderr('Ignoring invalid MCP_WORKSPACE_CONTEXT_JSON payload');
    return sanitizeWorkspaceContext(null);
  }
}

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
  {
    uri: 'bds://${projectName}/lineage-citations',
    name: 'Verified Lineage Citations (BDS)',
    description: 'Read-only FundamentalLineageCitationSchema catalog with integer minor units.',
    mimeType: 'application/json',
    read: () => ({
      schema: 'FundamentalLineageCitationSchema',
      schemaVersion: '1.0.0',
      fields: [
        'accessionNumber',
        'metricCode',
        'valueMinor',
        'sourceByteOffset',
        'sourceByteLength',
      ],
      citations: [
        {
          accessionNumber: 'ACC-2026-0001',
          metricCode: 'SUBSCRIPTION_ARR_MINOR',
          valueMinor: 58800,
          sourceByteOffset: 128,
          sourceByteLength: 24,
        },
        {
          accessionNumber: 'ACC-2026-0002',
          metricCode: 'AGENT_RUN_COST_MINOR',
          valueMinor: 1250,
          sourceByteOffset: 512,
          sourceByteLength: 18,
        },
      ],
    }),
  },
  {
    uri: 'bds://${projectName}/active-workspace-context',
    name: 'Active Workspace Link Context (BDS)',
    description: 'Read-only PII-free snapshot of WidgetLinkBus state (groups, entityType, symbol, timeframe).',
    mimeType: 'application/json',
    read: () => readWorkspaceContextFromEnv() as unknown as Record<string, unknown>,
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

function buildAgentAppSource(projectName: string, projectTitle: string): string {
  return `import { useEffect, useState } from 'react';
import { AgentControlRoom, LinkedPanel } from '@ui-construction-library/core';
import type { FundamentalLineageCitation } from '@ui-construction-library/schema';
import { TerminalShell, buildLineageDatasetProps } from './components/TerminalShell';

export type AgentViewState = 'default' | 'loading' | 'empty' | 'error';

export interface AgentRunSummary {
  id: string;
  traceId: string;
  status: 'RUNNING' | 'COMPLETED' | 'AWAITING_APPROVAL';
  totalCostMicros: number;
  totalTokensUsed: number;
  citation: FundamentalLineageCitation;
}

const SAMPLE_RUNS: AgentRunSummary[] = [
  {
    id: 'RUN-001',
    traceId: 'trace-alpha-001',
    status: 'COMPLETED',
    totalCostMicros: 42000,
    totalTokensUsed: 18420,
    citation: {
      accessionNumber: 'ACC-RUN-001',
      metricCode: 'SUBTREE_COST_MICROS',
      valueMinor: 42,
      sourceByteOffset: 64,
      sourceByteLength: 19,
    },
  },
  {
    id: 'RUN-002',
    traceId: 'trace-alpha-002',
    status: 'AWAITING_APPROVAL',
    totalCostMicros: 15000,
    totalTokensUsed: 6200,
    citation: {
      accessionNumber: 'ACC-RUN-002',
      metricCode: 'NODE_DIFF_AUDIT',
      valueMinor: 15,
      sourceByteOffset: 240,
      sourceByteLength: 32,
    },
  },
];

export function formatMicrosLabel(costMicros: number): string {
  const safeMicros = BigInt(Math.trunc(costMicros));
  const cents = safeMicros / 10000n;
  const whole = cents / 100n;
  const remCents = (cents % 100n).toString().padStart(2, '0');
  return \`$\${whole.toString()}.\${remCents} (\${safeMicros.toString()} micros)\`;
}

export function App() {
  const [viewState, setViewState] = useState<AgentViewState>('default');
  const [selectedRunId, setSelectedRunId] = useState<string>(SAMPLE_RUNS[0]?.id ?? 'RUN-001');
  const [lastInspected, setLastInspected] = useState<FundamentalLineageCitation | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const runParam = params.get('runId');
      if (runParam && SAMPLE_RUNS.some((run) => run.id === runParam)) {
        setSelectedRunId(runParam);
      }
    }
  }, []);

  const activeRun = SAMPLE_RUNS.find((run) => run.id === selectedRunId) ?? SAMPLE_RUNS[0];

  return (
    <TerminalShell
      onInspectLineage={(citation) => setLastInspected(citation)}
      onExecuteMnemonic={(cmd) => {
        const match = SAMPLE_RUNS.find((run) => run.id === cmd.entity);
        if (match) {
          setSelectedRunId(match.id);
        }
      }}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-100">${projectTitle} Control Room</h1>
            <p className="text-xs text-slate-400">
              Project: ${projectName} — Green-linked run selector &amp; click-to-source node audit
            </p>
          </div>
          <fieldset aria-label="Workspace view state" className="flex items-center gap-2 border-0 p-0 m-0">
            {(['default', 'loading', 'empty', 'error'] as const).map((stateOption) => (
              <button
                key={stateOption}
                type="button"
                aria-pressed={viewState === stateOption}
                onClick={() => setViewState(stateOption)}
                className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-mono text-slate-200 hover:bg-slate-800"
              >
                {stateOption}
              </button>
            ))}
          </fieldset>
        </div>

        {viewState === 'loading' && (
          <section
            role="status"
            aria-busy="true"
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300"
          >
            Loading agent execution traces and CAS approval gates...
          </section>
        )}

        {viewState === 'empty' && (
          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center space-y-3">
            <p className="text-sm text-slate-300">No agent runs recorded in this workspace yet.</p>
            <button
              type="button"
              onClick={() => setViewState('default')}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
            >
              Load Sample Trace
            </button>
          </section>
        )}

        {viewState === 'error' && (
          <section
            role="alert"
            className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-6 flex items-center justify-between gap-4"
          >
            <p className="text-sm text-rose-200">
              Telemetry stream interrupted. Circuit breaker is isolating trace polling.
            </p>
            <button
              type="button"
              onClick={() => setViewState('default')}
              className="rounded-lg border border-rose-400/50 px-3 py-1.5 text-xs font-medium text-rose-100"
            >
              Retry Connection
            </button>
          </section>
        )}

        {viewState === 'default' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4">
              <LinkedPanel group="green" title="Agent Runs (Green Group)">
                <ul className="space-y-2" aria-label="Agent run list">
                  {SAMPLE_RUNS.map((run) => (
                    <li key={run.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRunId(run.id)}
                          aria-current={run.id === selectedRunId ? 'true' : undefined}
                          className="text-left font-mono text-xs font-semibold text-emerald-300 hover:underline"
                        >
                          {run.id} ({run.status})
                        </button>
                        <button
                          type="button"
                          {...buildLineageDatasetProps(run.citation)}
                          className="rounded border border-slate-700 px-2 py-0.5 text-[11px] font-mono text-slate-300 hover:bg-slate-800"
                        >
                          Audit Diff
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatMicrosLabel(run.totalCostMicros)} · {run.totalTokensUsed} tokens
                      </p>
                    </li>
                  ))}
                </ul>
              </LinkedPanel>
            </div>

            <div className="lg:col-span-8">
              <LinkedPanel group="green" title="Control Room &amp; Node Lineage">
                {activeRun ? (
                  <div className="space-y-3">
                    <AgentControlRoom runId={activeRun.id} />
                    {lastInspected && (
                      <p className="text-xs font-mono text-emerald-300">
                        Active lineage: {lastInspected.accessionNumber} ({lastInspected.metricCode})
                      </p>
                    )}
                  </div>
                ) : null}
              </LinkedPanel>
            </div>
          </div>
        )}
      </div>
    </TerminalShell>
  );
}

export default App;
`;
}

export function buildMcpPackageFiles(projectName: string): GeneratedFile[] {
  return [
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
  ];
}

export function generateAgentStack(
  projectName: string,
  options: GenerateAgentStackOptions = {},
): GeneratedFile[] {
  const projectTitle = options.projectTitle ?? projectName;
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
            '@ui-construction-library/tokens': version('uiLibraryTokens'),
            zod: version('zod'),
            react: version('react'),
            'react-dom': version('reactDom'),
          },
        },
        null,
        2,
      ),
    },
    {
      path: 'apps/web/src/components/TerminalShell.tsx',
      content: buildTerminalShellSource({
        projectName,
        projectTitle,
        useClientDirective: false,
        defaultGroup: 'green',
        defaultEntity: 'RUN-001',
        includeAgentMnemonics: true,
      }),
    },
    {
      path: 'apps/web/src/App.tsx',
      content: buildAgentAppSource(projectName, projectTitle),
    },
  ];

  if (options.includeMcp) {
    files.push(...buildMcpPackageFiles(projectName));
  }

  return files;
}

export async function generateAgent(cwd: string, answers: ProjectAnswers): Promise<void> {
  const files = generateAgentStack(answers.projectName, {
    includeMcp: Boolean(answers.includeMcp || answers.format === 'agent-mcp'),
    projectTitle: answers.projectTitle,
  });

  for (const file of files) {
    const targetPath = path.join(cwd, file.path);
    await fs.ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, file.content);
  }
}
