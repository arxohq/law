import test from 'node:test';
import { runOwnRule } from '../examples/own-rule.mjs';
import { runCompiler } from '../examples/compiler.mjs';
import { runBenefits } from '../examples/french-benefits.mjs';

test('own rule: source compilation, missing fact and byte-identical replay', runOwnRule);
test('compiler: undeclared predicate is rejected and corrected source compiles', runCompiler);
test('APL: the supplied pinned formula probe yields 20.17 EUR', runBenefits);
