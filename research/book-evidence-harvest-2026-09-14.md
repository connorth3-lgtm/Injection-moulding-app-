# MouldMaster Book — Evidence Research Harvest

Date: 2026-09-14

Status: research archive / candidate evidence only

This file preserves the technical research gathered during the MouldMaster Book evidence-saturation session. It is intentionally separate from the governed Book evidence registry. Inclusion here does **not** make a claim verified, does **not** promote a chapter to Verified, and does **not** override material-, machine-, mould-, hot-runner-, site-, safety-, legal-, SDS-, or OEM-specific documentation.

## Governing accuracy rules

- Accuracy takes priority over content volume and release speed.
- Primary standards, OEM manuals, manufacturer processing data and other first-party engineering documentation take precedence where applicable.
- Peer-reviewed experimental evidence and high-quality reviews are used for mechanisms, correlations, diagnostics and process-engineering methods.
- No universal processing recipe is inferred from a single material, mould, machine or experiment.
- Correlation is not represented as causation without appropriate evidence.
- Troubleshooting guidance remains hypothesis-driven, not guaranteed-fix logic.
- Machine, mould, resin and safety limits are never guessed.
- Numeric values require units, context, applicability and provenance.
- Conflicting or unresolved evidence remains HOLD rather than being averaged into a false consensus.
- Existing Academy lesson text is not automatically Book-verified.
- Audio/listening must only use content whose governance state permits it.

## Book scope represented by this harvest

The current Book structure contains 8 parts and 46 governed chapters across:

1. Foundations
2. Materials
3. Machine
4. Mould
5. Building a Process
6. Defects & Troubleshooting
7. Process Engineering
8. Advanced

The current claim-review system covers 137 claim-level review records. At the time of this archive, 0 chapters are authorized as Verified.

## Primary authority and manufacturer evidence already in scope

Current or recently checked source families include:

- ISO 20430:2020 — injection moulding machine safety
- ISO 12165:2019 — mould component terminology
- ISO 294-1:2017 — injection moulding of test specimens, general principles
- ISO 294-4:2018 — moulding shrinkage
- ISO 294-5:2026 — anisotropy / flow-orientation related moulding properties
- ISO 20457:2026 — plastics moulded parts tolerances
- ASTM D3641-24 — injection moulding practice / material-specific processing precedence
- ASTM D955-21 — mould shrinkage test method and applicability limits
- BASF Ultramid B3Z1 Processing Data, 02/2026
- BASF Injection Molding Troubleshooter
- BASF Ultradur, Ultrason, Elastollan, Ultramid Advanced and ecovio technical literature
- Victrex PEEK processing literature
- Covestro Makrolon processing literature
- Husky hot-runner documentation
- Mold-Masters hot-runner documentation
- Synventive hot-runner documentation
- ENGEL clamp-force / mould-breathing and process-control documentation
- Sumitomo (SHI) Demag machine / clamp / mould-protection documentation
- RJG Decoupled Molding / scientific moulding process-development material
- Kistler cavity-pressure sensing and process-monitoring material
- Autodesk Moldflow clamp-force and process-simulation documentation
- NIST/SEMATECH statistical engineering handbook

## Peer-reviewed evidence — process control, V/P transfer, cavity pressure and clamp force

### Párizs et al. — multiple in-mould sensors

**Multiple In-Mold Sensors for Quality and Process Control in Injection Molding**  
Richárd Dominik Párizs, Dániel Török, Tatyana Ageyeva, József Kovács. Sensors, 2023.  
Relevant findings: pressure sensing in a multi-cavity mould was used experimentally to evaluate clamp force, switchover, holding phase and gate freeze-off. Pressure-curve integrals and cavity/in-channel sensor placement were shown to support different process-control tasks.  
Persistent record: https://openalex.org/W4319789996

### Bielenberg et al. — V/P switchover review

