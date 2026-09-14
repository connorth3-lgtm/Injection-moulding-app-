# MouldMaster Book — Data Enrichment Waves 2–4

Date: 2026-09-14

This note extends `BOOK_DATA_ENRICHMENT_2026-09-14.md`. It records the broader search requested after Wave 1 while preserving the distinction between **Book-integration candidates**, **independent measured experiments**, **simulation**, **supplier references**, and **secondary synthesis**.

## Current branch inventory

- Wave 1: 16 Book-enrichment candidates after the novelty audit: 9 new repository discoveries plus 7 already-known evidence sources deliberately selected for Book reuse.
- Wave 2: 25 further integration candidates across defects, energy, cooling, weld lines, rheology, ejection, recyclate/fibre behaviour and supplier references.
- Wave 3: 6 recovered candidates from the interrupted search: two defect/fault cases plus four manufacturer references.
- Wave 4: 15 candidates that were exact-DOI screened against `main` and deduplicated against Waves 1–3.
- Total candidate entries on this branch: **62**.

**62 candidate entries does not mean 62 new independent experiments.** Earlier waves include sources that were new to the Book-enrichment map but in some cases already existed elsewhere in MouldMaster's larger research/evidence corpus. Wave 4 is the strictest novelty layer and records only candidates whose exact DOI was not found on `main` and which were absent from Waves 1–3.

No learner-runtime Book content, release identity, publication authorization or physical-PWA candidate is changed by this research branch.

## What the broader search added

### Real industrial defect data

A 2026 Applied Sciences case (`10.3390/app16021025`) uses **1,284 real production cycles**, 24 machine/process parameters and 22 binary defect labels from a washing-machine control-panel line. Four critical defects—gas-trapped burn, short shot, sink mark and flash—were modelled together and followed by an on-site validation run. The key teaching value is not an AI model score; it is the real trade-off between defects and the need to split data by process setup rather than randomly leaking nearly identical cycles across train and test sets.

### Warpage, sink and dimensional metrology

Wave 2 adds a 420-part recycled-PP warpage/in-mould-sensor study. Wave 4 adds the September 2026 HDPE deformation paper (`10.3390/jmmp10090340`) combining moulding trials, DOE, 3D scanning and coupled thermal-structural simulation. It also adds a 2026 four-profiler inline geometry system (`10.1007/s00170-026-18962-1`) validated across 20 calibration experiments and 780 reference points.

These sources are suitable for teaching the difference between **process variation**, **part deformation** and **measurement-system capability**.

### Rheology and recyclate variability

The 2025 PA6GF30 rheology study (`10.1007/s00170-025-16522-7`) links MFI-derived rheology, Cross-WLF fitting, capillary-rheometer comparison and moulding validation. The recyclate flow-front paper (`10.1007/s00170-025-17109-y`) physically and numerically challenges how changes in viscosity and pvT behaviour move the flow front and pressure demand.

Together they can support a worked lesson showing why a displayed machine setting is not enough: material behaviour determines what that command actually produces.

### Reprocessing, fibres and circular materials

New candidates include:

- `10.1016/j.compositesa.2026.109837` — up to five reprocessing cycles of paper-fibre PP with fibre-length, GPC, DMA, rheological, thermal and mechanical measurements.
- `10.3390/ma19112314` — recycled fibre-reinforced PP validated at **seven industrial companies/sites** in Spain and Slovenia across different machines, moulds and components.
- `10.1016/j.jmapro.2026.02.012` — an injection-moulding compounder study measuring pressure build-up, residence time and shear while evaluating recycled fibre-reinforced thermoplastic processing.
- `10.1016/j.compositesa.2025.109174` — weld-line mechanical response and fibre realignment in recycled short-glass-fibre PP under a specialist gas-assisted push-pull process.

These are especially useful for stopping the Book from implying that a polymer family name defines a repeatable process response after recycling or repeated thermal/shear history.

### Weld lines and surface defects

The expanded pool now covers conventional and specialist weld-line mechanics, thin-wall thermal control and surface appearance. Wave 4 adds the 2026 halo-gloss-transition study (`10.1038/s41598-026-42688-5`), a PC/ABS surface-defect family that is distinct from flash, burns or short shots. It also adds the PLOS thin-wall study (`10.1371/journal.pone.0337889`) with physical thermal measurements and tensile testing across PC, ABS, PA6 and PP.

This gives the Book enough diversity to teach that an appearance defect is an observation to explain, not a one-to-one cause code.

### Cooling and tool thermal behaviour

