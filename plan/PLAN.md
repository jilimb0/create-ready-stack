# create-ready-stack — План развития генератора production-стека студии

> **Мировой бенчмарк:** Create-T3-App / Turborepo / Nx  
> **Суть продукта:** CLI утилита для развертывания эталонного стартового стека на Node 24/26, Biome v2.5, Vitest, React 19 и строгом TypeScript.  
> **Текущий статус:** 30 TS файлов, 15 тестов, версия 0.4.0, 3 CI workflows.  
> **Главная миссия:** Служить конвейером студии, разворачивающим новый микросервис или продукт за 1 команду с предустановленными `UI-Library` и `TGWrapper`.

---

## 1. Технический бэклог: Целевые генераторы шаблонов

- [x] **Генератор `--template saas` (Micro-SaaS Starter):**
  - Архитектура: Next.js 15 App Router / React 19 + TypeScript Strict.
  - База данных: Drizzle ORM + PostgreSQL + Docker Compose для локальной БД.
  - Дизайн: предустановленный `@ui-construction-library/core` с токенами Dark Glassmorphism и готовым компонентом `PricingTable`.
  - Биллинг: готовый шаблон Paddle / Stripe с валидацией вебхуков и переключением тарифа в БД.
  - Качество: Biome v2.5, Vitest, GitHub Actions `ci.yml`.
- [x] **Генератор `--template tma` (Telegram Mini App Fullstack Starter):**
  - Клиент: React 19 + Vite + Tailwind + `@ui-construction-library/core` (mobile-ready).
  - Бэкенд: Hono / Node.js + `@tgwrapper/core` с модулем TMA валидации `initData` и Telegram Stars.
  - Готовый скрипт локального туннелирования для тестирования в Telegram (ngrok / Cloudflare Tunnel).
- [x] **Генератор `--template bot` (Production Telegram Bot):**
  - Шаблон бота на базе `@tgwrapper/core` с Redis-стейтом, circuit-breaker и graceful shutdown.

---

## 2. Модель монетизации и внешнего использования

* **CLI:** Бесплатно на npm (`npx create-ready-stack`).
* **Pro Enterprise Templates:** Платные лицензии на доступ к коммерческим шаблонам с готовым Stripe/Paddle биллингом ($79 разовая покупка).

---

## 3. Пошаговые спринты реализации

### Спринт 1: Разработка шаблона `--template tma`
- [x] Создать генератор `src/generators/tma.ts`
- [x] Включить связку клиента (React 19) и бэкенда с `@tgwrapper/core`
- [x] Добавить автоматические тесты генерации

### Спринт 2: Разработка шаблона `--template saas`
- [x] Создать генератор `src/generators/saas.ts`
- [x] Включить Drizzle ORM + PostgreSQL + UI-Library Glassmorphism + заглушку биллинга
- [x] Настроить автоматический CI/CD пайплайн в генерируемом проекте

### Спринт 3: Тестирование и релиз v0.5.0
- [x] Прогон тестов сборки и генерации шаблонов
- [ ] Обновление документации и публикация v0.5.0 на npm

