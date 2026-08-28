# MouldMaster primary measured evidence registry

Status: peer-reviewed primary measured evidence layer  
Reviewed: 2026-08-28

## Purpose

This registry makes MouldMaster's evidence base depend on **credible measured experiments**, not a headline paper count. It is deliberately separate from the 264-case / 19,008-cycle synthetic learning library and from the public raw-data benchmark lane.

The machine-readable index is `data/primary-measured-evidence-registry-v1.json`; detailed study records are split across four packs under `data/primary-measured-evidence/`.

## Current counted evidence

- **31 unique peer-reviewed primary measured studies**
- **31 unique DOIs**
- **31 unique experiment identities**
- **3 Tier A** studies: peer-reviewed primary measured evidence with a public raw or companion measured dataset
- **28 Tier B** studies: publisher-verified peer-reviewed primary measured experiments whose reusable raw rows are not confirmed public or are available only by request

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

## Deduplication rules

Every counted study has:

- DOI and publisher URL;
- experiment identity;
- overlap group;
- machine/material/tool context;
- measured signals;
- physical quality/material outcome;
- study scale statement;
- raw-data status;
- causal-strength classification;
- explicit limitation.

A paper and its companion raw dataset share one experiment/overlap identity for independence purposes. A different paper is not independent merely because it has a different DOI: the experimental programme must also be distinct.

`qa_primary_measured_evidence.py` fails if a DOI or experiment identity is counted twice and checks every staged promotion pair for different experiment and overlap identities.

## Credibility tiers

### Tier A — measured + executable data

A Tier A record requires peer-reviewed primary measured evidence plus a public raw or companion measured dataset with traceable provenance. Current examples include the high-resolution scatimdata experiments, the completed Mendeley industrial benchmark, and the RWTH post-consumer-recycled material control experiments.

Tier A is the preferred source for executable MouldMaster benchmark/data-path work. It still does not make historical values into recommended process settings.

### Tier B — measured experiment, raw reuse not confirmed

Tier B requires publisher-verified peer-reviewed primary measured experiments with real process/material signals and physical outcomes. These studies are strong mechanism evidence but are not silently treated as reusable training datasets.

## Mechanism coverage strengthened in this revision

The new registry adds or formalises measured evidence for:

- cavity-pressure and high-resolution process/quality relationships;
- multicavity runner/gate imbalance;
- hot-runner thin-wall behaviour;
- retained fibre length and fibre breakage;
- liquid silicone rubber cure/cross-linking;
- moisture/drying/material-state effects;
- recycled-feedstock variability/control;
- surface micro/nano replication;
- injection-compression and precision optical quality;
- residual stress/birefringence and warpage;
- reinforced weld-line mechanical response;
- classic cavity pressure/temperature dimensional-quality monitoring.

## Six promotion candidates — staged, not automatically applied

The evidence registry now identifies six mechanisms with two independent qualifying primary measured studies:

| Mechanism | Qualifying DOI pair | State |
| --- | --- | --- |
| Fibre breakage / retained fibre length | `10.1002/pc.27232` + `10.1002/app.70427` | Eligible candidate; not applied |
| Runner/gate/multicavity imbalance | `10.3390/polym16202874` + `10.3390/s23031735` | Eligible candidate; not applied |
| Liquid silicone rubber | `10.1002/app.53381` + `10.7735/ksmte.2014.23.2.206` | Eligible candidate; not applied |
| Moisture/drying/degradation | `10.3390/app12031410` + `10.37358/MP.20.1.5311` | Eligible candidate; not applied |
| Surface replication/release | `10.1016/j.jmapro.2019.04.010` + `10.1002/pen.24772` | Eligible candidate; not applied |
| Injection-compression/precision optics | `10.1002/pat.6166` + `10.1002/pen.23429` | Eligible candidate; not applied |

These are deliberately **staged**. Learner-visible evidence maturity in `data/evidence-coverage-v1.json` is not changed merely because two papers were found. Formal promotion still requires a mechanism dossier, bounded claim, explicit experimental-independence rationale and the existing promotion QA.

Hot-runner evidence is intentionally more conservative: there is good measured evidence for nozzle pressure, tie-bar response, two-cavity part mass and hot-runner-vs-conventional physical outcomes, but this revision does not claim two independent studies directly measuring the actual hot-runner zone/valve behaviour needed by that mechanism's stronger evidence target.

## Evidence interpretation boundary

A measured association, machine-learning feature importance or prediction result is not automatically a physical root cause. Controlled process studies can support mechanism reasoning, but production changes still require the exact machine, mould, resin grade, approved process/change-control system and site safety requirements.

No numerical pressure, temperature, speed, time, fibre length, moisture value, runner dimension, compression gap, optical metric or quality threshold in these papers becomes a universal MouldMaster process recipe.

## Relationship to synthetic learning data

Synthetic data remain useful for controlled teaching cases, rare faults and counterfactual/recovery demonstrations where no suitable measured dataset exists. They remain explicitly synthetic.

The intended direction is **measured-data-first where credible measured evidence exists, synthetic gap-filling where it does not**. This registry is the evidence foundation for making that transition without pretending the public literature covers every real troubleshooting mechanism.
