# create-ready-stack — План встраивания Terminal UX & Read-Only MCP в генератор проектов

> **Репозиторий:** `core-infra/create-ready-stack` (`--template web | web+bot | tma | saas | agent | agent-mcp`)  
> **Статус плана:** Пресеты `agent` / `agent-mcp` и headless `--agent --in-place` с `AGENTS.md`/`CLAUDE.md`/`AGENT_PROMPT.md` реализованы в v0.6.0 (`ADR-0003`, `ADR-0004`); требуется встроить из коробки Bloomberg/Koyfin UX-паттерны (`WidgetLinkProvider`, `CommandPalette`, `SourceLineageDrawer`) и стандартизированный каталог MCP-ресурсов (`bdp://`, `bdh://`, `bds://`) во все генерируемые шаблоны.  
> **Связанные активные ADR (строгие инварианты):**  
> - `ADR-0001`: детерминированная генерация монорепозитория без ошибок линтера и pre-write защита коллизий.  
> - `ADR-0002`: встроенный биллинг, Telegram Stars и вебхуки с идемпотентностью.  
> - `ADR-0003`: `--template agent` (Drizzle trace-схема, CAS approval, SSE, `AgentControlRoom`) — строго integer `costMicros`.  
> - `ADR-0004`: канонический AI launch prompt и headless `--agent --in-place`.

---

## 1. Текущая кодовая база (Verified Baseline)

1. **Конфигурация версий (`src/config/versions.ts`):**
   - `VERSIONS` хранит централизованную карту зависимостей (на текущий момент `uiLibraryCore: '^0.10.0'`, `uiLibrarySchema: '^0.10.0'`, `uiLibraryMotion: '^0.10.0'`, `zod: '^4.6.7'`, `drizzleOrm: '^0.44.0'`). В коде генераторов запрещено хардкодить версии вручную вне `version(...)`.
2. **Генератор агентов и MCP (`src/generators/agent.ts`):**
   - `generateAgentStack(projectName, { includeMcp })` генерирует `packages/db/src/agent-orchestration.schema.ts` (таблицы `agentRuns`, `agentNodes` с integer `costMicros`), UI-пакет с `@ui-construction-library/core` и `AgentControlRoom`, а при `agent-mcp` — read-only stdio сервер `packages/mcp/src/server.ts` (`buildMcpServerSource`) с тремя ресурсами `bdp://${projectName}/manifest`, `bdh://${projectName}/health`, `bds://${projectName}/schema` и `tools: []`.
3. **Генератор SaaS (`src/generators/saas.ts`):**
   - Создаёт Next.js 15 (`apps/web`), Drizzle PostgreSQL (`packages/db`), `PricingTable`, вебхуки Stripe & Paddle (при этом в `apps/web/package.json` сейчас указана строка `^0.9.0` для `@ui-construction-library/core` вместо `version('uiLibraryCore')` — требуется перевести на `version(...)`).
4. **Генератор SPA Web (`src/generators/web.ts`):**
   - Создаёт React 19 + Vite 8 + React Router 7 + TanStack Query 5, опционально подключает `@ui-construction-library/core`.

**Ключевой разрыв:**  
Каждый новый проект, сгенерированный через `create-ready-stack`, получает дизайн-систему и даже базовый `AgentControlRoom` / `stdio` MCP, но ещё не получает **терминальной архитектуры рабочего пространства из коробки** (цветовой линкинг виджетов `G/B/R`, командную палитру `[Entity] [Mnemonic]`, Click-to-Source `SourceLineageDrawer` и ресурс активного экранного контекста для AI-агента как в OpenBB Workspace).

---

## 2. Матрица инвариантов (Axes 1–8)

