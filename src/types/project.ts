// TypeScript типы для ответов опросника

export interface ProjectAnswers {
  // Блок 1: Общие параметры
  projectName: string;      // slug
  projectTitle: string;     // title
  format: 'web' | 'bot' | 'web+bot';
  multiUser: boolean;
  useDocker: boolean;

  // Блок 2: Уровень 01 (Идея и контекст)
  problem: string;          // Проблема продукта
  targetAudience: string;   // ЦА
  mainScenario: string;     // Основной сценарий (1-3 шага)
  successCriteria: string;  // Что считается успехом v1
  metrics: string;          // Ключевые метрики на 3-6 месяцев
  timeBudget: string;       // Временной бюджет
  financialConstraints: string;  // Финансовые ограничения
  stackRequirements: string;     // Жёсткие требования по стеку
  integrations: string;     // Список интеграций (GitHub, GitLab, Telegram API, прочие)
  functionsV1: string;      // 3-7 ключевых функций v1
  hypotheses: string;       // 1-3 бизнес-гипотезы (H1-H3)
  risks: string;            // Основные риски
  criticalRisk: string;     // Самый критичный риск

  // Блок 3: Уровень 02
  coreDomain: string;       // Имя core-домена (например: repos, projects, tasks)
}

export interface GeneratedDomain {
  name: string;
  responsibility: string;
  entities: string[];
  useCases: string[];
}
