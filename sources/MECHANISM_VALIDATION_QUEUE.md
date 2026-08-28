# MouldMaster — Mechanism Validation Queue

Reviewed: 2026-08-28

This queue turns the evidence-coverage audit into executable work. It does **not** claim every mechanism can be validated from the five public datasets already identified. A public dataset should only be used where its actual fields and outcomes match the mechanism being tested.

## Current mechanism state

The registry currently tracks **12 priority mechanisms: 3 promoted / 9 provisional**.

Promoted mechanism evidence:

1. **Ejection/demoulding physics** — independent measured release/ejection and physical demoulding-quality evidence is retained. Next work is learning integration and dataset/site validation where suitable release-force or thermal signals exist.
2. **Residual stress/birefringence** — independent measured pressure/thermal-history plus optical/residual-stress and dimensional outcomes are retained. S13 may display Promoted while study-specific settings remain bounded.
3. **Weld-line mechanical strength** — independent measured tensile/impact and long-term durability evidence is retained. S14 may display Promoted, while cosmetic visibility remains separate from structural qualification.

Promotion does not mean the mechanism has a universal setpoint, limit, acceptance rule or guaranteed root cause.

## Lane A — executable with current open measured-data targets

### Recyclate and process variability

**Best first dataset:** RWTH post-consumer-recycled material process data.

Use real screw-antechamber pressure, cavity pressure, controller output, screw velocity/volume and part mass to test whether material identity/lot and dynamic process response expose variation that nominal machine settings hide.

Required report: source/version, file fingerprint, material groups, cycles, missingness, cavity/process signals, part-mass outcome and limitations. Do not infer a universal PCR correction factor.

### Process dynamics and quality linkage

**Best first datasets:** Mendeley industrial injection-moulding process-quality data and the SKZ Injection Molding Dataset.

Use these to verify data-pipeline assumptions around scalar settings versus time-resolved pressure, grouping, repeated cycles, quality tables and machine/material identity. This supports the broader evidence architecture but does not directly validate every specialist mechanism.

### Sensor fusion and cavity/process identity

**Best first dataset:** FORinFPRO-HIMD.

Use synchronized machine pressure, screw position/speed, clamp force, temperatures, ultrasound and dielectric signals to test multi-sensor reasoning, event alignment and the rule that different sensor locations/modalities are not interchangeable.

### Upstream process variation and downstream quality

**Best first dataset:** cross-process-chain injection-moulding / screw-driving archive.

Use upstream time-series/static moulding evidence and downstream assembly outcomes to test association and traceability while explicitly preventing upstream association from being labelled a proven root cause.

## Lane B — remaining literature-to-learning promotion work

These mechanisms remain provisional and need their own publisher-verified promotion dossiers. Do not use the three completed promotions to imply that adjacent mechanisms are also verified.

1. **Fibre breakage/retained length** — require measured fibre-length distributions plus mechanical/flow outcome where possible.
2. **Runner/gate/multicavity imbalance** — prioritize cavity-specific measured response and avoid treating simulation-only balance as production validation.
3. **Hot-runner actual behaviour** — prioritize heater/thermal/actuation actuals and cavity response rather than displayed setpoints.
4. **Liquid silicone rubber** — keep cure/crosslinking evidence separate from thermoplastic mechanisms.
5. **Gas/water/projectile-assisted moulding** — retain penetration and residual-wall-thickness evidence by process family.
6. **Moisture/drying/degradation** — prioritize measured pellet water content or material-state evidence rather than dryer settings alone.
7. **Surface replication/release** — retain replication metrology and demoulding/adhesion evidence as separate outcomes when appropriate.
8. **Injection-compression/precision optics** — retain residual-stress/birefringence, geometry and optical-performance evidence and do not inherit promotion automatically from the residual-stress mechanism.

**Recyclate/process variability** remains provisional too, but its next validation step is Lane A because an executable public measured-data target already exists.

## Lane C — authorised site-data pilot opportunities

The first approved site pilot can strengthen mechanisms where public datasets are sparse, but only if the site actually has suitable de-identified measurements. High-value fields are:

- cavity pressure by cavity;
- screw position, velocity and pressure command versus actual;
- V/P transfer timing and fill-fraction proxy;
- cushion and shot-delivery history;
- TCU supply/return temperature, flow and pressure-drop actuals;
- hot-runner zone actual temperature and heater duty/current where available;
- valve-gate command and actual actuation evidence where available;
- tie-bar/mould strain or separation evidence;
- material grade/lot, regrind/recycled fraction, drying and point-of-use moisture where measured;
- shot-linked part mass, dimensions, defect labels and mechanical tests;
- eject-force/load and part/tool temperature where available;
- timestamped intervention with before/after recovery verification.

No site-data field is required merely to satisfy this queue. The approved pilot scope, privacy rules, site authority and available instrumentation control what can be used.

## Promotion sequence

For each provisional evidence-coverage mechanism:

1. Deduplicate candidate literature by DOI, then work ID/title-year where DOI is absent.
2. Verify publication type and publisher metadata.
3. Record measured signals and physical outcomes.
4. Record machine/tool/material/test context and limitations.
5. Record an independence rationale showing why the counted experiments are separate evidence rather than duplicate publications or re-analysis of one campaign.
6. Require two independent publisher-verified primary measured studies before marking the mechanism `promoted`.
7. Link the mechanism to an existing synthetic case or optional specialist lesson; do not convert the synthetic case into measured data.
8. Where a suitable public or authorised dataset exists, run a separate benchmark and record the raw-file fingerprint and data-quality report.
9. Promote only the relationship actually supported; do not turn local numerical results into universal settings.

For an already promoted mechanism, new evidence can strengthen, narrow or challenge its scope, but it must not silently broaden the promoted claim.

## Priority order

1. Execute the existing public-data preflight and profiler on the Mendeley dataset.
2. Add adapters/profilers for SKZ, RWTH PCR, FORinFPRO-HIMD and the cross-process-chain archive.
3. Build the next promotion dossiers for fibre breakage/retained length, multicavity balance and hot-runner actual behaviour because they add immediate diagnostic depth to existing lessons.
4. Continue LSR, assisted moulding, moisture/degradation, surface replication and injection-compression/optics with their process-family and evidence boundaries explicit.
5. Use the first authorised site pilot to validate relationships that the public datasets cannot cover, without committing proprietary raw rows.
6. Revisit ejection, residual stress and weld-line structural evidence only when new studies or measured-data validation materially change the bounded mechanism claim or limitation.
