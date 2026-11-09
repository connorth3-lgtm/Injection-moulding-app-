# Book-wide rewrite and deep peer-review report

**Review revision:** 2026.11.09.2  
**Scope:** MouldMaster Academy Book, all 21 reader chapters and all 46 governed authored modules  
**Review type:** Internal editorial and technical-source peer-review-style audit  
**Independent human SME review:** **HOLD**  
**Device, accessibility, provider and accreditation review:** **HOLD**

## Executive assessment

The previous learning path had the right topics but too often assumed that a beginner already understood material vocabulary, relied on compressed definitions, repeated diagnostic cautions, or moved too quickly from a machine signal to a conclusion. The largest instructional gap was the structure of plastics: a learner needed a clear model of polymer chains, amorphous and semi-crystalline structure, crystallinity, glass transition, crystallisation, melting and the limits of laboratory tests.

This revision changes the teaching lead-in in **all 46 modules** and rewrites the complete polymer-foundations module as a 14-section sequence. It also rewrites material-family comparison, fillers and additives, fibre orientation, high-performance polymers, diagnostic reasoning, and three formerly very short process-development modules. The two diagnostic chapters now have different jobs: r11 teaches the basic investigation loop; r20 handles interacting mechanisms, contradictory evidence and escalation.

The authored module prose now contains **22,304 words**, down from 23,788 in the branch before this rewrite (about a 6.2% reduction). That reduction comes from removing repeated summaries while adding clearer explanations where the earlier content was too compressed. The 46 module IDs, 137 governed claim IDs and 58 governed evidence-source records are retained. No new claim IDs or governed source records were introduced.

This is a completed **repository-level review**, not an independent external peer review. The book remains an educational resource; this report does not establish learner competence, validated production settings, machine-control authority, NZQA approval or accreditation.

## Scope and method

The review covered:

- Every section in the three authored source files, including module applicability and source references.
- The 21-chapter reading map, its objectives, questions, application prompts, key terms and reading threads.
- The claim-evidence index and editorial review ledger, to confirm that rewritten modules still map to the existing governed claims.
- The optional open further-reading catalogue, checking chapter IDs, source-ID resolution, count and URL uniqueness.
- The content-to-runtime integrity bindings and the packaged copies served by the app.

The review checked clarity, sequence, repetition, term definitions, evidence boundaries, examples, safety language and the difference between a measured result and an inference. It did not independently reproduce material tests, verify every linked source’s current availability, perform a moulding trial, or test the rewritten chapters on a phone.

## Peer-review findings and dispositions

| Priority | Finding | Disposition in this rewrite |
| --- | --- | --- |
| P1 | **Polymer foundations were not explicit enough for a new learner.** “Plastic,” “polymer,” “resin,” “amorphous,” “semi-crystalline,” Tg, Tc and Tm need to be introduced in a sequence that explains how they relate. | Rebuilt the polymer module into 14 ordered sections: material words; thermoplastics versus thermosets; repeat units; chain-size distributions, branching and entanglement; tacticity and copolymers; amorphous versus semi-crystalline structure; lamellae and spherulites; Tg, Tc and Tm; cooling and flow; crystallinity estimation; DSC limits; properties; and a material-history chain. |
| P1 | **“Semi-amorphous” could leave learners with the wrong classification.** Semi-crystalline polymers contain ordered crystalline regions and amorphous regions; the ordinary introductory contrast is amorphous versus semi-crystalline. | The new text explicitly teaches the standard distinction and explains why “semi-amorphous” is confusing as the counterpart category. It avoids suggesting that a real grade is a perfectly uniform two-state object. |
| P1 | **Some process-development topics were too terse to teach a useful method.** Fill study, pressure loss and gate seal were previously represented by a few short lines. | Each now has a purpose, a controlled comparison, interpretation limits and an explicit distinction between evidence and production authority. The text does not set machine parameters. |
| P1 | **Basic and advanced diagnostics repeated similar advice.** | r11 now describes a practical sequence for ordinary bounded investigations. r20 addresses conflicting evidence, correlated signals, compensating mechanisms, product risk, outside review and stopping rules. |
| P1 | **Safety wording must remain visibly bounded.** General training text can be mistaken for an instruction to enter a guarded area or alter tooling. | Safety-foundations and equipment modules now say that site procedures, machine/tool documentation and qualified personnel control interventions. Examples remain hypothetical. Independent safety review remains required. |
| P2 | **Grade-family explanations could encourage overgeneralisation.** A family name is not a grade identity or a processing recipe. | Rewrote the material-family chapter around exact grade identity, test conditions, product requirements, substitution evidence and recycled-feedstock history. |
| P2 | **Fibre reinforcement needs a spatial, directional explanation.** A single “fibre direction” cannot represent a whole moulded component. | Rewrote the advanced orientation chapter to explain local distributions, skin/core differences, orientation tensors, sampling, micro-CT and simulation limits. |
| P2 | **High-performance polymers were grouped too loosely.** A family label does not establish machine, mould or hot-runner suitability. | Reframed the chapter around exact grade documentation and whole-system limits. No generic processing temperature or residence rule is supplied. |
| P2 | **Appearance names can be mistaken for causes.** Splay, burns, black specks, flash and short shots can each have more than one mechanism. | Rewrote chapter openings and diagnostic material to separate a symptom description from the competing mechanisms and the evidence needed to distinguish them. |
| P2 | **Optional sources must not be presented as claim evidence.** A reading link does not create technical approval. | The source catalogue remains a separate, optional learning layer. Claim evidence and SME status remain governed by their existing ledgers. |
| P2 | **Longer materials content can strain audio listening.** A deeper chapter needs useful stopping points. | The polymer foundations are divided into 14 short sections, with one main concept per section. Actual Android background playback and locked-screen behaviour were not tested in this rewrite. |

