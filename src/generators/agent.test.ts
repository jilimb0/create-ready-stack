import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'fs-extra';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VERSIONS } from '../config/versions.js';
import { generateAgentStack } from './agent.js';

vi.mock('zod', () => {
  const stringSchema = () => ({
    min(minLen: number) {
      return {
        safeParse(val: unknown) {
          return typeof val === 'string' && val.length >= minLen
            ? { success: true as const, data: val }
            : { success: false as const };
        },
      };
    },
    safeParse(val: unknown) {
      return typeof val === 'string'
        ? { success: true as const, data: val }
        : { success: false as const };
    },
  });

  const literalSchema = (expected: string) => ({
    safeParse(val: unknown) {
      return val === expected ? { success: true as const, data: val } : { success: false as const };
    },
  });

  const numberSchema = () => ({
    safeParse(val: unknown) {
      return typeof val === 'number'
        ? { success: true as const, data: val }
        : { success: false as const };
    },
  });

  const unknownSchema = () => ({
    safeParse(val: unknown) {
      return { success: true as const, data: val };
    },
  });

  const recordSchema = () => ({
    safeParse(val: unknown) {
      return typeof val === 'object' && val !== null && !Array.isArray(val)
        ? { success: true as const, data: val as Record<string, unknown> }
        : { success: false as const };
    },
  });

  const unionSchema = (
    options: Array<{ safeParse: (v: unknown) => { success: boolean; data?: unknown } }>,
  ) => ({
    safeParse(val: unknown) {
      for (const opt of options) {
        const res = opt.safeParse(val);
        if (res.success) return res;
      }
      return { success: false as const };
    },
  });

  const makeOptional = (inner: {
    safeParse: (v: unknown) => { success: boolean; data?: unknown };
  }) => ({
    safeParse(val: unknown) {
      if (val === undefined) return { success: true as const, data: undefined };
      return inner.safeParse(val);
    },
  });

  const objectSchema = (
    shape: Record<
      string,
      { safeParse: (v: unknown) => { success: boolean; data?: unknown }; optional?: () => unknown }
    >,
  ) => ({
    safeParse(val: unknown) {
      if (typeof val !== 'object' || val === null) return { success: false as const };
      const input = val as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, field] of Object.entries(shape)) {
        const res = field.safeParse(input[k]);
        if (!res.success) return { success: false as const };
        out[k] = res.data;
      }
      return { success: true as const, data: out };
    },
  });

  const wrapWithOptional = <T extends object>(
    schema: T,
  ): T & { optional: () => ReturnType<typeof makeOptional> } =>
    Object.assign(schema, {
      optional: () =>
        makeOptional(
          schema as unknown as { safeParse: (v: unknown) => { success: boolean; data?: unknown } },
        ),
    });

  return {
    z: {
      object: (
        shape: Record<string, { safeParse: (v: unknown) => { success: boolean; data?: unknown } }>,
      ) => wrapWithOptional(objectSchema(shape)),
      literal: (val: string) => wrapWithOptional(literalSchema(val)),
      string: () => wrapWithOptional(stringSchema()),
      number: () => wrapWithOptional(numberSchema()),
      unknown: () => wrapWithOptional(unknownSchema()),
      record: () => wrapWithOptional(recordSchema()),
      union: (
        options: Array<{ safeParse: (v: unknown) => { success: boolean; data?: unknown } }>,
      ) => wrapWithOptional(unionSchema(options)),
    },
  };
});

const tempDirs: string[] = [];

afterEach(async () => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) await fs.remove(dir);
  }
});

