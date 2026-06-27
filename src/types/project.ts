export interface ProjectAnswers {
  projectName: string;
  projectTitle: string;
  format: 'web' | 'bot' | 'web+bot';
  multiUser: boolean;
  useDocker: boolean;
  backendFramework: 'hono' | 'express';
  orm: 'drizzle' | 'prisma';
  useUILibrary: boolean;
  includeBot: boolean;

  problem: string;
  targetAudience: string;
  mainScenario: string;
  successCriteria: string;
  metrics: string;
  timeBudget: string;
  financialConstraints: string;
  stackRequirements: string;
  integrations: string;
  functionsV1: string;
  hypotheses: string;
  risks: string;
  criticalRisk: string;

  coreDomain: string;
}

export interface GeneratedDomain {
  name: string;
  responsibility: string;
  entities: string[];
  useCases: string[];
}
