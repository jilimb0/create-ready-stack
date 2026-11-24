import os from 'node:os';
import path from 'node:path';
import * as fs from 'fs-extra';
import { afterEach, describe, expect, it } from 'vitest';
import { VERSIONS } from '../config/versions.js';
import type { ProjectAnswers } from '../types/project.js';
import { generateArchitectureBlueprint, writeArchitectureBlueprint } from './blueprint.js';

const tempDirs: string[] = [];

function baseAnswers(overrides: Partial<ProjectAnswers> = {}): ProjectAnswers {
  return {
    projectName: 'demo-saas',
    projectTitle: 'Demo SaaS',
    format: 'saas',
    frontend: 'nextjs',
    multiUser: true,
    useDocker: true,
    useTailwind: true,
    useSentry: false,
    backendFramework: 'hono',
    orm: 'drizzle',
    useUILibrary: true,
    includeBot: false,
    includeMcp: false,
    problem: 'Automate SaaS subscription billing',
    targetAudience: 'Developers',
    mainScenario: 'Sign up, configure plan, review metrics',
    successCriteria: 'All UDPA checks pass',
    metrics: 'MRR and retention',
    timeBudget: '1 week',
    financialConstraints: 'Serverless',
    stackRequirements: 'Node 24',
    integrations: 'Paddle, Stripe',
    functionsV1: 'Auth, Billing, Dashboard',
    hypotheses: 'Faster onboarding',
    risks: 'Webhook duplicates',
    criticalRisk: 'Double charge',
    coreDomain: 'subscriptions',
    jwtSecret: '0'.repeat(64),
    ...overrides,
  };
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      await fs.remove(dir);
    }
  }
});

describe('generateArchitectureBlueprint', () => {
  it('generates deterministic prd_blueprint floorplan with integer bps and VERSIONS alignment', () => {
    const a1 = generateArchitectureBlueprint(baseAnswers());
    const a2 = generateArchitectureBlueprint(baseAnswers());

    expect(a1.schemaTag).toBe('gavel/floorplan@1');
    expect(a1.mode).toBe('prd_blueprint');
    expect(a1.snapshotId).toMatch(/^[a-f0-9]{64}$/);
    expect(a1.snapshotId).toBe(a2.snapshotId);
    expect(Number.isInteger(a1.metrics.assignedFilesBps)).toBe(true);
    expect(Number.isInteger(a1.metrics.edgeResolutionCoverageBps)).toBe(true);
    expect(a1.metrics.aiLabelingCostMicroUsd).toBe('0');
    expect(a1.stackVersions.hono).toBe(VERSIONS.hono);
    expect(a1.stackVersions.zod).toBe(VERSIONS.zod);
    expect(a1.stackVersions.uiLibraryCore).toBe(VERSIONS.uiLibraryCore);
    expect(a1.openDecisions.map((d) => d.udpaAxis)).toEqual(
      expect.arrayContaining(['axis_1', 'axis_2', 'axis_3', 'axis_4', 'axis_5', 'axis_6']),
    );
  });

  it('adapts preset topology for tma, bot, agent, and agent-mcp presets', () => {
    const tma = generateArchitectureBlueprint(
      baseAnswers({ format: 'tma', frontend: 'vite-spa', includeBot: true }),
    );
    expect(
      tma.nodes.some((n) => n.kind === 'external' && n.technicalName === 'telegram_bot_api'),
    ).toBe(true);
    expect(tma.stackVersions.tgwrapperCore).toBe(VERSIONS.tgwrapperCore);

    const agentMcp = generateArchitectureBlueprint(
      baseAnswers({ format: 'agent-mcp', frontend: 'vite-spa', includeMcp: true }),
    );
    expect(
      agentMcp.nodes.some((n) => n.kind === 'endpoint' && n.technicalName.includes('mcp')),
    ).toBe(true);
    expect(agentMcp.edges.some((e) => e.kind === 'db_access')).toBe(true);
  });

  it('writes architecture-blueprint.json to disk cleanly', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'crs-bp-'));
    tempDirs.push(dir);
    const outPath = await writeArchitectureBlueprint(dir, baseAnswers());
    expect(outPath).toBe(path.join(dir, 'architecture-blueprint.json'));
    const written = (await fs.readJson(outPath)) as { mode: string; schemaTag: string };
    expect(written.schemaTag).toBe('gavel/floorplan@1');
    expect(written.mode).toBe('prd_blueprint');
  });
});
