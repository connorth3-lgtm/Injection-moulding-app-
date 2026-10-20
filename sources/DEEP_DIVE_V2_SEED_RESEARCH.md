# MouldMaster Deep Dive v2 — initial research and dataset seed

Status date: 2026-08-28

Purpose: seed the expanded 2,000-paper / 1,000-primary-measured-study programme with high-value sources that address known gaps. This is a discovery/intake queue, not a claim that every source has already passed full-text evidence approval or raw-file benchmark execution.

## Immediate open measured-data queue

| Source | Public record | Why it is high value | Intake state |
|---|---|---|---|
| Data Model for Injection Molding and Blow Molding | https://doi.org/10.17632/gtnb4j7bfx.1 | Industrial production records; machine/process variables, material use, unit weight, reject/good quantities and cycle/cooling timing | Open candidate; profile/fingerprint next |
| SKZ Injection Molding Dataset — Viscometer, Euromap77, Quality Table | https://b2share.eudat.eu/records/fkk68-zyf30 | 68 experiments; repeated cycles; time-resolved viscometer pressure and internal machine/Euromap77 data | Open candidate; adapter required |
| SKZ/Fraunhofer ProBayes production data with quality labels | https://b2share.eudat.eu/records/k0v7s-jf859 | Machine/peripheral time series plus computer vision, scale and IR quality evidence | Open candidate; parquet adapter required |
| SKZ/Fraunhofer ProBayes d-optimal DOE dataset | https://b2share.eudat.eu/records/v64sz-f0f41 | DOE structure, machine/peripheral data, warpage-oriented part and quality evidence | Open candidate; parquet adapter required |
| FORinFPRO-HIMD multimodal hybrid injection-moulding dataset | https://doi.org/10.5281/zenodo.20744054 | Machine data plus pressure/temperature, ultrasound and dielectric sensing on PP organosheet hybrid moulding | Open candidate; multimodal synchronisation adapter required |
| Cross-process-chain injection moulding / screw-driving dataset | https://doi.org/10.5281/zenodo.17240390 | Injection pressure/velocity/volume traces linked to downstream screw-driving/assembly behavior | Open candidate; cross-process identity adapter required |

## Primary measured-study seed — process signals, control and quality

1. Bogedale et al. (2023), **Online Prediction of Molded Part Quality in the Injection Molding Process Using High-Resolution Time Series**. DOI: `10.3390/polym15040978`. High value: direct comparison of time-series versus scalar process features.
2. Zheng et al. (2024), **An Integrated Capacitance-Pressure-Temperature Sensing Probe for Injection Molding Monitoring**. DOI: `10.1109/TIM.2024.3522402`. High value: co-located multimodal sensing tied to shrinkage/part-quality prediction.
3. Kumar, Park & Lee (2020), **Data-driven smart control of injection molding process**. DOI: `10.1016/J.CIRPJ.2020.07.006`. High value: real disturbance monitoring and compensatory control with cavity pressure/temperature evidence.
4. Gim & Rhee (2021), **Novel Analysis Methodology of Cavity Pressure Profiles in Injection-Molding Processes Using Interpretation of Machine Learning Model**. DOI: `10.3390/POLYM13193297`. High value: pressure-curve feature interpretation rather than scalar maxima alone.
5. Cheng et al. (2024), **Out-of-Mold Sensor-Based Process Parameter Optimization and Adaptive Process Quality Control for Hot Runner Thin-Walled Injection-Molded Parts**. DOI: `10.3390/polym16081057`. High value: nozzle pressure, tie-bar strain, viscosity index and part-weight control.
6. Knoll & Heim (2024), **Analysis of the Machine-Specific Behavior of Injection Molding Machines**. DOI: `10.3390/polym16010054`. High value: hydraulic/electric machine fingerprints, cold start and transfer-learning implications.
7. García-Sánchez et al. (2025), **Enhancing Injection Molding Process by Implementing Cavity Pressure Sensors and an Iterative Learning Control Methodology**. DOI: `10.3390/pr13093010`. High value: closed-loop cavity-pressure intervention with dimensional outcomes.
8. Gordon et al. (2015), **Quality control using a multivariate injection molding sensor**. DOI: `10.1007/S00170-014-6706-6`. High value: pressure, temperature, derived melt velocity/viscosity tied to weight, dimensions and tensile strength.

