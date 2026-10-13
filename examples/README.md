# Examples: run, inspect, change

[← Arxo Law](../README.md)

With Node.js 20 or newer, from the repository root:

```sh
npm ci --ignore-scripts
npm start
```

| Example | Run | Expect | Change next |
|---|---|---|---|
| [Your first rule](../docs/write-rules.md) | `npm start` | Adult = yes; missing age = unknown; replay identical | `npm start -- --age 16` or edit [age.law](age.law) |
| [Compiler](../docs/write-rules.md#try-compiler-diagnostics) | `npm run example:compiler` | `LDC-E2102` for a typo; corrected source compiles | Inspect [compiler.mjs](compiler.mjs) and the source |
| [French model](../docs/run-a-model.md) | `npm run example:benefits` | 20.17 EUR as the supplied formula amount | `npm run example:benefits -- --rent 300` |

`npm run examples` runs all three. Readable output comes first; use `--json`
for complete result summaries and hashes:

```sh
npm --silent start -- --json
npm --silent run examples -- --json
```

The examples execute locally after installation using the exact package
versions in [package-lock.json](../package-lock.json). Dates and model
policies are explicit inputs. See [compatibility notes](../docs/compatibility.md)
for the tested set and the observed BGB package-load issue.

The age rule is synthetic. The French case is a teaching and integration probe;
its formula amount does not determine a person's final payable benefit.
[`npm test`](../CONTRIBUTING.md) checks the supplied baseline and CLI behaviour.