## Chapter-by-chapter review

“Rewrite applied” describes the editorial work in this branch. It does not mean an independent reviewer has approved the chapter.

| Reader chapter | Governed modules | Review finding and editorial disposition |
| --- | --- | --- |
| r01 | From Plastic Pellets to a Finished Part | `what-injection-moulding-is`, `cycle` | Part-making sequence; separates command, signal and part evidence. |
| r02 | The Machine, the Mould and Safety | `machine-anatomy`, `mould-anatomy`, `safety-foundations` | Machine, mould and safety. Reinforces equipment documentation, guarding and intervention boundaries. |
| r03 | Polymer Foundations: Chains, Amorphous and Semi-Crystalline Structure | `polymer-structure`, `material-families`, `fillers-additives` | Polymer chain basics; amorphous versus semi-crystalline structure; thermal events; crystallinity, DSC and grade context. |
| r03a | Advanced Materials: Fibre Orientation and High-Performance Polymers | `fibre-orientation`, `high-performance-polymers` | Advanced morphology, fibre orientation, anisotropy, skin/core structure, measurement and model limits. |
| r04 | How Melted Plastic Flows—and Why Moisture and Heat Matter | `rheology`, `moisture-drying`, `thermal-history` | Rheology, moisture and thermal history. Separates material condition from machine display or symptom. |
| r05 | How the Machine Prepares and Delivers Melt | `plasticising-unit`, `shot-utilisation`, `velocity-pressure` | Plasticising, shot consistency, commanded versus achieved motion and pressure-signal location. |
| r06 | Transfer, Packing and Clamp Behaviour | `vp-transfer`, `clamp` | Filling-to-hold transfer and clamp behaviour; distinguishes transfer evidence from force and flash diagnosis. |
| r07 | Feed Systems, Venting and Hot Runners | `feed-system`, `venting`, `hot-runners` | Sprue/runner/gate path, venting and hot-runner history; avoids generic tooling interventions. |
| r08 | Cooling, Release and Cycle Stability | `cooling`, `ejection-draft` | Cooling and ejection; links thermal gradients and release evidence to the part. |
| r09 | Establishing a Defensible Process Baseline | `process-baseline`, `documentation` | Repeatable baseline, context-rich documentation and explicit unknowns. |
| r10 | Scientific Process Development | `fill-study`, `pressure-loss`, `gate-seal`, `process-window` | Fill studies, pressure-path segmentation, gate-seal evidence and tested process windows. |
| r11 | A Diagnostic Method for Moulding Problems | `diagnostic-method` | A bounded diagnostic loop that distinguishes defect description, cause hypotheses, tests, recovery and escalation. |
| r12 | Filling and Boundary Defects | `short-shot`, `flash` | Short shots and flash as symptoms with multiple mechanisms; cavity, location and repeatability patterns. |
| r13 | Shrinkage, Voids and Warpage | `sink-voids`, `warpage` | Separates surface sink, internal void and warpage; connects geometry and thermal history. |
| r14 | Surface Defects, Gas and Degradation | `splay`, `burns`, `black-specks` | Distinguishes moisture, trapped gas, degradation and contamination using pattern and chronology. |
| r15 | Weld Lines and Flow-Front Interaction | `weld-lines` | Flow-front meeting, weld-line evidence and product-risk-matched validation. |
| r16 | Cavity Pressure and Process Monitoring | `cavity-pressure`, `process-monitoring` | Sensor location, measurement chain, representative cavity-pressure traces and monitoring rules. |
| r17 | DOE, Measurement and Capability | `doe`, `capability` | DOE, nuisance variation, confirmation, capability and measurement-system limitations. |
| r18 | Dimensional Stability and Measurement Conditions | `dimensional-stability` | Dimensional checks tied to time, conditioning, datum, support and method. |
| r19 | Thin-Wall and Multi-Cavity Processing | `thin-wall`, `multi-cavity` | Thin-wall and multi-cavity problems framed as system-specific evidence questions. |
| r20 | Complex Diagnostics and Engineering Judgment | `complex-diagnostics` | Conflicting evidence, hypothesis ranking, risk, escalation and stopping rules. |

