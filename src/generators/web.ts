import * as path from 'node:path';
import fs from 'fs-extra';
import { version } from '../config/versions.js';
import type { ProjectAnswers } from '../types/project.js';
import {
  buildEntityJsonLd,
  buildLlmsTxt,
  buildTerminalShellSource,
} from './terminalKit.js';

export async function generateWeb(cwd: string, answers: ProjectAnswers) {
  const dir = path.join(cwd, 'web');
  await fs.ensureDir(path.join(dir, 'src'));

  if (answers.useUILibrary) {
    await fs.ensureDir(path.join(dir, 'src', 'components'));
  }
  await fs.ensureDir(path.join(dir, 'public'));

  const dependencies: Record<string, string> = {
    react: version('react'),
    'react-dom': version('reactDom'),
    'react-router-dom': version('reactRouterDom'),
    '@tanstack/react-query': version('tanstackQuery'),
    zod: version('zod'),
  };
  if (answers.useUILibrary) {
    dependencies['@ui-construction-library/core'] = version('uiLibraryCore');
    dependencies['@ui-construction-library/schema'] = version('uiLibrarySchema');
    dependencies['@ui-construction-library/tokens'] = version('uiLibraryTokens');
  }
  if (answers.useSentry) {
    dependencies['@sentry/react'] = version('sentryReact');
  }

  const devDependencies: Record<string, string> = {
    '@types/react': version('@types/react'),
    '@types/react-dom': version('@types/react-dom'),
    '@vitejs/plugin-react': version('vitePluginReact'),
    typescript: version('typescript'),
    vite: version('vite'),
    vitest: version('vitest'),
    '@testing-library/react': version('testingLibraryReact'),
    jsdom: version('jsdom'),
  };
  if (answers.useTailwind) {
    devDependencies['@tailwindcss/vite'] = version('tailwindcssVite');
    devDependencies.tailwindcss = version('tailwindcss');
  }

  await fs.writeFile(
    path.join(dir, 'package.json'),
    `${JSON.stringify(
      {
        name: `@${answers.projectName}/web`,
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          preview: 'vite preview',
          typecheck: 'tsc --noEmit',
          test: 'vitest run',
          'test:watch': 'vitest',
        },
        dependencies,
        devDependencies,
      },
      null,
      2,
    )}\n`,
  );

  if (answers.useTailwind) {
    await fs.writeFile(
      path.join(dir, 'src', 'index.css'),
      `@import "tailwindcss";

:root {
  --color-primary: #3b82f6;
}
`,
    );
  }

  const entityJsonLd = JSON.stringify(
    buildEntityJsonLd({
      projectName: answers.projectName,
      projectTitle: answers.projectTitle,
      problem: answers.problem,
    }),
  );

  await fs.writeFile(
    path.join(dir, 'public', 'llms.txt'),
    buildLlmsTxt({
      projectName: answers.projectName,
      projectTitle: answers.projectTitle,
      problem: answers.problem,
      routes: ['/', '/dashboard'],
    }),
  );

  await fs.writeFile(
    path.join(dir, 'index.html'),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${answers.projectTitle}</title>
    <script type="application/ld+json">${entityJsonLd}</script>
  </head>
  <body>
    <noscript>
      <h1>${answers.projectTitle} (${answers.projectName})</h1>
      <p>${answers.projectTitle} (${answers.projectName}) is a web application for ${answers.problem}.</p>
      <nav aria-label="Primary routes">
        <a href="/">Home</a>
        <a href="/dashboard">Dashboard</a>
      </nav>
    </noscript>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  );

  const sentryImport = answers.useSentry
    ? `import * as Sentry from '@sentry/react';\n`
    : '';
  const sentryInit = answers.useSentry
    ? `\nSentry.init({\n  dsn: import.meta.env.VITE_SENTRY_DSN,\n  environment: import.meta.env.MODE,\n  sendDefaultPii: false,\n});\n`
    : '';

  await fs.writeFile(
    path.join(dir, 'src/main.tsx'),
    `${sentryImport}import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';${answers.useTailwind ? "\nimport './index.css';" : ''}
${sentryInit}const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
`,
  );

  const sentryWrapper = answers.useSentry ? 'Sentry.withProfiler(' : '';
  const sentryWrapperClose = answers.useSentry ? ')' : '';

  if (answers.useUILibrary) {
    await fs.writeFile(
      path.join(dir, 'src', 'components', 'TerminalShell.tsx'),
      buildTerminalShellSource({
        projectName: answers.projectName,
        projectTitle: answers.projectTitle,
        useClientDirective: false,
        defaultGroup: 'green',
        defaultEntity: answers.coreDomain.toUpperCase(),
      }),
    );

    await fs.writeFile(
      path.join(dir, 'src/App.tsx'),
      `import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LinkedPanel, WidgetLinkProvider } from '@ui-construction-library/core';
import type { FundamentalLineageCitation } from '@ui-construction-library/schema';
import {
  TerminalShell,
  buildLineageDatasetProps,
  formatMinorUsd,
} from './components/TerminalShell';

type DashboardViewState = 'default' | 'loading' | 'empty' | 'error';

const SAMPLE_CITATION: FundamentalLineageCitation = {
  accessionNumber: 'ACC-SPA-001',
  metricCode: 'CORE_VOLUME_MINOR',
  valueMinor: 25000,
  sourceByteOffset: 64,
  sourceByteLength: 20,
};

export default ${sentryWrapper}function App() {
  return (
    <WidgetLinkProvider syncUrl={true}>
      <TerminalShell withProvider={false}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </TerminalShell>
    </WidgetLinkProvider>
  );
}${sentryWrapperClose}

function Home() {
  const [count, setCount] = useState(0);

  return (
    <main${answers.useTailwind ? " className=\"min-h-screen flex flex-col items-center justify-center gap-4 p-8\"" : ''}>
      <h1${answers.useTailwind ? " className=\"text-4xl font-bold\"" : ''}>${answers.projectTitle}</h1>
      <p${answers.useTailwind ? " className=\"text-lg text-gray-400\"" : ''}>Welcome to your new project.</p>
      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        ${answers.useTailwind ? "className=\"rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600\"" : ''}
      >
        Count is {count}
      </button>
    </main>
  );
}

function Dashboard() {
  const [viewState, setViewState] = useState<DashboardViewState>('default');
  const [selectedSymbol, setSelectedSymbol] = useState('${answers.coreDomain.toUpperCase()}');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const symbolParam = params.get('symbol');
      if (symbolParam) {
        setSelectedSymbol(symbolParam);
      }
    }
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1${answers.useTailwind ? " className=\"text-2xl font-bold\"" : ''}>Dashboard</h1>
        <fieldset aria-label="Dashboard view state" className="flex items-center gap-2 border-0 p-0 m-0">
          {(['default', 'loading', 'empty', 'error'] as const).map((stateKey) => (
            <button
              key={stateKey}
              type="button"
              aria-pressed={viewState === stateKey}
              onClick={() => setViewState(stateKey)}
              className="rounded border border-slate-700 px-2.5 py-1 text-xs font-mono"
            >
              {stateKey}
            </button>
          ))}
        </fieldset>
      </div>

      {viewState === 'loading' && (
        <div role="status" aria-busy="true" className="rounded-lg border border-slate-800 p-4 text-sm">
          Loading ${answers.coreDomain} workspace...
        </div>
      )}

      {viewState === 'empty' && (
        <div className="rounded-lg border border-slate-800 p-4 text-sm space-y-2">
          <p>No ${answers.coreDomain} records available yet.</p>
          <button
            type="button"
            onClick={() => setViewState('default')}
            className="rounded bg-emerald-600 px-3 py-1 text-xs text-white"
          >
            Load Sample Data
          </button>
        </div>
      )}

      {viewState === 'error' && (
        <div role="alert" className="rounded-lg border border-rose-500/40 p-4 text-sm space-y-2">
          <p>Unable to load ${answers.coreDomain} telemetry.</p>
          <button
            type="button"
            onClick={() => setViewState('default')}
            className="rounded border border-rose-400 px-3 py-1 text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {viewState === 'default' && (
        <LinkedPanel group="green" title="Workspace Summary">
          <div className="flex items-center justify-between gap-4">
            <span className="font-mono text-xs">
              {selectedSymbol}: {formatMinorUsd(SAMPLE_CITATION.valueMinor)}
            </span>
            <button
              type="button"
              {...buildLineageDatasetProps(SAMPLE_CITATION)}
              className="rounded border border-emerald-500/40 px-3 py-1 text-xs font-mono text-emerald-300"
            >
              Inspect Source Lineage
            </button>
          </div>
        </LinkedPanel>
      )}
    </section>
  );
}
`,
    );
  } else {
    await fs.writeFile(
      path.join(dir, 'src/App.tsx'),
      `import { Routes, Route } from 'react-router-dom';
import { useState } from 'react';

export default ${sentryWrapper}function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}${sentryWrapperClose}

function Home() {
  const [count, setCount] = useState(0);

  return (
    <main${answers.useTailwind ? " className=\"min-h-screen flex flex-col items-center justify-center gap-4 p-8\"" : ''}>
      <h1${answers.useTailwind ? " className=\"text-4xl font-bold\"" : ''}>${answers.projectTitle}</h1>
      <p${answers.useTailwind ? " className=\"text-lg text-gray-600\"" : ''}>Welcome to your new project.</p>
      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        ${answers.useTailwind ? "className=\"rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600\"" : ''}
      >
        Count is {count}
      </button>
    </main>
  );
}

function Dashboard() {
  return <h1${answers.useTailwind ? " className=\"text-2xl font-bold p-4\"" : ''}>Dashboard</h1>;
}
`,
    );
  }

  await fs.writeFile(
    path.join(dir, 'src/api.ts'),
    `const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(\`\${BASE}\${path}\`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(\`API error: \${res.status}\`);
  return res.json();
}
`,
  );

  const tailwindPlugin = answers.useTailwind
    ? ",\n  tailwindcss()"
    : '';

  await fs.writeFile(
    path.join(dir, 'vite.config.ts'),
    `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';${answers.useTailwind ? "\nimport tailwindcss from '@tailwindcss/vite';" : ''}

export default defineConfig({
  plugins: [react()${tailwindPlugin}],
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } },
});
`,
  );

  await fs.writeFile(
    path.join(dir, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: '../tsconfig.base.json',
        compilerOptions: { jsx: 'react-jsx', noEmit: true },
        include: ['src'],
        references: [{ path: './tsconfig.node.json' }],
      },
      null,
      2,
    ),
  );

  await fs.writeFile(
    path.join(dir, 'tsconfig.node.json'),
    JSON.stringify(
      {
        extends: '../tsconfig.base.json',
        compilerOptions: { noEmit: true },
        include: ['vite.config.ts'],
      },
      null,
      2,
    ),
  );

  await fs.writeFile(
    path.join(dir, 'vitest.config.ts'),
    `import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { globals: true, environment: 'jsdom' },
});
`,
  );

  await fs.writeFile(
    path.join(dir, 'src/App.test.tsx'),
    `import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App', () => {
  it('renders project title', () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('${answers.projectTitle}')).toBeDefined();
  });

  it('renders welcome message', () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('Welcome to your new project.')).toBeDefined();
  });

  it('increments counter on button click', () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    const button = screen.getByRole('button', { name: /Count is/i });
    fireEvent.click(button);
    expect(screen.getByText('Count is 1')).toBeDefined();
  });
});
`,
  );

  await fs.writeFile(
    path.join(dir, 'Dockerfile'),
    `FROM node:26-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY . ./
RUN npm install
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`,
  );

  await fs.writeFile(
    path.join(dir, '.dockerignore'),
    `node_modules
dist
.git
*.md
`,
  );
}