## Machine-health and maintenance seed

9. Pierleoni et al. (2020), **Using Plastic Injection Moulding Machine Process Parameters for Predictive Maintenance Purposes**. DOI: `10.1109/ICIEM48762.2020.9160120`. High value: machine sensor data for condition discrimination.
10. Fruth, Kruppa & Schiffers (2020), **Condition monitoring for injection molding screws**. DOI: `10.1063/5.0028341`. High value: screw-wear estimation using real process flow-rate evidence.
11. Costa et al. (2025), **Analysis of the State and Fault Detection of a Plastic Injection Machine—A Machine Learning-Based Approach**. DOI: `10.3390/a18080521`. High value: machine-state clustering/classification validated against company expertise.
12. Pan et al. (2025), **Segmentation and Modeling of Injection Molding Production Processes Driven by Input Electrical Signals**. DOI: `10.1002/app.57853`. High value: electrical signatures, process segmentation and screw-speed/energy relationships.

## Material-state, recyclate and composite seed

13. Chen et al. (2022), **An Investigation to Reduce the Effect of Moisture on Injection-Molded Parts through Optimization of Plasticization Parameters**. DOI: `10.3390/app12031410`. High value: TPU/PC moisture, gloss and visible-defect measurements.
14. Bruchmüller & Puch (2026), **Inline pvT Analysis for Precise Volume Dosing in Injection Molding: Addressing Variability in Recyclate Melts**. DOI: `10.1002/app.70411`. High value: measured pressure/pvT response for variable recyclate compressibility and dosing.
15. Krantz et al. (2024), **In-mold rheology and automated process control for injection molding of recycled polypropylene**. DOI: `10.1002/pen.26836`. High value: recycled PP blend variability, in-mould pressure/rheology and adaptive control.
16. Gaxiola-Cockburn et al. (2020), **Investigation of the Mechanical Properties of Parts Fabricated with Ultrasonic Micro Injection Molding Process Using Polypropylene Recycled Material**. DOI: `10.3390/POLYM12092033`. High value: repeated recycling with DSC/TGA/FTIR/rheology/mechanical evidence.
17. Bortoletto et al. (2024), **Enhancing properties and manufacturability of post-consumer recycled polypropylene via gas counter-pressure injection molding**. DOI: `10.1016/j.susmat.2024.e00897`. High value: PCR PP surface quality, mould contamination and mechanical outcomes.
18. Lee & Ryu (2024), **Enhancing Injection Molding Optimization for SFRPs Through Multi-Fidelity Data-Driven Approaches Incorporating Prior Information in Limited Data Environments**. DOI: `10.1002/adts.202400130`. High value: short-fibre material transfer and optimisation under limited measured data.

## Cooling and tooling seed

19. Shen et al. (2020), **Thermal and Mechanical Assessments of the 3D-Printed Conformal Cooling Channels: Computational Analysis and Multi-objective Optimization**. DOI: `10.1007/S11665-020-05251-5`. High value: cooling time, temperature non-uniformity, pressure drop and fatigue trade-offs.
20. Ohnmacht (2023), **Design optimization of conformal cooling channels for injection molds: 3D transient heat transfer analysis**. DOI: `10.1080/15376494.2023.2203686`. High value: cooling/ejection-time and thermal-uniformity optimisation.
21. Li, Ong & Wan Muhamad (2024), **Optimization Design of Injection Mold Conformal Cooling Channel for Improving Cooling Rate**. DOI: `10.3390/pr12061232`. High value: additively manufactured conformal insert followed by mould trial.
22. Cai et al. (2021), **Analysis of Heat Transfer in Conformal Cooling Channel of Injection Mold Based on ANSYS**. DOI: `10.1109/ICIIBMS52876.2021.9651554`. High value: measured temperature monitoring used to check heat-transfer simulations.

## Defect, weld-line and optical seed

