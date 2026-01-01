import ffmpeg from 'fluent-ffmpeg';
import path from 'node:path';
import { stat, unlink, access, rename } from 'node:fs/promises';
import { sanitizeFilename } from './sanitizer.js';
import { VIDEO_EXTENSIONS } from './types.js';
import type { ConversionResult, ProgressInfo, FFMPEG_OPTIONS } from './types.js';

function isVideoFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  return VIDEO_EXTENSIONS.includes(ext as (typeof VIDEO_EXTENSIONS)[number]);
}

export interface ConvertOptions {
  verbose: boolean;
  onProgress?: (progress: ProgressInfo) => void;
}

export function getOutputPath(inputPath: string): string {
  const dir = path.dirname(inputPath);
  const ext = path.extname(inputPath).toLowerCase();
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const sanitizedName = sanitizeFilename(baseName);

  // For MP3 files, use temp file (will be replaced after successful conversion)
  if (ext === '.mp3') {
    return path.join(dir, `${sanitizedName}.tmp.mp3`);
  }

  return path.join(dir, `${sanitizedName}.mp3`);
}

export async function outputExists(outputPath: string): Promise<boolean> {
  try {
    await access(outputPath);
    return true;
  } catch {
    return false;
  }
}

export function convertToMp3(
  inputPath: string,
  outputPath: string,
  options: ConvertOptions
): Promise<ConversionResult> {
  return new Promise((resolve, reject) => {
    const isVideo = isVideoFile(inputPath);

    // Base audio options
    const outputOptions = [
      '-map_metadata', '0',
      '-map', '0:a',              // Map audio stream
      '-id3v2_version', '3',
      '-write_id3v1', '1',
    ];

    // For audio files: preserve/convert embedded cover art
    // For video files: audio-only extraction (no video stream embedding)
    if (!isVideo) {
      outputOptions.push(
        '-map', '0:v?',             // Map video/cover stream if exists (? = optional)
        '-c:v', 'mjpeg',            // Convert cover to JPEG baseline for MMI 3G+
        '-vf', 'scale=iw*min(1\\,min(640/iw\\,640/ih)):ih*min(1\\,min(640/iw\\,640/ih))',  // Max 640x640
        '-q:v', '2',                // High quality JPEG
      );
    } else {
      outputOptions.push('-vn');    // No video stream for video files
    }

    const command = ffmpeg(inputPath)
      .audioCodec('libmp3lame')
      .audioBitrate('320k')
      .audioFrequency(44100)
      .audioChannels(2)
      .outputOptions(outputOptions);

    if (options.verbose) {
      command.on('start', (cmd: string) => {
        console.log(`FFmpeg: ${cmd}`);
      });
    }

    if (options.onProgress) {
      command.on('progress', options.onProgress);
    }

    command
      .on('error', (err: Error) => {
        reject(new Error(err.message));
      })
      .on('end', () => {
        resolve({
          inputPath,
          outputPath,
          success: true,
        });
      })
      .save(outputPath);
  });
}

export async function verifyOutput(outputPath: string): Promise<boolean> {
  try {
    const stats = await stat(outputPath);
    if (stats.size < 1024) {
      return false;
    }

    return new Promise((resolve) => {
      ffmpeg.ffprobe(outputPath, (err, metadata) => {
        if (err) {
          resolve(false);
          return;
        }
        const hasAudio = metadata.streams?.some(
          (s) => s.codec_type === 'audio'
        );
        resolve(Boolean(hasAudio));
      });
    });
  } catch {
    return false;
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  await unlink(filePath);
}

export async function cleanupPartialOutput(outputPath: string): Promise<void> {
  try {
    await unlink(outputPath);
  } catch {
    // Ignore cleanup errors
  }
}

export async function finalizeOutput(
  inputPath: string,
  outputPath: string
): Promise<string> {
  // For MP3→MP3 conversions, replace original with processed version
  if (outputPath.endsWith('.tmp.mp3')) {
    const finalPath = inputPath; // Original path becomes the final path
    await unlink(inputPath);
    await rename(outputPath, finalPath);
    return finalPath;
  }
  return outputPath;
}
