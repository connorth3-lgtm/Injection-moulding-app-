# MouldMaster primary measured evidence registry

Status: peer-reviewed primary measured evidence layer  
Reviewed: 2026-08-29

## Purpose

This registry makes MouldMaster's evidence base depend on **credible measured experiments**, not a headline paper count. It is deliberately separate from the 264-case / 19,008-cycle synthetic learning library and from the public raw-data benchmark lane.

The machine-readable index is `data/primary-measured-evidence-registry-v1.json`; detailed study records are split across six packs under `data/primary-measured-evidence/`.

## Current counted evidence

- **65 unique peer-reviewed primary measured studies**
- **65 unique DOIs**
- **65 unique experiment identities**
- **4 Tier A** studies: peer-reviewed primary measured evidence with a public raw or companion measured dataset
- **61 Tier B** studies: publisher-verified peer-reviewed primary measured experiments whose reusable raw rows are not confirmed public or are available only by request
- The nine formerly provisional priority mechanisms retain an independent qualifying pair plus at least one additional independent backup experiment, and their formal promotion is now recorded through `data/evidence-promotion-overlay-v2.json`.

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

The registry deliberately goes beyond the two-study promotion minimum. Every staged mechanism retains at least **three distinct experimental identities** across its qualifying and backup evidence. `qa_primary_measured_evidence.py` fails if a DOI, experiment identity or overlap group is reused inside a mechanism's evidence set, if a qualifying DOI is reused as backup evidence, or if redundancy falls below three independent experiments.

## Credibility tiers

### Tier A — measured + executable data

A Tier A record requires peer-reviewed primary measured evidence plus a public raw or companion measured dataset with traceable provenance. Current examples include the high-resolution scatimdata experiments, the completed Mendeley industrial benchmark, the RWTH post-consumer-recycled material control experiments and the hot-runner sustainable-material supplementary dataset associated with `10.3390/su13148102`.

Tier A is the preferred source for executable MouldMaster benchmark/data-path work. It still does not make historical values into recommended process settings.

### Tier B — measured experiment, raw reuse not confirmed

Tier B requires publisher-verified peer-reviewed primary measured experiments with real process/material signals and physical outcomes. These studies are strong mechanism evidence but are not silently treated as reusable training datasets.

## New breadth added beyond the first 60 studies

The sixth pack, `data/primary-measured-evidence/breadth-production-cooling-v1.json`, adds five independent 2026 measured programmes chosen for diversity rather than duplication:

- cooling time, measured demoulding temperature, shrinkage and warpage in virgin and post-consumer-recycled PP (`10.3390/polym18151852`);
- real-time cavity pressure and temperature across conventional, conformal-cooling and CuBe mould configurations with dimensional/mechanical outcomes (`10.1007/s12541-026-01580-y`);
- PP processing history linked to molecular-weight distribution, rheology, shrinkage and tensile behaviour (`10.1016/j.polymer.2026.130427`);
- **1,320 physical experiments across 27 industrial machines**, 10 PP grades and 50 automotive reservoir variants with measured warpage (`10.3389/fmats.2026.1838502`);
- multi-material experimental injection-moulding energy observations spanning PLA, PBS, virgin PP and recycled/modified recycled PP (`10.1007/s40684-026-00916-3`).

These additions increase the peer-reviewed primary-measured study ledger from 60 to 65. They do **not** change the separate fully profiled dataset count or the accepted measured scalar-sample ledger unless their exact raw files later pass the dataset profiling boundary.

## Formal mechanism promotions

The historical `data/evidence-coverage-v1.json` remains the preserved pre-promotion snapshot. `data/evidence-promotion-overlay-v2.json` records nine explicit downstream promotions after the qualifying studies were resolved through formal dossiers and independence checks.

Resolved priority-mechanism state:

- **12 promoted**
- **0 provisional**
- **0 gaps**

The nine overlay promotions cover fibre breakage/retained length, runner/gate/multicavity imbalance, hot-runner actual behaviour, LSR, fluid-assisted moulding, moisture/drying/degradation, recyclate/process variability, surface replication/release and injection-compression/precision optics.

Promotion remains mechanism-level evidence only. It does not make paper-specific pressure, temperature, timing, material, geometry, wall-thickness, moisture, fibre-length, valve-delay, energy or quality values into universal production rules.

## Evidence interpretation boundary

A measured association, machine-learning feature importance or prediction result is not automatically a physical root cause. Controlled process studies can support mechanism reasoning, but production changes still require the exact machine, mould, resin grade, approved process/change-control system and site safety requirements.

No numerical pressure, temperature, speed, time, fibre length, moisture value, runner dimension, compression gap, assist pressure, valve delay, optical metric or quality threshold in these papers becomes a universal MouldMaster process recipe.

## Relationship to synthetic learning data

Synthetic data remain useful for controlled teaching cases, rare faults and counterfactual/recovery demonstrations where no suitable measured dataset exists. They remain explicitly synthetic.

The intended direction is **measured-data-first where credible measured evidence exists, synthetic gap-filling where it does not**. The next reduction in synthetic dependence should come from profiling more lawful Tier A/raw datasets and obtaining real fault → intervention → recovery histories, while continuing to broaden independent peer-reviewed experimental coverage.
