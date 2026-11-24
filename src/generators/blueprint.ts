import crypto from 'node:crypto';
import * as path from 'node:path';
import * as fs from 'fs-extra';
import { VERSIONS } from '../config/versions.js';
import type { ProjectAnswers } from '../types/project.js';

export interface OpenDecision {
  readonly id: string;
  readonly udpaAxis: 'axis_1' | 'axis_2' | 'axis_3' | 'axis_4' | 'axis_5' | 'axis_6';
  readonly question: string;
  readonly recommendedDefault: string;
}

export interface BlueprintNode {
  readonly id: string;
  readonly repoId: string;
  readonly parentId: string | null;
  readonly kind: 'repo' | 'part' | 'screen' | 'endpoint' | 'file' | 'table' | 'external';
  readonly technicalName: string;
  readonly plainTitle: string;
  readonly plainSummary: string;
  readonly filePath: string | null;
  readonly httpMethod?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly httpRoute?: string;
  readonly changedInLastCommit: boolean;
  readonly findingCountCritical: number;
  readonly findingCountHigh: number;
}

export interface BlueprintEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly kind:
    | 'import'
    | 'http_call'
    | 'db_access'
    | 'event_emit'
    | 'external_call'
    | 'local_ipc';
  readonly isCrossRepo: boolean;
  readonly confidenceBps: number;
  readonly verifiedByContract: boolean;
}

export interface ArchitectureBlueprintArtifact {
  readonly schemaTag: 'gavel/floorplan@1';
  readonly mode: 'prd_blueprint';
  readonly snapshotId: string;
  readonly generatedAtIso: string;
  readonly repositories: ReadonlyArray<{
    readonly repoId: string;
    readonly commitSha: null;
    readonly framework: string;
  }>;
  readonly nodes: ReadonlyArray<BlueprintNode>;
  readonly edges: ReadonlyArray<BlueprintEdge>;
  readonly findings: ReadonlyArray<never>;
  readonly metrics: {
    readonly assignedFilesBps: number;
    readonly edgeResolutionCoverageBps: number;
    readonly unmatchedFrontendCallsCount: number;
    readonly aiLabelingCostMicroUsd: string;
    readonly scanDurationMs: number;
  };
  readonly openDecisions: ReadonlyArray<OpenDecision>;
  readonly stackVersions: typeof VERSIONS;
}

/**
 * Builds a deterministic PRD-to-Blueprint architecture topology before writing monorepo files.
 */
