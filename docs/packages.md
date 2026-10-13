# Published packages

Generated from [the selected public sources](../catalog/sources.json) and
[the captured observations](../catalog/snapshot.json). Package owners retain
their versions; this is a delivery catalogue, not a conformance report.

Last refresh attempt: **2026-10-13T08:51:18.745Z**. Each row records its own successful observation.

An unavailable row retains its previous metadata and observation date. An
observation is not a real-time availability guarantee. npm `latest` is the
selected distribution tag, not the largest version number or a claim about
compatibility. Exact dependency pins and integrity strings are in the JSON snapshot.

## SDK

| Package | Observed `latest` | Purpose | Published (UTC) | Observation (UTC) |
|---|---|---|---|---|
| [@arxo/law](https://www.npmjs.com/package/@arxo/law) | 0.4.2 | Open a canon and ask a question | 2026-10-12T20:17:48.577Z | 2026-10-13T08:51:18.745Z |
| [@arxo/law-engine](https://www.npmjs.com/package/@arxo/law-engine) | 0.5.2 | Compile sources and embed the WebAssembly evaluator | 2026-10-12T20:14:41.020Z | 2026-10-13T08:51:18.745Z |
| [@arxo/law-types](https://www.npmjs.com/package/@arxo/law-types) | 0.3.2 | TypeScript document and diagnostic types | 2026-10-12T20:13:16.538Z | 2026-10-13T08:51:18.745Z |
| [@arxo/law-client](https://www.npmjs.com/package/@arxo/law-client) | 0.3.2 | Typed MCP and registry client | 2026-10-12T20:17:02.832Z | 2026-10-13T08:51:18.745Z |
| [@arxo/law-forms](https://www.npmjs.com/package/@arxo/law-forms) | 0.3.2 | Question forms and structural case assembly | 2026-10-12T20:19:18.910Z | 2026-10-13T08:51:18.745Z |

## CLI

| Package | Observed `latest` | Purpose | Published (UTC) | Observation (UTC) |
|---|---|---|---|---|
| [@arxo/cli](https://www.npmjs.com/package/@arxo/cli) | 0.2.2 | Install the law command | 2026-10-12T16:37:55.336Z | 2026-10-13T08:51:18.745Z |
| [create-arxo](https://www.npmjs.com/package/create-arxo) | 0.3.1 | Scaffold a TypeScript project | 2026-10-12T10:19:47.939Z | 2026-10-13T08:51:18.745Z |

## Canons

| Package | Observed `latest` | Purpose | Published (UTC) | Observation (UTC) |
|---|---|---|---|---|
| [@arxo/canon-bgb-fristen](https://www.npmjs.com/package/@arxo/canon-bgb-fristen) | 0.1.13 | German Civil Code period and deadline model | 2026-10-10T13:53:40.077Z | 2026-10-13T08:51:18.745Z |
| [@arxo/canon-fr-benefits](https://www.npmjs.com/package/@arxo/canon-fr-benefits) | 0.1.2 | Selected French benefit models | 2026-10-12T22:23:56.825Z | 2026-10-13T08:51:18.745Z |
| [@arxo/canon-ogpo-vts](https://www.npmjs.com/package/@arxo/canon-ogpo-vts) | 0.1.10 | Pinned Kazakhstan OGPO vehicle-insurance model | 2026-10-10T13:53:25.715Z | 2026-10-13T08:51:18.745Z |
| [@arxo/canon-swift-lilliput](https://www.npmjs.com/package/@arxo/canon-swift-lilliput) | 0.1.10 | Fictional Lilliput rules for learning | 2026-10-10T13:54:55.460Z | 2026-10-13T08:51:18.745Z |
| [@arxo/canon-unidroit-picc](https://www.npmjs.com/package/@arxo/canon-unidroit-picc) | 0.1.11 | UNIDROIT PICC models | 2026-10-10T13:53:20.915Z | 2026-10-13T08:51:18.745Z |

## MCP

| Package | Observed `latest` | Purpose | Published (UTC) | Observation (UTC) |
|---|---|---|---|---|
| [@arxo/mcp-charter](https://www.npmjs.com/package/@arxo/mcp-charter) | 0.1.7 | United Nations Charter slice | 2026-10-10T14:11:35.375Z | 2026-10-13T08:51:18.745Z |
| [@arxo/mcp-code-civil](https://www.npmjs.com/package/@arxo/mcp-code-civil) | 0.1.9 | French Civil Code slice | 2026-10-10T14:09:22.163Z | 2026-10-13T08:51:18.745Z |
| [@arxo/mcp-de-bgb](https://www.npmjs.com/package/@arxo/mcp-de-bgb) | 0.1.8 | German Civil Code slice | 2026-10-10T14:09:22.201Z | 2026-10-13T08:51:18.745Z |
| [@arxo/mcp-picc](https://www.npmjs.com/package/@arxo/mcp-picc) | 0.3.9 | UNIDROIT PICC slice | 2026-10-10T14:05:57.337Z | 2026-10-13T08:51:18.745Z |

## Platform dependencies

| Package | Observed `latest` | Purpose | Published (UTC) | Observation (UTC) |
|---|---|---|---|---|
| [@arxo/cli-darwin-arm64](https://www.npmjs.com/package/@arxo/cli-darwin-arm64) | 0.2.2 | cli binary for darwin-arm64 | 2026-10-12T16:37:00.796Z | 2026-10-13T08:51:18.745Z |
| [@arxo/cli-linux-x64](https://www.npmjs.com/package/@arxo/cli-linux-x64) | 0.2.2 | cli binary for linux-x64 | 2026-10-12T16:37:04.932Z | 2026-10-13T08:51:18.745Z |
| [@arxo/mcp-host-darwin-arm64](https://www.npmjs.com/package/@arxo/mcp-host-darwin-arm64) | 0.4.1 | mcp-host binary for darwin-arm64 | 2026-10-12T10:13:46.720Z | 2026-10-13T08:51:18.745Z |
| [@arxo/mcp-host-linux-x64](https://www.npmjs.com/package/@arxo/mcp-host-linux-x64) | 0.4.1 | mcp-host binary for linux-x64 | 2026-10-12T10:26:49.436Z | 2026-10-13T08:51:18.745Z |

## Using the catalogue

Start with `@arxo/law` to ask a model a question, `@arxo/law-engine` to compile
sources or embed the evaluator, or `@arxo/cli` for a command-line project.
Canon packages contain particular models; MCP packages contain particular slices.
Platform dependencies are installed by their launchers and are normally not chosen manually.

For example, a slice pins its own MCP host version. A newer host release does
not switch that slice automatically. The examples use a tested exact dependency
set in [package-lock.json](../package-lock.json), independently of later catalogue updates.

See [tested combinations and observed limitations](compatibility.md) before
assuming that independently published packages are mutually compatible.

Install an MCP slice with, for example:

```sh
claude mcp add arxo-bgb -- npx -y @arxo/mcp-de-bgb
```

Review the linked package README for its supported platforms and selected models.

To refresh the catalogue, follow [the contribution instructions](../CONTRIBUTING.md).
