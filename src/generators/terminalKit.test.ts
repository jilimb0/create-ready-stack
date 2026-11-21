import { describe, expect, it } from 'vitest';
import { buildTerminalShellSource } from './terminalKit.js';

describe('terminalKit', () => {
  it('generates TerminalShell with use client directive for Next.js SSR when enabled', () => {
    const source = buildTerminalShellSource({
      projectName: 'alpha-saas',
      projectTitle: 'Alpha SaaS',
      useClientDirective: true,
    });

    expect(source.startsWith("'use client';")).toBe(true);
    expect(source).toContain('WidgetLinkProvider');
    expect(source).toContain('syncUrl={true}');
    expect(source).toContain('CommandPalette');
    expect(source).toContain('SourceLineageDrawer');
    expect(source).toContain('FundamentalLineageCitation');
    expect(source).toContain("typeof window !== 'undefined'");
  });

  it('omits use client directive for Vite SPA when useClientDirective is false', () => {
    const source = buildTerminalShellSource({
      projectName: 'alpha-spa',
      projectTitle: 'Alpha SPA',
      useClientDirective: false,
    });

    expect(source.startsWith("'use client';")).toBe(false);
    expect(source).toContain('WidgetLinkProvider');
    expect(source).toContain('CommandPalette');
    expect(source).toContain('SourceLineageDrawer');
  });

  it('includes [Entity] [Mnemonic] command parser, hotkeys, data-lineage handler, and BigInt money formatter', () => {
    const source = buildTerminalShellSource({
      projectName: 'alpha-terminal',
      projectTitle: 'Alpha Terminal',
      useClientDirective: true,
      defaultGroup: 'green',
    });

    expect(source).toContain("'DES'");
    expect(source).toContain("'AUDIT'");
    expect(source).toContain("'LINEAGE'");
    expect(source).toContain("'STATUS'");
    expect(source).toContain('parseTerminalCommand');
    expect(source).toContain('split(/\\s+/)');
    expect(source).toContain("event.key === '/'");
    expect(source).toContain("event.key.toLowerCase() === 'k'");
    expect(source).toContain('data-lineage-accession');
    expect(source).toContain('onInspectLineage');
    expect(source).toContain('formatMinorUsd');
    expect(source).toContain('BigInt');
    expect(source).toContain('aria-keyshortcuts');
    expect(source).not.toContain(': any');
  });
});
