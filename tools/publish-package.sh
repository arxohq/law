#!/bin/sh
# Reproduces the transcript of docs/publish-package.md with the installed
# `law` CLI: author a package, test it, publish it into a static registry,
# install it from another project, then the refusals the guide shows.
#
#   sh tools/publish-package.sh            # uses `law` from PATH
#   LAW=/path/to/law sh tools/publish-package.sh
#
# Everything happens in a fresh temporary directory; nothing is written into
# this repository. The optional signature section serves the registry over
# loopback HTTP with python3 and is skipped when python3 is missing.
set -u
LAW=${LAW:-law}
WORK=$(mktemp -d "${TMPDIR:-/tmp}/arxo-publish-XXXXXX")
cd "$WORK" || exit 2
echo "# work directory: $WORK"
echo "# $("$LAW" version | head -1)"

shown() { # the command as the guide shows it: the CLI path prints as `law`
  if [ "$1" = "$LAW" ]; then shift; printf 'law %s' "$*"; else printf '%s' "$*"; fi
}

run() {
  printf '\n$ %s\n' "$(shown "$@")"
  "$@" 2>&1
  status=$?
  [ "$status" -eq 0 ] || printf '(exit %s)\n' "$status"
}

at() { # at <dir> <command…>: run inside <dir>
  dir=$1; shift
  printf '\n$ (cd %s && %s)\n' "$dir" "$(shown "$@")"
  (cd "$dir" && "$@" 2>&1)
  status=$?
  [ "$status" -eq 0 ] || printf '(exit %s)\n' "$status"
}

echo
echo "## 1. A leaf package: acme.parcel_tariff"
run "$LAW" init tariff --name acme.parcel_tariff --template package
cat > tariff/source.law <<'EOF'
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
EOF
mkdir -p tariff/tests
cat > tariff/tests/tariff.lawtest <<'EOF'
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
EOF
cat >> tariff/law.toml <<'EOF'

[features]
semanticLayer = "L1"

[[tests]]
family = "acme_parcel_tariff"
suites = ["tests/tariff.lawtest"]
world = ["acme.parcel_tariff"]
EOF
at tariff "$LAW" engine check .
at tariff "$LAW" engine lock . --write
at tariff "$LAW" test
run "$LAW" pack --project tariff --out artifacts/parcel-tariff-0.1.0
run cat artifacts/parcel-tariff-0.1.0/release.json
mkdir registry
run "$LAW" publish artifacts/parcel-tariff-0.1.0 --registry acme=registry
run find registry -type f
run cat registry/registry.json

echo
echo "## 2. A consumer project installs it"
run "$LAW" init consumer --name demo.consumer
run "$LAW" add acme.parcel_tariff@0.1.0 --project consumer --from acme --registry acme=registry
run cat consumer/law.lock
cat > consumer/main.lawcase <<'EOF'
language "law.core" version "0.2";
package demo.consumer version "0.1.0";
namespace "urn:law:demo:consumer";

case Main {
    context { legal_time @2026-10-01; decision_time @2026-10-01T00:00:00Z; knowledge_time @2026-10-01T00:00:00Z; timezone "UTC"; }
    assert "w": acme.parcel_tariff::weight_kg(entity_ref("urn:case:demo:box-1"), 5.0) { origin case_input; }
}
EOF
at consumer "$LAW" ask --query 'evaluate truth(acme.parcel_tariff::fee(entity_ref("urn:case:demo:box-1"), 950.0));' --query-id q1 --format text
rm -rf consumer/deps
run "$LAW" install --project consumer --offline
run "$LAW" install --project consumer --registry acme=registry
run "$LAW" install --project consumer --offline
# Without --from the publisher defaults to the public `arxo` registry, which
# this package is not in (the step needs network access).
run "$LAW" init consumer-no-from --name demo.consumer_no_from
run "$LAW" add acme.parcel_tariff@0.1.0 --project consumer-no-from --registry acme=registry

echo
echo "## 3. A package that depends on the published one"
run "$LAW" init surcharge --name acme.parcel_surcharge --template package
run "$LAW" add acme.parcel_tariff@0.1.0 --project surcharge --from acme --registry acme=registry
cat >> surcharge/source.law <<'EOF'

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
EOF
mkdir -p surcharge/tests
cat > surcharge/tests/surcharge.lawtest <<'EOF'
language "law.core" version "0.2";
package acme.parcel_surcharge version "0.1.0";
namespace "urn:law:acme:parcel_surcharge";

test "urn:query:acme-parcel-surcharge-t01-fragile-heavy" {
    given {
        context { legal_time @2026-10-01; decision_time @2026-10-01T00:00:00Z; knowledge_time @2026-10-01T00:00:00Z; timezone "UTC"; }
        assert "w": acme.parcel_tariff::weight_kg(entity_ref("urn:case:acme:box-3"), 5.0) { origin case_input; }
        assert "f": fragile(entity_ref("urn:case:acme:box-3")) { origin case_input; }
    }
    evaluate truth(total_fee(entity_ref("urn:case:acme:box-3"), 1150.0));
    expect result_kind == PROPOSITION;
    expect truth_status == TRUE_ONLY;
    expect evaluation_status == COMPUTED;
}
EOF
cat >> surcharge/law.toml <<'EOF'

