export interface ConversionOptions {
  dryRun: boolean;
  keepOriginal: boolean;
  verbose: boolean;
}

export interface ConversionResult {
  inputPath: string;
  outputPath: string;
  success: boolean;
}

export interface ConversionSummary {
  successful: ConversionResult[];
  failed: { inputPath: string; error: string }[];
  skipped: { inputPath: string; reason: string }[];
}

export interface ProgressInfo {
  percent?: number;
  currentFps?: number;
  currentKbps?: number;
  targetSize?: number;
  timemark?: string;
}

export const AUDIO_EXTENSIONS = [
  'mp3',   // Process existing MP3s for cover art fixing
  'flac',
  'wav',
  'aac',
  'ogg',
  'wma',
  'm4a',
  'aiff',
  'ape',
  'opus',
] as const;

export const VIDEO_EXTENSIONS = [
  'mp4',
  'webm',
  'mkv',
  'avi',
  'mov',
] as const;

export type AudioExtension = (typeof AUDIO_EXTENSIONS)[number];
export type VideoExtension = (typeof VIDEO_EXTENSIONS)[number];

export const FFMPEG_OPTIONS = {
  audioCodec: 'libmp3lame',
  bitrate: '320k',
  sampleRate: 44100,
  channels: 2,
} as const;
