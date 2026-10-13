# Choose a package

[← Arxo Law](../README.md)

| I want to… | Start with |
|---|---|
| Run a published model | [Run a model](run-a-model.md) with `@arxo/law` |
| Compile my own rules | [Write rules](write-rules.md) with `@arxo/law-engine` |
| Work in Python | [Python packages](#python-pypi) and the Python SDK guide |
| Connect an assistant | [Connect MCP](connect-mcp.md) with a selected slice |

Last refresh attempt: **2026-10-13 10:49 UTC**.

**Example set** means that exact version is used by this repository's CI examples.
Other entries are observed deliveries with the checks stated below. Each package
has its own version. See [tested combinations](compatibility.md).

## SDK

| Package | Latest | Use it for | Checks |
|---|---|---|---|
| [@arxo/law](https://www.npmjs.com/package/@arxo/law) | 0.4.2 | Open a canon and ask a question | [Example set](compatibility.md) |
| [@arxo/law-engine](https://www.npmjs.com/package/@arxo/law-engine) | 0.5.2 | Compile sources and embed the WebAssembly evaluator | [Example set](compatibility.md) |
| [@arxo/law-types](https://www.npmjs.com/package/@arxo/law-types) | 0.3.2 | TypeScript document and diagnostic types | Not checked here |
| [@arxo/law-client](https://www.npmjs.com/package/@arxo/law-client) | 0.3.2 | Typed MCP and registry client | Not checked here |
| [@arxo/law-forms](https://www.npmjs.com/package/@arxo/law-forms) | 0.3.2 | Question forms and structural case assembly | Not checked here |

## CLI

| Package | Latest | Use it for | Checks |
|---|---|---|---|
| [@arxo/cli](https://www.npmjs.com/package/@arxo/cli) | 0.2.2 | Install the law command | Not checked here |
| [create-arxo](https://www.npmjs.com/package/create-arxo) | 0.3.1 | Scaffold a TypeScript project | Not checked here |

## Canons

| Package | Latest | Use it for | Checks |
|---|---|---|---|
| [@arxo/canon-bgb-fristen](https://www.npmjs.com/package/@arxo/canon-bgb-fristen) | 0.1.13 | German Civil Code period and deadline model | [Model load issue](compatibility.md#bgb-package-load) |
| [@arxo/canon-fr-benefits](https://www.npmjs.com/package/@arxo/canon-fr-benefits) | 0.1.2 | Selected French benefit models | [Example set](compatibility.md) |
| [@arxo/canon-ogpo-vts](https://www.npmjs.com/package/@arxo/canon-ogpo-vts) | 0.1.10 | Pinned Kazakhstan OGPO vehicle-insurance model | Not checked here |
| [@arxo/canon-swift-lilliput](https://www.npmjs.com/package/@arxo/canon-swift-lilliput) | 0.1.10 | Fictional Lilliput rules for learning | Not checked here |
| [@arxo/canon-unidroit-picc](https://www.npmjs.com/package/@arxo/canon-unidroit-picc) | 0.1.11 | UNIDROIT PICC models | Not checked here |

## MCP

| Package | Latest | Use it for | Checks |
|---|---|---|---|
| [@arxo/mcp-charter](https://www.npmjs.com/package/@arxo/mcp-charter) | 0.1.7 | United Nations Charter slice | Not checked here |
| [@arxo/mcp-code-civil](https://www.npmjs.com/package/@arxo/mcp-code-civil) | 0.1.9 | French Civil Code slice | Not checked here |
| [@arxo/mcp-de-bgb](https://www.npmjs.com/package/@arxo/mcp-de-bgb) | 0.1.8 | German Civil Code slice | Not checked here |
| [@arxo/mcp-picc](https://www.npmjs.com/package/@arxo/mcp-picc) | 0.3.9 | UNIDROIT PICC slice | Not checked here |

A slice keeps its own pinned MCP host version.
[Connection instructions →](connect-mcp.md)

## Python (PyPI)

[Python SDK guide](https://docs.arxo.io/build/sdk/python/). Select the canon package as well as the facade.

```sh
pip install arxo arxo-canon-bgb-fristen
```

Check the observed Python requirement and pin the package versions for your application.
The Node.js example set does not validate these Python packages.

| Package | Latest | Python | Use it for |
|---|---|---|---|
| [arxo](https://pypi.org/project/arxo/) | 0.2.0 | >=3.12 | Open a pinned canon and ask a question from Python |
| [arxo-canon-bgb-fristen](https://pypi.org/project/arxo-canon-bgb-fristen/) | 0.1.1 | >=3.12 | German Civil Code period and deadline model |
| [arxo-canon-unidroit-picc](https://pypi.org/project/arxo-canon-unidroit-picc/) | 0.1.0 | >=3.12 | UNIDROIT PICC models |
| [arxo-canon-ogpo-vts](https://pypi.org/project/arxo-canon-ogpo-vts/) | 0.1.0 | >=3.12 | Pinned Kazakhstan OGPO vehicle-insurance model |

<details>
<summary>Platform dependencies — installed by the launchers</summary>

These are normally selected automatically for the operating system and architecture.

| Package | Latest | Use it for | Checks |
|---|---|---|---|
| [@arxo/cli-darwin-arm64](https://www.npmjs.com/package/@arxo/cli-darwin-arm64) | 0.2.2 | cli binary for darwin-arm64 | Not checked here |
| [@arxo/cli-linux-x64](https://www.npmjs.com/package/@arxo/cli-linux-x64) | 0.2.2 | cli binary for linux-x64 | Not checked here |
| [@arxo/mcp-host-darwin-arm64](https://www.npmjs.com/package/@arxo/mcp-host-darwin-arm64) | 0.4.1 | mcp-host binary for darwin-arm64 | Not checked here |
| [@arxo/mcp-host-linux-x64](https://www.npmjs.com/package/@arxo/mcp-host-linux-x64) | 0.4.1 | mcp-host binary for linux-x64 | Not checked here |

</details>

<details>
<summary>Publication dates, observations and package integrity</summary>

| Package | Published (UTC) | Last successful observation (UTC) |
|---|---|---|
| @arxo/law | 2026-10-12T20:17:48.577Z | 2026-10-13T10:49:23.965Z |
| @arxo/law-engine | 2026-10-12T20:14:41.020Z | 2026-10-13T10:49:23.965Z |
| @arxo/law-types | 2026-10-12T20:13:16.538Z | 2026-10-13T10:49:23.965Z |
| @arxo/law-client | 2026-10-12T20:17:02.832Z | 2026-10-13T10:49:23.965Z |
| @arxo/law-forms | 2026-10-12T20:19:18.910Z | 2026-10-13T10:49:23.965Z |
| @arxo/cli | 2026-10-12T16:37:55.336Z | 2026-10-13T10:49:23.965Z |
| create-arxo | 2026-10-12T10:19:47.939Z | 2026-10-13T10:49:23.965Z |
| @arxo/canon-bgb-fristen | 2026-10-10T13:53:40.077Z | 2026-10-13T10:49:23.965Z |
| @arxo/canon-fr-benefits | 2026-10-12T22:23:56.825Z | 2026-10-13T10:49:23.965Z |
| @arxo/canon-ogpo-vts | 2026-10-10T13:53:25.715Z | 2026-10-13T10:49:23.965Z |
| @arxo/canon-swift-lilliput | 2026-10-10T13:54:55.460Z | 2026-10-13T10:49:23.965Z |
| @arxo/canon-unidroit-picc | 2026-10-10T13:53:20.915Z | 2026-10-13T10:49:23.965Z |
| @arxo/mcp-charter | 2026-10-10T14:11:35.375Z | 2026-10-13T10:49:23.965Z |
| @arxo/mcp-code-civil | 2026-10-10T14:09:22.163Z | 2026-10-13T10:49:23.965Z |
| @arxo/mcp-de-bgb | 2026-10-10T14:09:22.201Z | 2026-10-13T10:49:23.965Z |
| @arxo/mcp-picc | 2026-10-10T14:05:57.337Z | 2026-10-13T10:49:23.965Z |
| @arxo/cli-darwin-arm64 | 2026-10-12T16:37:00.796Z | 2026-10-13T10:49:23.965Z |
| @arxo/cli-linux-x64 | 2026-10-12T16:37:04.932Z | 2026-10-13T10:49:23.965Z |
| @arxo/mcp-host-darwin-arm64 | 2026-10-12T10:13:46.720Z | 2026-10-13T10:49:23.965Z |
| @arxo/mcp-host-linux-x64 | 2026-10-12T10:26:49.436Z | 2026-10-13T10:49:23.965Z |
| arxo (PyPI) | 2026-09-21T20:28:19.824263Z | 2026-10-13T10:49:23.965Z |
| arxo-canon-bgb-fristen (PyPI) | 2026-09-21T20:28:21.413232Z | 2026-10-13T10:49:23.965Z |
| arxo-canon-unidroit-picc (PyPI) | 2026-09-21T20:28:24.757029Z | 2026-10-13T10:49:23.965Z |
| arxo-canon-ogpo-vts (PyPI) | 2026-09-21T20:28:23.173718Z | 2026-10-13T10:49:23.965Z |

Full integrity strings and exact dependency pins are in the
[captured snapshot](../catalog/snapshot.json), alongside SHA-256 hashes of PyPI release files.
npm `latest` is a distribution
tag; it does not establish compatibility. When a fetch fails, the version
retains its original observation date and is labelled unavailable.

The [source selection](../catalog/sources.json) is curated. Follow the
[contribution instructions](../CONTRIBUTING.md) to refresh it.

</details>

The [example lockfile](../package-lock.json) pins the runnable examples.
Refreshing the catalogue does not upgrade those examples or validate the full corpus.
