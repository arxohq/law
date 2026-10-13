import { runOwnRule } from './own-rule.mjs';
import { runCompiler } from './compiler.mjs';
import { runBenefits } from './french-benefits.mjs';

for (const [name, run] of [
  ['Your own rule', runOwnRule], ['Compiler', runCompiler],
  ['French APL formula probe', runBenefits],
]) {
  console.log(name);
  console.log(JSON.stringify(await run(), null, 2));
}