## Polymer-science review

The new foundations build a learner’s model from the molecule upward. The chain-regularity discussion is cross-checked against an open-access isotactic polypropylene structure/property study; the chain architecture explanation remains bounded to its cited grades and methods:

1. **Material words and network structures are different levels of description.** A polymer is a molecular material; a plastic is a usable formulation; a pellet is its feed form. Thermoplastics can soften and flow again within material limits, while a cured thermoset network does not return to a freely flowing melt.
2. **A grade is a population of chains.** Repeat units form chains with a distribution of sizes. Branching, copolymer sequence and tacticity can affect regular packing; entanglements affect motion but are not chemical cross-links.
3. **Semi-crystalline does not mean fully crystalline.** Ordered lamellae coexist with amorphous or less-ordered regions. Larger morphologies such as spherulites describe a different scale.
4. **Tg, Tc and Tm are distinct.** Tg describes a mobility change in an amorphous phase; Tc describes crystallisation under a specified cooling path; Tm describes melting of crystal populations. None is a universal machine setpoint.
5. **A moulded part has history and location.** Flow, cooling, wall thickness, pressure and grade can produce spatially different morphology. Published PP studies demonstrate effects under their stated material and test conditions; those results are not universal settings.
6. **DSC is useful and limited.** The trace belongs to a small sample and a controlled programme. A mass-basis crystallinity estimate uses net melting enthalpy, any cold-crystallisation correction, polymer mass fraction and a stated fully crystalline reference enthalpy. That estimate does not map a full component or prove component performance.
7. **Properties remain grade- and test-specific.** A structural explanation is a way to ask better questions; it does not replace supplier data, part-specific measurement or qualification.

