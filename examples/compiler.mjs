import { readFile } from 'node:fs/promises';
import { loadEngine } from '@arxo/law-engine/node';
import { isMain, runTerminal, describeCompiler } from './terminal.mjs';

export async function runCompiler() {
  const engine = await loadEngine();
  const fixed = await readFile(new URL('./age.law', import.meta.url), 'utf8');
  const source = fixed.replace('when age(', 'when aeg(');
  const call = (op, text) => engine.call({
    op, path: 'age.law', files: { 'age.law': text },
  }).answer;
  const broken = call('check', source);
  const checked = call('check', fixed);
  const lowered = call('lower', fixed);
  if (typeof lowered.bytes !== 'string') throw Error('The corrected source did not compile. Check examples/age.law.');
  const ir = JSON.parse(lowered.bytes);
  return { typoDiagnostic: broken.diagnostics?.find(d => d.code === 'LDC-E2102')?.code,
    fixedCheck: checked.ok,
    semanticVersion: ir.semanticVersion, artifactHash: ir.artifactHash };
}

if (isMain(import.meta.url)) {
  await runTerminal({ name: 'Compiler example', command: 'npm run example:compiler',
    run: runCompiler, describe: describeCompiler });
}