| Ось | Требование к генерируемым файлам `create-ready-stack` |
|---|---|
| **Axis 1 (Deterministic Generation)** | Все сгенерированные шаблоны проходят `tsc --noEmit` и `biome check` без ручных правок; версии пакетов берутся строго через `version('...')` из `src/config/versions.ts`. |
| **Axis 4 (Precision)** | Все финансовые и биллинговые/стоимостные поля в генерируемых Drizzle-схемах и Lineage-фикстурах используют исключительно `integer` / `bigint` minor units и `costMicros` (проходит проверку `docs-sync-check.mjs`). |
| **Axis 5 (Zero-Leakage & Read-Only MCP)** | В `buildMcpServerSource` сохраняются `tools: []`, `stderr`-only логирование (`console.error` / `process.stderr.write`) и фильтрация контекста рабочего экрана (экранный контекст содержит только ID сущностей/тикеры/выбранную группу, но НИКОГДА не передаёт секреты, токены или куки). |
| **Axis 6 & 7 (WAI-ARIA, SSR & 4 UI States)** | В `saas` (Next.js 15 SSR) клиентские терминальные обёртки помечены `"use client"` и защищены `typeof window !== 'undefined'`; шаблоны дашбордов содержат явные ветки `Loading`, `Empty`, `Error`, `Default`. |
| **Axis 8 (SEO/GEO)** | В `saas` и `web` генераторах сохраняется единый `JSON-LD (@graph)`, анкорное определение и `public/llms.txt`. |

---

## 3. Детальный пофазовый план реализации

### Фаза 1 — Out-of-the-Box Terminal Workspace UX в пресетах `agent`, `agent-mcp`, `saas` и `web`

**Целевые файлы:**
- `[MODIFY]` `src/config/versions.ts` (поднять `uiLibraryCore`, `uiLibrarySchema`, `uiLibraryMotion` до версии после публикации Фазы 1–4 в `UI-Library`)
- `[MODIFY]` `src/generators/agent.ts` и `src/generators/agent.test.ts`
- `[MODIFY]` `src/generators/saas.ts` и `src/generators/saas.test.ts`
- `[MODIFY]` `src/generators/web.ts` и `src/generators/web.test.ts`
- `[NEW]` `src/generators/terminalKit.ts` (общий генератор клиентского terminal shell для избежания дублирования кода между `agent.ts`, `saas.ts`, `web.ts`)

**Что генерирует `src/generators/terminalKit.ts` для целевых шаблонов:**
1. **`TerminalShell` компонент (в `apps/web/src/components/TerminalShell.tsx` или `apps/web/components/TerminalShell.tsx` с `"use client"` для Next.js 15 в `saas`):**
   - Оборачивает рабочую зону в `WidgetLinkProvider` (`syncUrl: true`).
   - Подключает глобальную `CommandPalette` (хоткей `/` и `Cmd+K`) с встроенным парсером команд `[Entity] [Mnemonic]` (`DES`, `AUDIT`, `LINEAGE`, `STATUS`).
   - Встраивает `SourceLineageDrawer` с демонстрационным/реальным обработчиком клика по метрикам (`data-lineage-*` или callback `onInspectLineage(citation: FundamentalLineageCitation)`).
2. **В `src/generators/saas.ts`:**
   - Заменить захардкоженные `@ui-construction-library/core: '^0.9.0'` и `@ui-construction-library/tokens: '^0.6.0'` на вызовы `version('uiLibraryCore')` и добавить токен-версию в `VERSIONS`.
   - Сгенерировать стартовый `apps/web/app/dashboard/page.tsx` (сейчас директория `app/dashboard` создаётся пустой в строке 10 `saas.ts`!) с двумя цвет-связанными (`Green` группа) панелями: список сущностей/подписок и панель `KPI + SourceLineageDrawer` для клик-аудита каждой транзакции/метрики в целых центах.
   - Сгенерировать `packages/db/src/schema.ts` с поддержкой `idempotencyKey` и integer `amountMinor` в биллинге/подписках.
