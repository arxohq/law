import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { open } from '@arxo/law';
import { loadEngine } from '@arxo/law-engine/node';

export async function runOwnRule() {
  const source = await readFile(new URL('./age.law', import.meta.url), 'utf8');
  const compiler = await loadEngine();
  const lowered = compiler.call({ op: 'lower', path: 'age.law', files: { 'age.law': source } }).answer;
  assert.equal(typeof lowered.bytes, 'string');
  const ir = JSON.parse(lowered.bytes);
  const spec = 'demo.age@0.1.0';
  const model = await open(spec, { offline: true, local: { packages: { [spec]: { ir } } } });
  const input = answers => ({ legalTime: '2026-10-01', timezone: 'UTC', answers });
  const facts = [{ predicate: 'age', args: ['alice', 20] }];
  const answer = await model.truth('adult', ['alice'], input(facts));
  assert.equal(answer.evaluationStatus, 'COMPUTED');
  assert.equal(answer.truthStatus, 'TRUE_ONLY');
  const missing = await model.truth('adult', ['alice'], input([]));
  assert.equal(missing.truthStatus, 'NEITHER');
  const replay = await model.truth('adult', ['alice'], input(facts));
  assert.deepEqual(Buffer.from(replay.document), Buffer.from(answer.document));
  return { model: spec, truthStatus: answer.truthStatus, missingAge: missing.truthStatus,
    resultHash: answer.hashes.result, documentBytes: answer.document.byteLength,
    replayIdentical: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await runOwnRule(), null, 2));
}
