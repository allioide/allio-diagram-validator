import * as fs from 'node:fs/promises';
import process from 'node:process';
import chalk from 'chalk';
import {Command} from 'commander';
import {loadDiagramFromString} from './loader.js';
import {DiagramValidationError} from './util/errors.js';

function printError(soucePath: string, errors: DiagramValidationError[]) {
  for (const error of errors) {
    console.log(chalk.bold(`${soucePath}:${error.line ?? 0}:${error.character ?? 0}:`)
                + ((error.severity === 'error') ? ` ${chalk.bold.red('error:')}` : ` ${chalk.bold.yellow('warning:')}`)
                + ` ${error.message}`);
  }
}

async function main(): Promise<void> {
  const program = new Command();
  program
    .argument('<input-path>', 'path to the input diagram file')
    .option('-v, --verbose', 'display more error messages')
    .version('0.0.1');
  program.parse();

  const options = program.opts();
  const sourcePath = program.args[0];
  const fileContent = await fs.readFile(sourcePath, 'utf8');
  try {
    const result = loadDiagramFromString(fileContent, options.verbose as boolean);
    if (result.errors.length !== 0) {
      printError(sourcePath, result.errors);
      process.exitCode = 1;
    }
  } catch (error) {
    console.log(error);
    process.exitCode = 1;
  }
}

await main();
