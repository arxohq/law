# Connect a model to an assistant

[← Arxo Law](../README.md) · [Run a model](run-a-model.md) · [Write rules](write-rules.md)

A published MCP package starts a selected model slice. Choose the slice you
need from [the catalogue](packages.md#mcp); each has its own pinned model tree
and platform dependencies.

## Add a slice to Claude Code

With Node.js 20 or newer and Claude Code installed, the observed UNIDROIT PICC
package can be configured with an exact version:

```sh
claude mcp add arxo-picc -- npx -y @arxo/mcp-picc@0.3.9
claude mcp list
```

Confirm that `arxo-picc` is listed and connected before asking the assistant
to use its tools. Ask which packages and tools this server exposes, then select
a model and give explicit fictional case facts. For example:

```text
Use the arxo-picc server to list the available model packages.
Explain which facts a supported example needs before evaluating it.
```

Configuration steps are a connection recipe. The repository's automated
examples validate local SDK execution; they do not run Claude Code or certify
every MCP slice. The [slice README](https://www.npmjs.com/package/@arxo/mcp-picc)
documents its models and supported platforms.

## Use another MCP client

Configure a local stdio server with command `npx` and arguments
`["-y", "@arxo/mcp-picc@0.3.9"]`. Use the host client's MCP settings and inspect
its connection status. Do not substitute the SDK package as a server command.

## Run your own server

For a deployment you control, start with [Operate](https://docs.arxo.io/operate/):
the guides cover a private HTTP service and a private MCP server, including
configuration, verification and rollback. Compare these routes with the local
SDK in [integration patterns](https://docs.arxo.io/agent-engineering/integration-patterns/).
These are documentation routes; this repository's CI does not test hosted deployments.

## If the connection fails

- Verify that Node.js and `npx` are available to the client process.
- Read the selected package's platform requirements and client error output.
- Check [the catalogue](packages.md) for the observed version. Slices keep
  their own exact host pins; a newer host release does not upgrade them.
- Include the slice version, operating system and connection error in
  [an issue](https://github.com/arxohq/law/issues).

Next: [public model repositories](ecosystem.md) or
[the local SDK example](run-a-model.md).
