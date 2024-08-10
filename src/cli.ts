import * as fs from 'node:fs/promises';
import process from 'node:process';
import {Command} from 'commander';
import {loadDiagramFromString} from './loader.js';

async function main(): Promise<void> {
  const program = new Command();
  program
    .argument('<input-path>', 'path to the input diagram file')
    .version('0.0.1');
  program.parse();

  const fileContent = await fs.readFile(program.args[0], 'utf8');
  try {
    loadDiagramFromString(fileContent);
  } catch {
    process.exitCode = 1;
  }
}

await main();
