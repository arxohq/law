import { runOwnRule } from './own-rule.mjs';
import { runCompiler } from './compiler.mjs';
import { runBenefits } from './french-benefits.mjs';
import { runTerminal, describeRule, describeCompiler, describeBenefits } from './terminal.mjs';

const run = async options => ({ rule: await runOwnRule(options),
  compiler: await runCompiler(), benefits: await runBenefits() });
await runTerminal({ name: 'Arxo examples', command: 'npm run examples', run,
  describe: result => [describeRule(result.rule), describeCompiler(result.compiler),
    describeBenefits(result.benefits)].join('\n\n') });
