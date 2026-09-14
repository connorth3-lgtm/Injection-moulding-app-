# MouldMaster Book — Data Enrichment Wave 1

Date: 2026-09-14

This research pass looks for data that can make the Book more quantitative and more useful to a working moulder without turning one machine, mould, material or experiment into a universal recipe.

The existing measured-data inventory is already substantial. This wave therefore prioritises **net-new evidence families**, not duplicate datasets already profiled in MouldMaster.

## Non-negotiable evidence boundaries

- Physical measurements and simulation outputs are separate evidence classes.
- A paper being open access does not automatically mean its raw dataset can be redistributed.
- Manufacturer processing data is grade-specific reference evidence, not a generic material-family process window.
- A case-study gate-seal time, pressure, melt temperature, cooling time, V/P point or clamp response is never a default setting for another mould.
- Correlation between a process signal and part quality is not proof of a unique root cause.
- Embargoed, request-only or rights-unresolved raw files do not count as usable Book data.
- Any derived chart must retain source identity, material, machine/mould context, units and whether each value was measured, simulated or calculated.

## Highest-value additions

### 1. 75-run physical HDPE experimental dataset — ingest first

**Experiment-Driven Gaussian Process Surrogate Modeling and Bayesian Optimization for Multi-Objective Injection Molding**  
DOI: `10.3390/polym18080902`

The article exposes the complete 75-row physical experiment table. Seven controllable variables are paired with volumetric shrinkage, warpage, cycle time and part weight. The measurement method is unusually well documented: CMM warpage, controller cycle time and stabilised precision mass.

Best Book uses:
- a complete worked DOE example;
- parameter-versus-response scatter plots;
- multi-objective trade-off discussion;
- shrinkage/weight relationship;
- why warpage is harder to predict than a single scalar process response;
- how measurement resolution and conditioning belong in the process record.

Target chapters: `doe`, `process-window`, `warpage`, `dimensional-stability`, `cooling`, `capability`, `documentation`.

### 2. Scientific-moulding machine-transfer case — build the first end-to-end case study

**Transfer and Optimisation of Injection Moulding Manufacture of Medical Devices Using Scientific Moulding Principles**  
DOI: `10.3390/jmmp5040113`

This case connects rheology, pressure-loss stages, cavity balance, gate freeze, cooling, DOE and final repeatability verification. It includes a 32-shot verification and compares theoretical and practical cycle time.

Best Book uses:
- one coherent case running through several chapters instead of isolated examples;
- cavity-balance table and interpretation;
- pressure-loss sequence through sprue/runner/gate/cavity;
- gate-seal plateau explanation;
- cooling-time evidence;
- final verification after process transfer.

Target chapters: `process-baseline`, `fill-study`, `pressure-loss`, `gate-seal`, `cooling`, `multi-cavity`, `documentation`.

### 3. Cavity-pressure diagnostic case — use for troubleshooting logic

**In-cavity pressure measurements for failure diagnosis in the injection moulding process and correlation with numerical simulation**  
DOI: `10.1007/s00170-023-11100-1`

The value here is not a single pressure number. The study shows how pressure-curve shape, filling behaviour, V/P response, mould venting and visible defects can be read together while keeping competing explanations alive.

Target chapters: `cavity-pressure`, `burns`, `short-shot`, `venting`, `diagnostic-method`, `pressure-loss`.

### 4. Multi-cavity pressure / gate-freeze study — build a pressure-integral example

**Multiple In-Mold Sensors for Quality and Process Control in Injection Molding**  
DOI: `10.3390/s23031735`

This provides measured cavity/channel pressure, product mass and experiments around clamp, switchover and holding time. It is especially useful for explaining gate freeze as an experimentally observed saturation behaviour rather than a universal time.

Target chapters: `gate-seal`, `cavity-pressure`, `clamp`, `multi-cavity`, `process-monitoring`, `vp-transfer`.

### 5. HIPS process-window physical validation — show simulation versus reality

**Utilizing Simulation Software to Develop Injection Molding Process Windows with High-Impact Polystyrene**  
DOI: `10.3390/polym17060718`

Use the study to teach how filling/packing windows can be predicted, physically challenged and corrected. Keep every plotted point labelled as simulated or measured.

Target chapters: `fill-study`, `pressure-loss`, `vp-transfer`, `process-window`, `short-shot`, `dimensional-stability`.

### 6. Experimental process-window paper — show boundaries, not nominal recipes

**Experimental Development of an Injection Molding Process Window**  
DOI: `10.3390/polym15153207`

This is useful for demonstrating why a process window is an experimentally delimited region tied to defined part outcomes, rather than one preferred set of machine values.

Target chapters: `process-window`, `flash`, `documentation`, `doe`, `capability`.

## Secondary physical-data additions

