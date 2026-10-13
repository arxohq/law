import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { open } from '@arxo/law';
import { loadModel } from '@arxo/canon-fr-benefits/apl';
import { household, caseInput } from '@arxo/canon-fr-benefits/examples/apl';

export async function runBenefits() {
  const model = await loadModel();
  const apl = await open(model.spec, {
    offline: true, local: { packages: { [model.spec]: model.package } },
  });
  const answer = await apl.collect('aide_formule', [household, '?amount'], caseInput);
  assert.equal(answer.evaluationStatus, 'COMPUTED');
  assert.equal(answer.value[0].value, '20.17');
  assert.equal(answer.value[0].currency, 'EUR');
  return { model: model.spec, evaluationStatus: answer.evaluationStatus,
    formulaAmount: answer.value[0].value, currency: answer.value[0].currency,
    resultHash: answer.hashes.result, documentBytes: answer.document.byteLength };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await runBenefits(), null, 2));
}
