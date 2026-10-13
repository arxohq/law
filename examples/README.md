# Runnable examples

From the repository root, with Node.js 20 or newer:

```sh
npm ci --ignore-scripts
npm run examples
```

All three examples execute locally using the exact versions in the lockfile.
Dates and policies are fixed inputs, never the current date.

| Example | Command | What it demonstrates |
|---|---|---|
| [Your own rule](own-rule.mjs) | `npm run example:rule` | Compile a small source model, supply a fact, omit it and compare evaluation bytes on replay |
| [Compiler](compiler.mjs) | `npm run example:compiler` | A diagnostic for an undeclared predicate, followed by a successful check and compilation |
| [French benefit formula](french-benefits.mjs) | `npm run example:benefits` | Loading a pinned model with its imports and evaluating an explicit supplied case |

The synthetic [age rule](age.law) declares that a person aged at least 18 is
an adult within this model. With an age of 20 it establishes the conclusion;
without an age fact it does not guess. The rule is a small language example,
not a model of any jurisdiction's capacity or age law.

The French case is the package's technical zero-rent APL probe dated 15 June
2024: one person, no dependants, metropolitan zone II, supplied resources of
EUR 4,000 and the explicit `PpPlancherFinal` reading. The computed **EUR 20.17
is a formula amount, separate from a final payable benefit**. It is a teaching
and integration example, not a claim about a person's entitlement.

`npm test` checks these behaviours against the installed packages. Tests use
these particular models and inputs; they do not establish corpus completeness.
See [the compatibility notes](../docs/compatibility.md) for a published BGB
package that is currently outside this tested example set.
