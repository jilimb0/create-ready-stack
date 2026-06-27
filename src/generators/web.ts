import fs from 'fs-extra';
import * as path from 'path';
import type { ProjectAnswers } from '../types/project.js';

export async function generateWeb(cwd: string, answers: ProjectAnswers) {
  const dir = path.join(cwd, 'web');
  await fs.ensureDir(path.join(dir, 'src'));
  await fs.ensureDir(path.join(dir, 'public'));

  const uilibDep = answers.useUILibrary
    ? ',\n    "@ui-construction-library/core": "^0.1.0"'
    : '';

  await fs.writeFile(path.join(dir, 'package.json'), `{
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
    "zod": "^3.24.0"${uilibDep}
  },
  "devDependencies": {
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^4.4.0",
    "typescript": "^5.7.0",
    "vite": "^8.0.0",
    "vitest": "^3.2.0",
    "@testing-library/react": "^16.3.0",
    "jsdom": "^26.0.0"
  }
}
`);

  await fs.writeFile(path.join(dir, 'index.html'), `<!doctype html>
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
`);

  await fs.writeFile(path.join(dir, 'src/main.tsx'), `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
`);

  await fs.writeFile(path.join(dir, 'src/App.tsx'), `import { Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

function Home() {
  return (
    <main>
      <h1>${answers.projectTitle}</h1>
      <p>Welcome to your new project.</p>
    </main>
  );
}

function Dashboard() {
  return <h1>Dashboard</h1>;
}
`);

  await fs.writeFile(path.join(dir, 'src/api.ts'), `const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(\`\${BASE}\${path}\`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(\`API error: \${res.status}\`);
  return res.json();
}
`);

  await fs.writeFile(path.join(dir, 'vite.config.ts'), `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } },
});
`);

  await fs.writeFile(path.join(dir, 'tsconfig.json'), JSON.stringify({
    extends: '../tsconfig.base.json',
    compilerOptions: { jsx: 'react-jsx', noEmit: true },
    include: ['src'],
    references: [{ path: './tsconfig.node.json' }],
  }, null, 2));

  await fs.writeFile(path.join(dir, 'tsconfig.node.json'), JSON.stringify({
    extends: '../tsconfig.base.json',
    compilerOptions: { noEmit: true },
    include: ['vite.config.ts'],
  }, null, 2));

  await fs.writeFile(path.join(dir, 'vitest.config.ts'), `import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { globals: true, environment: 'jsdom' },
});
`);

  await fs.writeFile(path.join(dir, 'src/App.test.tsx'), `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App', () => {
  it('renders project title', () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByText('${answers.projectTitle}')).toBeInTheDocument();
  });
});
`);

  await fs.writeFile(path.join(dir, 'Dockerfile'), `FROM node:26-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY . ./
RUN npm install
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`);
}
