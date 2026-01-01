# Music Converter

A CLI tool that converts audio and video files to high-quality MP3 format with intelligent metadata handling and automatic file renaming.

## Primary Use Case

This tool is specifically designed to convert music files for **Audi A7 C7 (2012-2018) MMI 3G/3G+ systems** on SD cards. The output format (320kbps, 44.1kHz stereo MP3) is optimized for maximum compatibility and audio quality within the MMI's supported specifications:

- **MMI System**: MMI 3G / MMI 3G+
- **Supported MP3 specs**: 32-320kbps, VBR 8-48kHz (recommended minimum 160kbps)
- **SD Card format**: FAT32 (single partition required)
- **Also supports**: AAC, WMA (though this tool outputs MP3)

The 320kbps bitrate ensures the highest quality audio playback while remaining fully compatible with the MMI system.

## Features

- **High-quality output**: 320kbps, 44.1kHz, stereo MP3
- **Metadata preservation**: Retains all ID3 tags from source files
- **Smart renaming**: Automatically renames output files to `Artist - Title.mp3` based on ID3 tags
- **Cover art handling**: Preserves and optimizes embedded artwork (scaled to max 640×640 JPEG)
- **Filename sanitization**: Transliterates non-ASCII characters and removes problematic punctuation
- **Video support**: Extracts audio from video files (MP4, MKV, WebM, etc.)
- **Safe operation**: Verifies output integrity before removing originals

## Requirements

- Node.js 18+
- pnpm
- FFmpeg and FFprobe installed on system

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
choco install ffmpeg
```

## Installation

```bash
git clone <repository-url>
cd music-converter
pnpm install
```

## Usage

```bash
# Convert all audio files in a directory
pnpm start <directory>

# Preview what would be converted (dry run)
pnpm start <directory> --dry-run

# Keep original files after conversion
pnpm start <directory> --keep-original

# Show detailed FFmpeg output
pnpm start <directory> --verbose
```

### Options

| Option | Short | Description |
|--------|-------|-------------|
| `--dry-run` | `-d` | Preview conversions without making changes |
| `--keep-original` | `-k` | Keep original files after successful conversion |
| `--verbose` | `-v` | Display FFmpeg command and detailed output |

## Supported Formats

### Audio (input)
mp3, flac, wav, aac, ogg, wma, m4a, aiff, ape, opus

### Video (audio extraction)
mp4, webm, mkv, avi, mov

## How It Works

1. **Scan**: Recursively finds all supported audio/video files in the target directory
2. **Convert**: Re-encodes to MP3 using libmp3lame at 320kbps
3. **Verify**: Validates output file integrity with ffprobe
4. **Rename**: Reads ID3 tags and renames to `Artist - Title.mp3` format
5. **Cleanup**: Removes original file (unless `--keep-original` is set)

### Special Cases

- **MP3 to MP3**: Uses a temporary file to allow in-place re-encoding (useful for fixing cover art or normalizing bitrate)
- **Missing ID3 tags**: Files without artist/title tags keep their original filename
- **Filename conflicts**: Automatically adds counter suffix (`Song (1).mp3`, `Song (2).mp3`)

## Development

```bash
# Run in development mode (watch for changes)
pnpm dev <directory>

# Build TypeScript to JavaScript
pnpm build
```

## Project Structure

```
src/
├── index.ts      # CLI entry point
├── types.ts      # TypeScript interfaces and constants
├── scanner.ts    # Recursive directory scanning
├── converter.ts  # FFmpeg conversion wrapper
├── renamer.ts    # ID3 tag reading and file renaming
├── sanitizer.ts  # Filename cleaning and transliteration
└── logger.ts     # Progress spinner and terminal output
```

## License

MIT
