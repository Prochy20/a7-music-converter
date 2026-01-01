import ffmpeg from 'fluent-ffmpeg';
import path from 'node:path';
import { rename, access } from 'node:fs/promises';
import { sanitizeFilename } from './sanitizer.js';

interface FfprobeFormat {
  tags?: Record<string, string>;
}

interface FfprobeData {
  format?: FfprobeFormat;
}

export interface RenameResult {
  newPath: string;
  renamed: boolean;
  reason?: string;
}

/**
 * Read artist and title tags from file using ffprobe
 */
function readTags(
  filePath: string
): Promise<{ artist?: string; title?: string }> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        resolve({});
        return;
      }

      const data = metadata as FfprobeData;
      const tags = data.format?.tags;

      if (!tags) {
        resolve({});
        return;
      }

      // Tags can be lowercase or uppercase depending on source
      resolve({
        artist: tags.artist || tags.ARTIST,
        title: tags.title || tags.TITLE,
      });
    });
  });
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rename a file based on its ID3 tags to "Artist - Title.mp3" format
 */
export async function renameByID3Tags(filePath: string): Promise<RenameResult> {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);

  try {
    const { artist, title } = await readTags(filePath);

    // Check if both tags are present and non-empty
    if (!artist?.trim() || !title?.trim()) {
      return {
        newPath: filePath,
        renamed: false,
        reason: `Missing ID3 tags (artist: ${artist ?? 'none'}, title: ${title ?? 'none'})`,
      };
    }

    // Build and sanitize the new filename
    const newName = sanitizeFilename(`${artist.trim()} - ${title.trim()}`);
    const currentName = path.basename(filePath, ext);

    // Already correctly named
    if (currentName === newName) {
      return {
        newPath: filePath,
        renamed: false,
        reason: 'Already named correctly',
      };
    }

    // Find unique path (handle conflicts)
    let newPath = path.join(dir, `${newName}${ext}`);
    let counter = 1;

    while ((await fileExists(newPath)) && counter < 1000) {
      newPath = path.join(dir, `${newName} (${counter})${ext}`);
      counter++;
    }

    // Perform rename
    await rename(filePath, newPath);

    return {
      newPath,
      renamed: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      newPath: filePath,
      renamed: false,
      reason: `Rename failed: ${message}`,
    };
  }
}
