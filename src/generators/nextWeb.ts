import * as path from 'node:path';
import fs from 'fs-extra';
import type { ProjectAnswers } from '../types/project.js';

export async function generateNextWeb(cwd: string, answers: ProjectAnswers) {
  const dir = path.join(cwd, 'web');
  await fs.ensureDir(path.join(dir, 'app', 'dashboard'));
  await fs.ensureDir(path.join(dir, 'app', 'login'));
  await fs.ensureDir(path.join(dir, 'app', 'register'));
  await fs.ensureDir(path.join(dir, 'components'));

  const uilibDep = answers.useUILibrary ? ',\n    "@ui-construction-library/core": "^0.5.0"' : '';
  const sentryDep = answers.useSentry
    ? ',\n    "@sentry/nextjs": "^9.0.0"'
    : '';
  const tailwindDeps = answers.useTailwind
    ? ',\n    "tailwindcss": "^4.1.0"'
    : '';

  await fs.writeFile(
    path.join(dir, 'package.json'),
    `{
  "name": "@${answers.projectName}/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "next": "^15.3.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@tanstack/react-query": "^5.75.0"${uilibDep}${sentryDep}
  },
  "devDependencies": {
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@types/node": "^26.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.2.0",
    "@testing-library/react": "^16.3.0",
    "@vitejs/plugin-react": "^4.4.0",
    "jsdom": "^26.0.0"${tailwindDeps}
  }
}
`,
  );

  await fs.writeFile(
    path.join(dir, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: '../tsconfig.base.json',
        compilerOptions: {
          jsx: 'preserve',
          noEmit: true,
          plugins: [{ name: 'next' }],
        },
        include: ['.'],
        exclude: ['node_modules'],
      },
      null,
      2,
    ),
  );

  await fs.writeFile(
    path.join(dir, 'next.config.ts'),
    `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Add your Next.js configuration here
};

export default nextConfig;
`,
  );

  await fs.writeFile(
    path.join(dir, 'app/layout.tsx'),
    `import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${answers.projectTitle}',
  description: '${answers.projectTitle} app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body${answers.useTailwind ? ' className="min-h-screen"' : ''}>{children}</body>
    </html>
  );
}
`,
  );

  await fs.writeFile(
    path.join(dir, 'app/page.tsx'),
    `export default function HomePage() {
  return (
    <main${answers.useTailwind ? ' className="min-h-screen flex flex-col items-center justify-center gap-4 p-8"' : ''}>
      <h1${answers.useTailwind ? ' className="text-4xl font-bold"' : ''}>${answers.projectTitle}</h1>
      <p${answers.useTailwind ? ' className="text-lg text-gray-600"' : ''}>Welcome to your new project.</p>
    </main>
  );
}
`,
  );

  await fs.writeFile(
    path.join(dir, 'app/dashboard/page.tsx'),
    `export default function DashboardPage() {
  return (
    <main${answers.useTailwind ? ' className="min-h-screen p-8"' : ''}>
      <h1${answers.useTailwind ? ' className="text-3xl font-bold"' : ''}>Dashboard</h1>
      <p${answers.useTailwind ? ' className="mt-4 text-gray-600"' : ''}>Dashboard placeholder for ${answers.projectTitle}.</p>
    </main>
  );
}
`,
  );

  await fs.writeFile(
    path.join(dir, 'app/login/page.tsx'),
    `export default function LoginPage() {
  return (
    <main${answers.useTailwind ? ' className="min-h-screen flex items-center justify-center p-8"' : ''}>
      <div${answers.useTailwind ? ' className="w-full max-w-md"' : ''}>
        <h1${answers.useTailwind ? ' className="text-3xl font-bold text-center"' : ''}>Login</h1>
        <p${answers.useTailwind ? ' className="mt-4 text-center text-gray-600"' : ''}>Sign in to your account</p>
        <form${answers.useTailwind ? ' className="mt-8 space-y-4"' : ''}>
          <input type="email" placeholder="Email"${answers.useTailwind ? ' className="w-full px-4 py-2 border rounded"' : ''} />
          <input type="password" placeholder="Password"${answers.useTailwind ? ' className="w-full px-4 py-2 border rounded"' : ''} />
          <button type="submit"${answers.useTailwind ? ' className="w-full px-4 py-2 bg-blue-600 text-white rounded"' : ''}>Login</button>
        </form>
        <p${answers.useTailwind ? ' className="mt-4 text-center text-sm text-gray-600"' : ''}>
          <a href="/register"${answers.useTailwind ? ' className="text-blue-600"' : ''}>Register instead</a>
        </p>
      </div>
    </main>
  );
}
`,
  );

  await fs.writeFile(
    path.join(dir, 'app/register/page.tsx'),
    `export default function RegisterPage() {
  return (
    <main${answers.useTailwind ? ' className="min-h-screen flex items-center justify-center p-8"' : ''}>
      <div${answers.useTailwind ? ' className="w-full max-w-md"' : ''}>
        <h1${answers.useTailwind ? ' className="text-3xl font-bold text-center"' : ''}>Register</h1>
        <p${answers.useTailwind ? ' className="mt-4 text-center text-gray-600"' : ''}>Create your account</p>
        <form${answers.useTailwind ? ' className="mt-8 space-y-4"' : ''}>
          <input type="text" placeholder="Name"${answers.useTailwind ? ' className="w-full px-4 py-2 border rounded"' : ''} />
          <input type="email" placeholder="Email"${answers.useTailwind ? ' className="w-full px-4 py-2 border rounded"' : ''} />
          <input type="password" placeholder="Password"${answers.useTailwind ? ' className="w-full px-4 py-2 border rounded"' : ''} />
          <button type="submit"${answers.useTailwind ? ' className="w-full px-4 py-2 bg-blue-600 text-white rounded"' : ''}>Register</button>
        </form>
        <p${answers.useTailwind ? ' className="mt-4 text-center text-sm text-gray-600"' : ''}>
          <a href="/login"${answers.useTailwind ? ' className="text-blue-600"' : ''}>Login instead</a>
        </p>
      </div>
    </main>
  );
}
`,
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
    path.join(dir, 'app/page.test.tsx'),
    `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

describe('HomePage', () => {
  it('renders project title', () => {
    render(<HomePage />);
    expect(screen.getByText('${answers.projectTitle}')).toBeInTheDocument();
  });

  it('renders welcome message', () => {
    render(<HomePage />);
    expect(screen.getByText('Welcome to your new project.')).toBeInTheDocument();
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

FROM node:26-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./
COPY --from=builder /app/public ./public
RUN npm install --production
EXPOSE 3001
CMD ["npm", "start"]
`,
  );

  await fs.writeFile(
    path.join(dir, '.dockerignore'),
    `node_modules
.next
dist
.git
*.md
`,
  );
}
