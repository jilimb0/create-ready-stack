#!/usr/bin/env node

import * as fs from 'fs-extra';
import * as path from 'path';

export function isDirectoryEmpty(dir: string): boolean {
  try {
    const files = fs.readdirSync(dir);
    // Ignore .git and hidden files
    const visibleFiles = files.filter(f => !f.startsWith('.') || f === '.git');
    return visibleFiles.length === 0;
  } catch {
    return true;
  }
}

export async function ensureDirectory(dir: string): Promise<void> {
  await fs.ensureDir(dir);
}

export async function copyFile(src: string, dest: string): Promise<void> {
  await fs.copy(src, dest);
}

export async function writeFile(dest: string, content: string): Promise<void> {
  await fs.writeFile(dest, content);
}
