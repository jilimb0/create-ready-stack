#!/usr/bin/env node

import fs from 'fs-extra';
import * as path from 'path';
import { ProjectAnswers } from '../types/project.js';

export async function generateDocs(cwd: string, answers: ProjectAnswers) {
  const docsBase = path.join(cwd, 'docs');

  // 1. Уровень 01 - Idea
  const ideaDir = path.join(docsBase, '01-idea');
  await fs.ensureDir(ideaDir);

  const briefContent = `# Brief - ${answers.projectTitle}

## Проблема
${answers.problem}

## ЦА (Target Audience)
${answers.targetAudience}

## Основной сценарий
${answers.mainScenario}

## Цели v1
${answers.successCriteria}

## Ключевые метрики (3-6 месяцев)
${answers.metrics}

## Временной бюджет
${answers.timeBudget}

## Финансовые ограничения
${answers.financialConstraints}

## Жёсткие требования
${answers.stackRequirements}

## Интеграции
${answers.integrations}

## Функции v1
${answers.functionsV1}

## Бизнес-гипотезы
${answers.hypotheses}

## Риски
${answers.risks}

## Критичный риск
${answers.criticalRisk}
`;
  await fs.writeFile(path.join(ideaDir, 'brief.md'), briefContent);

  const dod01 = `# Definition of Done - Уровень 01 (Идея и контекст)

## Критерии завершения уровня 01:
- [ ] brief.md заполнен с ответами на все вопросы
- [ ] Проблема продукта чётко описана
- [ ] ЦА определена
- [ ] Основной сценарий описан (1-3 шага)
- [ ] Успех v1 определён
- [ ] Метрики на 3-6 месяцев установлены
- [ ] Временный и финансовый бюджет оценены
- [ ] Требования по стеку зафиксированы
- [ ] Интеграции перечислены
- [ ] Функции v1 (3-7) описаны
- [ ] Гипотезы (H1-H3) сформулированы
- [ ] Риски оценены, критичный риск выделен
`;
  await fs.writeFile(path.join(ideaDir, 'dod.md'), dod01);

  // 2. Уровень 02 - Architecture
  const archDir = path.join(docsBase, '02-arch');
  await fs.ensureDir(archDir);

  const hasUsers = answers.multiUser;
  const domainsContent = `# Домены - Уровень 02 (Архитектура и дизайн)

## Core-домен: ${answers.coreDomain}

## Список доменов:

### auth
**Ответственность:** Управление аутентификацией и авторизацией
**Сущности:** User, Session, Token
**Use cases:** login, logout, register, refreshToken

### users
**Ответственность:** Управление профилями пользователей
**Сущности:** User, Profile
**Use cases:** getProfile, updateProfile

### ${answers.coreDomain}
**Ответственность:** Core-домен проекта
**Сущности:** ${answers.coreDomain}, ${answers.coreDomain}Item
**Use cases:** create${answers.coreDomain}, get${answers.coreDomain}, update${answers.coreDomain}, delete${answers.coreDomain}

### integrations
**Ответственность:** Интеграция с внешними сервисами
**Сущности:** Integration, IntegrationConfig
**Use cases:** connectIntegration, syncData

### activity
**Ответственность:** Логирование активности пользователей
**Сущности:** Activity, ActivityLog
**Use cases:** logActivity, getActivity

### analytics
**Ответственность:** Аналитика и метрики
**Сущности:** Metric, AnalyticsReport
**Use cases:** trackMetric, getAnalytics

### notes
**Ответственность:** Система заметок/документации
**Сущности:** Note, Document
**Use cases:** createNote, getNote, updateNote
`;
  await fs.writeFile(path.join(archDir, 'domains.md'), domainsContent);

  const flowsContent = `# Пользовательские и интеграционные потоки - Уровень 02

## Основной пользовательский поток

1. **Login** → Пользователь входит в систему
   - Вход по email/password или OAuth
   - Получение токена

2. **Dashboard** → Пользователь видит основную панель
   - Обзор статистики
   - Быстрые действия

3. **${answers.coreDomain}** → Работа с core-доменом
   - создание ${answers.coreDomain}
   - просмотр списка
   - редактирование
   - удаление

## Поток интеграций

1. **Подключение внешнего сервиса** → Пользователь подключает интеграцию
   - Выбор сервиса (GitHub, GitLab, Telegram)
   - Авторизация в сервисе
   - Сохранение config

2. **Синхронизация данных** → Система синхронизирует данные
   - Периодический pull данных
   - Обработка изменений
   - Сохранение в БД
`;
  await fs.writeFile(path.join(archDir, 'flows.md'), flowsContent);

  const dod02 = `# Definition of Done - Уровень 02 (Архитектура и дизайн)

## Критерии завершения уровня 02:
- [ ] domains.md заполнен со списком доменов
- [ ] Для каждого домена описана ответственность
- [ ] Сущности доменов перечислены
- [ ] Use cases для доменов описаны (черновик)
- [ ] flows.md содержит пользовательские потоки
- [ ] flows.md содержит интеграционные потоки
- [ ] Архитектура модульного монолита зафиксирована
`;
  await fs.writeFile(path.join(archDir, 'dod.md'), dod02);

  // 3. LEVELS.md
  const levelsContent = `# Методология разработки - Уровни 01-06

## Уровень 01 - Идея и контекст
**Артефакты:**
- docs/01-idea/brief.md - бриф с ответами на вопросы
- docs/01-idea/dod.md - Definition of Done

**Цель:** Чётко описать проблему, ЦА, сценарии, цели, функции v1

## Уровень 02 - Архитектура и дизайн
**Артефакты:**
- docs/02-arch/domains.md - список доменов, ответственность, сущности
- docs/02-arch/flows.md - пользовательские и интеграционные потоки
- docs/02-arch/dod.md - DoD уровня 02

**Цель:** Зафиксировать архитектуру модульного монолита, домены, use cases

## Уровень 03 - Реализация (каркас)
**Артефакты:**
- docs/03-impl/dod.md - DoD уровня 03
- docs/03-impl/commands.md - команды качества/релизов

**Стек:** backend (Node.js + Express + Prisma), web (Next.js + React), ORM (Prisma), БД (Postgres)

**Цель:** Создать skeleton репозитория без бизнес-логики

## Уровень 04 - Качество
**Артефакты:**
- docs/04-quality/task-dod.md - DoD для задачи
- docs/04-quality/feature-dod.md - DoD для фичи
- docs/04-quality/checklist-manual.md - ручной smoke-чеклист

**Стандарт:** Biome (линтер+форматтер), TypeScript strict, unit/интеграционные тесты

**Цель:** Настроить стандарт качества и команды проверки

## Уровень 05 - Релизы
**Артефакты:**
- docs/05-release/checklist.md - чеклист релиза
- docs/05-release/release-flow.md - пошаговый flow релиза
- CHANGELOG.md, VERSION

**Цель:** Настроить процесс релизов

## Уровень 06 - Деплой
**Артефакты:**
- docs/06-deploy/checklist.md - общий деплой-чеклист
- docs/06-deploy/deploy-vps-docker.md - деплой через Docker/Compose
- docs/06-deploy/deploy-vps-manual.md - деплой без Docker
- docker-compose.example.yml, Dockerfile.example

**База:** Деплой на VPS, Docker/Compose - дефолт

**Цель:** Настроить деплой
`;
  await fs.writeFile(path.join(docsBase, 'LEVELS.md'), levelsContent);

  // 4. Уровень 03 - Impl
  const implDir = path.join(docsBase, '03-impl');
  await fs.ensureDir(implDir);

  const dod03 = `# Definition of Done - Уровень 03 (Реализация)

## Критерии завершения уровня 03:
- [ ] Skeleton репозитория создан
- [ ] backend/ каркас Node.js + Prisma
- [ ] web/ минимальный Next.js проект
- [ ] bot/ (если выбран формат) минимальный entrypoint
- [ ] docs/ структура с LEVELS.md
- [ ] scripts/ заготовочные скрипты
- [ ] package.json с командами качества/релизов
- [ ] biome.json, tsconfig.base.json
- [ ] .github/workflows/ci.yml
`;
  await fs.writeFile(path.join(implDir, 'dod.md'), dod03);

  const commandsContent = `- Команды качества:
- \`pnpm lint\` - линтинг Biome
- \`pnpm lint:fix\` - линтинг с автофиксом
- \`pnpm typecheck\` - проверка типов
- \`pnpm test\` - запуск тестов
- \`pnpm check\` - lint + typecheck + test
- \`pnpm check:fix\` - lint:fix + typecheck + test
- \`pnpm validate\` - lint + typecheck + test + build

## Команды релизов:
- \`pnpm build\` - сборка проекта
- \`pnpm release:prep\` - validate перед релизом
- \`pnpm release:tag\` - хук для создания git tag
`;
  await fs.writeFile(path.join(implDir, 'commands.md'), commandsContent);

  // 5. Уровень 04 - Quality
  const qualityDir = path.join(docsBase, '04-quality');
  await fs.ensureDir(qualityDir);

  await fs.writeFile(path.join(qualityDir, 'task-dod.md'), `# Definition of Done - Задача

## Критерии завершения задачи:
- [ ] Код написан и соответствует стандартам
- [ ] TypeScript strict - без ошибок
- [ ] Biome lint - без ошибок
- [ ] Unit тесты написаны и проходят
- [ ] Интеграционные тесты (если нужны) написаны и проходят
- [ ] Код закоммичен
- [ ] Pull request создан
- [ ] Code review пройден
`);

  await fs.writeFile(path.join(qualityDir, 'feature-dod.md'), `# Definition of Done - Фича

## Критерии завершения фичи:
- [ ] Все задачи фичи завершены (DoD задачи пройден)
- [ ] Unit тесты покрытие >= 80%
- [ ] Интеграционные тесты проходят
- [ ] Smoke тесты (checklist-manual.md) пройдены
- [ ] Документация обновлена
- [ ] CHANGELOG обновлён
- [ ] Фича в master/main branch
`);

  await fs.writeFile(path.join(qualityDir, 'checklist-manual.md'), `# Ручной Smoke-чеклист

## Перед релизом пройти:
- [ ] Приложение запускается (pnpm dev)
- [ ] Login страница работает
- [ ] Dashboard страница работает
- [ ] Core-домен работает (create, read, update, delete)
- [ ] TypeScript typecheck проходит (pnpm typecheck)
- [ ] Lint проходит (pnpm lint)
- [ ] Тесты проходят (pnpm test)
- [ ] Build проходит (pnpm build)
`);

  // 6. Уровень 05 - Release
  const releaseDir = path.join(docsBase, '05-release');
  await fs.ensureDir(releaseDir);

  await fs.writeFile(path.join(releaseDir, 'checklist.md'), `# Чеклист релиза

## Перед release:prep:
- [ ] Все фичи завершены (DoD фичи пройден)
- [ ] Smoke тесты пройдены
- [ ] CHANGELOG обновлён
- [ ] VERSION обновлён

## После release:prep:
- [ ] pnpm validate проходит
- [ ] Git tag создан (release:tag)
- [ ] Релиз в npm/Vercel/другой платформе
`);

  await fs.writeFile(path.join(releaseDir, 'release-flow.md'), `# Flow релиза

1. **release:prep** → pnpm validate
   - lint + typecheck + test + build

2. **release:tag** → git tag v<VERSION>

3. **Publish** → Публикация в npm/Vercel

4. **CHANGELOG** → Обновить CHANGELOG.md
`);

  // 7. Уровень 06 - Deploy
  const deployDir = path.join(docsBase, '06-deploy');
  await fs.ensureDir(deployDir);

  await fs.writeFile(path.join(deployDir, 'checklist.md'), `# Деплой-чеклист

## Общие:
- [ ] RELEASE checklist пройден
- [ ] Docker images построены (если useDocker)
- [ ] VPS готов (SSH доступ, ports открыты)

## Docker/Compose:
- [ ] docker-compose.yml создан
- [ ] DB миграции выполнены
- [ ] Приложения запускаются

## Manual:
- [ ] Node.js установлен на VPS
- [ ] PM2/systemd настроен
- [ ] Postgres установлен
- [ ] Migrations выполнены
`);

  const dockerDeployContent = `# Деплой через Docker/Compose на VPS

## Шаги:
1. Скопировать docker-compose.yml на VPS
2. \`docker-compose up -d\`
3. \`docker-compose ps\` - проверить здоровье
4. \`docker-compose logs\` - посмотреть логи
5. DB миграции: \`docker-compose exec backend pnpm db:migrate\`
`;
  await fs.writeFile(path.join(deployDir, 'deploy-vps-docker.md'), dockerDeployContent);

  const manualDeployContent = `# Деплой без Docker на VPS

## Шаги:
1. Установить Node.js на VPS
2. Установить PM2: \`npm install -g pm2\`
3. Скопировать проект на VPS
4. \`pnpm install\`
5. \`pnpm build\`
6. DB миграции: \`pnpm db:migrate\`
7. \`pm2 start dist/server.js --name app\`
8. \`pm2 save\`
9. \`pm2 startup\` - настроить systemd
`;
  await fs.writeFile(path.join(deployDir, 'deploy-vps-manual.md'), manualDeployContent);

  console.log('   → docs/созданы');
}
