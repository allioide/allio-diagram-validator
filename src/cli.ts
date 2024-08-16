import * as fs from 'node:fs/promises';
import process from 'node:process';
import chalk from 'chalk';
import {Command} from 'commander';
import {loadDiagramFromString} from './loader.js';
import {DiagramValidationError} from './util/errors.js';

function printError(soucePath: string, error: DiagramValidationError) {
  for (const detail of error.detail) {
    console.log(chalk.bold(`${soucePath}:${detail.line ?? 0}:${detail.character ?? 0}:`)
                + ((detail.severity === 'error') ? ` ${chalk.bold.red('error:')}` : ` ${chalk.bold.yellow('warning:')}`)
                + ` ${detail.message}`);
  }
}

async function main(): Promise<void> {
  const program = new Command();
  program
    .argument('<input-path>', 'path to the input diagram file')
    .version('0.0.1');
  program.parse();

  const sourcePath = program.args[0];
  const fileContent = await fs.readFile(sourcePath, 'utf8');
  try {
    loadDiagramFromString(fileContent);
  } catch (error) {
    if (error instanceof DiagramValidationError) {
      printError(sourcePath, error);
    } else {
      console.log(error);
    }

    process.exitCode = 1;
  }
}

await main();
