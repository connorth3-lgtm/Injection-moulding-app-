# MouldMaster primary measured evidence registry

Status: peer-reviewed primary measured evidence layer  
Reviewed: 2026-08-28

## Purpose

This registry makes MouldMaster's evidence base depend on **credible measured experiments**, not a headline paper count. It is deliberately separate from the 264-case / 19,008-cycle synthetic learning library and from the public raw-data benchmark lane.

The machine-readable index is `data/primary-measured-evidence-registry-v1.json`; detailed study records are split across five packs under `data/primary-measured-evidence/`.

## Current counted evidence

- **60 unique peer-reviewed primary measured studies**
- **60 unique DOIs**
- **60 unique experiment identities**
- **4 Tier A** studies: peer-reviewed primary measured evidence with a public raw or companion measured dataset
- **56 Tier B** studies: publisher-verified peer-reviewed primary measured experiments whose reusable raw rows are not confirmed public or are available only by request
- **9/9 provisional mechanisms** now have a staged independent qualifying pair plus at least one additional independent backup experiment.

Raw-data availability and scientific credibility are intentionally separate attributes. A strong peer-reviewed experiment can be Tier B because the raw rows are not reusable; an open repository is not automatically Tier A unless its provenance is tied to a peer-reviewed measured experiment.

## What is excluded from the measured count

The registry does **not** count the following as independent primary measured evidence:

- reviews or systematic reviews;
- simulation-only studies;
- synthetic-only datasets;
- conference abstracts without enough measured methods/results to audit;
- unverified third-party mirrors;
- duplicate publications or a paper plus companion dataset from the same experimental campaign counted twice.

Reviews remain useful as discovery maps. Validated simulations remain useful as supporting physics. Neither inflates the primary measured count.

## Deduplication and redundancy rules

Every counted study has DOI/publisher provenance, an experiment identity and overlap group, machine/material/tool context, measured signals, physical outcomes, a scale statement, raw-data status, causal-strength classification and an explicit limitation.

A paper and its companion raw dataset share one experiment/overlap identity for independence purposes. A different paper is not independent merely because it has a different DOI: the experimental programme must also be distinct.

The registry now deliberately goes beyond the two-study promotion minimum. Every staged mechanism must retain at least **three distinct experimental identities** across its qualifying and backup evidence. `qa_primary_measured_evidence.py` fails if a DOI, experiment identity or overlap group is reused inside a mechanism's evidence set, if a qualifying DOI is reused as backup evidence, or if redundancy falls below three independent experiments.

## Credibility tiers

### Tier A — measured + executable data

A Tier A record requires peer-reviewed primary measured evidence plus a public raw or companion measured dataset with traceable provenance. Current examples include the high-resolution scatimdata experiments, the completed Mendeley industrial benchmark, the RWTH post-consumer-recycled material control experiments and the 955-row hot-runner sustainable-material supplementary dataset associated with `10.3390/su13148102`.

Tier A is the preferred source for executable MouldMaster benchmark/data-path work. It still does not make historical values into recommended process settings.

### Tier B — measured experiment, raw reuse not confirmed

Tier B requires publisher-verified peer-reviewed primary measured experiments with real process/material signals and physical outcomes. These studies are strong mechanism evidence but are not silently treated as reusable training datasets.

## Mechanism coverage strengthened in this revision

The expansion adds substantial independent measured depth for:

- hot-runner and sequential-valve-gate **actual behaviour**, including direct command-to-valve-opening measurement, cavity pressure, accelerometer/CCD verification and real-time melt-front detection;
- gas- and water-assisted moulding, including residual wall thickness, penetration, cooling, surface quality, void formation and ultrasonic in-process measurement;
- post-consumer/recycled polypropylene variability, contamination, silver streaks, crystallization, mechanical properties and repeat/reprocessing history;
- retained fibre length and fibre breakage with independent mechanical outcomes;
- multicavity filling imbalance across conventional thermoplastics and powder-injection systems;
- additional LSR cavity-pressure/tie-bar/quality evidence;
- injection-compression cavity-pressure/backflow evidence;
- plus the previously retained cavity-pressure, surface-replication, residual-stress, weld-line, moisture and optical studies.

## Nine promotion candidates — staged, not automatically applied

All nine mechanisms that remain provisional in the learner-facing registry now have an independent qualifying pair and backup evidence:

| Mechanism | Qualifying DOI pair | Additional independent backup |
| --- | --- | ---: |
| Fibre breakage / retained fibre length | `10.1002/pc.27232` + `10.1002/app.70427` | 3 |
| Runner/gate/multicavity imbalance | `10.3390/polym16202874` + `10.3390/s23031735` | 2 |
| Hot-runner actual behaviour | `10.1002/app.22371` + `10.1016/j.jmapro.2024.07.095` | 5 |
| Liquid silicone rubber | `10.1002/app.53381` + `10.7735/ksmte.2014.23.2.206` | 1 |
| Fluid-assisted moulding | `10.1155/2015/161938` + `10.1002/pen.20832` | 8 |
| Moisture/drying/degradation | `10.3390/app12031410` + `10.37358/MP.20.1.5311` | 1 |
| Recyclate/process variability | `10.1016/j.jprocont.2026.103725` + `10.1002/pen.26689` | 6 |
| Surface replication/release | `10.1016/j.jmapro.2019.04.010` + `10.1002/pen.24772` | 3 |
| Injection-compression/precision optics | `10.1002/pat.6166` + `10.1002/pen.23429` | 1 |

These remain deliberately **staged**. Learner-visible evidence maturity in `data/evidence-coverage-v1.json` is not changed merely because the literature registry now exceeds the promotion threshold. Formal promotion still requires a mechanism dossier, bounded claim, explicit experimental-independence rationale and the existing promotion QA.

The hot-runner gap is materially stronger than before: the qualifying evidence now includes a 2005 experiment that directly measures command-to-actual valve response with CCD, cavity-pressure transducers and accelerometer verification, and an independent 2024 experiment that uses real-time melt-front detection to control/validate sequential valve gating. Supporting experiments add physical filling, weld-line, structural and mechanical outcomes across different hot-runner architectures.

## Evidence interpretation boundary

A measured association, machine-learning feature importance or prediction result is not automatically a physical root cause. Controlled process studies can support mechanism reasoning, but production changes still require the exact machine, mould, resin grade, approved process/change-control system and site safety requirements.

No numerical pressure, temperature, speed, time, fibre length, moisture value, runner dimension, compression gap, assist pressure, valve delay, optical metric or quality threshold in these papers becomes a universal MouldMaster process recipe.

## Relationship to synthetic learning data

Synthetic data remain useful for controlled teaching cases, rare faults and counterfactual/recovery demonstrations where no suitable measured dataset exists. They remain explicitly synthetic.

The intended direction is **measured-data-first where credible measured evidence exists, synthetic gap-filling where it does not**. With all nine previously provisional mechanisms now backed by redundant primary measured literature, the next reduction in synthetic dependence should come from ingesting more Tier A raw datasets and building real fault/intervention/recovery histories rather than simply adding more simulated rows.