Primary research used as a boundary check includes the [fast-scanning DSC study of cooling-rate effects in one semi-crystalline polypropylene](https://pmc.ncbi.nlm.nih.gov/articles/PMC9460925/), the [study of injection-moulded polypropylene properties at different distances from the gate](https://pmc.ncbi.nlm.nih.gov/articles/PMC12030404/), the [LDPE microstructure and rheology study](https://doi.org/10.1039/D1RA03749H), and the [study of isotactic polypropylene structure and processing history](https://pmc.ncbi.nlm.nih.gov/articles/PMC12300483/). Their results are explicitly confined to their tested materials, geometries and methods. The DSC method reference is [ISO 11357-1](https://www.iso.org/standard/83904.html); the standard landing page is not counted as an open full-text reading source.

Polymer section sizes for listen/read segmentation: Start here: plastic, polymer, resin and pellet: 104 words; Thermoplastics and thermosets have different network structures: 91 words; Repeat units, monomers and chain length: 98 words; Molecular-weight distribution, branching and entanglement: 98 words; Chain regularity, tacticity and copolymers: 97 words; Amorphous and semi-crystalline polymers: 85 words; From chains to lamellae and spherulites: 87 words; Glass transition is not melting: 92 words; Crystallisation temperature and melting temperature: 93 words; How cooling and flow build morphology: 99 words; Crystallinity is a fraction, not a label: 140 words; What DSC can and cannot tell you: 100 words; Structure links to properties, with limits: 87 words; A useful material-history chain: 92 words.

## Open further-reading source audit

The catalogue assigns **15 source IDs to each of 21 reader chapters**: 315 chapter assignments in total. The catalogue contains 156 source records, all 156 URLs are distinct and use HTTPS, and those sources span 40 distinct source hostnames (39 after collapsing `www` prefixes). Every chapter has 15 distinct IDs that resolve to the catalogue.

These are **optional further-reading links**. Their presence does not mean that every link was live-checked during this rewrite, that every publisher is independent, or that a link supports every governed claim. Source currency, access, jurisdiction, grade applicability and source quality should be checked by the independent reviewer.

### Chapter source assignments

- **r01 — From Plastic Pellets to a Finished Part:** WS_INJECTION, AUTODESK_FILL_PHASES, POLYMER_MELT_FLOW, FILLING_MODELING_REVIEW, AUTODESK_CYCLE_TIME, AUTODESK_FEED_SYSTEM, AVIENT_PROCESS, POLYSURE_GUIDE, XOMETRY_DESIGN, OPENLEARN_POLYMERS, NPTEL_POLYMER_PHYSICS, PMC_COOLING_CAVITY, AUTODESK_PRESSURE_DROP, BASF_TROUBLESHOOTER, RJG_DECOUPLED
- **r02 — The Machine, the Mould and Safety:** WS_INJECTION, WS_PLASTICS, WS_MACHINERY, WS_LOCKOUT, WS_FACTSHEET, OSHA_HORIZONTAL, OSHA_PLASTICS, OSHA_TOUR_1, OSHA_TOUR_3, OSHA_PLASTICS_INDUSTRY, HSE_PLASTICS, HSE_RESOURCES, CA_IMM_RULE, OREGON_GUARDING, HSE_INJECTION_MACHINES
- **r03 — Polymer Foundations: Chains, Amorphous and Semi-Crystalline Structure:** OPENLEARN_POLYMERS, NPTEL_POLYMER_PHYSICS, LIBRE_GLASS_TRANSITION, LIBRE_CRYSTALLINITY, LIBRE_SEMICRYSTALLINE, PACIFIC_POLYMER_TEXT, WILEY_CRYSTALLIZATION, FRACTIONATED_CRYSTALLIZATION, PA_AMORPHOUS_SEMICRYSTALLINE, CRYSTALLIZATION_KINETICS, PP_COOLING_CRYSTALLIZATION, RHEO_MEASUREMENTS, ROLE_RHEOLOGY, LDPE_RHEOLOGY, BASF_ULTRADUR
- **r03a — Advanced Materials: Fibre Orientation and High-Performance Polymers:** FIBER_FRONTIERS, FIBER_GATE_DESIGN, FIBER_UNCERTAINTY, FIBER_MODEL_ACCURACY, AUTODESK_FIBER_ANALYSIS, AUTODESK_FIBER_BASIS, AUTODESK_FIBER_TENSOR, AUTODESK_FIBER_MODELS, PEEK_CRYSTALLINITY, PEEK_REPROCESSING, VICTREX_PEEK_GUIDE, VICTREX_GUIDE_PAGE, BASF_ULTRASON_GUIDE, BASF_ULTRASON_PAGE, BASF_PPA
- **r04 — How Melted Plastic Flows—and Why Moisture and Heat Matter:** RHEO_MEASUREMENTS, ROLE_RHEOLOGY, LDPE_RHEOLOGY, PP_PRETREATMENT, EXTENSIONAL_FLOW, POLYMER_MELT_FLOW, FILLING_MODELING_REVIEW, MOISTURE_BIOPOLYESTER, MOISTURE_POLYAMIDE, PLA_DEGRADATION, PLA_PROCESSING, PP_COOLING_CRYSTALLIZATION, BASF_ULTRAMID_B3Z1, BASF_ULTRADUR, BASF_TROUBLESHOOTER
- **r05 — How the Machine Prepares and Delivers Melt:** POLYMER_MELT_FLOW, SCREW_CONVEYING, SCREW_MOTION, NOZZLE_SCREW_SETUP, AVIENT_PROCESS, POLYSURE_GUIDE, AUTODESK_FILL_PHASES, AUTODESK_CYCLE_TIME, AUTODESK_FLOW_TEMP, AUTODESK_PRESSURE_DROP, SWITCHOVER_REVIEW, AUTODESK_FILL_SETTINGS, AUTODESK_FAST_FILL, EASTMAN_TROUBLESHOOTER, BASF_TROUBLESHOOTER
- **r06 — Transfer, Packing and Clamp Behaviour:** SWITCHOVER_REVIEW, NOZZLE_SCREW_SETUP, PRESSURE_DIAGNOSIS, INMOLD_SENSORS, BARREL_NOZZLE_SENSING, OPEN_SOURCE_MONITOR, AUTODESK_CLAMP_FORCE, AUTODESK_CLAMP_RESULT, AUTODESK_CLAMP_MODEL, RJG_DECOUPLED, AUTODESK_FILL_PHASES, AUTODESK_FAST_FILL, PROCESS_WINDOW, NIST_CONTROL_METHODS, PROCESS_STABILITY_WEIGHT
- **r07 — Feed Systems, Venting and Hot Runners:** AUTODESK_FEED_SYSTEM, AUTODESK_RUNNERS, AUTODESK_RUNNER_LAYOUT, AUTODESK_RUNNER_BALANCE, AUTODESK_UNBALANCED, MDPI_MULTI_CAVITY, MDPI_RUNNER_DESIGN, OPEN_RUNNER_OPTIMIZATION, SYNVENTIVE_HOTRUNNER, MOLDMASTERS_MANUAL, AUTODESK_AIR_TRAPS, AUTODESK_AIR_TROUBLE, VACUUM_VENTING, VACUUM_VENTING_REPO, MICRO_VENTING
- **r08 — Cooling, Release and Cycle Stability:** PMC_COOLING_CAVITY, PMC_TEMP_CONTROL, PMC_CLOSE_CONTOUR, PMC_SLENDER_COOLING, PMC_CONFORMAL_REVIEW, PMC_COOLING_TIME, KUO_COOLING_WARPAGE, AUTODESK_COOL_CIRCUIT, AUTODESK_COOL_FEATURES, AUTODESK_FREEZE_TIME, AUTODESK_COOL_STAGE, AUTODESK_COOLANT, AUTODESK_DRAFT, DEMOLDING_REVIEW, XOMETRY_DESIGN
- **r09 — Establishing a Defensible Process Baseline:** NIST_HANDBOOK, NIST_MPC_GAUGE, NIST_REPEATABILITY, NIST_CAPABILITY, NIST_CONTROL_METHODS, NIST_CONTROL_CHARTS, NIST_UNCERTAINTY, PROCESS_STABILITY_WEIGHT, OPEN_SOURCE_MONITOR, INMOLD_SENSORS, PRESSURE_DIAGNOSIS, AVIENT_PROCESS, EASTMAN_TROUBLESHOOTER, WS_MACHINERY, WS_LOCKOUT
- **r10 — Scientific Process Development:** NIST_DOE_SELECT, NIST_RESPONSE_SURFACE, NIST_DOE_MODEL, NATURE_ADAPTIVE_DOE, AUTODESK_DOE, AUTODESK_DOE_SETUP, PROCESS_WINDOW, FILLING_MODELING_REVIEW, PRESSURE_DIAGNOSIS, SWITCHOVER_REVIEW, MDPI_MULTI_CAVITY, PMC_MULTIOBJECTIVE, NIST_PROCESS_OPTIMIZATION, RJG_DECOUPLED, AUTODESK_PRESSURE_DROP
- **r11 — A Diagnostic Method for Moulding Problems:** BASF_TROUBLESHOOTER, EASTMAN_TROUBLESHOOTER, ENTEC_TROUBLESHOOTER, AVIENT_PROCESS, POLYSURE_GUIDE, AUTODESK_SHORT_SHOT, AUTODESK_SINK, AUTODESK_BURN, AUTODESK_AIR_TROUBLE, WELD_AUTODESK, AUTODESK_WARP_TROUBLE, AUTODESK_STREAK, NIST_EXPLORATORY, NIST_CONTROL_METHODS, PRESSURE_DIAGNOSIS
- **r12 — Filling and Boundary Defects:** AUTODESK_SHORT_SHOT, AUTODESK_PRESSURE_DROP, AUTODESK_FILL_PHASES, AUTODESK_FAST_FILL, AUTODESK_CLAMP_FORCE, AUTODESK_CLAMP_MODEL, AUTODESK_FILL_SETTINGS, AUTODESK_FLASH, BASF_TROUBLESHOOTER, EASTMAN_TROUBLESHOOTER, ENTEC_TROUBLESHOOTER, POLYSURE_GUIDE, XOMETRY_DESIGN, FILLING_MODELING_REVIEW, PRESSURE_DIAGNOSIS
- **r13 — Shrinkage, Voids and Warpage:** PMC_WARPAGE_REVIEW, PMC_WARPAGE_INVERSE, PMC_THERMOELASTICITY, PMC_MULTIOBJECTIVE, PMC_COOLING_CAVITY, PMC_TEMP_CONTROL, PMC_CLOSE_CONTOUR, PMC_COOLING_TIME, AUTODESK_WARP, AUTODESK_WARP_TROUBLE, AUTODESK_WARP_PREP, AUTODESK_SINK, AUTODESK_SINK_INDEX, PVT_MEASUREMENT, THINWALL_WARPAGE
- **r14 — Surface Defects, Gas and Degradation:** AUTODESK_BURN, AUTODESK_STREAK, ENTEC_TROUBLESHOOTER, EASTMAN_TROUBLESHOOTER, BASF_TROUBLESHOOTER, LYONDELL_OXIDATION, PLA_DEGRADATION, PLA_PROCESSING, MOISTURE_BIOPOLYESTER, MOISTURE_POLYAMIDE, MICRO_VENTING, VACUUM_VENTING, VACUUM_VENTING_REPO, MDPI_BURN, SILVER_STREAKS
- **r15 — Weld Lines and Flow-Front Interaction:** WELD_REVIEW, WELD_MICRO, WELD_GF, WELD_PA6, WELD_AUTODESK, WELD_AUTODESK_RESULT, PLOS_THINWALL, FIBER_GATE_DESIGN, FIBER_FRONTIERS, FIBER_MODEL_ACCURACY, MDPI_MULTI_CAVITY, FILLING_MODELING_REVIEW, PMC_TEMP_CONTROL, INMOLD_SENSORS, XOMETRY_DESIGN
- **r16 — Cavity Pressure and Process Monitoring:** INMOLD_SENSORS, OPEN_SOURCE_MONITOR, PRESSURE_DIAGNOSIS, BARREL_NOZZLE_SENSING, ONLINE_QUALITY, MDPI_ADAPTIVE_SENSORS, NIST_CONTROL_METHODS, NIST_CONTROL_CHARTS, NIST_HANDBOOK, NIST_UNCERTAINTY, SWITCHOVER_REVIEW, NOZZLE_SCREW_SETUP, AUTODESK_CLAMP_RESULT, PROCESS_STABILITY_WEIGHT, NATURE_ADAPTIVE_DOE
- **r17 — DOE, Measurement and Capability:** NIST_HANDBOOK, NIST_MPC_GAUGE, NIST_REPEATABILITY, NIST_CAPABILITY, NIST_CONTROL_METHODS, NIST_CONTROL_CHARTS, NIST_UNCERTAINTY, NIST_DOE_SELECT, NIST_RESPONSE_SURFACE, NIST_DOE_MODEL, AUTODESK_DOE, NATURE_ADAPTIVE_DOE, PROCESS_STABILITY_WEIGHT, MICRO_ACCURACY, PMC_MULTIOBJECTIVE
- **r18 — Dimensional Stability and Measurement Conditions:** PVT_MEASUREMENT, PMC_COOLING_TIME, PMC_WARPAGE_REVIEW, PMC_THERMOELASTICITY, PMC_WARPAGE_INVERSE, PMC_MULTIOBJECTIVE, MICRO_ACCURACY, PROCESS_STABILITY_WEIGHT, NIST_MPC_GAUGE, NIST_REPEATABILITY, NIST_UNCERTAINTY, NIST_CAPABILITY, MOISTURE_BIOPOLYESTER, PA_AMORPHOUS_SEMICRYSTALLINE, PP_COOLING_CRYSTALLIZATION
- **r19 — Thin-Wall and Multi-Cavity Processing:** THINWALL_WARPAGE, THINWALL_PP, MDPI_THINWALL, PLOS_THINWALL, SAGE_THINWALL, MICRO_INJECTION_REVIEW, MDPI_MULTI_CAVITY, MDPI_RUNNER_DESIGN, OPEN_RUNNER_OPTIMIZATION, AUTODESK_UNBALANCED, AUTODESK_RUNNER_BALANCE, AUTODESK_FEED_SYSTEM, PMC_SLENDER_COOLING, FILLING_MODELING_REVIEW, AUTODESK_PRESSURE_DROP
- **r20 — Complex Diagnostics and Engineering Judgment:** NIST_EXPLORATORY, NIST_DOE_SELECT, NIST_RESPONSE_SURFACE, NIST_MPC_GAUGE, NIST_UNCERTAINTY, NIST_CONTROL_METHODS, OPEN_SOURCE_MONITOR, INMOLD_SENSORS, PRESSURE_DIAGNOSIS, FILLING_MODELING_REVIEW, BASF_TROUBLESHOOTER, EASTMAN_TROUBLESHOOTER, ENTEC_TROUBLESHOOTER, AVIENT_PROCESS, PMC_WARPAGE_REVIEW

## Structural and integrity review

| Check | Result |
| --- | --- |
| Reader map | 21 chapters; 46 modules assigned once each; no missing or duplicate module assignment. |
| Authored modules | 46 of 46 have revised teaching lead-ins. Polymer foundations, material families, fillers/additives, fibre orientation, high-performance polymers, both diagnostic chapters, fill study, pressure loss and gate seal received section-level rewrites. |
| Section edits | 99 changed sections, 14 new sections and 8 removed sections across the authored material. |
| Authored prose size | 22,304 words after revision, compared with 23,788 before revision. |
| Claim IDs | 137 claim IDs retained; the set is unchanged. |
| Governed evidence sources | 58 source records retained; no new governed source record was added. |
| Editorial ledger | Coverage expanded from 39 to all 46 governed modules. Each module record is bound to its exact authored Git blob and mapped claim IDs. |
| Further reading | 21/21 chapters have 15 unique source IDs; 315 assignments; 156 distinct catalogue URLs. |
| Release identity | New Book-content release is 2026.11.09.2. The learner web release in this branch remains 2026.11.09.1; Android release metadata was not changed. |
| Runtime integrity | Updated authorization fingerprints bind the rewritten canonical data files. The app’s packaged JSON copies are set to mirror those files byte-for-byte. |
| App/device behaviour | No APK was rebuilt. Locked-screen playback, Chrome speech, Android speech and physical-device accessibility were not retested here. |

## Residual risks and required independent review

1. **Independent technical review is still needed.** A materials/process SME should review all 46 modules, with focused review of safety, polymer classification and transitions, reinforced grades, process windows, high-temperature polymers, weld strength and any passage that may be read as a machine instruction.
2. **Review the material terminology against the intended learner audience.** In particular, confirm that “amorphous,” “semi-crystalline,” “crystallinity,” “lamella,” “spherulite,” Tg, Tc, Tm and DSC are introduced at the right depth and that the distinction from “semi-amorphous” is clear without being over-prescriptive.
3. **Test reading and listening on the actual phone.** Confirm chapter navigation, section sequencing, pronunciation of symbols and abbreviations, background playback, lock-screen behaviour, interruption recovery and text/voice alignment. This report makes no pass claim for the previously reported audio-stop problem.
4. **Recheck every optional link before publication.** Confirm the page remains open, relevant, current enough for its stated scope, and suitable for the chapter. Standards, manufacturer pages, academic articles and training resources should be clearly identified by type.
5. **Rebind release evidence to the final candidate.** Any exact-source build, web validation or device evidence from an earlier branch head is historical and cannot validate this rewrite. External validation, accessibility testing and any NZQA process must be attached to the exact final release.
6. **Keep product and process decisions outside this book’s authority.** The rewritten text teaches concepts and investigation logic. Material substitutions, equipment changes, process windows and corrective actions still require the relevant product, site and engineering approvals.

## Editorial verdict

The book now gives beginners a much better route into the material science they need before diagnosing process behaviour. Its most important improvement is a clear explanation that “semi-crystalline” means ordered crystals within a material that also contains amorphous regions, followed by a careful explanation of how chain architecture, thermal history and measurement affect interpretation. Across the rest of the book, shorter explanations have been made more teachable and overlapping diagnostic advice has been separated by purpose.

**Disposition:** Internal rewrite and source-boundary review complete for this repository draft. **Independent human SME review, device validation and release approval remain HOLD.**
