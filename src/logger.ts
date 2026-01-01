import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import path from 'node:path';
import type { ConversionSummary, ProgressInfo } from './types.js';

export interface ProgressTracker {
  start(filename: string): void;
  update(progress: ProgressInfo): void;
  success(filename: string): void;
  fail(filename: string, error: string): void;
  skip(filename: string, reason: string): void;
  finish(summary: ConversionSummary): void;
}

export function createProgressTracker(totalFiles: number): ProgressTracker {
  let current = 0;
  let spinner: Ora | null = null;
  let currentFilename = '';

  return {
    start(filename: string) {
      currentFilename = path.basename(filename);
      spinner = ora({
        text: `[${current + 1}/${totalFiles}] Converting: ${currentFilename}`,
        color: 'cyan',
      }).start();
    },

    update(progress: ProgressInfo) {
      if (spinner && progress.percent !== undefined) {
        const percent = progress.percent.toFixed(1);
        spinner.text = `[${current + 1}/${totalFiles}] Converting: ${currentFilename} (${percent}%)`;
      }
    },

    success(filename: string) {
      current++;
      const name = path.basename(filename);
      if (spinner) {
        spinner.succeed(chalk.green(`[${current}/${totalFiles}] Converted: ${name}`));
        spinner = null;
      }
    },

    fail(filename: string, error: string) {
      current++;
      const name = path.basename(filename);
      if (spinner) {
        spinner.fail(chalk.red(`[${current}/${totalFiles}] Failed: ${name} - ${error}`));
        spinner = null;
      }
    },

    skip(filename: string, reason: string) {
      current++;
      const name = path.basename(filename);
      console.log(chalk.yellow(`[${current}/${totalFiles}] Skipped: ${name} - ${reason}`));
    },

    finish(summary: ConversionSummary) {
      console.log('\n' + chalk.bold('Conversion Summary:'));
      console.log(chalk.green(`  Successful: ${summary.successful.length}`));
      console.log(chalk.red(`  Failed:     ${summary.failed.length}`));
      console.log(chalk.yellow(`  Skipped:    ${summary.skipped.length}`));

      if (summary.failed.length > 0) {
        console.log('\n' + chalk.red('Failed files:'));
        for (const { inputPath, error } of summary.failed) {
          console.log(chalk.red(`  - ${path.basename(inputPath)}: ${error}`));
        }
      }
    },
  };
}

export function logInfo(message: string): void {
  console.log(chalk.blue(message));
}

export function logVerbose(message: string, verbose: boolean): void {
  if (verbose) {
    console.log(chalk.gray(message));
  }
}
