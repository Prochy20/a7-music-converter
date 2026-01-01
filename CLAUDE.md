# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Music converter CLI tool that converts audio/video files to MP3 (320kbps, 44.1kHz, stereo) with metadata preservation and ID3-based file renaming.

## Commands

```bash
# Install dependencies
pnpm install

# Run the converter
pnpm start <directory> [options]

# Development mode (watch for changes)
pnpm dev <directory> [options]

# Build TypeScript to JavaScript
pnpm build
```

**CLI Options:**
- `-d, --dry-run` - Preview what would be converted
- `-k, --keep-original` - Keep original files after conversion
- `-v, --verbose` - Show detailed FFmpeg output

**External requirement:** ffmpeg and ffprobe must be installed on the system.

## Architecture

```
src/
├── index.ts      # CLI entry point, orchestrates conversion workflow
├── types.ts      # TypeScript interfaces and constants (ConversionOptions, etc.)
├── scanner.ts    # Async generator for recursive directory scanning
├── converter.ts  # FFmpeg wrapper (convertToMp3, verifyOutput, finalizeOutput)
├── renamer.ts    # ID3 tag reading and "Artist - Title.mp3" renaming
├── sanitizer.ts  # Filename cleaning (transliteration, reserved names, length)
└── logger.ts     # Progress spinner and color-coded terminal output
```

**Data Flow:**
1. `scanner.ts` yields files via async generator (memory-efficient)
2. `converter.ts` wraps fluent-ffmpeg for conversion with cover art handling
3. `renamer.ts` reads ID3 tags and renames output files
4. `logger.ts` provides real-time progress feedback

**Supported formats:**
- Audio: mp3, flac, wav, aac, ogg, wma, m4a, aiff, ape, opus
- Video: mp4, webm, mkv, avi, mov (audio extraction only)

## Key Implementation Details

- MP3→MP3 conversions use temp files to allow in-place re-encoding
- Cover art is scaled to max 640x640 JPEG
- Filename conflicts resolved with automatic counter suffix
- All metadata preserved via `-map_metadata 0`