3. **В `src/generators/agent.ts`:**
   - Добавить в UI-компонент `apps/web` для `--template agent` и `--template agent-mcp` единую связку: список прогонов (`LinkedPanel` `Green`) $\leftrightarrow$ `AgentControlRoom` (реактивное обновление при выборе `runId`) + `SourceLineageDrawer` для инспекции артефакта/диффа любого узла графа.

---

### Фаза 2 — Стандартизация Read-Only MCP (`bdp://`, `bdh://`, `bds://`) & Context-Aware Workspace State

Реализация концепции OpenBB / Massari из нашего аудита: AI-агент читает **текущий контекст экрана пользователя** через стандартный MCP-ресурс, не имея права на бесконтрольные мутации.

**Целевые файлы:**
- `[MODIFY]` `src/generators/agent.ts` (`buildMcpServerSource` и опциональная передача `includeMcp` для `saas`)
- `[MODIFY]` `src/commands/init.ts` (поддержка флага `--with-mcp` или автоподключение read-only MCP также в `saas` при выборе в визарде/флаге)
- `[MODIFY]` `src/generators/agent.test.ts`

**Расширение каталога ресурсов в генерируемом `packages/mcp/src/server.ts`:**
В дополнение к `bdp://${projectName}/manifest`, `bdh://${projectName}/health`, `bds://${projectName}/schema` добавить:
1. **`bds://${projectName}/lineage-citations`** — схема и точка чтения проверяемых цитат первоисточников (совместимых с `FundamentalLineageCitationSchema` из `@ui-construction-library/schema`: `accessionNumber`, `metricCode`, `valueMinor`, `sourceByteOffset`, `sourceByteLength`).
2. **`bds://${projectName}/active-workspace-context`** — чтение безопасного, очищенного от PII снимка активного состояния `WidgetLinkBus` (активные группы `green` / `blue`, выбранная `entityType`, `symbol`, `timeframe`), который клиент может синхронизировать с локальным dev-бэкендом или файловым сокетом для контекстного AI-копилота.
3. **Инвариант безопасности:** `tools/list` в генерируемом сервере строго возвращает `{ tools: [] }`, любые нераспознанные методы возвращают JSON-RPC `-32601`, диагностика пишется только через `logStderr` в `process.stderr`.

---

## 4. Детальный TDD-план (Red $\rightarrow$ Green $\rightarrow$ Refactor)

1. **`src/generators/agent.test.ts` (Vitest):**
   - `generateAgentStack('demo-app', { includeMcp: true })` генерирует 5+ файлов, включая `TerminalShell`, `packages/mcp/src/server.ts` и валидные `bds://demo-app/lineage-citations` + `bds://demo-app/active-workspace-context`.
   - Сгенерированный MCP-сервер в тесте обрабатывает JSON-RPC `resources/list` (все 5 URI присутствуют), `resources/read` на новый URI возвращает `200`-валидный JSON с `valueMinor`, а `tools/list` строго возвращает `{ tools: [] }`.
   - В сгенерированной Drizzle-схеме отсутствуют float `cost_usd` (строго `totalCostMicros`, `selfCostMicros`).
2. **`src/generators/saas.test.ts` (Vitest):**
   - `generateSaas(...)` создаёт непустой `apps/web/app/dashboard/page.tsx` с `"use client"`, `WidgetLinkProvider` и обработчиками состояний `Loading / Empty / Error / Default`.
   - В сгенерированном `apps/web/package.json` нет захардкоженной версии `@ui-construction-library/core` — используется значение из `VERSIONS`.
3. **`src/generators/web.test.ts`:**
   - При `answers.useUILibrary === true` сгенерированный SPA включает `CommandPalette` и `WidgetLinkProvider`.

---

## 5. Команды верификации

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm check
pnpm build
```
После завершения — обновить `.ai/ARCHITECTURE.md` индексом нового ADR `0005-terminal-ux-and-mcp-context-scaffolding.md` (контролируя порог `.ai/*.md <= 15 KB`) и прогнать smoke-проверку генерации с последующим `tsc --noEmit` внутри тестового output.
