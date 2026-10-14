<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/cover-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="docs/assets/cover-light.svg">
  <img src="docs/assets/cover-light.svg" width="1440" alt="A highlighted rule connects to a result through a visible trail of evidence.">
</picture>

# Arxo Law

**Run a rule. See the answer and why. Replay the result.**

[![Checks](https://github.com/arxohq/law/actions/workflows/ci.yml/badge.svg)](https://github.com/arxohq/law/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@arxo/law)](https://www.npmjs.com/package/@arxo/law)

[Try in browser](https://french-benefits.law.arxo.io/) · [Run locally](#run-locally) ·
[Write rules](docs/write-rules.md) · [Install in VS Code](https://marketplace.visualstudio.com/items?itemName=arxo.law) ·
[Connect MCP](docs/connect-mcp.md)

SDK and CLI packages are available. [Engine source is planned](docs/source-availability.md).

## Run locally

With **Node.js 20 or newer**:

```sh
git clone \
  https://github.com/arxohq/law \
  arxo-law
cd arxo-law
npm ci --ignore-scripts
npm start
```

```text
Your first rule
  Rule      Adult
  Input     Alice, age 20
  Answer    adult = yes
  Why       Applied Adult
  Missing   unknown (no age fact)
  Replay    identical evaluation bytes
```

Try **`npm start -- --age 16`**. The answer becomes unknown: this model has no
rule establishing adulthood below 18. Then edit [the rule](examples/age.law)
and run again. [Walk through the example →](docs/write-rules.md)

## Choose your next step

| I want to… | Start here |
|---|---|
| Run an existing model | [French housing-aid formula: input → answer → evidence](docs/run-a-model.md) |
| Write my own rules | [A small `.law` source, compiler diagnostics and replay](docs/write-rules.md) |
| Work in an editor | [Install Arxo Law in VS Code or through Open VSX](docs/install-editor.md) |
| Use Python | [Published Python SDK and canon packages](docs/packages.md#python-pypi) |
| Use a model with an assistant | [Install a specific MCP slice and verify the connection](docs/connect-mcp.md) |

## How an answer is built

<img src="docs/assets/answer-flow.svg" width="440" alt="Age 20 and the rule age at least 18 produce adult yes; the explanation names Adult and the same input replays identically.">

Arxo compiles rules into a model, applies the supplied facts and attaches an
explanation and canonical evaluation document. The examples execute locally
after installation. Law is the first domain; standards and other rulebooks
use the same machinery. A proof explains the selected model's answer.

## Packages

<!-- catalog:featured:start -->

| Package | Latest | Start with |
|---|---|---|
| [@arxo/law](https://www.npmjs.com/package/@arxo/law) | 0.4.4 | [Run a model](docs/run-a-model.md) |
| [@arxo/law-engine](https://www.npmjs.com/package/@arxo/law-engine) | 0.5.4 | [Write rules](docs/write-rules.md) |
| [@arxo/cli](https://www.npmjs.com/package/@arxo/cli) | 0.2.5 | [CLI and editor](docs/write-rules.md#use-the-cli-or-editor) |

<!-- catalog:featured:end -->

[npm and Python packages →](docs/packages.md) ·
[Editors, installations, browser tools and learning →](docs/ecosystem.md)

## Explore and contribute

- `npm run examples` — run all three examples with readable output.
- `npm --silent start -- --json` — inspect the result summary, statuses and full hash.
- [Example commands and expected results](examples/README.md).
- [Report a problem](https://github.com/arxohq/law/issues) or [ask a question](https://github.com/arxohq/law/discussions).
- [Contribution guide](CONTRIBUTING.md) · [source availability](docs/source-availability.md).

## Follow Arxo

<!-- catalog:community:start -->

[YouTube](https://www.youtube.com/@arxohq) · [X](https://x.com/arxohq) · [Telegram](https://t.me/arxoio) · [DEV.to](https://dev.to/arxo) · [Medium](https://medium.com/@arxo) · [Instagram](https://www.instagram.com/arxo.io/)

<!-- catalog:community:end -->

[Community](https://community.arxo.io/) · [Books](https://books.arxo.io/) · [Writings](https://blog.arxo.io/)

[arxo.io](https://www.arxo.io/) · [Documentation](https://docs.arxo.io/) · [Apache-2.0](LICENSE)
