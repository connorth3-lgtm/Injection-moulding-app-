# New2 multi-cavity evidence linkage candidate

**Status:** research-stage metadata contract, **not calibrated/physically validated**. Applies to issue #442 and builds on the separately introduced `EQ-FLOWPATH-004-CANDIDATE` geometric path accounting module. No production machine-control authority.

## Why this candidate exists

Multi-cavity geometry by itself cannot establish a flow split, packing balance, pressure loss, gate seal or filling order. The companion pure function `multiCavityEvidenceCoverage` ensures that a geometry candidate and a nominated measurement campaign name the *same cavity identities*, *one common shot window* and *one timebase synchronisation basis* and provide a distinct cavity pressure signal/location and sensor calibration reference for each cavity.

A gate-seal study may be listed *per cavity* as additional references. An incomplete gate-seal list fails closed rather than silently implying every cavity has been checked. Absence of gate-seal studies is surfaced as `not-provided`, not interpreted as a completed study.

The successful output's exact status is `reference-coverage-complete-unverified`, with `validatedBalance: false` and `productionAuthority: false`. It contains **no numeric pressure, shear, flow-split or gate-seal result**.

## Intake / review checklist before any learner promotion

- Confirm actual mould drawing, runner geometry, cavity labels, runner segmentation and installed machine/injection-unit identity against the declared references.
- Check rights-cleared measured pressure-waveform source records, sensor location, calibration, acquisition system and consistent shot/timebase correspondence across all cavities.
- Independently inspect baseline, change/intervention and follow-up trace quality. Matching text labels alone do not establish real synchronisation.
- Check actual gate-seal test protocol, hold stages, cavity-specific measurement and stabilization criteria for every claimed study.
- Preserve material grade, processing history and measurement uncertainty; distinguish measured evidence from synthetic demonstrations.
- Have a qualified machine/mould/material engineer review the physical validity before any machine-fit or educational claim is promoted.

## QA

`node qa_multicavity_evidence.mjs` uses deliberately synthetic identifier-only fixtures. It verifies matched cavity identity, common acquisition basis, both trace references, calibration references and optional all-cavity gate-seal references; it rejects missing/duplicated/unknown cavities and mismatched shot windows/timebases. The Release QA workflow exercises the test.

No user-facing numeric predictor, browser runtime core adapter, engineering equation-registry promotion or release-approval status is changed here.
