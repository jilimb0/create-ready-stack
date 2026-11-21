// See .ai/adr/0005-terminal-ux-and-mcp-context-scaffolding.md
export type TerminalMnemonic = 'DES' | 'AUDIT' | 'LINEAGE' | 'STATUS';

export interface BuildTerminalShellOptions {
  projectName: string;
  projectTitle: string;
  useClientDirective?: boolean;
  defaultGroup?: 'green' | 'blue' | 'red';
  defaultEntity?: string;
  includeAgentMnemonics?: boolean;
}

export interface SeoArtifactOptions {
  projectName: string;
  projectTitle: string;
  problem: string;
  routes?: string[];
}

export function buildTerminalShellSource(options: BuildTerminalShellOptions): string {
  const clientHeader = options.useClientDirective ? "'use client';\n\n" : '';
  const defaultGroup = options.defaultGroup ?? 'green';
  const defaultEntity = (options.defaultEntity ?? 'MAIN').toUpperCase();
  const auditLabel = options.includeAgentMnemonics ? 'Inspect Run Audit Trail' : 'Audit Ledger';

  return `${clientHeader}import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CommandPalette,
  SourceLineageDrawer,
  WidgetLinkProvider,
} from '@ui-construction-library/core';
import type { FundamentalLineageCitation } from '@ui-construction-library/schema';

export const TERMINAL_MNEMONICS = ['DES', 'AUDIT', 'LINEAGE', 'STATUS'] as const;
export type TerminalMnemonic = (typeof TERMINAL_MNEMONICS)[number];

export interface ParsedTerminalCommand {
  entity: string;
  mnemonic: TerminalMnemonic;
}

export function parseTerminalCommand(raw: string): ParsedTerminalCommand | null {
  const parts = raw.trim().split(/\\s+/).filter(Boolean);
  if (parts.length < 2) {
    return null;
  }
  const candidateMnemonic = parts[parts.length - 1]?.toUpperCase();
  if (!TERMINAL_MNEMONICS.includes(candidateMnemonic as TerminalMnemonic)) {
    return null;
  }
  const entity = parts.slice(0, -1).join(' ').toUpperCase();
  if (!entity) {
    return null;
  }
  return {
    entity,
    mnemonic: candidateMnemonic as TerminalMnemonic,
  };
}

export function formatMinorUsd(amountMinor: number): string {
  const safeMinor = BigInt(Math.trunc(amountMinor));
  const sign = safeMinor < 0n ? '-' : '';
  const absMinor = safeMinor < 0n ? -safeMinor : safeMinor;
  const whole = absMinor / 100n;
  const cents = (absMinor % 100n).toString().padStart(2, '0');
  return \`\${sign}$\${whole.toString()}.\${cents}\`;
}

export function buildLineageDatasetProps(citation: FundamentalLineageCitation): Record<string, string | number> {
  return {
    'data-lineage-accession': citation.accessionNumber,
    'data-lineage-metric': citation.metricCode,
    'data-lineage-value-minor': citation.valueMinor,
    'data-lineage-byte-offset': citation.sourceByteOffset,
    'data-lineage-byte-length': citation.sourceByteLength,
  };
}

export interface TerminalShellProps {
  children: ReactNode;
  withProvider?: boolean;
  onInspectLineage?: (citation: FundamentalLineageCitation) => void;
  onExecuteMnemonic?: (command: ParsedTerminalCommand) => void;
}

export function TerminalShell({
  children,
  withProvider = true,
  onInspectLineage,
  onExecuteMnemonic,
}: TerminalShellProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [activeEntity, setActiveEntity] = useState('${defaultEntity}');
  const [activeMnemonic, setActiveMnemonic] = useState<TerminalMnemonic>('DES');
  const [selectedCitation, setSelectedCitation] = useState<FundamentalLineageCitation | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const inspectCitation = useCallback(
    (citation: FundamentalLineageCitation) => {
      setSelectedCitation(citation);
      onInspectLineage?.(citation);
    },
    [onInspectLineage],
  );

  const runCommand = useCallback(
    (parsed: ParsedTerminalCommand) => {
      setActiveEntity(parsed.entity);
      setActiveMnemonic(parsed.mnemonic);
      setPaletteOpen(false);
      onExecuteMnemonic?.(parsed);
    },
    [onExecuteMnemonic],
  );

  const paletteCommands = useMemo(
    () => [
      {
        id: 'cmd-des',
        label: \`\${activeEntity} DES — Entity Summary\`,
        mnemonic: 'DES' as const,
        group: '${defaultGroup}',
        onSelect: () => runCommand({ entity: activeEntity, mnemonic: 'DES' }),
      },
      {
        id: 'cmd-audit',
        label: \`\${activeEntity} AUDIT — ${auditLabel}\`,
        mnemonic: 'AUDIT' as const,
        group: '${defaultGroup}',
        onSelect: () => runCommand({ entity: activeEntity, mnemonic: 'AUDIT' }),
      },
      {
        id: 'cmd-lineage',
        label: \`\${activeEntity} LINEAGE — Source Citation Drawer\`,
        mnemonic: 'LINEAGE' as const,
        group: '${defaultGroup}',
        onSelect: () => runCommand({ entity: activeEntity, mnemonic: 'LINEAGE' }),
      },
      {
        id: 'cmd-status',
        label: \`\${activeEntity} STATUS — Runtime Health & Link Bus\`,
        mnemonic: 'STATUS' as const,
        group: '${defaultGroup}',
        onSelect: () => runCommand({ entity: activeEntity, mnemonic: 'STATUS' }),
      },
    ],
    [activeEntity, runCommand],
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleKeyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        const tagName = target?.tagName ?? '';
        const isEditable =
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT' ||
          Boolean(target?.isContentEditable);

        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          setPaletteOpen((prev) => !prev);
          return;
        }

        if (!isEditable && event.key === '/') {
          event.preventDefault();
          setPaletteOpen(true);
          return;
        }

        if (event.key === 'Escape') {
          setPaletteOpen(false);
          setSelectedCitation(null);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && containerRef.current) {
      const container = containerRef.current;
      const handleContainerClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement | null;
        const node = target?.closest<HTMLElement>('[data-lineage-accession]');
        if (!node) {
          return;
        }

        const accessionNumber = node.getAttribute('data-lineage-accession') ?? '';
        const metricCode = node.getAttribute('data-lineage-metric') ?? '';
        const valueMinor = Number.parseInt(node.getAttribute('data-lineage-value-minor') ?? '', 10);
        const sourceByteOffset = Number.parseInt(
          node.getAttribute('data-lineage-byte-offset') ?? '',
          10,
        );
        const sourceByteLength = Number.parseInt(
          node.getAttribute('data-lineage-byte-length') ?? '',
          10,
        );

        if (
          !accessionNumber ||
          !metricCode ||
          !Number.isSafeInteger(valueMinor) ||
          !Number.isSafeInteger(sourceByteOffset) ||
          !Number.isSafeInteger(sourceByteLength)
        ) {
          return;
        }

        inspectCitation({
          accessionNumber,
          metricCode,
          valueMinor,
          sourceByteOffset,
          sourceByteLength,
        });
      };

      container.addEventListener('click', handleContainerClick);
      return () => container.removeEventListener('click', handleContainerClick);
    }
    return undefined;
  }, [inspectCitation]);

  const handleCommandSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseTerminalCommand(commandInput);
    if (parsed) {
      runCommand(parsed);
      setCommandInput('');
    }
  };

  const shellContent = (
    <div
      ref={containerRef}
      className="min-h-screen bg-[var(--ucl-bg,#0b0f19)] text-slate-100"
      data-terminal-project="${options.projectName}"
      data-terminal-group="${defaultGroup}"
    >
      <header
        role="toolbar"
        aria-label="${options.projectTitle} terminal workspace controls"
        className="border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-mono text-emerald-300 border border-emerald-500/30">
            GROUP: ${defaultGroup.toUpperCase()}
          </span>
          <span className="text-xs font-mono text-slate-300" aria-live="polite">
            {activeEntity} [{activeMnemonic}]
          </span>
        </div>

        <form onSubmit={handleCommandSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="${defaultEntity} AUDIT"
            aria-label="Terminal mnemonic command"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-100 placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-expanded={paletteOpen}
            aria-keyshortcuts="/ Control+k Meta+k"
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-mono text-slate-200 hover:bg-slate-700"
          >
            Command Palette (/ or Cmd+K)
          </button>
        </form>
      </header>

      <main className="mx-auto max-w-7xl p-4">{children}</main>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        commands={paletteCommands}
      />

      <SourceLineageDrawer
        citation={selectedCitation}
        open={selectedCitation !== null}
        onClose={() => setSelectedCitation(null)}
      />
    </div>
  );

  if (!withProvider) {
    return shellContent;
  }

  return <WidgetLinkProvider syncUrl={true}>{shellContent}</WidgetLinkProvider>;
}
`;
}

export function buildLlmsTxt(options: SeoArtifactOptions): string {
  const routes = options.routes ?? ['/', '/dashboard'];
  return `# ${options.projectTitle}

${options.projectTitle} (${options.projectName}) is a fullstack application for ${options.problem}.

## Routes
${routes.map((route) => `- ${route}`).join('\n')}
`;
}

export function buildEntityJsonLd(options: SeoArtifactOptions): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `#org-${options.projectName}`,
        name: options.projectTitle,
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `#app-${options.projectName}`,
        name: options.projectTitle,
        applicationCategory: 'DeveloperApplication',
        description: `${options.projectTitle} (${options.projectName}) is a web application for ${options.problem}.`,
      },
      {
        '@type': 'WebSite',
        '@id': `#site-${options.projectName}`,
        name: options.projectTitle,
      },
    ],
  };
}
