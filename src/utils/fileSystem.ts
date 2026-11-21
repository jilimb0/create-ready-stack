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

export function isSpecOnlyDirectory(dirPath: string): boolean {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    let markdownCount = 0;

    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === '.DS_Store') {
        continue;
      }
      if (entry.name.startsWith('.')) {
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        markdownCount++;
        continue;
      }
      return false;
    }

    return markdownCount > 0;
  } catch {
    return false;
  }
}