The search now spans conventional, conformal, TPMS, threaded, thin-layer and lattice-structured cooling concepts. Wave 4 adds physical LDPE validation of lattice-structured surface cooling (`10.1016/j.jmapro.2026.04.059`) and a separate simulation-only conformal-versus-traditional Pareto study (`10.1007/s12289-026-01979-y`).

The evidence class must be visible on every future figure: **physical validation** and **simulation optimisation** are not interchangeable.

### Tool condition, ejection and tool life

Wave 2 adds measured ejection-force studies. Wave 3 adds an industrial black-speck troubleshooting case linking degraded resin in stagnant machine regions to inspection/intervention/follow-up. Wave 4 adds the September 2026 photopolymer rapid-tooling study (`10.1007/s00170-026-19051-z`), where thermal accumulation produced dimensional drift and edge failure after only a few dozen cycles in the tested prototype inserts.

This is an excellent contrast lesson: tool condition can become the changing input, but rapid photopolymer-tool cycle life must never be generalized to production steel moulds.

### Residual stress and delayed dimensional behaviour

Wave 4 adds the open PLA residual-stress study (`10.1002/bip.70026`) combining photoelasticity with quantitative hole-drilling measurements. Wave 2 also includes post-mould PP conditioning/shrinkage evidence. These sources support a stronger explanation that a dimension measured immediately after ejection is not necessarily the final dimensional state.

### Energy and sustainability

The branch now includes multiple distinct energy perspectives:

- real plant energy/production data already present in MouldMaster;
- full-cell energy accounting including drive, barrel heaters, temperature-control units and cooling (`10.1016/j.procir.2026.05.065`);
- machine-module energy modelling;
- the already-staged LEGO six-machine-family dataset/appendix route;
- an open 2026 meta-regression (`10.1016/j.resconrec.2025.108730`) summarising 160 energy observations across 15 studies, 20 materials and three machine types.

The meta-analysis is **secondary evidence**. It is valuable for demonstrating why a generic kWh/kg constant is weak, but it must not inflate the primary-measured evidence count.

### Moisture and material conditioning

The Book already has thermoplastic drying evidence and exact-grade supplier sources. Wave 4 deliberately adds one specialist counterexample: `10.1007/s12289-026-02087-7`, an industrial thermoset case with **1,524 parts across 254 cycles**, six controlled moisture levels and 100% camera inspection across eight surface-defect types.

Its educational value is the non-linearity and the failure of the slogan “drier is always better.” Its numerical moisture window **must remain thermoset-specific** and must never be merged into thermoplastic drying guidance.

## Data that is valuable but not currently usable as raw Book data

Two 2026 Zenodo PP datasets remain particularly valuable but are embargoed until **31 December 2027**:

- process settings, five part-weight measurements per batch, energy and cycle time (`10.5281/zenodo.20309380`);
- part images / defect-segmentation data from the same experimental campaign (`10.5281/zenodo.20322729`).

Their CC BY 4.0 metadata does not override the file embargo. They may be cited as future acquisition targets, but their raw rows/images must not be represented as currently possessed or profiled.

The RWTH recycled-material process-control archive (`10.18154/RWTH-2025-06809`) is rights-clear at record level, but MouldMaster's previous automated retrieval received an HTML response rather than the advertised archive. It remains non-counting until the actual source payload is obtained and fingerprinted.

## What to turn into Book content first

1. **Industrial multi-defect case:** show the competition between burns, flash, short shots and sink rather than presenting four independent symptom recipes.
2. **75-run physical DOE:** build transparent plots for warpage, shrinkage, cycle time and mass with units and measurement methods visible.
3. **Rheology → fill response:** connect measured rheology to pressure demand and recyclate flow-front variation.
4. **Three-dimensional measurement case:** compare real 3D-scanned warpage/sink results with simulation while keeping evidence types visually distinct.
5. **Weld-line mechanics:** contrast unfilled/reinforced/recycled and thin-wall thermal cases without transferring their process settings.
6. **Residual stress:** use photoelasticity as the visual entry point, followed by quantitative stress measurement and delayed dimensional implications.
7. **Full-cell energy:** teach system boundary first, then SEC; do not treat machine drive power as total moulding energy.
8. **Tool degradation:** pair ejection/tool-condition evidence with rapid-tool degradation to show when a process symptom is actually a tooling-state change.
9. **Supplier-reference exercises:** keep exact grade/family documents in the loop so learners practise checking the source that actually controls production.

## Admission rule remains fail-closed

No chart or worked case becomes governed Book content until its source identity, rights state, material/grade, machine/tool context, evidence class, units and measurement method are recorded. Every example must also state what it **does not prove**.

That discipline lets the Book become much richer in real numbers without quietly turning research observations into unsafe recipes.
