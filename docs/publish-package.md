# Publish your package

[← Arxo Law](../README.md) · [Write rules](write-rules.md) · [Run a model](run-a-model.md) · [Packages](packages.md)

This guide takes a package of rules from an empty directory to a release that
another project installs by name and exact version. The registry is a
directory you own: a folder in your git repository or files on a static HTTPS
host. No Arxo account, token or hosted service is involved, and none is
needed. The public Arxo registry is a curated distribution channel, not a
condition for using your package.

The example is a parcel tariff. Law is the first domain on Arxo, but the
machinery is the same for a tariff, a standard, a game rulebook or a
calculation: rules with a provenance, scenarios with expected answers, a
release with hashes, and an answer with its proof.

**Verified with:** `law` 0.2.6, published as `@arxo/cli` 0.2.6 (`law version`
prints the tool version, the semantics line `law.core/0.2` and the hash of
the binary). Every output block
below is the verbatim transcript of [`tools/publish-package.sh`](../tools/publish-package.sh),
which replays the whole route in a temporary directory:

```sh
sh tools/publish-package.sh
```

## What a package is

A **package** is a directory with a manifest `law.toml`, one or more `.law`
files with the same header, scenarios under `tests/`, and a lock `law.lock`.
Its identity is the triple in the header:

```law
language "law.core" version "0.2";
package acme.parcel_tariff version "0.1.0";
namespace "urn:law:acme:parcel_tariff";
```

- **Name** `<publisher>.<subject>[.<module>]`: lower-case segments separated
  by dots. The first segment is your publisher prefix; keep it for all your
  packages. Consumers address your declarations as
  `acme.parcel_tariff::fee`.
- **Namespace** is a URN that `law init` derives from the name. It is the
  stable prefix of every identifier in the model and must match the manifest.
- **Version** is exact. Registries never rewrite a published version; a
  changed model is the next version.
- **Interface:** only `pub` declarations are visible to consumers. Everything
  else is private to the package and may change without notice.

A package is not a **case**. A case (`law init <dir>` without `--template`)
holds facts and asks questions; it pins packages and is not published. A
package (`law init <dir> --template package`) holds rules and is what you
publish.

## 1. Author the package

```sh
law init tariff --name acme.parcel_tariff --template package
```

```text
tariff: law.toml, source.law
created current lock from source and artifact
```

Replace `tariff/source.law` with the tariff. Facts the consumer supplies are
`kind empirical`; conclusions of the rules are `kind institutional`.

```law
language "law.core" version "0.2";
package acme.parcel_tariff version "0.1.0";
namespace "urn:law:acme:parcel_tariff";

pub entity Shipment { label en unofficial "Shipment"; }

pub relation weight_kg(s: Shipment, kg: Decimal) kind empirical {
    label en unofficial "shipment weight, kg";
}
pub relation fee(s: Shipment, amount: Decimal) kind institutional {
    label en unofficial "shipping fee under the tariff";
}

rule BaseFee(s: Shipment, kg: Decimal) strict {
    label en official "up to 2 kg inclusive: base fee 500";
    when weight_kg(s, kg);
    when kg <= 2.0;
    then fee(s, 500.0);
}

rule HeavyFee(s: Shipment, kg: Decimal) strict {
    label en official "over 2 kg: 500 plus 150 per kilogram above 2";
    when weight_kg(s, kg);
    when kg > 2.0;
    then fee(s, 500.0 + (kg - 2.0) * 150.0);
}
```