**From Manual to Automated: Exploring the Evolution of Switchover Methods in Injection Molding Processes—A Review**  
Christian Bielenberg, Markus Stommel, Peter Karlinger. Polymers, 2025.  
Relevant findings: reviews stroke-, time-, pressure-gradient-, deformation-, ultrasonic-, simulation- and machine-learning-based approaches to filling-to-packing switchover. Highlights sensitivity to material properties, machine wear and environmental conditions.  
Persistent record: https://openalex.org/W4409567072

### Chen, Liu & Huang — tie-bar elongation based switchover

**Tie-Bar Elongation Based Filling-To-Packing Switchover Control and Prediction of Injection Molding Quality**  
Jianyu Chen, Chunying Liu, Ming-Shyan Huang. Polymers, 2019.  
Relevant findings: tie-bar strain can act as an indirect measurement linked to mould opening force/cavity pressure and can support switchover and quality prediction in the studied system.  
Persistent record: https://openalex.org/W2961075601

### Liou et al. — adaptive process control

**Optimize Injection-Molding Process Parameters and Build an Adaptive Process Control System Based on Nozzle Pressure Profile and Clamping Force**  
Guan-Yan Liou et al. Polymers, 2023.  
Relevant findings: nozzle-pressure profile and tie-bar/clamp information were used to optimize V/P transfer, injection speed, packing and clamping force, then drive adaptive quality control across multiple viscosities.  
Persistent record: https://openalex.org/W4317933370

### Araújo et al. — failure diagnosis from cavity pressure

**In-cavity pressure measurements for failure diagnosis in the injection moulding process and correlation with numerical simulation**  
C. Araújo, D. Pereira, D. Dias, R. Marques, S. Cruz. The International Journal of Advanced Manufacturing Technology, 2023.  
DOI: 10.1007/s00170-023-11100-1  
Relevant findings: cavity-pressure profile interpretation was experimentally applied to short-shot and burn-mark diagnosis and correlated with simulation.

### Johnston, Kazmer & Gao — online simulation-based control

**Online simulation-based process control for injection molding**  
Stephen Johnston, David Kazmer, Robert X. Gao. Polymer Engineering & Science, 2009.  
DOI: 10.1002/PEN.21481  
Relevant findings: real-time nozzle-pressure-fed simulation predicted process state and was used for fill-to-pack transfer. It also documented controller/interface delay as a source of increased variability, making it useful as both supporting and limiting evidence.

### Chen, Zhuang & Huang — V/P and holding-pressure stability

**Enhancing the quality stability of injection molded parts by adjusting V/P switchover point and holding pressure**  
Jian-Yu Chen, Jia-Xiang Zhuang, Ming-Shyan Huang. Polymer, 2021.  
Relevant findings: V/P switchover and hold pressure were experimentally used to compensate process drift in the studied two-cavity system; the result should remain scoped to the tested material/process context.

## Peer-reviewed evidence — shrinkage, warpage, cooling and dimensional stability

### Zhao et al. — shrinkage and warpage review

**Recent progress in minimizing the warpage and shrinkage deformations by the optimization of process parameters in plastic injection molding: a review**  
Nanyang Zhao, Jiaoyuan Lian, Pengfei Wang, Zhongbin Xu. The International Journal of Advanced Manufacturing Technology, 2022.  
DOI: 10.1007/s00170-022-08859-0  
Relevant findings: shrinkage and warpage are multivariable outcomes influenced by mould temperature, melt temperature, injection/filling conditions, packing/holding and cooling. Supports avoiding single-cause troubleshooting rules.

### Kuo & Xu — cooling / warpage optimisation

**A simple method of improving warpage and cooling time of injection molded parts simultaneously**  
Kuo & Xu, 2022.  
DOI: 10.1007/s00170-022-09925-3  
Use: cooling-system/process optimisation with explicit scope conditions.

### Masato et al. — fibre reinforced thin-wall shrinkage

**Analysis of the shrinkage of injection-molded fiber-reinforced thin-wall parts**  
Davide Masato et al.  
Persistent record: https://openalex.org/W2738870835

