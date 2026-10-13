import { open } from '@arxo/law';
import { loadModel } from '@arxo/canon-fr-benefits/apl';
import { household, caseInput } from '@arxo/canon-fr-benefits/examples/apl';
import { isMain, runTerminal, describeBenefits } from './terminal.mjs';

export async function runBenefits({ rent = '0' } = {}) {
  const model = await loadModel();
  const apl = await open(model.spec, {
    offline: true, local: { packages: { [model.spec]: model.package } },
  });
  const input = structuredClone(caseInput);
  const rentFact = input.answers.find(fact => fact.predicate === 'loyer_principal');
  if (!rentFact) throw Error('The supplied case has no rent fact to change. Inspect the pinned package case.');
  rentFact.args[1] = `${rent} EUR`;
  const answer = await apl.collect('aide_formule', [household, '?amount'], input);
  if (answer.evaluationStatus !== 'COMPUTED' || !answer.value?.length) {
    throw Error(`The supplied case returned ${answer.evaluationStatus} without a formula amount.`);
  }
  return { model: model.spec, evaluationStatus: answer.evaluationStatus,
    rent, legalTime: input.legalTime, factCount: input.answers.length,
    formulaAmount: answer.value[0].value, currency: answer.value[0].currency,
    resultHash: answer.hashes.result, documentBytes: answer.document.byteLength };
}

if (isMain(import.meta.url)) {
  await runTerminal({ name: 'French benefit example', command: 'npm run example:benefits',
    run: runBenefits, describe: describeBenefits, allowRent: true });
}
