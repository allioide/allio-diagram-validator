import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test, {type ExecutionContext} from 'ava';
import {loadDiagramFromString} from '../../src/loader.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTestShoudPass(t: ExecutionContext, filename: string) {
  const fileContent = await readFile(path.join(dirname, 'assets', filename), 'utf8');
  t.notThrows(() => loadDiagramFromString(fileContent, true));
}

async function runTestAndSnapshotException(t: ExecutionContext, filename: string) {
  const fileContent = await readFile(path.join(dirname, 'assets', filename), 'utf8');
  const error = t.throws(() => loadDiagramFromString(fileContent, true));
  t.snapshot(error);
}

test('empty diagram', async t => runTestShoudPass(t, 'empty.alliodiagram'));
test('error when missing devices section', async t => runTestAndSnapshotException(t, 'missing_devices_section.alliodiagram'));
test('error when missing diagrams section', async t => runTestAndSnapshotException(t, 'missing_diagrams_section.alliodiagram'));
test.failing('error when missing end block (1/2)', async t => runTestAndSnapshotException(t, 'missing_end_or_back_1.alliodiagram'));
test.failing('error when missing end block (2/2)', async t => runTestAndSnapshotException(t, 'missing_end_or_back_2.alliodiagram'));

test('error when command contains invalid key (1/9)', async t => runTestAndSnapshotException(t, 'invalid_key_command_1.alliodiagram'));
test('error when command contains invalid key (2/9)', async t => runTestAndSnapshotException(t, 'invalid_key_command_2.alliodiagram'));
test('error when command contains invalid key (3/9)', async t => runTestAndSnapshotException(t, 'invalid_key_command_3.alliodiagram'));
test('error when command contains invalid key (4/9)', async t => runTestAndSnapshotException(t, 'invalid_key_command_4.alliodiagram'));
test('error when command contains invalid key (5/9)', async t => runTestAndSnapshotException(t, 'invalid_key_command_5.alliodiagram'));
test('error when command contains invalid key (6/9)', async t => runTestAndSnapshotException(t, 'invalid_key_command_6.alliodiagram'));
test('error when command contains invalid key (7/9)', async t => runTestAndSnapshotException(t, 'invalid_key_command_7.alliodiagram'));
test('error when command contains invalid key (8/9)', async t => runTestAndSnapshotException(t, 'invalid_key_command_8.alliodiagram'));
test('error when command contains invalid key (9/9)', async t => runTestAndSnapshotException(t, 'invalid_key_command_9.alliodiagram'));

test('error when transition contains invalid key (1/10)', async t => runTestAndSnapshotException(t, 'invalid_key_transition_1.alliodiagram'));
test('error when transition contains invalid key (2/10)', async t => runTestAndSnapshotException(t, 'invalid_key_transition_2.alliodiagram'));
test('error when transition contains invalid key (3/10)', async t => runTestAndSnapshotException(t, 'invalid_key_transition_3.alliodiagram'));
test('error when transition contains invalid key (4/10)', async t => runTestAndSnapshotException(t, 'invalid_key_transition_4.alliodiagram'));
test('error when transition contains invalid key (5/10)', async t => runTestAndSnapshotException(t, 'invalid_key_transition_5.alliodiagram'));
test('error when transition contains invalid key (6/10)', async t => runTestAndSnapshotException(t, 'invalid_key_transition_6.alliodiagram'));
test('error when transition contains invalid key (7/10)', async t => runTestAndSnapshotException(t, 'invalid_key_transition_7.alliodiagram'));
test('error when transition contains invalid key (8/10)', async t => runTestAndSnapshotException(t, 'invalid_key_transition_8.alliodiagram'));
test('error when transition contains invalid key (9/10)', async t => runTestAndSnapshotException(t, 'invalid_key_transition_9.alliodiagram'));
test('error when transition contains invalid key (10/10)', async t => runTestAndSnapshotException(t, 'invalid_key_transition_10.alliodiagram'));