### Huang et al. — fibre orientation and warpage/mechanical properties

**Flow-induced Orientations of Fibers and Their Influences on Warpage and Mechanical Property in Injection Fiber Reinforced Plastic Parts**  
Chao-Tsai Huang et al., 2021.  
DOI: 10.1007/S40684-020-00226-2  
Relevant findings: gate design and resulting short-fibre orientation materially affect anisotropic mechanical response; micro-CT was used to validate orientation predictions.

### Polymer/mould heat transfer

**Polymer/mold interfacial heat transfer during injection molding**  
D. Kamala Nathan, K. Narayan Prabhu.  
Persistent record: https://openalex.org/W4389740627

### Conformal cooling

**Towards sustainable injection moulding using 3D printed conformal cooling channels: a comparative simulation study**  
Rebecca Clark et al., 2024.  
Persistent record: https://openalex.org/W4394854337

## Peer-reviewed evidence — venting, trapped gas and burn mechanisms

### Tucker et al. — adiabatic heating / diesel effect

**High Temperature Adiabatic Heating in µ-IM Mould Cavities—A Case for Venting Design Solutions**  
Matthew Tucker, Christian Griffiths, Andrew P. Rees, Gethin Llewelyn. Micromachines, 2020.  
DOI: 10.3390/MI11040358  
Relevant findings: experimental/simulation work showed that trapped, rapidly compressed gas can create very high local temperatures during filling; supports venting as a mechanism-based consideration, without turning one micro-mould study into a universal vent-depth rule.

### Kim et al. — vent-clogging monitoring

**Development of the vent clogging monitoring methods for injection molding**  
Bongju Kim, Jinsu Gim, Eunsu Han, Byungohk Rhee. CIRP Journal of Manufacturing Science and Technology, 2021.  
DOI: 10.1016/J.CIRPJ.2021.01.009  
Relevant findings: cavity-gas pressure/temperature sensing detected vent-depth differences; cavity-gas pressure was demonstrated over a long-cycle run as a monitoring approach for vent clogging.

### Air venting multiphase simulation

**Air Venting Simulation for Multiphase Flow of Polymers and Air in the Cavity of a Mold**  
Jeong Woo Woo, Sung Hyun Choi, Min-Young Lyu, 2019.  
DOI: 10.7317/PK.2019.43.6.816

## Peer-reviewed evidence — drying, moisture, hydrolysis and thermal history

### Chen et al. — moisture effects and plasticisation parameters

**An Investigation to Reduce the Effect of Moisture on Injection-Molded Parts through Optimization of Plasticization Parameters**  
Shia-Chung Chen et al. Applied Sciences, 2022.  
DOI: 10.3390/app12031410  
Materials: TPU and PC.  
Relevant findings: moisture-related part appearance/gloss/void effects were studied against back pressure, screw speed and barrel temperature. Important limitation: the study explores mitigation under its specific materials and conditions and is not a replacement for resin-manufacturer drying requirements.

### Stan — PA / TPU drying and splay

**Considerations on the Drying of the Raw Material and Consequences on the Quality of the Injected Products**  
Daniel V. Stan, 2020.  
DOI: 10.37358/MP.20.1.5311  
Materials: polyamide and TPU.  
Relevant findings: connects measured residual moisture with splay/appearance effects in hygroscopic materials.

### Long & Sokol — polycarbonate moisture degradation

**Molding polycarbonate: Moisture degradation effect on physical and chemical properties**  
T. S. Long, R. J. Sokol. Polymer Engineering & Science, 1974.  
DOI: 10.1002/PEN.760141202  
Relevant findings: excess moisture during PC moulding was associated with molecular-weight and mechanical-property reduction. Numeric moisture limits from this historical paper must not displace current grade-specific supplier data.

### Aguirre-Flores & Sanchez-Valdes — moisture plus reprocessing in PC

