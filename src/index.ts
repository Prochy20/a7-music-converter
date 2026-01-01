#!/usr/bin/env node
import path from 'node:path';
import { program } from 'commander';
import { collectAudioFiles, directoryExists } from './scanner.js';
import { renameByID3Tags } from './renamer.js';
import {
  convertToMp3,
  deleteFile,
  getOutputPath,
  outputExists,
  verifyOutput,
  cleanupPartialOutput,
  finalizeOutput,
} from './converter.js';
import { createProgressTracker, logInfo, logVerbose } from './logger.js';
import type { ConversionOptions, ConversionSummary } from './types.js';

async function convertDirectory(
  directory: string,
  options: ConversionOptions
): Promise<ConversionSummary> {
  const summary: ConversionSummary = {
    successful: [],
    failed: [],
    skipped: [],
  };

  // Validate directory
  if (!(await directoryExists(directory))) {
    throw new Error(`Directory not found: ${directory}`);
  }

  // Collect audio files
  logInfo(`Scanning directory: ${directory}`);
  const files = await collectAudioFiles(directory);

  if (files.length === 0) {
    logInfo('No audio files found to convert.');
    return summary;
  }

  logInfo(`Found ${files.length} audio file(s) to process.`);

  if (options.dryRun) {
    logInfo('\nDry run - would convert:');
    for (const file of files) {
      const outputPath = getOutputPath(file);
      console.log(`  ${file} -> ${outputPath}`);
    }
    return summary;
  }

  const tracker = createProgressTracker(files.length);

  for (const inputPath of files) {
    const outputPath = getOutputPath(inputPath);
    const isMp3Input = inputPath.toLowerCase().endsWith('.mp3');

    // Skip if output already exists (but not for MP3→MP3 which uses temp files)
    if (!isMp3Input && (await outputExists(outputPath))) {
      tracker.skip(inputPath, 'output already exists');
      summary.skipped.push({ inputPath, reason: 'output already exists' });
      continue;
    }

    tracker.start(inputPath);

    try {
      // Convert
      logVerbose(`Converting: ${inputPath}`, options.verbose);
      logVerbose(`Output: ${outputPath}`, options.verbose);

      const result = await convertToMp3(inputPath, outputPath, {
        verbose: options.verbose,
        onProgress: (progress) => tracker.update(progress),
      });

      // Verify output
      const verified = await verifyOutput(outputPath);
      if (!verified) {
        throw new Error('Output verification failed');
      }

      // Finalize output (replaces original for MP3→MP3)
      const finalPath = await finalizeOutput(inputPath, outputPath);
      result.outputPath = finalPath;

      // Rename based on ID3 tags (Artist - Title.mp3)
      const renameResult = await renameByID3Tags(finalPath);
      result.outputPath = renameResult.newPath;

      if (renameResult.renamed) {
        logVerbose(
          `Renamed to: ${path.basename(renameResult.newPath)}`,
          options.verbose
        );
      } else if (renameResult.reason) {
        logVerbose(`Not renamed: ${renameResult.reason}`, options.verbose);
      }

      // Delete original if requested (but not for MP3 which was already replaced)
      if (!options.keepOriginal && !isMp3Input) {
        await deleteFile(inputPath);
        logVerbose(`Deleted original: ${inputPath}`, options.verbose);
      }

      tracker.success(inputPath);
      summary.successful.push(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      tracker.fail(inputPath, message);
      summary.failed.push({ inputPath, error: message });

      // Clean up partial output
      await cleanupPartialOutput(outputPath);
    }
  }

  tracker.finish(summary);
  return summary;
}

program
  .name('music-convert')
  .description('Convert audio files to MP3 (320kbps, 44.1kHz, Stereo)')
  .version('1.0.0')
  .argument('<directory>', 'Directory to scan for audio files')
  .option('-d, --dry-run', 'Show what would be converted without converting', false)
  .option('-k, --keep-original', 'Keep original files after conversion', false)
  .option('-v, --verbose', 'Show detailed FFmpeg output', false)
  .action(async (directory: string, options: ConversionOptions) => {
    try {
      const summary = await convertDirectory(directory, options);
      const exitCode = summary.failed.length > 0 ? 1 : 0;
      process.exit(exitCode);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

program.parse();
