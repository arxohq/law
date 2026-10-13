# Run a published model

[← Arxo Law](../README.md) · [Write rules](write-rules.md) · [Connect MCP](connect-mcp.md)

Start with the supplied French housing-aid example. It includes a pinned model,
its imports and an explicit demonstration case.

## Run the checked example

From the cloned repository, with Node.js 20 or newer:

```sh
npm ci --ignore-scripts
npm run example:benefits
```

You should see model `fr.apl@0.1.0`, case date `2024-06-15`, 12 supplied facts
and **20.17 EUR (formula amount)**. The JSON result also includes its result hash.

The supplied case is a technical zero-rent probe: one person, no dependants,
metropolitan zone II, resources of EUR 4,000 and the explicit `PpPlancherFinal`
reading. The formula amount is separate from a final payable benefit. This
example demonstrates integration and the selected model's calculation.

## See the complete call

```js
import { open } from '@arxo/law';
import { loadModel } from '@arxo/canon-fr-benefits/apl';
import { household, caseInput } from '@arxo/canon-fr-benefits/examples/apl';

const model = await loadModel();
const apl = await open(model.spec, {
  offline: true,
  local: { packages: { [model.spec]: model.package } },
});
const answer = await apl.collect('aide_formule', [household, '?amount'], caseInput);

console.log(answer.value[0].value, answer.value[0].currency);
```

The repository pins `@arxo/law@0.4.2` and `@arxo/canon-fr-benefits@0.1.2`.
For a separate project, install those exact versions and save the snippet as
`example.mjs`, then run `node example.mjs`.

```sh
npm install @arxo/law@0.4.2 @arxo/canon-fr-benefits@0.1.2
```

## Change a case deliberately

```sh
npm run example:benefits -- --rent 300
```

This changes the rent to EUR 300 in a copy of the input, retaining its other
facts, dates and selected reading. The example prints the newly computed
amount: **298.45 EUR (formula amount)** with this pinned model and case.
It does not require the original 20.17 EUR answer.

Make a copy of [examples/french-benefits.mjs](../examples/french-benefits.mjs).
Before the call, create an independent input and change the supplied rent:

```js
const myCase = structuredClone(caseInput);
const rent = myCase.answers.find(fact => fact.predicate === 'loyer_principal');
rent.args[1] = '300 EUR';
const answer = await apl.collect('aide_formule', [household, '?amount'], myCase);
```

Inspect the copied `answers` before changing other facts. Keep the case dates,
units and selected reading explicit. Change your example, rather than installed
package files. The changed case has its own computed amount; 20.17 EUR is the
baseline of the original zero-rent case only.

For the complete supplied case and the available models, read
[the canon package](https://www.npmjs.com/package/@arxo/canon-fr-benefits).

## Keep the evidence

```sh
npm --silent run example:benefits -- --json
```

The API answer exposes `answer.document`, `answer.proof`, `answer.sources`
and `answer.hashes`. The example returns a compact JSON summary; use the
complete answer in your application when you need to retain those documents.

If loading a model fails, check the exact versions in
[compatibility notes](compatibility.md). Publication and compatibility are
recorded separately in [the package catalogue](packages.md).
