import { describe, it, expect } from 'vitest';
import { VERSIONS, version } from './versions.js';

describe('versions', () => {
  it('has all required version keys', () => {
    expect(VERSIONS.hono).toBe('^4.7.0');
    expect(VERSIONS.react).toBe('^19.1.0');
    expect(VERSIONS.vite).toBe('^8.0.0');
    expect(VERSIONS.typescript).toBe('^5.7.0');
    expect(VERSIONS.drizzleOrm).toBe('^0.44.0');
    expect(VERSIONS.tanstackQuery).toBe('^5.75.0');
  });

  it('version() returns correct value', () => {
    expect(version('hono')).toBe('^4.7.0');
    expect(version('react')).toBe('^19.1.0');
  });

  it('all versions are semver ranges', () => {
    for (const key of Object.keys(VERSIONS) as (keyof typeof VERSIONS)[]) {
      expect(VERSIONS[key]).toMatch(/^[\^~]/);
    }
  });

  it('contains backend dependencies', () => {
    expect(VERSIONS.express).toBeDefined();
    expect(VERSIONS.bcryptjs).toBeDefined();
    expect(VERSIONS.jose).toBeDefined();
  });

  it('contains frontend dependencies', () => {
    expect(VERSIONS.reactRouterDom).toBeDefined();
    expect(VERSIONS.vitePluginReact).toBeDefined();
    expect(VERSIONS.testingLibraryReact).toBeDefined();
  });

  it('contains bot dependencies', () => {
    expect(VERSIONS.tgwrapperCore).toBeDefined();
    expect(VERSIONS.tgwrapperRedis).toBeDefined();
  });

  it('contains dev dependencies', () => {
    expect(VERSIONS.biome).toBeDefined();
    expect(VERSIONS.turbo).toBeDefined();
    expect(VERSIONS.tsx).toBeDefined();
    expect(VERSIONS.vitest).toBeDefined();
  });

  it('version() works for all keys', () => {
    for (const key of Object.keys(VERSIONS) as (keyof typeof VERSIONS)[]) {
      expect(version(key)).toBe(VERSIONS[key]);
    }
  });
});
