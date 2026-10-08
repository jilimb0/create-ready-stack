import * as path from 'node:path';
import fs from 'fs-extra';
import { version } from '../config/versions.js';
import type { ProjectAnswers } from '../types/project.js';

export async function generateTma(cwd: string, answers: ProjectAnswers) {
  // 1. TMA Frontend (Client: React 19 + Vite + Tailwind + @ui-construction-library/core)
  const clientDir = path.join(cwd, 'apps', 'tma-client');
  await fs.ensureDir(path.join(clientDir, 'src'));
  await fs.ensureDir(path.join(clientDir, 'public'));

  await fs.writeFile(
    path.join(clientDir, 'package.json'),
    JSON.stringify(
      {
        name: `@${answers.projectName}/tma-client`,
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: {
          dev: 'vite --port 5173',
          build: 'tsc && vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: version('react'),
          'react-dom': version('reactDom'),
          '@ui-construction-library/core': '^0.9.0',
          '@ui-construction-library/tokens': '^0.6.0',
        },
        devDependencies: {
          '@types/react': version('@types/react'),
          '@types/react-dom': version('@types/react-dom'),
          '@vitejs/plugin-react': version('vitePluginReact'),
          tailwindcss: version('tailwindcss'),
          typescript: version('typescript'),
          vite: version('vite'),
        },
      },
      null,
      2,
    ),
  );

  await fs.writeFile(
    path.join(clientDir, 'src/App.tsx'),
    `import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
        };
        openTelegramLink: (url: string) => void;
      };
    };
  }
}

export function App() {
  const [initData, setInitData] = useState<string>('');
  const [user, setUser] = useState<{ id: number; firstName: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      const raw = window.Telegram.WebApp.initData;
      setInitData(raw);

      if (raw) {
        // Authenticate with TMA Hono backend
        fetch('/api/me', {
          headers: { 'x-telegram-init-data': raw },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.user) setUser(data.user);
          })
          .catch(console.error);
      }
    }
  }, []);

  const handleBuyStars = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stars-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData,
        },
        body: JSON.stringify({ starsPrice: 50, title: '50 Stars Pass' }),
      });
      const data = await res.json();
      if (data.invoiceLink && window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink(data.invoiceLink);
      }
    } catch (err) {
      console.error('Invoice error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgba(18,21,31,0.95)] text-white p-4 flex flex-col justify-between">
      <header className="py-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#6C7BFF]">${answers.projectTitle}</h1>
        <p className="text-xs text-slate-400 mt-1">Telegram Mini App Starter</p>
      </header>

      <main className="space-y-4 my-auto">
        <div className="p-6 rounded-2xl bg-[rgba(18,21,31,0.75)] backdrop-blur-[16px] border border-[rgba(108,123,255,0.12)] shadow-lg">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6C7BFF] mb-2">Telegram User</h2>
          {user ? (
            <div>
              <div className="text-lg font-bold">{user.firstName}</div>
              <div className="text-xs text-slate-400">ID: {user.id}</div>
            </div>
          ) : (
            <div className="text-sm text-slate-400">
              {initData ? 'Validating initData with backend...' : 'Running outside Telegram WebApp environment'}
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-[rgba(18,21,31,0.75)] backdrop-blur-[16px] border border-[rgba(108,123,255,0.12)] space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6C7BFF]">Telegram Stars Payment</h2>
          <p className="text-xs text-slate-300">
            One-click Stars payment with pre-checkout validation powered by @tgwrapper/core.
          </p>
          <button
            type="button"
            onClick={handleBuyStars}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-medium text-sm bg-gradient-to-r from-[#6C7BFF] to-[#828FFF] text-white shadow-md hover:opacity-95 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Creating Invoice...' : 'Purchase for 50 Stars (XTR)'}
          </button>
        </div>
      </main>

      <footer className="text-center text-[10px] text-slate-500 py-2">
        Powered by create-ready-stack & @tgwrapper/core
      </footer>
    </div>
  );
}
`,
  );

  await fs.writeFile(
    path.join(clientDir, 'src/main.tsx'),
    `import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
  );

  await fs.writeFile(
    path.join(clientDir, 'src/index.css'),
    `@import "tailwindcss";

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #09090b;
}
`,
  );

  await fs.writeFile(
    path.join(clientDir, 'index.html'),
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <title>${answers.projectTitle} TMA</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  );

  // 2. TMA Backend (Hono 4 + @tgwrapper/core TMA validation + Stars)
  const serverDir = path.join(cwd, 'apps', 'tma-server');
  await fs.ensureDir(path.join(serverDir, 'src'));

  await fs.writeFile(
    path.join(serverDir, 'package.json'),
    JSON.stringify(
      {
        name: `@${answers.projectName}/tma-server`,
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: {
          dev: 'tsx watch src/index.ts',
          build: 'tsc',
          start: 'node dist/index.js',
        },
        dependencies: {
          '@hono/node-server': version('honoNodeServer'),
          '@tgwrapper/core': '^0.20.0',
          hono: version('hono'),
        },
        devDependencies: {
          '@types/node': version('@types/node'),
          tsx: version('tsx'),
          typescript: version('typescript'),
        },
      },
      null,
      2,
    ),
  );

  await fs.writeFile(
    path.join(serverDir, 'src/index.ts'),
    `import { serve } from '@hono/node-server';
import { ApiClient, createStarsInvoiceLink, tmaHonoMiddleware } from '@tgwrapper/core';
import { Hono } from 'hono';

const botToken = process.env.BOT_TOKEN || 'dummy_token';
const apiClient = new ApiClient({ token: botToken });

const app = new Hono();

// TMA Auth Middleware verifying HMAC-SHA256 signature
app.use('/api/*', tmaHonoMiddleware(botToken, { optional: false }));

app.get('/api/me', (c) => {
  const user = c.get('telegramUser');
  return c.json({ ok: true, user });
});

app.post('/api/stars-invoice', async (c) => {
  const body = await c.req.json();
  const user = c.get('telegramUser') as { id: number; firstName: string } | undefined;

  try {
    const invoiceLink = await createStarsInvoiceLink(apiClient, {
      title: body.title || 'Stars Item',
      description: 'Telegram Stars purchase in TMA',
      starsPrice: body.starsPrice || 50,
      payload: \`order_\${user?.id ?? 'guest'}_\${Date.now()}\`,
    });
    return c.json({ ok: true, invoiceLink });
  } catch (err) {
    return c.json({ ok: false, error: (err as Error).message }, 500);
  }
});

const port = Number(process.env.PORT) || 3000;
console.log(\`TMA Backend listening on http://localhost:\${port}\`);
serve({ fetch: app.fetch, port });
`,
  );

  // 3. Local Tunneling Script for Testing in Telegram (scripts/tunnel.sh)
  await fs.ensureDir(path.join(cwd, 'scripts'));
  await fs.writeFile(
    path.join(cwd, 'scripts', 'tunnel.sh'),
    `#!/usr/bin/env bash
set -euo pipefail

echo "============================================="
echo " Starting local tunnel for Telegram Mini App "
echo "============================================="

if command -v cloudflared &> /dev/null; then
  echo "Using Cloudflare Tunnel..."
  cloudflared tunnel --url http://localhost:5173
elif command -v ngrok &> /dev/null; then
  echo "Using ngrok..."
  ngrok http 5173
else
  echo "Neither cloudflared nor ngrok found in PATH."
  echo "Install cloudflared: brew install cloudflared"
  echo "or ngrok: brew install ngrok"
  exit 1
fi
`,
  );
  await fs.chmod(path.join(cwd, 'scripts', 'tunnel.sh'), 0o755);
}
