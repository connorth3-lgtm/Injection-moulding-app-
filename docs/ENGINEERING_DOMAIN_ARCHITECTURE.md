# MouldMaster injection-moulding domain architecture

## Purpose

Issue #310 requires engineering rules to be independently testable and reusable without coupling them to browser UI, storage, release plumbing, external integrations or machine-control authority. The canonical direction is therefore **presentation/adapters → pure domain**. The pure domain must never import from UI, DOM, IndexedDB/localStorage, network clients, GitHub/release tooling or platform packaging.

## Canonical process-domain modules

| Module | Responsibility | Browser/storage dependency |
| --- | --- | --- |
| `src/domains/process/engineering-core.mjs` | Pure injection-moulding engineering primitives and fail-closed source/semantic boundaries | none |
| `src/domains/process/process-statistics.mjs` | Pure descriptive/statistical evidence calculations with explicit unsupported states | none |
| `src/domains/process/process-data-integrity.js` | Browser compatibility adapter around site-local process-data storage/runtime | yes — adapter only |
| `data-integration-runtime.js` | Current `.16.2` UI/orchestration/storage runtime | yes — legacy orchestration layer |

The intended dependency direction is:

```text
UI / browser orchestration / storage adapters / release plumbing
                    |
                    v
       pure process-domain functions
                    |
                    v
            plain input/output data
```

A pure domain module may return data, reasons, assumptions, units, provenance and authority boundaries. It may not manipulate UI, persistence, browser globals or machines.

## Current extracted rules

`engineering-core.mjs` currently isolates the following rules without changing frozen learner-facing `.16.2` behaviour:

1. **Clamp separating-force arithmetic** — projected area × explicitly supplied representative pressure, with unit conversion and explicit warning that the arithmetic result is not automatically the required machine clamp rating.
2. **Shot/cavity mass accounting** — cavity count × part mass + optional runner mass, without claiming machine shot-capacity suitability.
3. **Process-channel semantic readiness** — role, meaning, unit/dynamic-unit and sampling-basis blockers, kept equivalent to the current `.16.2` browser implementation during migration.
4. **Exact-grade processing boundary** — grade-specific process settings require an exact grade and a current controlling supplier document; the pure domain does not invent generic production setpoints.
5. **Pressure unit + semantic typing** — converts units while requiring a declared pressure location/type; it never turns hydraulic pressure into plastic/nozzle/cavity pressure by implication, and pressure units require canonical case (`Pa`, `kPa`, `MPa`, `bar`) so `mPa` or lowercase `mpa` cannot be silently normalised to `MPa`.
6. **Location-explicit measured pressure difference** — subtracts only verified plastic-side actual pressures tied to distinct locations and one measurement basis; hydraulic and command pressures are excluded, negative differences are retained for investigation, and the result is not promoted into a viscosity or restriction diagnosis.
7. **Clamp-force uncertainty range** — applies projected area to an explicitly supplied representative cavity-pressure range without inventing a machine clamp setting or safety factor.
8. **Verified-basis shot-capacity screening** — computes utilisation only when the machine capacity and required shot are explicitly verified as comparable on the same material/equivalent basis; no universal preferred utilisation band is supplied.
9. **Machine capacity axes** — shot mass, clamp force, specific-plastic pressure, volumetric flow and plasticising throughput comparisons are separate fail-closed screens. They require exact machine/injection-unit identity as applicable plus a traceable capacity-basis reference; plasticising additionally requires exact material-grade identity. The screens report utilisation/margin without inventing a preferred utilisation target.
10. **Measured fill-stage rates** — pure volume/time, mass/time and ram-travel/time arithmetic with an explicit boundary that ram speed is not melt-front velocity and does not imply shear rate or viscosity.
11. **Machine-transfer screw geometry** — screw swept volume, geometric volumetric rate from actual screw motion, inverse screw speed for a target volumetric rate and cross-machine screw-speed translation are tied to exact injection-unit identities. The functions preserve only barrel-displacement geometry and explicitly do not claim equivalent cavity fill, pressure demand, acceleration response, melt condition or product quality.
12. **Average residence screening** — inventory/throughput and shot/cycle forms return average residence estimates only; they explicitly do not claim a residence-time distribution or grade-specific degradation limit.
13. **Relative thermal/cooling scaling** — thickness-squared/diffusivity scaling is available only as a first-order relative comparison under comparable thermal boundaries, never as a universal absolute cooling-time prediction.
14. **Amorphous 1-D analytical cooling estimate** — a centerline first-term plane-wall solution is available only when amorphous morphology, source-backed thermal diffusivity, an explicitly `centerline-temperature` ejection criterion and an explicit mould-surface-temperature basis are supplied. Semi-crystalline materials fail closed to a phase-change-model requirement, and the result remains an analytical screen rather than a guaranteed cycle setting.
15. **Source-bound shrinkage compensation range** — converts an explicitly sourced linear shrinkage range into a starting mould-dimension range using a declared mould-referenced shrinkage definition; it does not provide generic polymer shrinkage values or released tool dimensions.
16. **Exact-grade moisture acceptance with uncertainty** — compares a measured sample plus stated measurement uncertainty with an explicit supplier-controlled maximum on the same mass-fraction basis. PASS requires the full upper measurement bound to remain within the limit; FAIL requires the full lower bound to exceed it; overlap returns INDETERMINATE. No generic drying time/temperature/dew point is generated.
17. **Exact machine/mould geometric fit screens** — mould height, opening stroke, maximum daylight, tie-bar clear opening and ejector stroke are compared only on explicit like-for-like definitions tied to exact machine and mould configuration identities. No automatic mould rotation, hidden installation allowance or safety conclusion is invented.
18. **Declared-axis machine suitability composition** — combines an explicit required-axis list using PASS / MARGINAL / FAIL / UNKNOWN. Any machine, injection-unit or mould identity carried by an axis must match the summary identity or that axis becomes UNKNOWN. An identity-free custom axis is rejected unless it explicitly declares `contextIndependent: true` and a non-empty `contextBasisRef`. FAIL dominates; otherwise any unresolved/mismatched/unbound required axis forces UNKNOWN. MARGINAL additionally requires a non-empty `marginalBasisRef`. The composer never invents a margin threshold. PASS applies only to the declared axes and is not universal production readiness.
19. **Runner/gate flow-path geometry** — hydraulic diameter (4A/P), uniform-section volume and circular-channel apparent wall shear rate are available as narrowly scoped geometry/kinematic screens. The shear-rate function explicitly omits the Rabinowitsch correction and never calculates viscosity, shear stress, pressure loss or a universal safe gate/runner limit.
20. **Pressure-loss modelling readiness** — quantitative pressure-loss work is blocked unless exact grade identity, rheology model, thermal-state reference, flow-path geometry, volumetric flow plus explicit, distinct upstream/downstream location IDs are all present. The pressure-type labels may legitimately be the same at different physical locations, but only plastic-side measured kinds (specific-plastic, nozzle, runner or cavity) are accepted; hydraulic and command pressures are blocked. MFR/MFI alone is explicitly insufficient.
21. **Gate-seal plateau analysis** — repeated part-mass observations can be tested against a user-supplied decision tolerance; the result is evidence consistent with a plateau for that exact study, not proof of a universal or exact gate-freeze instant.

