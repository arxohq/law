# Explore the public ecosystem

[← Arxo Law](../README.md)

Choose an editor, installation route, browser tool or learning format.
Last refresh attempt: **2026-10-13 17:51 UTC**.

## Install the editor

[Installation and first steps →](install-editor.md)

| Store | Latest | Use it for |
|---|---|---|
| [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=arxo.law) | 0.1.3 | Arxo Law for VS Code |
| [Open VSX](https://open-vsx.org/extension/arxo/law) | 0.1.3 | Arxo Law through Open VSX |

VS Code command line:

```sh
code --install-extension arxo.law
```

Check the installed version in the extension's Details view. Store releases can differ.
The [editor guide](install-editor.md#check-which-release-you-installed) distinguishes
published features from newer development work.

## Install the CLI

| Route | Start here |
|---|---|
| npm | `npm install -g @arxo/cli` |
| Homebrew | `brew install arxohq/tap/law` · [tap](https://github.com/arxohq/homebrew-tap) |
| APT: Debian and Ubuntu amd64 | [Repository setup](https://packages.arxo.io/) · package `arxo-law` |
| Archive or shell installer | [Release assets and checksums](https://github.com/arxohq/law-releases/releases) |

Follow the [installation guide](https://docs.arxo.io/cli/install/) for platform requirements.
After installation, inspect the command:

```sh
law --help
```

Observed stable binary release: [law-v0.2.2](https://github.com/arxohq/law-releases/releases/tag/law-v0.2.2).

CLI and LSP archives, installers and matching checksums are in
[law-releases](https://github.com/arxohq/law-releases).

## Try in the browser

| Start here | What you can do |
|---|---|
| [Playground](https://docs.arxo.io/play/) | Write and run a small rule in the browser |
| [French benefits lab](https://french-benefits.law.arxo.io/) | Change fictional case facts and inspect the model's answer |
| [Canon catalogue](https://law.arxo.io/) | Choose a public canon hub and explore worked cases |
| [Lens](https://lens.arxo.io/) | Read an answer with its grounds |

## Build and integrate

| Start here | What you can do |
|---|---|
| [Python SDK](https://docs.arxo.io/build/sdk/python/) | Use the Python API over a pinned model |
| [Connect an assistant](https://docs.arxo.io/guide/mcp/) | Connect a client to the public MCP host |
| [Host an HTTP or MCP service](https://docs.arxo.io/operate/) | Follow the deployment and verification guides for your own instance |
| [Integration patterns](https://docs.arxo.io/agent-engineering/integration-patterns/) | Compare SDK, service, generated-module and MCP routes |

## Learn

| Start here | What you can do |
|---|---|
| [Documentation](https://docs.arxo.io/) | Find authoring, application and agent guides |
| [Northbridge course](https://docs.arxo.io/tutorials/northbridge/) | Build a municipal model through lessons and exercises |
| [Formalization Handbook](https://docs.arxo.io/handbook/) | Prepare a source model for review |
| [Books](https://books.arxo.io/) | Read longer introductions and worked examples |
| [Writings](https://blog.arxo.io/) | Read project articles and investigations |

## Public model and tool repositories

| Project | What you can do |
|---|---|
| [arxohq/law-releases](https://github.com/arxohq/law-releases) | CLI and LSP binary archives, installers and checksums |
| [arxohq/homebrew-tap](https://github.com/arxohq/homebrew-tap) | Homebrew formulae |
| [arxohq/arxo-vscode](https://github.com/arxohq/arxo-vscode) | VS Code and Cursor extension source mirror |
| [arxohq/arxo-bgb](https://github.com/arxohq/arxo-bgb) | Executable German Civil Code packages |
| [arxohq/arxo-unidroit-picc](https://github.com/arxohq/arxo-unidroit-picc) | UNIDROIT PICC packages and worked scenarios |
| [arxohq/arxo-charter-1945](https://github.com/arxohq/arxo-charter-1945) | United Nations Charter executable model |
| [arxohq/arxo-ogpo-public](https://github.com/arxohq/arxo-ogpo-public) | Pinned OGPO canon releases and public verification |
| [arxohq/arxo-cnaf](https://github.com/arxohq/arxo-cnaf) | French benefit models and Node.js distribution |
| [arxohq/law-as-code-france-examples](https://github.com/arxohq/law-as-code-france-examples) | Fictional French benefit cases and book examples |
| [arxohq/arxo-wohngeld](https://github.com/arxohq/arxo-wohngeld) | German housing-benefit models and Node.js distribution |
| [arxohq/law-as-code-germany-examples](https://github.com/arxohq/law-as-code-germany-examples) | Fictional German housing-benefit cases and book examples |
| [arxohq/arxo-catala-parity](https://github.com/arxohq/arxo-catala-parity) | Arxo and Catala comparison artefact |

## Other tools

The [integration-pattern guide](https://docs.arxo.io/agent-engineering/integration-patterns/)
also describes generated-code use. No dedicated generated-module distribution is observed here.
Public installation routes for Zed, the desktop app and standalone agent skills
have not been verified by this catalogue.

## Follow and participate

[Ask a question](https://github.com/arxohq/law/discussions) ·
[Report a problem](https://github.com/arxohq/law/issues) ·
[Community](https://community.arxo.io/)

| Channel | What you will find |
|---|---|
| [YouTube](https://www.youtube.com/@arxohq) | Video explanations and tutorials |
| [X](https://x.com/arxohq) | Project posts and updates |
| [Telegram](https://t.me/arxoio) | Russian-language posts |
| [DEV.to](https://dev.to/arxo) | Developer articles |
| [Medium](https://medium.com/@arxo) | Articles and essays |
| [Instagram](https://www.instagram.com/arxo.io/) | Visual stories and examples |

Website and community links are curated entry points. Registry observations
below record publication metadata; they do not establish runtime compatibility.

<details>
<summary>Binary assets and observation details</summary>

Binary observation (UTC): 2026-10-13T17:51:07.486Z.

| Asset | Bytes |
|---|---:|
| [arxo-nix-0.2.2.tar.gz](https://github.com/arxohq/law-releases/releases/download/law-v0.2.2/arxo-nix-0.2.2.tar.gz) | 3190 |
| [install.sh](https://github.com/arxohq/law-releases/releases/download/law-v0.2.2/install.sh) | 2225 |
| [law-0.2.2-aarch64-apple-darwin.tar.gz](https://github.com/arxohq/law-releases/releases/download/law-v0.2.2/law-0.2.2-aarch64-apple-darwin.tar.gz) | 14833003 |
| [law-0.2.2-aarch64-apple-darwin.tar.gz.sha256](https://github.com/arxohq/law-releases/releases/download/law-v0.2.2/law-0.2.2-aarch64-apple-darwin.tar.gz.sha256) | 104 |
| [law-0.2.2-x86_64-unknown-linux-gnu.tar.gz](https://github.com/arxohq/law-releases/releases/download/law-v0.2.2/law-0.2.2-x86_64-unknown-linux-gnu.tar.gz) | 16148873 |
| [law-0.2.2-x86_64-unknown-linux-gnu.tar.gz.sha256](https://github.com/arxohq/law-releases/releases/download/law-v0.2.2/law-0.2.2-x86_64-unknown-linux-gnu.tar.gz.sha256) | 108 |

| Repository | Last successful observation (UTC) |
|---|---|
| arxohq/law-releases | 2026-10-13T17:51:07.486Z |
| arxohq/homebrew-tap | 2026-10-13T17:51:07.486Z |
| arxohq/arxo-vscode | 2026-10-13T17:51:07.486Z |
| arxohq/arxo-bgb | 2026-10-13T17:51:07.486Z |
| arxohq/arxo-unidroit-picc | 2026-10-13T17:51:07.486Z |
| arxohq/arxo-charter-1945 | 2026-10-13T17:51:07.486Z |
| arxohq/arxo-ogpo-public | 2026-10-13T17:51:07.486Z |
| arxohq/arxo-cnaf | 2026-10-13T17:51:07.486Z |
| arxohq/law-as-code-france-examples | 2026-10-13T17:51:07.486Z |
| arxohq/arxo-wohngeld | 2026-10-13T17:51:07.486Z |
| arxohq/law-as-code-germany-examples | 2026-10-13T17:51:07.486Z |
| arxohq/arxo-catala-parity | 2026-10-13T17:51:07.486Z |

| Editor store | Published / updated (UTC) | Last successful observation (UTC) |
|---|---|---|
| marketplace: arxo.law | 2026-10-13T10:47:06.143Z | 2026-10-13T17:51:07.486Z |
| open-vsx: arxo.law | 2026-10-13T10:41:46.338008Z | 2026-10-13T17:51:07.486Z |

Only repositories reported public at the selected address are accepted
as successful observations. Linked projects retain their own licences and notices.

</details>

- [Choose an npm package or MCP slice](packages.md).
- [Visit Arxo](https://www.arxo.io/).
