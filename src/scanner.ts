import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { AUDIO_EXTENSIONS, VIDEO_EXTENSIONS } from './types.js';

function isAudioFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  return AUDIO_EXTENSIONS.includes(ext as (typeof AUDIO_EXTENSIONS)[number]);
}

function isVideoFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  return VIDEO_EXTENSIONS.includes(ext as (typeof VIDEO_EXTENSIONS)[number]);
}

function isConvertibleFile(filePath: string): boolean {
  return isAudioFile(filePath) || isVideoFile(filePath);
}

function isHidden(name: string): boolean {
  return name.startsWith('.');
}

export async function* scanDirectory(directory: string): AsyncGenerator<string> {
  const absoluteDir = path.resolve(directory);

  let entries;
  try {
    entries = await readdir(absoluteDir, { withFileTypes: true });
  } catch {
    // Skip directories we can't read (permissions, etc.)
    return;
  }

  for (const entry of entries) {
    // Skip hidden files/directories (., .., .Spotlight-V100, etc.)
    if (isHidden(entry.name)) {
      continue;
    }

    const fullPath = path.join(absoluteDir, entry.name);

    if (entry.isDirectory()) {
      yield* scanDirectory(fullPath);
    } else if (entry.isFile() && isConvertibleFile(entry.name)) {
      yield fullPath;
    }
  }
}

export async function collectAudioFiles(directory: string): Promise<string[]> {
  const files: string[] = [];

  for await (const file of scanDirectory(directory)) {
    files.push(file);
  }

  return files.sort();
}

export async function directoryExists(directory: string): Promise<boolean> {
  try {
    const stats = await stat(directory);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
