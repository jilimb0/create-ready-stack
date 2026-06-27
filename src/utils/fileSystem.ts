import * as fs from 'fs-extra';

export function isDirectoryEmpty(dir: string): boolean {
  try {
    const files = fs.readdirSync(dir);
    const visibleFiles = files.filter((f) => !f.startsWith('.') || f === '.git');
    return visibleFiles.length === 0;
  } catch {
    return true;
  }
}