describe('create-ready-stack agent generator', () => {
  it('generates agent Drizzle schema and web package.json with aligned versions', () => {
    const files = generateAgentStack('my-agent-platform');
    expect(files.length).toBeGreaterThanOrEqual(4);

    const schemaFile = files.find((f) => f.path.includes('agent-orchestration.schema.ts'));
    expect(schemaFile).toBeDefined();
    expect(schemaFile?.content).toContain('agentRuns');
    expect(schemaFile?.content).toContain('approvalGates');
    expect(schemaFile?.content).toContain('totalCostMicros');
    expect(schemaFile?.content).toContain('selfCostMicros');
    expect(schemaFile?.content).not.toContain('cost_usd');

    const apiFile = files.find((f) => f.path === 'apps/api/src/index.ts');
    expect(apiFile).toBeDefined();
    expect(apiFile?.content).toContain('/api/runs/:runId/traces/stream');
    expect(apiFile?.content).toContain('/api/gates/:gateId/decide');
    expect(apiFile?.content).toContain('expectedVersion');

    const pkgFile = files.find((f) => f.path.includes('apps/web/package.json'));
    expect(pkgFile).toBeDefined();
    const pkg = JSON.parse(pkgFile?.content ?? '{}') as {
      dependencies: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const versionValues = new Set<string>(Object.values(VERSIONS));
    for (const ver of Object.values(pkg.dependencies)) {
      expect(versionValues.has(ver)).toBe(true);
    }
    for (const ver of Object.values(pkg.devDependencies ?? {})) {
      expect(versionValues.has(ver)).toBe(true);
    }
    expect(pkg.dependencies['@ui-construction-library/core']).toBe(VERSIONS.uiLibraryCore);
    expect(pkg.dependencies['@ui-construction-library/schema']).toBe(VERSIONS.uiLibrarySchema);
    expect(pkg.dependencies['@ui-construction-library/motion']).toBe(VERSIONS.uiLibraryMotion);
    expect(pkg.dependencies['@ui-construction-library/tokens']).toBe(VERSIONS.uiLibraryTokens);
    expect(pkg.dependencies.zod).toBe(VERSIONS.zod);
    expect(pkg.dependencies.react).toBe(VERSIONS.react);
    expect(pkg.dependencies['react-dom']).toBe(VERSIONS.reactDom);
  });

  it('generates TerminalShell and reactive LinkedPanel <-> AgentControlRoom workspace with 4 UI states', () => {
    const files = generateAgentStack('demo-app', { includeMcp: true });
    expect(files.length).toBeGreaterThanOrEqual(5);

    const terminalShell = files.find((f) => f.path === 'apps/web/src/components/TerminalShell.tsx');
    expect(terminalShell).toBeDefined();
    expect(terminalShell?.content).toContain('WidgetLinkProvider');
    expect(terminalShell?.content).toContain('CommandPalette');
    expect(terminalShell?.content).toContain('SourceLineageDrawer');
    expect(terminalShell?.content).toContain('data-lineage-accession');

    const appFile = files.find((f) => f.path === 'apps/web/src/App.tsx');
    expect(appFile).toBeDefined();
    expect(appFile?.content).toContain('LinkedPanel');
    expect(appFile?.content).toContain('group="green"');
    expect(appFile?.content).toContain('AgentControlRoom');
    expect(appFile?.content).toContain('runId');
    expect(appFile?.content).toContain('buildLineageDatasetProps');
    expect(appFile?.content).toContain("'loading'");
    expect(appFile?.content).toContain("'empty'");
    expect(appFile?.content).toContain("'error'");
    expect(appFile?.content).toContain("'default'");
    expect(appFile?.content).toContain("typeof window !== 'undefined'");
  });

  it('generates read-only MCP 2024-11-05 stdio server and UDPA gate workflow when includeMcp is true', () => {
    const files = generateAgentStack('my-agent-mcp', { includeMcp: true });

    const mcpServerFile = files.find((f) => f.path === 'packages/mcp/src/server.ts');
    expect(mcpServerFile).toBeDefined();
    expect(mcpServerFile?.content).toContain('2024-11-05');
    expect(mcpServerFile?.content).toContain('bdp://my-agent-mcp/manifest');
    expect(mcpServerFile?.content).toContain('bdh://my-agent-mcp/health');
    expect(mcpServerFile?.content).toContain('bds://my-agent-mcp/schema');
    expect(mcpServerFile?.content).toContain('bds://my-agent-mcp/lineage-citations');
    expect(mcpServerFile?.content).toContain('bds://my-agent-mcp/active-workspace-context');
    expect(mcpServerFile?.content).toContain('process.stderr');
    expect(mcpServerFile?.content).toContain('resources/list');
    expect(mcpServerFile?.content).toContain('resources/read');
    expect(mcpServerFile?.content).not.toContain('console.log(');

    const udpaGateFile = files.find((f) => f.path === '.github/workflows/udpa-gate.yml');
    expect(udpaGateFile).toBeDefined();
    expect(udpaGateFile?.content).toContain('uses: jilimb0/udpa-engine@v1');
  });

  it('executes generated MCP server JSON-RPC handlers for all 5 URIs, valueMinor lineage, PII sanitization, and tools: []', async () => {
    const files = generateAgentStack('demo-app', { includeMcp: true });
    const mcpServerFile = files.find((f) => f.path === 'packages/mcp/src/server.ts');
    expect(mcpServerFile).toBeDefined();

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'crs-mcp-exec-'));
    tempDirs.push(tmpDir);
    const serverPath = path.join(tmpDir, 'server.ts');
    await fs.writeFile(serverPath, mcpServerFile?.content ?? '');

    const mod = (await import(pathToFileURL(serverPath).href)) as {
      handleMcpRequest: (raw: unknown) => Promise<{
        jsonrpc: string;
        id: string | number;
        result?: Record<string, unknown>;
        error?: { code: number; message: string };
      } | null>;
      sanitizeWorkspaceContext: (raw: unknown) => Record<string, unknown>;
    };

    const listRes = await mod.handleMcpRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'resources/list',
    });
    const resources = (listRes?.result?.resources ?? []) as Array<{ uri: string }>;
    const uris = resources.map((r) => r.uri);
    expect(uris).toEqual([
      'bdp://demo-app/manifest',
      'bdh://demo-app/health',
      'bds://demo-app/schema',
      'bds://demo-app/lineage-citations',
      'bds://demo-app/active-workspace-context',
    ]);

    const lineageRes = await mod.handleMcpRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'resources/read',
      params: { uri: 'bds://demo-app/lineage-citations' },
    });
    const lineageContents = (lineageRes?.result?.contents ?? []) as Array<{ text: string }>;
    const lineageJson = JSON.parse(lineageContents[0]?.text ?? '{}') as {
      citations: Array<{
        accessionNumber: string;
        metricCode: string;
        valueMinor: number;
        sourceByteOffset: number;
        sourceByteLength: number;
      }>;
    };
    expect(lineageJson.citations.length).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(lineageJson.citations[0]?.valueMinor)).toBe(true);
    expect(lineageJson.citations[0]?.accessionNumber).toBeDefined();
    expect(lineageJson.citations[0]?.metricCode).toBeDefined();
    expect(Number.isInteger(lineageJson.citations[0]?.sourceByteOffset)).toBe(true);
    expect(Number.isInteger(lineageJson.citations[0]?.sourceByteLength)).toBe(true);

    const ctxRes = await mod.handleMcpRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'resources/read',
      params: { uri: 'bds://demo-app/active-workspace-context' },
    });
    const ctxContents = (ctxRes?.result?.contents ?? []) as Array<{ text: string }>;
    const ctxJson = JSON.parse(ctxContents[0]?.text ?? '{}') as {
      activeGroup: string;
      groups: Record<string, unknown>;
      entityType: string;
      symbol: string;
      timeframe: string;
      sanitized: boolean;
    };
    expect(ctxJson.activeGroup).toBe('green');
    expect(ctxJson.groups).toHaveProperty('green');
    expect(ctxJson.groups).toHaveProperty('blue');
    expect(ctxJson.entityType).toBeDefined();
    expect(ctxJson.symbol).toBeDefined();
    expect(ctxJson.timeframe).toBeDefined();
    expect(ctxJson.sanitized).toBe(true);

    const sanitized = mod.sanitizeWorkspaceContext({
      activeGroup: 'blue',
      entityType: 'equity',
      symbol: 'NVDA',
      timeframe: '1D',
      token: 'secret-jwt',
      cookie: 'session=abc',
      apiKey: 'sk-live-123',
      email: 'user@example.com',
      authorization: 'Bearer xyz',
    });
    expect(sanitized.symbol).toBe('NVDA');
    expect(sanitized.activeGroup).toBe('blue');
    expect(sanitized.token).toBeUndefined();
    expect(sanitized.cookie).toBeUndefined();
    expect(sanitized.apiKey).toBeUndefined();
    expect(sanitized.email).toBeUndefined();
    expect(sanitized.authorization).toBeUndefined();

    const toolsListRes = await mod.handleMcpRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/list',
    });
    expect(toolsListRes?.result).toEqual({ tools: [] });

    const toolsCallRes = await mod.handleMcpRequest({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
    });
    expect(toolsCallRes?.error?.code).toBe(-32601);
  });

  it('uses dependency versions strictly from src/config/versions.ts in generated package.json files', () => {
    const files = generateAgentStack('my-agent-mcp', { includeMcp: true });
    const mcpPkgFile = files.find((f) => f.path === 'packages/mcp/package.json');
    expect(mcpPkgFile).toBeDefined();

    const mcpPkg = JSON.parse(mcpPkgFile?.content ?? '{}') as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const versionValues = new Set<string>(Object.values(VERSIONS));
    for (const ver of Object.values(mcpPkg.dependencies ?? {})) {
      expect(versionValues.has(ver)).toBe(true);
    }
    for (const ver of Object.values(mcpPkg.devDependencies ?? {})) {
      expect(versionValues.has(ver)).toBe(true);
    }
    expect(mcpPkg.dependencies?.zod).toBe(VERSIONS.zod);
    expect(mcpPkg.devDependencies?.typescript).toBe(VERSIONS.typescript);
    expect(mcpPkg.devDependencies?.vitest).toBe(VERSIONS.vitest);
    expect(mcpPkg.devDependencies?.['@types/node']).toBe(VERSIONS['@types/node']);
  });
});
