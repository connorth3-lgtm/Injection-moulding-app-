# MouldMaster — Evidence Coverage and Research Promotion Policy

Reviewed: 2026-08-28

## Purpose

MouldMaster uses research to improve injection-moulding education, troubleshooting reasoning and measured-data validation. The project must not confuse a large literature-search result with a large body of usable evidence.

The recent scholarly searches produced an approximate **1,100-record discovery pool**. That number is a discovery count only. It includes strong journal papers, reviews, simulation studies, specialist metal/ceramic/medical applications, theses and occasional off-topic index matches. It must not be presented as a publisher-verified peer-reviewed corpus of that size or used as an evidence-strength metric.

The authoritative metric is **mechanism evidence coverage**:

> mechanism → source → measured signals → physical quality outcome → experimental context → limitation → intervention/recovery evidence

## Evidence classes

MouldMaster separates source roles rather than treating every citation as equivalent.

1. **Open measured dataset** — reusable measured files are actually available under a usable access/licence condition. Dataset metadata alone is not enough.
2. **Primary measured study** — an experiment or manufacturing study reports real measurements. The article can support the tested relationship, but its raw rows are not assumed reusable unless data files are separately available.
3. **Validated simulation study** — numerical or physics-based work compared with physical measurements. Useful for mechanism explanation; not a substitute for measured production evidence.
4. **Simulation-only study** — useful for hypothesis/mechanism teaching when clearly labelled; not measured validation.
5. **Review** — useful for discovery, terminology and mapping a field; it does not count as independent primary confirmation of a mechanism.
6. **Standard / regulator / official method** — controls safety, legal, test-method or formal terminology claims within its scope.
7. **Manufacturer / vendor technical source** — useful for equipment-, material- or product-specific context; it must not be generalized to every machine, mould or resin.
8. **Thesis / conference / preprint / discovery candidate** — may guide further research but is quarantined from promoted mechanism evidence until its role and publication status are verified.

## Promotion rule

A technical mechanism may be marked **promoted** in the evidence-coverage registry only when:

- at least two independent **primary measured studies** are publisher-verified;
- the measured signal(s) and physical quality outcome(s) are recorded;
- material, machine, mould/tool and process context are retained where available;
- the limitation states what cannot be generalized;
- association/prediction is not rewritten as root-cause proof;
- no study-specific numerical setting becomes a universal setpoint, limit, maintenance threshold or acceptance criterion.

A mechanism with useful evidence but incomplete publisher verification remains **provisional**. A mechanism without enough suitable primary evidence remains an explicit **gap** rather than being padded with tangential papers.

## Twelve priority depth areas

The 2026-08-28 corpus audit identified twelve areas where evidence depth should be strengthened or made more explicit in MouldMaster:

1. ejection and demoulding physics;
2. residual stress and birefringence;
3. weld-line mechanical strength versus appearance;
4. fibre breakage and retained fibre length;
5. runner/gate and multicavity imbalance;
6. hot-runner actual thermal/mechanical behaviour;
7. liquid-silicone-rubber cure/crosslinking behaviour;
8. gas-, water- and projectile-assisted moulding;
9. moisture, drying and process-induced degradation;
10. recyclate/process variability;
11. surface replication, texture, adhesion and release;
12. injection-compression and precision optical moulding.

These are tracked in `data/evidence-coverage-v1.json`. Optional specialist lessons can teach a mechanism before it is fully promoted, but the UI and evidence task must preserve its evidence status and uncertainty.

## Relationship to the 264 synthetic learning cases

The 264 cases / 19,008 cycles remain deterministic synthetic education data. They teach baseline → fault → discriminating evidence → recovery reasoning. They are not converted into measured evidence by adding citations.

The evidence-coverage layer is used to decide which synthetic mechanisms deserve stronger measured support, which need specialist learning, and which are ready for validation against public or authorised site data.

## Relationship to real measured data

The five currently prioritised open measured-data families remain the first executable validation lane:

- Mendeley industrial injection/blow process-quality dataset;
- SKZ Injection Molding Dataset;
- RWTH post-consumer-recycled process dataset;
- FORinFPRO-HIMD multimodal dataset;
- cross-process-chain injection-moulding / screw-driving dataset.

For each dataset actually executed, MouldMaster should record source/version, raw-file fingerprint, schema, rows/cycles, missingness, grouping keys, time-series resolution, material/machine/tool context, quality outcomes and safe candidate relationships. Public benchmark work remains separate from an authorised site-data pilot.

## Curriculum and assessment use

- Reviews may introduce a topic or point to terminology, but advanced diagnostic claims should preferentially cite primary measured evidence.
- Simulation can teach physical mechanisms, but learners must be told when the evidence is simulated.
- Machine-learning prediction can identify quality risk without proving physical causation.
- A local intervention is strongest when process signals and a physical quality outcome recover together.
- Questions must not reveal answer-supporting evidence before grading; exact sources can appear in post-grade debriefs.
- Safety/legal content remains controlled by current official sources, standards, machine documentation and approved site procedures.

## Corpus hygiene rules

Automatically quarantine or reject records when injection moulding is merely specimen preparation, the topic is unrelated biomedical/dental use, generic additive manufacturing, unrelated composites, or the paper provides no useful process/material/tool/quality measurement or transferable mechanism. Metal/ceramic/powder injection-moulding studies are specialist evidence only unless a clearly transferable mechanism is documented.

Deduplicate primarily by DOI; otherwise use OpenAlex/work identifier plus normalized title/year. Never count duplicate versions, repositories and publisher copies as independent evidence.

## Success metric

MouldMaster should report **coverage by mechanism and evidence maturity**, not a headline paper total. The target is not “more papers”; it is more mechanisms with independent measured confirmation, clear limits, and executable validation paths.