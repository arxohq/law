# Contributing

Contributions to documentation, runnable examples and the delivery catalogue
are welcome. Open an issue for a reproducible engine or package problem even
while engine source is not available here. Core changes currently require
maintainer integration; there is no public engine-source PR workflow yet.

## Local checks

Use Node.js 20 or newer:

```sh
npm ci --ignore-scripts
npm run check
npm test
```

The examples use installed packages and fixed cases. They do not require a
parent checkout, an Arxo account or access to a hosted runtime.

## Catalogue changes

`catalog/sources.json` owns this catalogue's selection and editorial purposes,
not package versions. Package owners and their published artefacts own the
deliveries; npm and the public GitHub API supply the observed metadata.

```sh
npm run catalog:refresh
npm run check
```

Review changes to `catalog/snapshot.json`, `docs/packages.md`,
`docs/ecosystem.md` and the README catalogue block together. A failed fetch
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
For a missing catalogue entry, provide its public package or repository URL.

Contributions to this repository are under [Apache-2.0](LICENSE).
