# Write your first rule

[← Arxo Law](../README.md) · [Run a model](run-a-model.md) · [Publish a package](publish-package.md) · [Connect MCP](connect-mcp.md)

Start in the cloned repository with Node.js 20 or newer:

```sh
npm ci --ignore-scripts
npm start
```

You should see `adult = yes`, the applied rule `Adult`, a missing-fact answer
and `identical evaluation bytes` on replay.

## Read the rule

[examples/age.law](../examples/age.law) declares a person, an age fact and an
adulthood relation. Its rule is:

```law
rule Adult(p: Person, y: Integer) strict {
  when age(p, y);
  when y >= 18;
  then adult(p);
}
```

This is a synthetic language example. It does not model any jurisdiction's
age or capacity law.

## Change one fact

```sh
npm start -- --age 16
```

The answer is `unknown`: the supplied age does not satisfy
the rule. This model contains no rule concluding the opposite. Missing
evidence and an explicit negative conclusion are different statuses.

Now open `examples/age.law`, change `y >= 18` to `y >= 21`, and run
`npm start` again. Alice's supplied age is still 20, so the answer changes.
Change the threshold back before running the repository's baseline tests.

The [JavaScript entry](../examples/own-rule.mjs) shows the whole path: read
source, compile it, open the local model, supply facts, ask a question and
compare the repeated evaluation bytes. The source is compiled on each run.

## Try compiler diagnostics

```sh
npm run example:compiler
```

This example introduces `aeg` in place of `age`. The compiler reports
`LDC-E2102`; the corrected source checks and compiles. See
[the compiler example](../examples/compiler.mjs).

## Inspect evidence or automate

```sh
npm --silent start -- --json
```

JSON includes `truthStatus`, `rulesApplied`, the full `resultHash`, the
evaluation document's size and the replay comparison. Use `--help` to see
available options. [`npm test`](../CONTRIBUTING.md) checks the fixed baseline.

Next: [run a published model](run-a-model.md),
[publish your rules as a package](publish-package.md) or
[read the package catalogue](packages.md).

## Use the CLI or editor

For command-line package work, install the published CLI:

```sh
npm install -g @arxo/cli
law --help
```

The current CLI platform packages target macOS ARM64 and Linux x64.
The [editor installation guide](install-editor.md) links directly to
Marketplace and Open VSX and explains how to check the installed version.
Arxo Law adds syntax support and compiler-backed tools for `.law` files.
Binary downloads and alternative installation routes are in
[the ecosystem catalogue](ecosystem.md#install-the-cli).
