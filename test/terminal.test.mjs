import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { root } from '../tools/catalog.mjs';
import { truthLabel } from '../examples/terminal.mjs';

test('the first-run command shows an answer, explanation and concrete next command', () => {
  const output = execFileSync(process.execPath, ['examples/own-rule.mjs'], { cwd: root, encoding: 'utf8' });
  assert.match(output, /adult = yes/);
  assert.match(output, /Applied Adult/);
  assert.match(output, /identical evaluation bytes/);
  assert.match(output, /npm start -- --age 16/);
  assert.doesNotMatch(output, /sha256:/);
});
test('JSON mode is parseable and preserves complete evidence fields', () => {
  const output = execFileSync(process.execPath, ['examples/own-rule.mjs', '--json', '--age', '16'], { cwd: root, encoding: 'utf8' });
  const result = JSON.parse(output);
  assert.equal(result.age, 16);
  assert.equal(result.truthStatus, 'NEITHER');
  assert.match(result.resultHash, /^sha256:[0-9a-f]{64}$/);
  assert.ok(result.documentBytes > 0);
});
test('invalid options exit nonzero with an actionable message and no runtime stack', () => {
  const result = spawnSync(process.execPath, ['examples/own-rule.mjs', '--age', 'tomorrow'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /non-negative whole number/);
  assert.match(result.stderr, /npm start -- --help/);
  assert.doesNotMatch(result.stderr, /at file:/);
});
test('truth labels keep missing evidence distinct from an explicit negative conclusion', () => {
  assert.equal(truthLabel('NEITHER'), 'unknown (not established)');
  assert.equal(truthLabel('FALSE_ONLY'), 'no');
  assert.equal(truthLabel('BOTH'), 'conflicting conclusions');
});
