export const VERSIONS = {
  // Backend frameworks
  hono: '^4.7.0',
  honoNodeServer: '^1.14.0',
  express: '^5.2.0',

  // ORMs
  drizzleOrm: '^0.44.0',
  drizzleKit: '^0.31.0',
  postgres: '^3.4.0',
  prismaClient: '^5.22.0',
  prisma: '^5.22.0',

  // Validation
  zod: '^3.24.0',

  // Auth
  bcryptjs: '^2.4.3',
  jose: '^5.9.0',

  // Dev deps
  typescript: '^5.7.0',
  tsx: '^4.19.0',
  vitest: '^3.2.0',
  turbo: '^2.9.0',
  biome: '^2.4.0',
  '@types/node': '^26.0.0',
  '@types/express': '^5.0.0',
  '@types/bcryptjs': '^2.4.0',

  // Frontend
  react: '^19.1.0',
  reactDom: '^19.1.0',
  reactRouterDom: '^7.5.0',
  tanstackQuery: '^5.75.0',
  vite: '^8.0.0',
  vitePluginReact: '^4.4.0',
  testingLibraryReact: '^16.3.0',
  jsdom: '^26.0.0',
  '@types/react': '^19.1.0',
  '@types/react-dom': '^19.1.0',

  // Bot
  tgwrapperCore: '^0.17.0',
  tgwrapperRedis: '^0.8.0',

  // Root
  '@biomejs/biome': '^2.4.0',
} as const;

export type VersionKey = keyof typeof VERSIONS;

export function version(key: VersionKey): string {
  return VERSIONS[key];
}