A real package names its source: each rule carries a provenance annotation
pointing at the text it formalises. The [rule-writing guide](write-rules.md)
and the language reference on [docs.arxo.io](https://docs.arxo.io/) show
the forms.

### Scenarios with expected answers

Work the expectations out from the tariff text **before** running anything:
5 kg is 500 + 3 × 150 = 950; exactly 2 kg is 500. `tariff/tests/tariff.lawtest`:

```law
language "law.core" version "0.2";
package acme.parcel_tariff version "0.1.0";
namespace "urn:law:acme:parcel_tariff";

test "urn:query:acme-parcel-tariff-t01-heavy" {
    given {
        context { legal_time @2026-10-01; decision_time @2026-10-01T00:00:00Z; knowledge_time @2026-10-01T00:00:00Z; timezone "UTC"; }
        assert "w": weight_kg(entity_ref("urn:case:acme:box-1"), 5.0) { origin case_input; }
    }
    evaluate truth(fee(entity_ref("urn:case:acme:box-1"), 950.0));
    expect result_kind == PROPOSITION;
    expect truth_status == TRUE_ONLY;
    expect evaluation_status == COMPUTED;
}

test "urn:query:acme-parcel-tariff-t02-base" {
    given {
        context { legal_time @2026-10-01; decision_time @2026-10-01T00:00:00Z; knowledge_time @2026-10-01T00:00:00Z; timezone "UTC"; }
        assert "w": weight_kg(entity_ref("urn:case:acme:box-2"), 2.0) { origin case_input; }
    }
    evaluate truth(fee(entity_ref("urn:case:acme:box-2"), 500.0));
    expect result_kind == PROPOSITION;
    expect truth_status == TRUE_ONLY;
    expect evaluation_status == COMPUTED;
}
```

Declare the suite in `tariff/law.toml`. Scenarios are data of the manifest:
a `.lawtest` file under `tests/` that no `[[tests]]` entry names is an error,
not a silently skipped file.

```toml
[features]
semanticLayer = "L1"

[[tests]]
family = "acme_parcel_tariff"
suites = ["tests/tariff.lawtest"]
world = ["acme.parcel_tariff"]
```

### Check, lock, test

```sh
cd tariff
law engine check .
law engine lock . --write
law test
```

```text
check OK: .

(no dependency changes)
written ./law.lock

law test acme.parcel_tariff: world acme.parcel_tariff
  ok   [acme_parcel_tariff] tests/tariff.lawtest / urn:query:acme-parcel-tariff-t01-heavy
  ok   [acme_parcel_tariff] tests/tariff.lawtest / urn:query:acme-parcel-tariff-t02-base
total: 2 checked, 2 passed, 0 failed, 0 not run; code 0
```

`law engine check` is the static check: types, names, the header against
the manifest. `law engine lock . --write` records the hash of the source and
of the compiled model in `law.lock`; the lock is the identity a release
carries, so rerun it after every edit. `law test` executes the scenarios over
the pinned world. Exit code 0 means every selected scenario passed; 1 means a
failure; 2 means something did not run.

## 2. Pack and publish

```sh
law pack --project tariff --out artifacts/parcel-tariff-0.1.0
```

```text
acme.parcel_tariff@0.1.0 → artifacts/parcel-tariff-0.1.0: contentHash sha256:5f3bbf8e96a42e0b056bc2719c3532e38c45b8e751d0a53d7e59ebe78be40584, worldHash sha256:5f3bbf8e96a42e0b056bc2719c3532e38c45b8e751d0a53d7e59ebe78be40584, 3 files
```

The artifact directory holds the compiled model (`package.lawir.json`), the
world the resolver assembles for it (`world.lawir.json`), the lock, any
resources the lock pins, and `release.json` with the hash of each file:

```json
{
  "contentHash": "sha256:5f3bbf8e96a42e0b056bc2719c3532e38c45b8e751d0a53d7e59ebe78be40584",
  "dependencies": [],
  "features": [
    "core-executable"
  ],
  "files": {
    "law.lock": "sha256:aaf80d94ee6ea2cbc12bf903bf43ca1c47ca099e45af940ac4981dab97899949",
    "package.lawir.json": "sha256:5f3bbf8e96a42e0b056bc2719c3532e38c45b8e751d0a53d7e59ebe78be40584",
    "world.lawir.json": "sha256:5f3bbf8e96a42e0b056bc2719c3532e38c45b8e751d0a53d7e59ebe78be40584"
  },
  "format": "law.package-release/0.1",
  "languageSemantics": "law.core/0.2.11",
  "name": "acme.parcel_tariff",
  "namespace": "urn:law:acme:parcel_tariff",
  "resources": [],
  "sourceHash": "sha256:fe1db7fed8bc8dfe5c3764a42e65dcf2203347afa862eef896fcb083cee8c612",
  "version": "0.1.0",
  "worldHash": "sha256:5f3bbf8e96a42e0b056bc2719c3532e38c45b8e751d0a53d7e59ebe78be40584"
}
```

`pack` is offline and deterministic. It refuses when the source changed
after the lock was written (`LPK-E0605`, rerun `law engine lock . --write`),
when `--out` is not a new directory, and for a case with rules at its root.
It does **not** run your scenarios: run `law test` first.

Publish into an empty directory. The directory becomes a registry with the
identifier you give it; the identifier, not the path, is what consumers pin.

```sh
mkdir registry
law publish artifacts/parcel-tariff-0.1.0 --registry acme=registry
```

```text
registry acme created: registry
acme.parcel_tariff@0.1.0 → acme (registry): contentHash sha256:5f3bbf8e96a42e0b056bc2719c3532e38c45b8e751d0a53d7e59ebe78be40584, worldHash sha256:5f3bbf8e96a42e0b056bc2719c3532e38c45b8e751d0a53d7e59ebe78be40584
versions acme.parcel_tariff: 0.1.0
changed: p/acme.parcel_tariff/0.1.0/package.lawir.json
changed: p/acme.parcel_tariff/0.1.0/world.lawir.json
changed: p/acme.parcel_tariff/0.1.0.json
```

```text
registry/registry.json
registry/p/acme.parcel_tariff/versions.json
registry/p/acme.parcel_tariff/0.1.0.json
registry/p/acme.parcel_tariff/0.1.0/package.lawir.json
registry/p/acme.parcel_tariff/0.1.0/world.lawir.json
```

`registry.json` names the registry and its layout:

```json
{
  "layout": {
    "descriptor": "p/<name>/<version>.json",
    "package": "p/<name>/<version>/package.lawir.json",
    "resource": "r/<algo>/<hex>",
    "versions": "p/<name>/versions.json",
    "world": "p/<name>/<version>/world.lawir.json"
  },
  "registryId": "acme",
  "specVersion": "0.2"
}
```

`publish` writes only into a directory: an empty one, or an existing registry
whose `registry.json` carries the same identifier. There is no upload. Keep
`registry/` under version control and commit each publication as one commit;
a consumer that clones a commit gets exactly that generation.

## 3. Install it from another project

A consumer is a case project. `--from acme` names the publisher; without it
the CLI looks for the package in the public `arxo` registry and does not
find it. `--registry acme=<path>` says where that publisher's registry is.

```sh
law init consumer --name demo.consumer
law add acme.parcel_tariff@0.1.0 --project consumer --from acme --registry acme=registry
```

```text
acme ← registry (--registry)
+ acme.parcel_tariff 0.1.0
exports (3): Shipment, fee, weight_kg
changed: .law/transport.json
changed: deps/acme.parcel_tariff.lawir.json
changed: law.lock
changed: law.toml
changed: package.law
```

One transaction pinned the exact version and its hashes in `law.lock`,
copied the model into `deps/`, added the dependency to `law.toml` and the
`import` to `package.law`. The lock records whose release this is:

```json
"packages": [
  {
    "artifactHash": "sha256:5f3bbf8e96a42e0b056bc2719c3532e38c45b8e751d0a53d7e59ebe78be40584",
    "features": ["core-executable"],
    "name": "acme.parcel_tariff",
    "namespace": "urn:law:acme:parcel_tariff",
    "registryId": "acme",
    "resolverUri": "registry://acme/acme.parcel_tariff/0.1.0",
    "sourceHash": "sha256:fe1db7fed8bc8dfe5c3764a42e65dcf2203347afa862eef896fcb083cee8c612",
    "version": "0.1.0"
  }
]
```

Write the case in `consumer/main.lawcase` and ask:

```law
language "law.core" version "0.2";
package demo.consumer version "0.1.0";
namespace "urn:law:demo:consumer";

case Main {
    context { legal_time @2026-10-01; decision_time @2026-10-01T00:00:00Z; knowledge_time @2026-10-01T00:00:00Z; timezone "UTC"; }
    assert "w": acme.parcel_tariff::weight_kg(entity_ref("urn:case:demo:box-1"), 5.0) { origin case_input; }
}
```

```sh
cd consumer
law ask --query 'evaluate truth(acme.parcel_tariff::fee(entity_ref("urn:case:demo:box-1"), 950.0));' --query-id q1 --format text
```

The answer is established (`TRUE_ONLY`, `COMPUTED`) by the rule `HeavyFee`
from the case fact `weight_kg(box-1, 5)`; the footer carries the
`resultHash` of the evaluation and the hash of the program that produced it.
Without `--format text` the command prints the full evaluation document as
JSON: `results[0].truthStatus`, `rulesApplied`, the proof and the manifest.
The readable projection is produced by the verbalisation pack bundled with
the CLI, which today is Russian; the JSON document is language-neutral.

Offline installation restores `deps/` from the lock and the registry, then
verifies that the bytes match the pins:

```sh
rm -rf consumer/deps
law install --project consumer --registry acme=registry
law install --project consumer --offline
```

```text
acme ← registry (--registry)
changed: deps/acme.parcel_tariff.lawir.json

all in place: deps/ and resources already match law.lock
no changes
```

`--offline` exists only for `install`; `add` and `update` must read the
registry's descriptors to build the closure. With nothing in `deps/`,
`install --offline` refuses (`LPK-E0103`) rather than guessing.

## 4. A package that depends on yours

A second package imports the first one. Add the dependency, write the rules
over the imported declarations, lock, test, pack:

```sh
law init surcharge --name acme.parcel_surcharge --template package
law add acme.parcel_tariff@0.1.0 --project surcharge --from acme --registry acme=registry
```

```text
acme ← registry (--registry)
+ acme.parcel_tariff 0.1.0
exports (3): Shipment, fee, weight_kg
changed: .law/transport.json
changed: deps/acme.parcel_tariff.lawir.json
changed: law.lock
changed: law.toml
changed: source.law
```

Append to `surcharge/source.law` (the `import` line is already there):

```law
pub relation fragile(s: acme.parcel_tariff::Shipment) kind empirical {
    label en unofficial "shipment is marked fragile";
}
pub relation total_fee(s: acme.parcel_tariff::Shipment, amount: Decimal) kind institutional {
    label en unofficial "fee including the fragile surcharge";
}

rule FragileSurcharge(s: acme.parcel_tariff::Shipment, base: Decimal) strict {
    label en official "a fragile shipment pays the tariff fee plus 200";
    when acme.parcel_tariff::fee(s, base);
    when fragile(s);
    then total_fee(s, base + 200.0);
}
```

A scenario's `world` lists the package first and its dependencies after it:

```toml
[[tests]]
family = "acme_parcel_surcharge"
suites = ["tests/surcharge.lawtest"]
world = ["acme.parcel_surcharge", "acme.parcel_tariff"]
```

```text
law test acme.parcel_surcharge: world acme.parcel_surcharge, acme.parcel_tariff
  ok   [acme_parcel_surcharge] tests/surcharge.lawtest / urn:query:acme-parcel-surcharge-t01-fragile-heavy
total: 1 checked, 1 passed, 0 failed, 0 not run; code 0
```

```text
acme.parcel_surcharge@0.1.0 → artifacts/parcel-surcharge-0.1.0: contentHash sha256:c01c9f15ca23eac1369327ea7ec9880a73f2893a37ad10a879f4bd4715644ff5, worldHash sha256:ec3c245dbc537b4911bd444e2a72ca500f7cc7d941e0b39e0922760f5ba6042d, 3 files
```

The world hash now differs from the content hash: the world contains both
packages. A registry refuses a package whose dependency it has not published:

```text
law: REFUSAL LPK-E0603: dependency acme.parcel_tariff@0.1.0 declared in registry acme but never published there — publish it first
  → publish the dependency before its consumer
```

Published into `registry`, where the tariff already is, the surcharge installs
with its closure in one step:

```sh
law add acme.parcel_surcharge@0.1.0 --project consumer2 --from acme --registry acme=registry
```

```text
acme ← registry (--registry)
+ acme.parcel_surcharge 0.1.0
+ acme.parcel_tariff 0.1.0
exports (2): fragile, total_fee
changed: .law/transport.json
changed: deps/acme.parcel_surcharge.lawir.json
changed: deps/acme.parcel_tariff.lawir.json
changed: law.lock
changed: law.toml
changed: package.law
```

## 5. Host the registry

The registry is static files. Two ways to serve them:

- **A git repository.** Commit `registry/` (alone, or next to the package
  source). Consumers clone it and pass the path:
  `--registry acme=/path/to/clone/registry`. A private repository works the
  same way; access control is your git host's. The CLI accepts no
  credentials in a registry address and has no HTTP authentication.
- **Static HTTPS.** Upload the directory as is. Consumers name the address
  once in their manifest:

  ```toml
  [registries.acme]
  url = "https://packages.example.org/registry"
  ```

  Then `law add acme.parcel_tariff@0.1.0 --from acme` needs no `--registry`.
  The address must be `https://` and must not redirect; plain `http://` is
  accepted for loopback only. A manifest entry cannot name a local
  directory: a directory registry is always passed with `--registry`.

A consumer can also keep the address in user configuration
(`~/.config/arxo/config.toml`, the same `[registries.<id>]` table) so that
every project on the machine finds it. The order of precedence is the
`--registry` flag, the project manifest, user configuration, then the
built-in address of the public `arxo` registry.

## 6. Sign releases, and what consumers trust

An unsigned registry is usable as is; integrity is checked by hashes against
the lock on every install. For a registry you distribute regularly, sign
releases with a key and let consumers pin the key.

```sh
law key new --out acme.key
law publish artifacts/parcel-tariff-0.1.0 --registry acme=registry-signed --key acme.key
```

```text
key → acme.key (the secret lives only in this file)
public ed25519:40a9977e1bda3afc88bdd1c369d1a298b1c1d4007639f3a84608c13f1afe73b8
```

The key file is created with owner-only permissions and holds the secret;
publish the public half. The consumer names it next to the address:

```toml
[registries.acme]
url = "https://packages.example.org/registry"
trustedKeys = ["ed25519:40a9977e1bda3afc88bdd1c369d1a298b1c1d4007639f3a84608c13f1afe73b8"]
```

With the publisher's key trusted, `add` and `install --offline` proceed as
before. With another key trusted, or with a signed registry and no
`trustedKeys` at all, the release is refused:

```text
law: REFUSAL: package acme.parcel_tariff: signature.keyId ed25519:40a9977e1bda3afc88bdd1c369d1a298b1c1d4007639f3a84608c13f1afe73b8: key not in trustedKeys
```

And with `trustedKeys` configured, an unsigned release is refused:

```text
law: REFUSAL: package acme.parcel_tariff: no signature by a trusted key: the registry declares trusted keys, so an unsigned manifest is refused
```

So a signed registry commits you to publishing the public key where
consumers can find it, and every release of that registry must be signed.
What the signature covers: the descriptor's identity and content hash
(name, version, namespace, `contentHash`, `sourceHash`). The dependency
list, the world hash and the resources are not under the signature; they
are verified by hash against the lock. There is no trust without
configuration: a valid signature from an unknown key is a refusal, not a
warning.

## 7. The next release

A published version is immutable. Change the tariff, bump the version in
`law.toml`, in the `.law` header and in the scenario headers, relock, test,
pack into a new directory and publish into the same registry. What happens
if you skip the bump:

```text
law: REFUSAL LPK-E0601: acme.parcel_tariff@0.1.0 package.lawir.json: registry/p/acme.parcel_tariff/0.1.0/package.lawir.json already holds different bytes at this address — releases are immutable
  → cut the next version; a published release is never rewritten
```

Publishing the same artifact again changes nothing:

```text
acme.parcel_tariff@0.1.0 already published in acme with the same bytes
versions acme.parcel_tariff: 0.1.0
no changes
```

Every package in a project's closure must carry the root's **exact**
`law.core` release (`languageSemantics` in `release.json`, `law.core/0.2.11`
above). A release built for another exact release is refused at
installation, not patched:

```text
law: REFUSAL LPK-E0403: acme.parcel_tariff@0.1.0: the release declares languageSemantics law.core/0.2.10, but the root executes exactly law.core/0.2.11; every closure package must carry the root's exact law.core release, since one world executes under one semantics release
  → take a package version published for the root's exact law.core release (`law outdated` lists the versions); a release of the same major.minor line is not enough
```

When the semantics release changes, rebuild and publish a new version of
each package, dependencies before their consumers. Arxo does not re-issue
your model on your behalf.

On the consumer side nothing moves by itself. `law outdated` reports newer
versions in the registry without touching the lock; `law update
acme.parcel_tariff@0.2.0` moves the pin and its subtree, and `--replay <dir>`
replays saved answers against the candidate before it is applied.

```text
acme ← registry (--registry)
acme.parcel_tariff@0.1.0 [acme]: up to date
```

Version numbers are yours to assign; the registry enforces immutability and
the exact semantics release, not semantic-versioning compatibility of the
model's behaviour.

## 8. Submit to the Arxo registry

Your own registry stays the main route. Submitting to the public `arxo`
registry adds a curated copy: consumers then install your package with
`law add acme.parcel_tariff@0.1.0`, without `--from` or `--registry`.
Requests go to [arxohq/registry-requests](https://github.com/arxohq/registry-requests)
as pull requests. You need no Arxo account or token, only your own public
GitHub repository and a fork of the requests repository.
The outputs in this section are not from `tools/publish-package.sh`: they come
from the intake checks of a test request, with hashes and paths shortened.

**What you bring.** The packed files as assets of a GitHub Release in your
repository, and one file, `requests/<name>-<version>/request.json`, that names
the Release, the commit its tag points to, an SPDX license and the sha256
and size of every file:

```sh
law publish artifacts/acme.parcel_tariff-0.1.0 \
  --request requests/acme.parcel_tariff-0.1.0/request.json --bytes release-assets \
  --source acme/parcel-tariff@parcel-tariff-0.1.0 \
  --commit "$(git rev-parse 'parcel-tariff-0.1.0^{commit}')" --license Apache-2.0
gh release create parcel-tariff-0.1.0 release-assets/* --repo acme/parcel-tariff
```

`law publish --request` arrives with the next CLI release. With `@arxo/cli`
0.2.6, write a candidate (`law publish … --candidate cand.json --bytes
release-assets`) and convert it with `tools/make_request.py` from the
requests repository; the result is the same file. Packages that depend on
each other travel in one request under one Release. Dependencies must already
be in `arxo` or be part of the same request.

**What the machine checks**, on the pull request and without secrets: the
request format and its paths and sizes; that the tag points to the named
commit; that every Release asset, downloaded anonymously, has the named size
and sha256; that the artifacts publish with the pinned `law` into a scratch
copy of the registry, dependencies first, and pass the registry's own gate;
that a scratch project installs them with `law add … --from arxo`; and that
the name prefix (`acme` in `acme.parcel_tariff`) is not reserved for Arxo
packages and not held by another owner. The first accepted request claims a
new prefix for the owner of its source repository. The report arrives as a
comment on the pull request:

```text
### Arxo registry intake — ✅ machine checks passed

| package | version | contentHash | worldHash |
|---|---|---|---|
| `acme.parcel_tariff` | `0.1.0` | `sha256:a126c314…ade0a6` | `sha256:89d3b601…53cc54` |
```

Refusals are named in the same report, and nothing is published:

```text
- acme.parcel_tariff-0.1.0.world.lawir.json: asset has 127392 bytes, the request says 127391
- law: REFUSAL LPK-E0601: acme.parcel_tariff@0.1.0 package.lawir.json: … already holds different bytes at this address — releases are immutable
- acme.parcel_local@0.1.0: dependency acme.leaf@0.1.0 comes from registry `acme`; only `arxo` dependencies are accepted (LPK-E0603)
- kz.parcel_tariff: prefix `kz` is reserved for Arxo packages
- acme.parcel_tariff: prefix `acme` belongs to acme-corp; requests with it come only from that owner
```

**What a person checks.** A maintainer reviews what a machine cannot: that
the license allows redistribution, that the texts the package carries are
public domain, official acts or your own, and that the name and description
say what the package is. Merging the pull request approves exactly the
sha256 in the request. After the merge the files are downloaded once more,
stored under Arxo's control and published; from then on the published
release does not depend on your Release staying online.

**What is not promised.** No review deadline. No automatic acceptance: a
green check is necessary, not sufficient. No publisher signature: packages
in `arxo` are verified by hash, and consumers' `trustedKeys` for `arxo` are
empty. No rewriting: a fix is the next version and a new request.

## Other ways out

- **`.arxo` container.** `law pack --project tariff --out parcel-tariff.arxo`
  writes one portable file with the package, its closure and its scenarios;
  `law inspect parcel-tariff.arxo --verify` checks it, `law sign` attests it
  and `law test parcel-tariff.arxo` runs the scenarios straight from the
  file. It is for handing a package to another team or archiving a run; it
  is not an input to `law publish`, which reads an artifact directory.
- **npm.** The JavaScript SDK (`@arxo/law`) currently loads canon packages
  published as `@arxo/canon-*`; it does not load third-party registries.
  Applications that need your package in Node.js run the CLI or
  `law serve` over a project that pins it.
- **The public Arxo registry.** The `arxo` registry is curated: releases are
  published from reviewed requests, see [section 8](#8-submit-to-the-arxo-registry).
  Your own registry does not change when a package is also in `arxo`.
- **Code generation.** Printing a package as a standalone module without the
  rule engine is a separate route and is not part of the published CLI.

## Refusals you may meet

| Code | Meaning | Action |
|---|---|---|
| `LPK-E0304` | registry unreachable, or `add` without `--from` asked the public registry | pass `--from <id>` and `--registry <id>=<location>` |
| `LPK-E0302` | the registry at that address has another identifier | the address is not the identity: check both |
| `LPK-E0403` | the release carries another exact `law.core` release | take a version built for the root's release |
| `LPK-E0601` | the version is already published with other bytes | cut the next version |
| `LPK-E0602` | the directory is neither empty nor a registry | publish into an empty directory or an existing registry |
| `LPK-E0603` | a dependency is not published in this registry | publish it first |
| `LPK-E0605` | `pack`: no lock, a stale lock, a non-empty `--out`, or rules at a case root | relock, choose a new `--out`, publish a package rather than a case |
| `key not in trustedKeys` / `no trusted-key signature` | the consumer's trust does not match the release | pin the publisher's key, or sign the release |

`law <command> --help` prints a command's own usage; the full list is `law --help`.