[features]
semanticLayer = "L1"

[[tests]]
family = "acme_parcel_surcharge"
suites = ["tests/surcharge.lawtest"]
world = ["acme.parcel_surcharge", "acme.parcel_tariff"]
EOF
at surcharge "$LAW" engine check .
at surcharge "$LAW" engine lock . --write
at surcharge "$LAW" test
run "$LAW" pack --project surcharge --out artifacts/parcel-surcharge-0.1.0
mkdir registry-without-tariff
run "$LAW" publish artifacts/parcel-surcharge-0.1.0 --registry acme=registry-without-tariff
run "$LAW" publish artifacts/parcel-surcharge-0.1.0 --registry acme=registry
run "$LAW" init consumer2 --name demo.consumer2
run "$LAW" add acme.parcel_surcharge@0.1.0 --project consumer2 --from acme --registry acme=registry

echo
echo "## 4. Publishing again, and what a registry refuses"
run "$LAW" publish artifacts/parcel-tariff-0.1.0 --registry acme=registry
sed -i.bak 's/base fee 500/base fee 500 (reworded)/' tariff/source.law && rm tariff/source.law.bak
at tariff "$LAW" engine lock . --write
run "$LAW" pack --project tariff --out artifacts/parcel-tariff-0.1.0-edited
run "$LAW" publish artifacts/parcel-tariff-0.1.0-edited --registry acme=registry
mkdir not-a-registry && touch not-a-registry/README.md
run "$LAW" publish artifacts/parcel-tariff-0.1.0 --registry acme=not-a-registry
run "$LAW" publish artifacts/parcel-tariff-0.1.0 --registry other=registry
run "$LAW" pack --project tariff --out artifacts/parcel-tariff-0.1.0
# A release built for another exact law.core release: the descriptor of a copy
# of the registry is rewritten to simulate it.
cp -R registry registry-other-core
sed -i.bak 's#"languageSemantics": "law.core/[0-9.]*"#"languageSemantics": "law.core/0.2.10"#' \
  registry-other-core/p/acme.parcel_tariff/0.1.0.json && rm registry-other-core/p/acme.parcel_tariff/0.1.0.json.bak
run "$LAW" init consumer3 --name demo.consumer3
run "$LAW" add acme.parcel_tariff@0.1.0 --project consumer3 --from acme --registry acme=registry-other-core
run "$LAW" outdated --project consumer --registry acme=registry

echo
echo "## 5. A publisher key and trustedKeys"
run "$LAW" key new --out acme.key
run "$LAW" key new --out someone-else.key
mkdir registry-signed
run "$LAW" publish artifacts/parcel-tariff-0.1.0 --registry acme=registry-signed --key acme.key
PUBLIC=$(sed -n 's/.*"public": "\([^"]*\)".*/\1/p' acme.key)
OTHER=$(sed -n 's/.*"public": "\([^"]*\)".*/\1/p' someone-else.key)
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server 8765 --bind 127.0.0.1 --directory registry-signed >/dev/null 2>&1 &
  SERVER=$!
  sleep 1
  run "$LAW" init trusting --name demo.trusting
  printf '\n[registries.acme]\nurl = "http://127.0.0.1:8765"\ntrustedKeys = ["%s"]\n' "$PUBLIC" >> trusting/law.toml
  run "$LAW" add acme.parcel_tariff@0.1.0 --project trusting --from acme
  run "$LAW" install --project trusting --offline
  run "$LAW" init other-trust --name demo.other_trust
  printf '\n[registries.acme]\nurl = "http://127.0.0.1:8765"\ntrustedKeys = ["%s"]\n' "$OTHER" >> other-trust/law.toml
  run "$LAW" add acme.parcel_tariff@0.1.0 --project other-trust --from acme
  run "$LAW" init no-trust --name demo.no_trust
  printf '\n[registries.acme]\nurl = "http://127.0.0.1:8765"\n' >> no-trust/law.toml
  run "$LAW" add acme.parcel_tariff@0.1.0 --project no-trust --from acme
  run "$LAW" init trusting-unsigned --name demo.trusting_unsigned
  printf '\n[registries.acme]\nurl = "http://127.0.0.1:8765"\ntrustedKeys = ["%s"]\n' "$PUBLIC" >> trusting-unsigned/law.toml
  run "$LAW" add acme.parcel_tariff@0.1.0 --project trusting-unsigned --from acme --registry acme=registry
  { kill "$SERVER"; wait "$SERVER"; } 2>/dev/null
else
  echo "(python3 missing: the loopback-HTTP signature section is skipped)"
fi

echo
echo "## 6. The .arxo container"
run "$LAW" pack --project tariff --out parcel-tariff.arxo
run "$LAW" inspect parcel-tariff.arxo --verify
echo
echo "# done: $WORK"