**Effect of reprocessing and moisture on the properties of bisphenol-A polycarbonate**  
Journal of Injection Molding Technology, 1999.  
Relevant findings: combined moisture and repeated processing reduced measured physical properties and altered molecular-weight / melt-flow indicators in the studied polycarbonate.

### Ceretti et al. — degradation mechanisms review

**Molecular Pathways for Polymer Degradation during Conventional Processing, Additive Manufacturing, and Mechanical Recycling**  
Daniel V. A. Ceretti, Mariya Edeleva, Ludwig Cardon, Dagmar R. D'hooge. Molecules, 2023.  
DOI: 10.3390/molecules28052344  
Relevant findings: thermal, thermo-mechanical, thermo-oxidative and hydrolytic degradation pathways across polymer processing. Useful for mechanism explanations, not for grade-specific operating limits.

## Peer-reviewed evidence — plasticising unit, screw behaviour and melt homogeneity

### Verbraak & Meijer — screw design

**Screw design in injection molding**  
C. P. J. M. Verbraak, H. E. H. Meijer. Polymer Engineering & Science, 1989.  
DOI: 10.1002/PEN.760290708  
Relevant findings: compared general-purpose, barrier and mixing-element screw designs for distributive/dispersive mixing, capacity and melt-temperature homogeneity. Also provides limiting evidence against assuming that simply increasing back pressure is always the best way to improve mixing.

### Wilczynski & Buziak — melting/flow model plus experiments

**Modeling and Experimental Studies on Polymer Melting and Flow in Injection Molding**  
Krzysztof Wilczynski, Kamila Buziak. Polymers, 2022.  
DOI: 10.3390/polym14102106  
Relevant findings: experimental investigation of screw speed, plasticating stroke and back pressure; explicitly notes limitations of existing models and identifies previously under-represented feeding/melting behaviour.

### Park et al. — barrier screw plasticisation

**Effect of Barrier Screw Design in Injection Molding Machines on the Plasticization Efficiency of Polypropylene Resin**  
Seong-Yeol Park et al., 2016.  
DOI: 10.7317/PK.2016.40.5.751

### Chen, Wong & Huang — regrind melt-quality control

**Quality monitoring and control for plasticization of acrylonitrile-butadiene-styrene regrind polymer in injection molding**  
Jian-Yu Chen, Liang-Ci Wong, Ming-Shyan Huang. Polymer Engineering & Science, 2023.  
DOI: 10.1002/pen.26596  
Relevant findings: pressure-integral features during plasticisation correlated with regrind-part quality and back-pressure adjustment in the studied system.

## Peer-reviewed evidence — runners, gates, multi-cavity balance and hot runners

### Lee & Kim — runner balancing via packing simulation

**Automated design for the runner system of injection molds based on packing simulation**  
B. H. Lee, Byung Kim. Polymer-Plastics Technology and Engineering, 1996.  
DOI: 10.1080/03602559608000086  
Relevant findings: runner/gate changes were used to minimise cavity entrance pressure differences through the cycle, including family-mould contexts.

### Beaumont, Young & Jaworski — geometrically balanced runners can still imbalance

**Mold Filling Imbalances in Geometrically Balanced Runner Systems**  
John P. Beaumont, Jack H. Young, Matthew J. Jaworski. Journal of Reinforced Plastics and Composites, 1999.  
DOI: 10.1177/073168449901800609  
Relevant finding: geometrically balanced multi-cavity runners can develop substantial shear/thermal flow imbalance; useful evidence against equating geometric symmetry with guaranteed rheological balance.

### Kapoor & Kazmer — local multi-cavity melt control

**Consistency and Flexibility of Multi Cavity Melt Control**  
Deepak Kapoor, David Kazmer. International Polymer Processing, 1998.  
DOI: 10.3139/217.980398  
Relevant findings: local valve control and cavity-pressure regulation were used to improve dimensional process capability in the reported commercial multi-gate application.

### Han et al. — hot-runner imbalance

