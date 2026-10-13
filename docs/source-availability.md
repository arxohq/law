# Source availability and the planned open core

This repository currently contains public documentation, catalogue tooling
and examples. Installed SDK and CLI packages are available now. The engine's
implementation source has not yet been published here.

## Planned scope

The planned open core includes the language specification, data formats,
compiler, rule evaluator, explanations and reproducibility, project tooling,
LSP, standard resources, embedding interfaces and implementation checks.
The intended boundary allows a developer to write, compile, test and execute
their own packages without an Arxo service account.

Full subject corpora, separately released canons, hosted services and additional
product implementations have their own distribution boundaries. Selected
public canons are linked in [the ecosystem catalogue](ecosystem.md).
No publication date or complete verification result is implied by this plan.

## How source will arrive

The first source publication will import an explicitly selected source tree
with its build inputs, licences, notices, provenance and disclosed checks.
The private development history is outside that publication boundary.

This repository's README, catalogue tools, examples and contribution history
remain owned here. Source imports must define their paths and resolve overlaps
explicitly; replacing the entire checkout with an export is not the import
contract. Binary archives continue through the existing
[law-releases](https://github.com/arxohq/law-releases) channel until a delivery
change is announced.

Initially the development source may remain the origin of release exports.
Any accepted external source correction must be integrated there and preserved
by the next export. Moving canonical core development to this public repository
is a separate decision. The contribution instructions will describe the actual
process when source becomes available.

## Availability and verification

A package being published, its licence, its source availability and the checks
performed on a release are separate facts. The delivery catalogue records
availability and observed versions only. It does not imply acceptance of the
full corpus or a fully verified core release. Release evidence must state its
scope and any unperformed checks.
