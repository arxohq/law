# Install Arxo Law in your editor

[← Arxo Law](../README.md) · [Write your first rule](write-rules.md)

## VS Code

Install [Arxo Law from the Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=arxo.law),
or use the VS Code command line:

```sh
code --install-extension arxo.law
```

The extension identifier is **`arxo.law`**. Reload the window after installation.
If `code` is not on your PATH, use the Marketplace link and the editor's Extensions view.

## Cursor and Open VSX

Open [Arxo Law on Open VSX](https://open-vsx.org/extension/arxo/law),
then find `arxo.law` in your editor's Extensions view. If your editor does not
offer the extension, use the versioned VSIX download on the registry page
and **Extensions: Install from VSIX**. Reload the window.

## Open a rule

Open the cloned repository and [examples/age.law](../examples/age.law).
The language mode should be **Arxo Law** and the source should be highlighted.
Run the repository's example in its terminal:

```sh
npm ci --ignore-scripts
npm start
```

Edit the condition and rerun the example as described in
[Write your first rule](write-rules.md). That command uses the repository's
pinned SDK compiler; it is independent of the compiler bundled in the extension.

For a compiler diagnostic in the editor, follow the small package and deliberate
typo in [the published editor walkthrough](https://docs.arxo.io/guide/editor/).

## Add the language server

Release **0.1.3** supports the external `law-lsp` server. It ships alongside
`law` in the [CLI releases](ecosystem.md#install-the-cli). Put `law-lsp` on
PATH or set `law.lsp.path` to its installed location, then reload the editor.
The currently observed native archives target macOS ARM64 and Linux x64.

With the server available, the extension provides language-server diagnostics,
hover, navigation, completion, symbols and formatting. Without it, the bundled
WASM compiler and built-in providers remain available. Native compiler commands
can use the public `law` binary on PATH; `law.lawcPath` also accepts its full path.
The extension routes those commands through `law engine`.

## Check which release you installed

[Observed releases](ecosystem.md#install-the-editor) lists Marketplace and
Open VSX separately. The extension's Details view shows your installed version.
The stores can carry different releases; newer development features are not
automatically part of an older published extension.

The published extension highlights sources and exposes compiler-backed tools.
Native formatting and some commands also require the CLI configuration described
in [the extension README](https://github.com/arxohq/arxo-vscode).
The [0.1.3 release](https://github.com/arxohq/arxo-vscode/releases/tag/v0.1.3)
records the packaged runtime, artifact hash and delivery checks.

The public catalogue observes registry metadata. This repository's CI exercises
the SDK examples, not an editor installation. For an editor problem, include
the extension version, editor version, operating system and diagnostic in
[the extension's issues](https://github.com/arxohq/arxo-vscode/issues).