**A Study on the Filling Imbalances between Multi-Cavity in Hot-Runner Mold**  
Han Seong Ryeol et al., 2005.  
Relevant findings: CAE plus moulding experiments with ABS, PMMA and PA showed that hot-runner filling imbalance remained material/process dependent and simulation did not perfectly reproduce experiment.

### Yokoi et al. — visualisation inside hot-runner system

**Visualization analysis of injection molding phenomena in hot-runner system**  
Hidetoshi Yokoi et al., 2016.  
DOI: 10.1063/1.4942273  
Relevant findings: direct visualisation of stagnation, valve-pin/nozzle regions, asymmetrical filling, temperature distribution and other hot-runner phenomena.

## Peer-reviewed evidence — thin wall, micro moulding and flow hesitation

### Regi et al. — direct visualisation of thin-wall flow hesitation

**Experimental Characterization and Simulation of Thermoplastic Polymer Flow Hesitation in Thin-Wall Injection Molding Using Direct In-Mold Visualization Technique**  
Francesco Regi, Patrick Guerrier, Yang Zhang, Guido Tosello. Micromachines, 2020.  
DOI: 10.3390/MI11040428  
Materials: ABS and PP.  
Relevant findings: flow progression/hesitation depended on section thickness, velocity and material type. Simulation accuracy degraded in thinner sections, providing useful model-limitation evidence.

### Cheng et al. — hot-runner thin-wall adaptive control

**Out-of-Mold Sensor-Based Process Parameter Optimization and Adaptive Process Quality Control for Hot Runner Thin-Walled Injection-Molded Parts**  
Feng-Jung Cheng et al. Polymers, 2024.  
DOI: 10.3390/polym16081057  
Relevant findings: nozzle pressure and tie-bar strain features were used to build and test a standardized parameter-optimization/adaptive-control procedure in a hot-runner thin-wall case.

## Peer-reviewed evidence — DOE, process windows, monitoring and data-driven control

### Fitzgerald et al. — scientific moulding / process transfer

**Transfer and Optimisation of Injection Moulding Manufacture of Medical Devices Using Scientific Moulding Principles**  
A. Fitzgerald et al. Journal of Manufacturing and Materials Processing, 2021.  
Relevant themes: pressure-loss study, gate-freeze study, cavity balance, rheology and DOE used in process transfer/optimisation.

### Kumar, Park & Lee — data-driven smart control

**Data-driven smart control of injection molding process**  
Saurabh Kumar, Hong-Seok Park, Chang Myung Lee. CIRP Journal of Manufacturing Science and Technology, 2020.  
DOI: 10.1016/J.CIRPJ.2020.07.006  
Relevant findings: cavity pressure/temperature limits and rule-based control were tested in an automotive moulding case.

### Coates & Speight — early intelligent process-control work

**Towards Intelligent Process Control of Injection Moulding of Polymers**  
P. D. Coates, Russell Speight, 1995.  
DOI: 10.1243/PIME_PROC_1995_209_095_02  
Relevant findings: melt/hydraulic pressure integrals were correlated with part weight/dimensions across laboratory and factory studies and multiple polymers.

## Defect-specific evidence and diagnostic cautions

### Short shot

- Araújo et al. 2023 demonstrates cavity-pressure-based diagnosis in studied failure cases.
- Moayyedian, Abhary & Marian: **The Analysis of Short Shot Possibility in Injection Molding Process**, DOI 10.1007/s00170-017-0055-1. Experimental/simulation work identifies material/process/geometry-dependent contributors; its parameter ranking must remain scoped to the tested PP plate/gate system.
- Otieno et al. 2023 evaluates interactions between process parameters for short-shot modelling; useful for demonstrating interaction effects rather than single-cause rules.

### Weld lines

**A review of research progress on the minimization of weld lines in injection molding**  
Xijue Li et al.  
Persistent record: https://openalex.org/W4396518863  
Use: mechanism and mitigation synthesis; individual recommendations still need material/mould scoping.

