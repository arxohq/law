import test from 'node:test';
import assert from 'node:assert/strict';
import { runOwnRule } from '../examples/own-rule.mjs';
import { runCompiler } from '../examples/compiler.mjs';
import { runBenefits } from '../examples/french-benefits.mjs';

test('own rule: source compilation, missing fact and byte-identical replay', async () => {
  const result = await runOwnRule();
  assert.equal(result.evaluationStatus, 'COMPUTED');
  assert.equal(result.truthStatus, 'TRUE_ONLY');
  assert.equal(result.missingAge, 'NEITHER');
  assert.deepEqual(result.rulesApplied, ['Adult']);
  assert.equal(result.replayIdentical, true);
  assert.match(result.resultHash, /^sha256:[0-9a-f]{64}$/);
});
test('changing the supplied age below the threshold produces unknown, not false', async () => {
  const result = await runOwnRule({ age: 16 });
  assert.equal(result.truthStatus, 'NEITHER');
  assert.deepEqual(result.rulesApplied, []);
  assert.equal(result.replayIdentical, true);
});
test('compiler: undeclared predicate is rejected and corrected source compiles', async () => {
  const result = await runCompiler();
  assert.equal(result.typoDiagnostic, 'LDC-E2102');
  assert.equal(result.fixedCheck, true);
  assert.match(result.artifactHash, /^sha256:[0-9a-f]{64}$/);
});
test('APL: the supplied pinned formula probe yields 20.17 EUR', async () => {
  const result = await runBenefits();
  assert.equal(result.evaluationStatus, 'COMPUTED');
  assert.equal(result.formulaAmount, '20.17');
  assert.equal(result.currency, 'EUR');
  assert.equal(result.legalTime, '2024-06-15');
  assert.equal(result.factCount, 12);
});
test('changing the rent computes a new amount without requiring the original answer', async () => {
  const result = await runBenefits({ rent: '300' });
  assert.equal(result.evaluationStatus, 'COMPUTED');
  assert.equal(result.rent, '300');
  assert.equal(result.currency, 'EUR');
  assert.notEqual(result.formulaAmount, '20.17');
});