- **Tie-Bar Elongation Based Filling-To-Packing Switchover Control and Prediction of Injection Molding Quality** — DOI `10.3390/polym11071168`. Quantitative V/P, cavity-pressure and clamp-response example.
- **Research on Quality Characterization Method of Micro-Injection Products Based on Cavity Pressure** — DOI `10.3390/polym13162755`. Peak pressure versus pressure-integral relationships with part weight.
- **Real-time product weight estimation based on internal pressure monitoring in injection molding** — DOI `10.1002/pen.27078`. ABS and PP pressure-integral/weight saturation modelling; rights must be confirmed before extracting or redistributing tables/figures.
- **Out-of-Mold Sensor-Based Process Parameter Optimization and Adaptive Process Quality Control for Hot Runner Thin-Walled Injection-Molded Parts** — DOI `10.3390/polym16081057`. Nozzle pressure, tie-bar strain, viscosity index, clamp-force difference and product-weight stabilization.
- **Development of Artificial Neural Network System to Recommend Process Conditions of Injection Molding for Various Geometries** — DOI `10.1002/aisy.202000037`. Reports 3600 simulations and 476 physical experiments; use as a geometry-transfer lesson unless the underlying experiment files can be located and legally obtained.

## Simulation datasets worth using — but never call them measured moulding data

### Injection Molding Simulations v5

DOI: `10.5281/zenodo.18598121`

624 Moldflow geometry simulations with spatial fields for warpage, fibre orientation, fill/freeze time, pressure, temperature, velocity, shrinkage and residual stress. This is excellent for diagrams, field visualisation and teaching spatial mechanisms that are difficult to obtain from open physical experiments.

Target chapters: `fibre-orientation`, `warpage`, `cooling`, `fill-study`, `pressure-loss`, `thin-wall`.

### GF-PP 86-run CCD / anisotropy study

DOI: `10.3390/polym18111373`

The supplementary table contains an 86-run CCD response set for warpage and residual stress. The response table is simulation-derived; full-scale physical mould trials are a separate validation layer. Keep those two layers visibly distinct.

Target chapters: `fibre-orientation`, `warpage`, `doe`, `dimensional-stability`.

### GPPS warpage RSM dataset

Figshare dataset `29039676`, CC BY 4.0. Useful as a small reusable worked RSM example. It is Moldex3D-based simulation data, not physical part measurements.

Target chapters: `warpage`, `doe`, `process-window`.

## Manufacturer-grade reference examples

Manufacturer data should be used to teach **how to read a grade datasheet**, not to populate default settings.

### Covestro Makrolon FR6902

The current product page supplies grade-specific rheology, mechanical and thermal properties plus drying, moisture, melt/mould temperature, backpressure, screw-speed, shot-to-cylinder and vent-depth recommendations. It explicitly states that processing recommendations vary with equipment and application.

Target chapters: `moisture-drying`, `rheology`, `shot-utilisation`, `velocity-pressure`, `venting`, `material-families`.

### Celanese Polyester Technical Manual

The manual includes a flow-length versus wall-thickness example for Celanex 3300 at stated temperature/pressure conditions and explicitly warns against transferring standard test-bar shrinkage directly into production tool sizing.

Target chapters: `rheology`, `thin-wall`, `moisture-drying`, `dimensional-stability`, `fillers-additives`.

## Existing MouldMaster data that should remain in the Book enrichment pool

The new wave supplements rather than replaces the current real-data inventory. Existing high-value assets include the 3328-cycle `scatimdata` pressure/flow/part-weight datasets, 307-cycle ImPure cavity-pressure/contact-temperature traces, OpenMMS mould-side pressure/temperature/force/inertial time series, the 4502-record Mendeley production dataset, the hot-runner sustainable-material DOE supplement, the iGuzzini 1451-part quality-labelled production dataset, and the RWTH recycled-material cavity-pressure/control dataset once its advertised archive is successfully delivered and profiled.

## Recommended Book outputs

The next editorial/data integration should produce:

1. **One full scientific-moulding case** that is followed through process baseline → fill/pressure loss → cavity balance → gate seal → cooling → verification.
2. **One 75-run physical DOE workbook/plot set** covering shrinkage, warpage, cycle time and mass, with units and measurement method visible.
3. **Three cavity-pressure plots** showing normal interpretation, short-shot/burn/venting diagnosis, and pressure-integral-to-mass reasoning.
4. **One V/P/clamp worked example** using measured responses without prescribing a portable switchover position.
5. **One process-window exercise** where learners classify measured/simulated points as acceptable/unacceptable based on declared part requirements.
6. **One simulation-versus-measurement spread** for warpage/fibre orientation that visibly distinguishes prediction from physical validation.
7. **Two grade-datasheet reading exercises** demonstrating why exact commercial grade identity controls drying and processing guidance.

## Admission rule for the Book

A source is not admitted simply because it contains a useful number. Before a new chart, table or case enters the governed Book, record:

- source identity and version/date;
- licence/reuse state;
- material and exact grade where known;
- machine, mould, cavity count and sensor context where reported;
- whether each value is measured, simulated, calculated or vendor-recommended;
- unit and measurement method;
- the chapter claim the data is intended to illustrate;
- a sentence stating what the example **does not prove**.

That final line is mandatory. It prevents a strong case study from silently becoming a universal process recipe.
