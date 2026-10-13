import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { loadEngine } from '@arxo/law-engine/node';

export async function runCompiler() {
  const engine = await loadEngine();
  const source = `language "law.core" version "0.2";
package demo.age version "0.1.0";
namespace "urn:example:demo-age";

pub entity Person;
pub relation age(p: Person, years: Integer) kind empirical;
pub relation adult(p: Person) kind institutional;

rule Adult(p: Person, y: Integer) strict {
  when aeg(p, y);
  when y >= 18;
  then adult(p);
}
`;
  const call = (op, text) => engine.call({
    op, path: 'demo.law', files: { 'demo.law': text },
  }).answer;
  const broken = call('check', source);
  assert.equal(broken.ok, false);
  assert.ok(broken.diagnostics.some(d => d.code === 'LDC-E2102'));
  const fixed = source.replace('when aeg(', 'when age(');
  const checked = call('check', fixed);
  assert.equal(checked.ok, true);
  const lowered = call('lower', fixed);
  assert.equal(typeof lowered.bytes, 'string');
  const ir = JSON.parse(lowered.bytes);
  assert.match(ir.artifactHash, /^sha256:[0-9a-f]{64}$/);
  return { typoDiagnostic: 'LDC-E2102', fixedCheck: checked.ok,
    semanticVersion: ir.semanticVersion, artifactHash: ir.artifactHash };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await runCompiler(), null, 2));
}
