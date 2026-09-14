# MouldMaster Book — Data Enrichment Wave 2

Date: 2026-09-14

This wave broadens the Book beyond general mechanism explanation by adding candidates for measured examples, worked calculations, plots, tables, case studies and supplier-document reading exercises. It is research metadata only. It does not change the Book runtime, web release, physical-device candidate or publication authorization.

## Baseline already present

MouldMaster already has a substantial measured-data/evidence base. The repository currently documents 25 measured dataset families and a primary measured evidence registry whose human-readable ledger records 70 unique peer-reviewed measured studies. Wave 2 is not an attempt to inflate those numbers. It is an editorial acquisition map for evidence that can make the Book more concrete.

Wave 1 is also now novelty-audited: it contains 16 integration candidates, of which 9 were new repository discoveries and 7 were already-known evidence selected for Book reuse.

## Wave 2 adds 25 candidates

The machine-readable registry is `data/research-expansion/2026-09-14/book-data-enrichment-wave2-v1.json`.

The highest-value additions are:

- **420-part recycled-PP warpage/sensor study** — measured warpage, mass, in-mould temperature profiles, MFI/DSC/FTIR and controlled cooling/injection-temperature variation. Best for `warpage`, `cooling`, `dimensional-stability` and `process-monitoring`.
- **1,284 real industrial production cycles with 22 defect labels** — gives the Book a bounded production-data example across burn/gas mark, short shot, sink and flash without claiming that model feature importance proves physical cause.
- **active vacuum venting experiment** — connects venting, productivity and energy using physical trials instead of treating venting as a purely qualitative chapter.
- **holistic injection-moulding power profiles** — includes machine drives/heaters plus peripherals and cooling, useful for explaining why energy cannot be inferred from cycle time alone.
- **industrial module-level energy modelling** — useful for the distinction between machine-level and site/module-level energy evidence and for teaching model-transfer limits.
- **transparent-PC weld-line/dimensional DOE** — a clean worked example of competing cosmetic and dimensional objectives.
- **new thermoplastic rheology-characterisation procedure** — gives `rheology` and `pressure-loss` a practical experimental bridge rather than only qualitative shear-thinning discussion.
- **cooling-layer/weld-strength experiment** — links mould thermal design to physical flexural performance at a weld line.
- **PA/glass-fibre weld-line experiment** and **GF-composite weld-line prediction/validation** — allow a reinforced-material treatment that does not pretend unfilled-polymer rules transfer unchanged.
- **micro-injection weld-line experiment** — demonstrates scale effects and why a technically correct mechanism can behave differently in a very small geometry.
- **TPMS conformal-cooling mould trials**, **threaded-channel thermal experiments**, and **direct cooling/warpage metrology** — create a multi-source cooling chapter instead of relying on one conformal-cooling example.
- **measured ejection-force DOE** — draft angle, roughness, mould temperature, holding pressure and polymer identity measured with a piezoelectric force sensor. Excellent for showing interactions rather than a simplistic 'more draft is always enough' rule.
- **thick-wall sink/void experiment + CAE** — supports a worked defect case where geometry, cooling, packing and simulation are separated cleanly.
- **rapid heat-cycle moulding experiment** — useful for surface/weld/cooling trade-offs and for teaching dynamic mould-temperature systems.
- **time-dependent PP shrinkage/conditioning experiment** — supports the important point that a dimension measured immediately after moulding is not necessarily the final dimensional state.
- **XCT fibre-orientation study comparing glass, carbon and hybrid reinforcement** — gives real spatial orientation evidence and measured directional mechanical response.
- **hybrid continuous/discontinuous GF-PA6 experiment** — broadens reinforced-material coverage into insert/overmoulded hybrid structures.
- **47-variant recycled GF-PP processing-history experiment** — connects reprocessing, screw speed, MVR, fibre length and physical properties without treating screw speed as a universal degradation proxy.

## Supplier-data coverage added

The wave also adds current manufacturer-reference targets rather than deriving grade settings from papers:

- Asahi Kasei **LEONA PA technical handbook** — water absorption, moisture dependence, moulding, mould design and troubleshooting.
- Syensqo **KetaSpire PEEK design/processing guide** — high-temperature machine capability, moisture/drying, shutdown/purge and degradation checks.
- Syensqo **Udel PSU / Radel PPSU / Veradel PESU guides** — high-temperature amorphous engineering-polymer processing and design.
- BASF **Ultramid A3WG5 grade processing sheet** — a concrete PA66-GF25 exercise covering grade-specific moisture, drying, residence, screw speed and directional shrinkage.

These references are ideal for a recurring Book exercise: **read the exact supplier sheet, identify what is grade-specific, identify what the Book can explain generically, and state which document controls the production decision.**

## Recommended Book artifacts

### 1. Worked DOE chapter spread

Use the Wave 1 75-run physical HDPE dataset as the main worked table. Add the Wave 2 420-part recycled-PP warpage study as a second example showing that a different material/geometry produces a different response surface. The teaching objective is not to find a universal optimum; it is to learn how to construct, interrogate and bound an experiment.

### 2. Real defect-data spread

Use the 1,284-cycle industrial dataset to show defect prevalence, imbalance and why a classifier can be misleading when defects are rare. Pair it with mechanism-focused measured studies for short shot, flash, burns and sink/voids. This keeps prediction separate from physical diagnosis.

### 3. Cooling evidence ladder

Build one figure/table that progresses from coolant/mould thermal design to measured surface temperature, dimensional response, warpage and weld-line strength. The learner should see why 'mould temperature' is not a single controller number.

### 4. Ejection interaction example

Plot or tabulate the ejection-force study by polymer, draft and surface condition. The key learning point is the interaction: one surface or thermal change can help one polymer and hurt another.

### 5. Weld-line evidence matrix

Compare unfilled/transparent PC, PA-GF, general GF composites and micro-injection examples. Columns should include material, geometry/scale, measured output, process variables and what cannot be transferred to another mould.

### 6. Energy accounting example

Separate energy into machine drive, barrel heating, mould/temperature-control, cooling and other peripherals. Show why an energy improvement claim requires a defined measurement boundary.

### 7. Supplier-document exercises

Add small grade-document exercises for PA66-GF, PEEK and PSU/PPSU/PESU. No grade-specific number should be copied into a generic Book recipe.

## Acquisition order

1. Extract only article tables/data whose licence clearly permits it and preserve citation + context.
2. Prefer public raw datasets with stable identifiers and checksums when available.
3. For article-only studies, create Book-owned derived summaries/plots only when licence permits; otherwise cite and describe without reproducing protected tables/figures.
4. Keep physical measurements, simulation outputs, model predictions and supplier recommendations as distinct evidence classes in every Book artifact.
5. Preserve units, material identity, machine/mould context, measurement timing and sample unit. Never convert a batch, part, cycle or time-sample count into another unit to make a dataset appear larger.

## Release boundary

None of this research changes the currently released Book. When selected examples are actually added to learner-visible Book content, that will change governed learner-runtime bytes, require a new `web_release`, and create a new exact physical-device candidate. Until then, PR #332 remains the human-voice content candidate and this research PR remains metadata-only.
