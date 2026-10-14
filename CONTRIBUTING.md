# Contributing

Contributions to documentation, runnable examples and the delivery catalogue
are welcome. Open an issue for a reproducible engine or package problem even
while engine source is not available here. Core changes currently require
maintainer integration; there is no public engine-source PR workflow yet.

Publishing a package of your own rules is not a contribution to this
repository: it is a release into a registry you own, described in
[Publish your package](docs/publish-package.md). Open an issue here when
that route fails.

## Local checks

Use Node.js 20 or newer:

```sh
npm ci --ignore-scripts
npm run check
npm test
```

The examples use installed packages and fixed cases. They do not require a
parent checkout, an Arxo account or access to a hosted runtime.

`npm start` is the first-run example. Changing its `--age` fact or `.law`
source produces a new answer; baseline expectations belong in tests, not
in the runnable example. Keep readable default output and parseable `--json`
output when changing examples. The [task guides](docs/write-rules.md) explain
how to run, inspect and modify them.

## Catalogue changes

`catalog/sources.json` owns this catalogue's selection and editorial purposes,
not package versions. Package owners and their published artefacts own the
deliveries; npm, PyPI, Visual Studio Marketplace, Open VSX and the public
GitHub API supply the observed metadata. `surfaces` and `community` own
curated public links, not observations of service availability.
Its `knownIssues` entries record an observed package/engine version pair,
with a link to its evidence and recovery guidance. They are not inferred from
a successful publication. The renderer shows example-set membership only
when the observed version matches a direct dependency pin.

```sh
npm run catalog:refresh
npm run check
```

`tools/publish-package.sh` replays the publishing guide with the installed
`law` CLI in a temporary directory; its transcript is the source of the
output blocks in `docs/publish-package.md`.

Review changes to `catalog/snapshot.json`, `docs/packages.md`,
`docs/ecosystem.md` and the README catalogue and community blocks together. A failed fetch
preserves the previous successful observation, marks it as unavailable and
returns a nonzero exit code. It does not turn a previous version into a fresh
observation. `npm run catalog:check` verifies the rendered files offline.

Public GitHub requests are unauthenticated by default. For local rate-limit
relief an optional `GITHUB_TOKEN` may be provided; only metadata for explicitly
selected repositories whose API reports `private: false` is retained.

To update example dependencies, edit their exact versions, regenerate the
lockfile and rerun the examples. Catalogue refreshes do not alter that lock.

## Reporting a problem

Include the package and version, Node.js version, operating system, exact
model/case input and the observed status or diagnostic. Keep dates, calendar
policies and model readings explicit. Use fictional or redacted case facts.
For a missing catalogue entry, provide its public package, editor listing,
repository or website URL.

Contributions to this repository are under [Apache-2.0](LICENSE).
