import { readFile } from 'node:fs/promises';
import { open } from '@arxo/law';
import { loadEngine } from '@arxo/law-engine/node';
import { isMain, runTerminal, describeRule } from './terminal.mjs';

export async function runOwnRule({ age = 20 } = {}) {
  const source = await readFile(new URL('./age.law', import.meta.url), 'utf8');
  const compiler = await loadEngine();
  const lowered = compiler.call({ op: 'lower', path: 'age.law', files: { 'age.law': source } }).answer;
  if (typeof lowered.bytes !== 'string') throw Error('The source did not compile. Check examples/age.law and its diagnostics.');
  const ir = JSON.parse(lowered.bytes);
  const spec = 'demo.age@0.1.0';
  const model = await open(spec, { offline: true, local: { packages: { [spec]: { ir } } } });
  const input = answers => ({ legalTime: '2026-10-01', timezone: 'UTC', answers });
  const facts = [{ predicate: 'age', args: ['alice', age] }];
  const answer = await model.truth('adult', ['alice'], input(facts));
  const missing = await model.truth('adult', ['alice'], input([]));
  const replay = await model.truth('adult', ['alice'], input(facts));
  const rulesApplied = [...new Set((answer.proof?.nodes ?? [])
    .filter(node => node.kind === 'rule_application' && node.rule)
    .map(node => String(node.rule).split('#').pop()))];
  return { model: spec, age, evaluationStatus: answer.evaluationStatus,
    truthStatus: answer.truthStatus, rulesApplied, missingAge: missing.truthStatus,
    resultHash: answer.hashes.result, documentBytes: answer.document.byteLength,
    replayIdentical: Buffer.from(replay.document).equals(Buffer.from(answer.document)) };
}

if (isMain(import.meta.url)) {
  await runTerminal({ name: 'Your first rule', command: 'npm start',
    run: runOwnRule, describe: describeRule, allowAge: true });
}
