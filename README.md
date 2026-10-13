# Arxo Law

**Turn rules into answers you can inspect, test and replay.**

Arxo compiles rules into an executable model. Give it a case and a question;
it returns an answer, a graph of the rules it applied and a canonical evaluation
document. Law is the first domain; the same machinery works with standards
and other rulebooks.

[![Checks](https://github.com/arxohq/law/actions/workflows/ci.yml/badge.svg)](https://github.com/arxohq/law/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@arxo/law)](https://www.npmjs.com/package/@arxo/law)

[Start here](#try-it) · [Packages](docs/packages.md) · [Examples](examples/README.md) ·
[Ecosystem](docs/ecosystem.md) · [Source availability](docs/source-availability.md)

This is the official public entry point for Arxo Law. Today it contains
documentation, a catalogue of published packages and runnable examples.
**Engine source code is not published here yet.** The planned open core will
be added to this repository; [its scope and contribution process](docs/source-availability.md)
are described separately from the packages available today.

## Try it

With Node.js 20 or newer, run the tested examples in this repository:

```sh
git clone https://github.com/arxohq/law.git arxo-law
cd arxo-law
npm ci --ignore-scripts
npm run examples
```

The examples use exact package versions and fixed inputs. After installation
they execute locally in WebAssembly, without a service account.

## One model, one answer

Load a pinned French housing-aid model and its supplied demonstration case:

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

console.log(answer.evaluationStatus); // COMPUTED
console.log(answer.value[0].value);   // 20.17
console.log(answer.value[0].currency); // EUR
console.log(answer.hashes.result);   // sha256:...
```

Install `@arxo/law@0.4.2` and `@arxo/canon-fr-benefits@0.1.2` to run this snippet.
This is a technical zero-rent probe dated 15 June 2024 with explicit facts and
the selected `PpPlancherFinal` reading. **EUR 20.17 is a formula amount, separate
from a final payable benefit.** See [the complete example](examples/french-benefits.mjs)
and [the case description](examples/README.md).
An answer establishes what follows from the selected model and supplied facts;
its proof graph is not a claim that the model captures every real-world rule.

## Choose a package

<!-- catalog:featured:start -->

| Package | Observed `latest` | Use it for |
|---|---|---|
| [@arxo/law](https://www.npmjs.com/package/@arxo/law) | 0.4.2 | Open a canon and ask a question |
| [@arxo/law-engine](https://www.npmjs.com/package/@arxo/law-engine) | 0.5.2 | Compile sources and embed the WebAssembly evaluator |
| [@arxo/law-types](https://www.npmjs.com/package/@arxo/law-types) | 0.3.2 | TypeScript document and diagnostic types |
| [@arxo/law-client](https://www.npmjs.com/package/@arxo/law-client) | 0.3.2 | Typed MCP and registry client |
| [@arxo/law-forms](https://www.npmjs.com/package/@arxo/law-forms) | 0.3.2 | Question forms and structural case assembly |
| [@arxo/cli](https://www.npmjs.com/package/@arxo/cli) | 0.2.2 | Install the law command |
| [create-arxo](https://www.npmjs.com/package/create-arxo) | 0.3.1 | Scaffold a TypeScript project |

<!-- catalog:featured:end -->

See the [full catalogue](docs/packages.md) for canon packages, MCP slices,
platform dependencies, publication dates and observation times.
Versions belong to individual packages. The catalogue observes published
artefacts; it does not certify engine correctness or corpus completeness.
The examples' tested dependency set is pinned in [package-lock.json](package-lock.json).
Known package limitations are recorded in [the compatibility notes](docs/compatibility.md).

## CLI and editors

```sh
npm install -g @arxo/cli
law --help
```

The npm CLI currently targets macOS ARM64 and Linux x64. Downloadable archives
and checksums are maintained in [law-releases](https://github.com/arxohq/law-releases).
The [VS Code and Cursor extension](https://github.com/arxohq/arxo-vscode) adds
syntax support, diagnostics and compiler-backed hints for `.law` files.

## Explore and contribute

- [Compiler diagnostics](examples/compiler.mjs): check a small rule, fix a typo and compile it.
- [Your own rule](examples/own-rule.mjs): compile sources, inspect a missing fact and compare replay bytes.
- [French benefits](examples/french-benefits.mjs): load a pinned model and calculate its explicit demonstration case.
- [Public canons and integrations](docs/ecosystem.md): models, repositories and installation routes.
- [Report an issue](https://github.com/arxohq/law/issues): include package versions and a small reproducible input.
- [Contribute](CONTRIBUTING.md): documentation, examples and catalogue corrections.

Read more at [arxo.io](https://www.arxo.io/) and [docs.arxo.io](https://docs.arxo.io/).

The files in this repository are licensed under [Apache-2.0](LICENSE).
Linked projects and installed packages carry their own notices and licences.