export function generateArchitectureBlueprint(
  answers: ProjectAnswers,
): ArchitectureBlueprintArtifact {
  const repoId = answers.projectName;
  const domain = answers.coreDomain || 'items';

  const nodes: BlueprintNode[] = [
    {
      id: `${repoId}:.#repo`,
      repoId,
      parentId: null,
      kind: 'repo',
      technicalName: repoId,
      plainTitle: answers.projectTitle,
      plainSummary: answers.problem,
      filePath: null,
      changedInLastCommit: false,
      findingCountCritical: 0,
      findingCountHigh: 0,
    },
    {
      id: `${repoId}:apps/web#screen:${domain}`,
      repoId,
      parentId: `${repoId}:.#repo`,
      kind: 'screen',
      technicalName:
        answers.frontend === 'nextjs' ? 'apps/web/app/page.tsx' : 'apps/web/src/App.tsx',
      plainTitle: `${answers.projectTitle} Screen`,
      plainSummary: `Primary UI surface (${answers.frontend}) for ${domain}`,
      filePath: answers.frontend === 'nextjs' ? 'apps/web/app/page.tsx' : 'apps/web/src/App.tsx',
      changedInLastCommit: false,
      findingCountCritical: 0,
      findingCountHigh: 0,
    },
    {
      id: `${repoId}:apps/api#GET:/api/${domain}`,
      repoId,
      parentId: `${repoId}:.#repo`,
      kind: 'endpoint',
      technicalName: `GET /api/${domain}`,
      plainTitle: `List ${domain}`,
      plainSummary: `Validated ${answers.backendFramework} endpoint with Zod contracts`,
      filePath: `apps/api/src/routes/${domain}.ts`,
      httpMethod: 'GET',
      httpRoute: `/api/${domain}`,
      changedInLastCommit: false,
      findingCountCritical: 0,
      findingCountHigh: 0,
    },
    {
      id: `${repoId}:apps/api#table:${domain}`,
      repoId,
      parentId: `${repoId}:.#repo`,
      kind: 'table',
      technicalName: domain,
      plainTitle: `${domain} table`,
      plainSummary: `Primary ${answers.orm} persistence model`,
      filePath: 'apps/api/src/db/schema.ts',
      changedInLastCommit: false,
      findingCountCritical: 0,
      findingCountHigh: 0,
    },
  ];

  const edges: BlueprintEdge[] = [
    {
      id: `http:${repoId}:screen->endpoint`,
      sourceNodeId: `${repoId}:apps/web#screen:${domain}`,
      targetNodeId: `${repoId}:apps/api#GET:/api/${domain}`,
      kind: 'http_call',
      isCrossRepo: false,
      confidenceBps: 10000,
      verifiedByContract: true,
    },
    {
      id: `db:${repoId}:endpoint->table`,
      sourceNodeId: `${repoId}:apps/api#GET:/api/${domain}`,
      targetNodeId: `${repoId}:apps/api#table:${domain}`,
      kind: 'db_access',
      isCrossRepo: false,
      confidenceBps: 10000,
      verifiedByContract: true,
    },
  ];

  if (answers.includeBot || answers.format === 'tma' || answers.format === 'bot') {
    const botExtId = `${repoId}:external#telegram_bot_api`;
    nodes.push({
      id: botExtId,
      repoId,
      parentId: `${repoId}:.#repo`,
      kind: 'external',
      technicalName: 'telegram_bot_api',
      plainTitle: 'Telegram Bot API',
      plainSummary: '@tgwrapper/core CAS sessions & Telegram Stars/webhook integration',
      filePath: 'apps/bot/src/index.ts',
      changedInLastCommit: false,
      findingCountCritical: 0,
      findingCountHigh: 0,
    });
    edges.push({
      id: `ext:${repoId}:api->telegram`,
      sourceNodeId: `${repoId}:apps/api#GET:/api/${domain}`,
      targetNodeId: botExtId,
      kind: 'external_call',
      isCrossRepo: false,
      confidenceBps: 10000,
      verifiedByContract: true,
    });
  }

  if (answers.includeMcp || answers.format === 'agent' || answers.format === 'agent-mcp') {
    const mcpNodeId = `${repoId}:packages/mcp#mcp:readonly`;
    nodes.push({
      id: mcpNodeId,
      repoId,
      parentId: `${repoId}:.#repo`,
      kind: 'endpoint',
      technicalName: 'stdio mcp / read-only resources',
      plainTitle: 'Read-Only MCP Server',
      plainSummary: 'PII-scrubbed stdio MCP server with stderr-only diagnostics',
      filePath: 'packages/mcp/src/server.ts',
      changedInLastCommit: false,
      findingCountCritical: 0,
      findingCountHigh: 0,
    });
    edges.push({
      id: `db:${repoId}:mcp->table`,
      sourceNodeId: mcpNodeId,
      targetNodeId: `${repoId}:apps/api#table:${domain}`,
      kind: 'db_access',
      isCrossRepo: false,
      confidenceBps: 10000,
      verifiedByContract: true,
    });
  }

  const openDecisions: OpenDecision[] = [
    {
      id: 'dec-axis-1',
      udpaAxis: 'axis_1',
      question: `How should ${domain} mutations enforce idempotency under retries?`,
      recommendedDefault: 'Require Idempotency-Key header backed by kv_store / Redis SET NX',
    },
    {
      id: 'dec-axis-2',
      udpaAxis: 'axis_2',
      question: 'Does v1 need offline client queueing or optimistic local cache?',
      recommendedDefault: 'Service Worker SWR + IndexedDB outbox with expectedVersion CAS',
    },
    {
      id: 'dec-axis-3',
      udpaAxis: 'axis_3',
      question: 'Which outbound integrations require CircuitBreaker and Full-Jitter backoff?',
      recommendedDefault: '3000ms connect / 8000ms response timeout, max 3 Full-Jitter retries',
    },
    {
      id: 'dec-axis-4',
      udpaAxis: 'axis_4',
      question: 'Are any monetary amounts, percentages, or scores computed?',
      recommendedDefault:
        'Strictly integer minor units (cents), bps (0..10000), or BigInt micro-USD',
    },
    {
      id: 'dec-axis-5',
      udpaAxis: 'axis_5',
      question: 'What PII or secrets enter logs, webhooks, or telemetry?',
      recommendedDefault:
        'Redact PII/tokens before logging; verify webhooks via crypto.timingSafeEqual',
    },
    {
      id: 'dec-axis-6',
      udpaAxis: 'axis_6',
      question: 'Which UI surfaces need WAI-ARIA landmarks and SSR window guards?',
      recommendedDefault:
        'Build on @ui-construction-library/core (--ucl-*) with typeof window !== "undefined"',
    },
  ];

  const repositories = [
    {
      repoId,
      commitSha: null,
      framework: answers.backendFramework,
    },
  ];

  const snapshotId = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        schemaTag: 'gavel/floorplan@1',
        mode: 'prd_blueprint',
        repositories,
        nodes,
        edges,
      }),
    )
    .digest('hex');

  return {
    schemaTag: 'gavel/floorplan@1',
    mode: 'prd_blueprint',
    snapshotId,
    generatedAtIso: new Date().toISOString(),
    repositories,
    nodes,
    edges,
    findings: [],
    metrics: {
      assignedFilesBps: 10000,
      edgeResolutionCoverageBps: 10000,
      unmatchedFrontendCallsCount: 0,
      aiLabelingCostMicroUsd: '0',
      scanDurationMs: 1,
    },
    openDecisions,
    stackVersions: VERSIONS,
  };
}

export async function writeArchitectureBlueprint(
  projectDir: string,
  answers: ProjectAnswers,
): Promise<string> {
  await fs.ensureDir(projectDir);
  const artifact = generateArchitectureBlueprint(answers);
  const outPath = path.join(projectDir, 'architecture-blueprint.json');
  await fs.writeJson(outPath, artifact, { spaces: 2 });
  return outPath;
}