The machine-readable contract for these calculations is `data/engineering-calculation-registry-v1.json`. Every implemented calculation has a stable ID, input/output scope, evidence anchors and an uncertainty/authority boundary. The registry now also declares its governed evidence-resolution chain: Book/source ledgers already owned by the repository plus a deliberately small `engineeringEvidenceSupplements` section for peer-reviewed sources not otherwise defined as source records. Raw DOI strings are not valid calculation evidence IDs. `qa_engineering_domain.mjs` requires exact registry/domain coverage **and** resolves every evidence anchor to an HTTPS source record, failing on orphan IDs, conflicting governed URLs or raw DOI-as-ID usage.

`process-statistics.mjs` separately owns the descriptive/statistical evidence calculations already extracted by the audit, including reference-spread normalization, group separation, cavity-specific descriptive summaries, energy-per-good-part and fail-closed capability arithmetic. Cavity identity is retained before summarisation and no universal cavity-balance tolerance is invented. Cp/Cpk are emitted only from an explicitly confirmed within-subgroup spread basis; overall/long-term spread is labelled Pp/Ppk instead. Stability, measurement-system adequacy, sampling adequacy and distribution/model adequacy must each be explicitly confirmed and carry a non-empty evidence-basis reference; a common measurement unit, explicit spread-estimator reference and specification-authority reference are also mandatory. Bare boolean confirmations are insufficient, and the function never invents a universal acceptance threshold.

## Inputs, outputs and fail-closed behaviour

Pure functions accept plain JavaScript values/objects only. Engineering quantities must carry explicit units at the boundary. SI prefix case is preserved across the engineering unit boundary; ambiguous substitutions such as `mPa`/`MPa`, `mN`/`MN`, `Mg`/`mg`, `Mm`/`mm` and `ML`/`mL` are rejected rather than guessed. Where the input is absent, non-finite, unsupported, ambiguous or lacks required provenance, the function returns `ok: false` with a stable reason instead of guessing.

Successful engineering results carry the relevant units plus assumptions/provenance and an authority label. The authority labels are deliberately narrow: arithmetic estimates, mass accounting, semantic readiness and source-first guidance. None grant validated recipe authority or machine-control authority.

## Migration and duplicate-rule protection

The learner-facing `.16.2` browser runtime is intentionally not broadly rewritten by this audit PR. Migration is incremental:

- new or changed engineering logic should be implemented in the pure domain first;
- existing browser calculations remain unchanged until a deliberately versioned learner release migrates them;
- while duplicate logic exists, executable equivalence tests must compare the pure function to the captured current runtime rule or otherwise prove matching behaviour for representative and edge cases;
- a migration may remove the duplicate only after the consuming UI/adaptor calls the pure domain and the relevant browser/regression suites remain green.

`qa_engineering_domain.mjs` currently provides golden/invalid fixtures and an equivalence guard for the process-channel semantic-readiness rule. `qa_process_statistics_domain.mjs` provides the equivalent pure-statistics regression suite.

## Inventory for further extraction

The audit still identifies additional candidate rules that should move behind the same boundary when they next change: material/drying applicability, residence/thermal-history suitability tied to grade-specific limits, nozzle/location/platen/load/utility and ancillary-equipment fit axes, cycle-time component accounting, absolute cooling/solidification models that have sufficiently scoped material/thermal evidence, non-circular gate/shear models and validated rheology-dependent pressure-loss models, energy and quality/drift calculations, process-limit/readiness rules, and the remaining duplicate clamp/pressure/fill-rate logic in learner UI. The legacy simulator's fixed weighted defect signals also remain a training model only and must not be promoted into probability, causal or production-setting authority. Each extraction must preserve units, assumptions, provenance, uncertainty and unsupported-state reasons.

## Safety and authority boundary

This architecture introduces **no production or automatic machine-control authority**. MouldMaster remains advisory-only unless a separate controlled-site validation, safety/governance review and explicit authorization establishes a narrower authority for an exact site/system scope. Generic educational calculations must never be promoted into universal machine settings or validated production recipes merely because they are implemented in code.
