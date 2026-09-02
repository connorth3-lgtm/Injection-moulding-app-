# Material expansion to 100 selections — completion audit

Date: 2026-09-03

## Current committed material scope

- 100 selectable material classes
- 72 common selections
- 28 specialty selections
- 71 underlying material families
- 72 representative supplier/grade records in the detailed engineering database
- Exact-grade processing data are populated only where the source supports them; unsupported fields remain null.

## Latest 20 additions

Common/formulation classes:
- PP long-glass-fibre reinforced
- PP carbon-fibre reinforced
- PC optical/high-transparency
- PC medical/healthcare
- impact-modified PMMA
- lubricated/low-friction POM
- glass-fibre reinforced POM
- PA6 carbon-fibre reinforced
- PA66 carbon-fibre reinforced
- flame-retardant PBT
- flame-retardant TPU
- transparent TPU

Specialty/high-performance:
- PPS glass-fibre reinforced
- PEEK carbon-fibre reinforced
- PPA glass-fibre reinforced
- PA46
- PA410
- PA610
- PA612
- PCT

## New family evidence anchors

- PA46: Envalior Stanyl TW441, exact current PA46 injection-moulding grade identity.
- PA410: Envalior EcoPaXX Q-KXG6, PA410-GF30 injection-moulding grade.
- PA610: BASF Ultramid S3W Balance, PA610 injection-moulding grade and supplier processing range.
- PA612: EMS-GRIVORY Grilamid 2D supplier family and injection-moulding guidance. This remains GUIDE-level rather than being presented as an exact commercial-grade recipe.
- PCT: Celanese Thermx CGT33 with supplier processing, drying and directional shrinkage values.

## Validation status

The Engineering deep-dive workflow passes on the 100-material head, including:
- calculation regression
- deterministic 200-case calculation stress suite
- material provenance suite
- deterministic deep-material suite
- 50-material catalog suite
- 60-common / 20-specialty suite
- deterministic 200-case 100-material suite
- static runtime integration checks

Latest 100-material suite result: 71 families, 72 records, 72 common + 28 specialty = 100 selections, 1,555 assertions.

## Completion check against prior requests

### Complete
- engineering calculation contracts and fail-closed pressure-domain logic
- deterministic calculation stress suite
- exact-grade/provenance data model
- expanded common and specialty material selector
- 100 selectable material classes
- source-backed representative grade records
- app-shell loading and CI integration

### Not yet complete
- The prior request for **10 or more real commercial grades for every material family** is not yet implemented in the committed branch.
- A compliant implementation requires at least 710 distinct sourced commercial-grade identities for the current 71 families, with no fabricated grade names and no cross-grade copying of numeric process conditions.
- This remains the only major material-database scope item from the conversation that should not be marked complete.

## Engineering boundary

Selector variants are navigation/formulation classes. They do not automatically inherit processing temperatures, drying settings, shrinkage, pressure or machine limits from another grade. Exact supplier grade/revision data remain authoritative for production use.