23. Araújo et al. (2023), **In-cavity pressure measurements for failure diagnosis in the injection moulding process and correlation with numerical simulation**. DOI: `10.1007/s00170-023-11100-1`. High value: measured cavity-pressure signatures for burn/short-shot diagnosis.
24. Vaněk et al. (2024), **Study of Injection Molding Process to Improve Geometrical Quality of Thick-Walled Polycarbonate Optical Lenses by Reducing Sink Marks**. DOI: `10.3390/polym16162318`. High value: measured thick-section optical sink/geometry outcomes.
25. Pieressa et al. (2024), **Enhancing weld line visibility prediction in injection molding using physics-informed neural networks**. DOI: `10.1007/s10845-024-02460-w`. High value: weld-line visibility, frozen-layer relation and reduced experimental burden; retain prediction-versus-causality boundary.
26. Mukras, Zein & Omar (2025), **Achieving Optimal Injection Molding Parameters to Minimize Both Shrinkage and Surface Roughness Through a Multi-Objective Optimization Approach**. DOI: `10.3390/app15095063`. High value: experimentally validated shrinkage/surface-quality trade-off.

## LSR, hybrid and assisted-process seed

27. Weißer et al. (2022), **Novel approach to characterize the cross-linking effect of liquid silicone rubber via cavity pressure analysis during injection molding**. DOI: `10.1002/app.53381`. High value: LSR crosslinking signature derived from cavity-pressure response and DSC correlation.
28. Matysiak et al. (2013), **Analysis and Optimization of the Silicone Molding Process Based on Numerical Simulations and Experiments**. DOI: `10.1002/ADV.21272`. High value: viscosity, pvT and curing-kinetics characterisation with experimental validation.
29. Ou et al. (2017), **Multiphysics modelling and experimental investigations of the filling and curing phases of bi-injection moulding of thermoplastic polymer/liquid silicone rubbers**. DOI: `10.1007/S00170-017-0425-8`. High value: real-condition rheology/kinetics/thermal evidence for two-component LSR/thermoplastic processing.
30. Chen et al. (2022), **Using Gas Counter Pressure and Combined Technologies for Microcellular Injection Molding of Thermoplastic Polyurethane to Achieve High Foaming Qualities and Weight Reduction**. DOI: `10.3390/polym14102017`. High value: measured cell size/distribution under MuCell, GCP and dynamic mould-temperature control.
31. Jiang et al. (2021), **Microcellular injection molding of polymers: a review of process know-how, emerging technologies, and future directions**. DOI: `10.1016/J.COCHE.2021.100694`. Discovery review: core-back, SIFT, SGAP and microcellular evidence families; primary-source follow-up required before mechanism promotion.

## Statistics, anomaly and data-science seed

32. Chen, Huang & Liao (2024), **Integration of the multivariate statistical control chart and machine learning to identify faults in the quality characteristics for polylactic acid with glass fiber composites in injection molding**. DOI: `10.1177/00405175241239345`. High value: Hotelling T2 plus fault classification tied to measured mechanical quality characteristics.
33. Tayalati et al. (2024), **Hybrid Approach Integrating Deep Learning-Autoencoder with Statistical Process Control Chart for Anomaly Detection: Case study in Injection Molding Process**. DOI: `10.1109/access.2024.3425582`. High value: time-series cushion anomaly monitoring combining SPC and sequence modelling.
34. Yan et al. (2024), **Automated process monitoring in injection molding via representation learning and setpoint regression**. DOI: `10.1109/SDS60720.2024.00027`. High value: production anomaly detection with dynamic calibration/drift handling and interpretable deviation indices.

## Intake rules for this seed

- A paper enters the final evidence registry only after identity/DOI and relevance are checked and the claim is bounded to what the experiment measured.
- Reviews support discovery but do not substitute for primary measured evidence.
- Numerical optima remain local to the paper's material, geometry, machine, tool and test method.
- Dataset records above are candidates until their actual files are downloaded through the approved profiler, fingerprinted and schema-checked.
- Candidate raw datasets remain external unless redistribution is explicitly permitted.
- Any future learning case derived from these sources must declare measured versus synthetic provenance and an evidence-maturity level.
