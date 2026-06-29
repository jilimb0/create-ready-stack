import * as path from 'node:path';
import fs from 'fs-extra';
import type { ProjectAnswers } from '../types/project.js';

export async function generateWeb(cwd: string, answers: ProjectAnswers) {
  const dir = path.join(cwd, 'web');
  await fs.ensureDir(path.join(dir, 'src'));

  if (answers.useTailwind) {
    await fs.ensureDir(path.join(dir, 'src'));
  }
  await fs.ensureDir(path.join(dir, 'public'));

  const uilibDep = answers.useUILibrary ? ',\n    "@ui-construction-library/core": "^0.1.0"' : '';
  const sentryDep = answers.useSentry
    ? ',\n    "@sentry/react": "^9.0.0"'
    : '';
  const tailwindDeps = answers.useTailwind
    ? ',\n    "@tailwindcss/vite": "^4.1.0",\n    "tailwindcss": "^4.1.0"'
    : '';

  await fs.writeFile(
    path.join(dir, 'package.json'),
    `{
  "name": "@${answers.projectName}/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.5.0",
    "@tanstack/react-query": "^5.75.0",
    "zod": "^3.24.0"${uilibDep}${sentryDep}
  },
  "devDependencies": {
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^4.4.0",
    "typescript": "^5.7.0",
    "vite": "^8.0.0",
    "vitest": "^3.2.0",
    "@testing-library/react": "^16.3.0",
    "jsdom": "^26.0.0"${tailwindDeps}
  }
}
`,
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

  await fs.writeFile(
    path.join(dir, 'index.html'),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${answers.projectTitle}</title>
  </head>
  <body>
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
    ? `\nSentry.init({\n  dsn: import.meta.env.VITE_SENTRY_DSN,\n  environment: import.meta.env.MODE,\n});\n`
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
    const button = screen.getByRole('button');
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