### Sink marks / shrinkage / voids

Use multivariable shrinkage/warpage evidence and defect-specific simulation/experimental work rather than reducing these defects to a single packing-pressure rule. Existing candidate sources include experimental/numerical studies of sink marks in injection-moulded gears and inserted parts.

### Splay

Moisture is one possible splay mechanism, strongly supported for hygroscopic materials in multiple sources, but splay must not be universally equated with moisture because thermal degradation, shear/air/gas and contamination-related appearances can overlap.

### Burn marks

Trapped/compressed gas and inadequate venting are supported mechanisms in appropriate geometries, but burn marks can also involve thermal/material degradation and process conditions. Diagnostic logic must preserve competing hypotheses.

### Black specks / contamination

Evidence harvest remains comparatively weaker here than for pressure/warpage/venting. Manufacturer/OEM contamination, purge, residence-time and thermal-degradation documentation should remain primary until stronger peer-reviewed defect-specific evidence is mapped.

## Important negative / limiting evidence captured

The evidence harvest intentionally includes findings that prevent overclaiming:

- Some process-control methods increase variability if sensor/controller delays are not accounted for.
- Simulations can reproduce flow patterns while still losing accuracy in very thin sections or for pressure magnitude.
- Geometric runner balance does not guarantee rheological/thermal balance.
- Increasing back pressure is not a universally superior way to improve melt homogeneity; screw design and material/process context matter.
- Moisture mitigation experiments do not override supplier-required drying specifications.
- Shrinkage and warpage respond differently to processing variables and should not be treated as interchangeable defects.
- Cavity-pressure signals are powerful process indicators but sensor position and mould geometry affect interpretation.
- Hot-runner/manifold stagnation and temperature history are system-specific; generic residence-time claims must be qualified.
- Results from PP, ABS, PC, PA, TPU, PEEK or other families are not automatically transferable between polymers or grades.

## Plugin research status

### Working

- Consensus — peer-reviewed search and paper-record retrieval
- SciSpace — broad academic search and topic-focused triage
- Sider Scholar — OpenAlex/Scholar-scale discovery and persistent identifiers

### Connected but not usable in this session

- Elicit — connection succeeded, but search/systematic-review execution was restricted by the connected account/plan. No Elicit evidence was counted as retrieved evidence.

### Recommended additional layer

- Scite — useful for citation-context checking, particularly to identify whether important papers are subsequently supported, disputed or merely mentioned.

## Search-quality observations

Large broad searches produce substantial irrelevant polymer/additive-manufacturing/biomedical material noise. Topic-specific semantic searches produced much higher-value evidence for:

- cavity pressure and V/P transfer
- clamp-force optimization
- drying/moisture/hydrolysis
- venting and trapped gas
- runner/gate/multi-cavity balance
- hot-runner behavior
- thin-wall hesitation
- plasticisation and screw design
- shrinkage/warpage/fibre orientation
- process monitoring / adaptive control

A few OpenAlex records returned malformed metadata in very large result batches. Those records were not treated as reliable evidence and should be re-resolved by DOI/title before registry inclusion.

## Required next governance step

This archive is deliberately **not** the production evidence registry. Before any item here supports a Book claim, it should be converted into a structured evidence record containing at least:

- stable evidence ID
- title
- authors / responsible organisation
- publication / document date
- DOI or persistent URL
- source type
- authority tier
- material / grade scope
- machine scope
- mould / geometry scope
- process-variable scope
- measured outcomes
- supported claim(s)
- limitations
- contradiction / corroboration links
- source-currency date
- Book chapter mapping
- claim-review mapping
- final status: supported / qualified / HOLD / conflicting

No chapter should be promoted solely because this harvest is large. Verification remains claim-by-claim and fail-closed.

## Repository context at archive creation

Source Book head used to create this independent research branch:

`e23837bed45ae9b7007420af470328ab2c81b403`

The active Book pull request remained separate and unchanged by this archive upload.
