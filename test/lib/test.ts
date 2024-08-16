import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test, {type ExecutionContext} from 'ava';
import {loadDiagramFromString} from '../../src/loader.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTestShoudPass(t: ExecutionContext, filename: string) {
  const fileContent = await readFile(path.join(dirname, 'assets', filename), 'utf8');
  t.notThrows(() => loadDiagramFromString(fileContent));
}

async function runTestAndSnapshotException(t: ExecutionContext, filename: string) {
  const fileContent = await readFile(path.join(dirname, 'assets', filename), 'utf8');
  const error = t.throws(() => loadDiagramFromString(fileContent));
  t.snapshot(error);
}

test('empty diagram', async t => runTestShoudPass(t, 'empty.alliodiagram'));
test('error when missing devices section', async t => runTestAndSnapshotException(t, 'missing_devices_section.alliodiagram'));
test('error when missing diagrams section', async t => runTestAndSnapshotException(t, 'missing_diagrams_section.alliodiagram'));
test.failing('error when missing end block (1/2)', async t => runTestAndSnapshotException(t, 'missing_end_or_back_1.alliodiagram'));
test.failing('error when missing end block (2/2)', async t => runTestAndSnapshotException(t, 'missing_end_or_back_2.alliodiagram'));
