import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test, {type ExecutionContext} from 'ava';
import {loadDiagramFromString} from '../../src/loader.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTestShoudPass(t: ExecutionContext, filename: string) {
  const fileContent = await readFile(path.join(dirname, 'assets', filename), 'utf8');
  const result = loadDiagramFromString(fileContent, false);
  t.assert(result.errors.length === 0);
}

async function runTestAndSnapshotException(t: ExecutionContext, filename: string) {
  const fileContent = await readFile(path.join(dirname, 'assets', filename), 'utf8');
  const result = loadDiagramFromString(fileContent, false);
  t.assert(result.errors.length > 0);
  t.snapshot(result.errors);
}

test('empty diagram', async t => runTestShoudPass(t, 'empty.alliodiagram'));
test('valid diagram (1/3)', async t => runTestShoudPass(t, 'valid_1.alliodiagram'));
test('valid diagram (2/3)', async t => runTestShoudPass(t, 'valid_2.alliodiagram'));
test('valid diagram (3/3)', async t => runTestShoudPass(t, 'valid_3.alliodiagram'));

test('error when missing devices section', async t => runTestAndSnapshotException(t, 'missing_devices_section.alliodiagram'));
test('error when missing diagrams section', async t => runTestAndSnapshotException(t, 'missing_diagrams_section.alliodiagram'));
test('error when missing begin block', async t => runTestAndSnapshotException(t, 'missing_begin.alliodiagram'));
test('error when found more than one begin block', async t => runTestAndSnapshotException(t, 'too_many_begin.alliodiagram'));

test('error when missing end block (1/3)', async t => runTestAndSnapshotException(t, 'missing_end_or_back_1.alliodiagram'));
test('error when missing end block (2/3)', async t => runTestAndSnapshotException(t, 'missing_end_or_back_2.alliodiagram'));
test('error when missing end block (3/3)', async t => runTestAndSnapshotException(t, 'missing_end_or_back_3.alliodiagram'));

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

test('error when id is not unique (1/2)', async t => runTestAndSnapshotException(t, 'component_id_duplicate_1.alliodiagram'));
test('error when id is not unique (2/2)', async t => runTestAndSnapshotException(t, 'component_id_duplicate_2.alliodiagram'));

test('error on invalid connection (multiple uncondition transitions with same origin)', async t => runTestAndSnapshotException(t, 'invalid_connection_1.alliodiagram'));
