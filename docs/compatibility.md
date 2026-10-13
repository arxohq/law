# Tested combinations and observed limitations

The examples were checked on 13 October 2026 with Node.js 20, using
`@arxo/law@0.4.2`, `@arxo/law-engine@0.5.2` and
`@arxo/canon-fr-benefits@0.1.2`. Their complete dependency set is recorded in
[package-lock.json](../package-lock.json). CI checks the same set on Node.js
20 and 22; its actual results are visible in [Checks](https://github.com/arxohq/law/actions/workflows/ci.yml).

## BGB package load

The published `@arxo/canon-bgb-fristen@0.1.13` was observed to fail when loaded
through the core and full modules of `@arxo/law-engine@0.5.2`:

```text
EVALUATION_REQUEST_INVALID: SymbolDecl: unknown field `judgment`
```

The catalogue records that package's npm availability; it does not claim that
this combination is compatible. The runnable starting point in this repository
uses a freshly compiled synthetic model and the French model instead.
No model payload is rewritten to conceal the load failure. BGB examples can
join the tested set once a compatible published combination is checked.

## Scope of a passing check

Passing examples establish those inputs on the pinned dependency set. They do
not validate every package in the catalogue, all runtime platforms or the full
corpus. Catalogue refreshes observe versions and availability without replacing
these example pins or extending their verification claim.
