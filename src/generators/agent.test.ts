import { describe, expect, it } from 'vitest';
import { VERSIONS } from '../config/versions.js';
import { generateAgentStack } from './agent.js';

describe('create-ready-stack agent generator', () => {
  it('generates agent Drizzle schema and web package.json with aligned versions', () => {
    const files = generateAgentStack('my-agent-platform');
    expect(files.length).toBeGreaterThanOrEqual(2);

    const schemaFile = files.find((f) => f.path.includes('agent-orchestration.schema.ts'));
    expect(schemaFile).toBeDefined();
    expect(schemaFile?.content).toContain('agentRuns');
    expect(schemaFile?.content).toContain('totalCostMicros');

    const pkgFile = files.find((f) => f.path.includes('apps/web/package.json'));
    expect(pkgFile).toBeDefined();
    const pkg = JSON.parse(pkgFile?.content ?? '{}') as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies['@ui-construction-library/core']).toBe(VERSIONS.uiLibraryCore);
    expect(pkg.dependencies['@ui-construction-library/schema']).toBe(VERSIONS.uiLibrarySchema);
    expect(pkg.dependencies['@ui-construction-library/motion']).toBe(VERSIONS.uiLibraryMotion);
    expect(pkg.dependencies.zod).toBe(VERSIONS.zod);
    expect(pkg.dependencies.react).toBe(VERSIONS.react);
    expect(pkg.dependencies['react-dom']).toBe(VERSIONS.reactDom);
  });

  it('generates read-only MCP 2024-11-05 stdio server and UDPA gate workflow when includeMcp is true', () => {
    const files = generateAgentStack('my-agent-mcp', { includeMcp: true });

    const mcpServerFile = files.find((f) => f.path === 'packages/mcp/src/server.ts');
    expect(mcpServerFile).toBeDefined();
    expect(mcpServerFile?.content).toContain('2024-11-05');
    expect(mcpServerFile?.content).toContain('bdp://');
    expect(mcpServerFile?.content).toContain('bdh://');
    expect(mcpServerFile?.content).toContain('bds://');
    expect(mcpServerFile?.content).toContain('process.stderr');
    expect(mcpServerFile?.content).toContain('resources/list');
    expect(mcpServerFile?.content).toContain('resources/read');
    expect(mcpServerFile?.content).not.toContain('console.log(');

    const udpaGateFile = files.find((f) => f.path === '.github/workflows/udpa-gate.yml');
    expect(udpaGateFile).toBeDefined();
    expect(udpaGateFile?.content).toContain('uses: jilimb0/udpa-engine@v1');
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
