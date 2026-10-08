# New2 unified Defect Finder + Troubleshooting Coach / engineering upgrade

## Learner experience

The former separate Defect Finder and Troubleshooting Coach now use one **evidence-led diagnostic workbench** inside the existing Practice surface. The old `defects` and `coach` view routes continue to resolve to the unified interface for compatibility. It runs entirely offline using the existing governed `D.defects` symptom/mechanism/check catalogue; it makes no AI network call and has no machine-control interface.

The workflow includes:

1. Search and choose a defect pattern by physical symptom, with the relevant canonical mechanisms and checks.
2. Record onset, extent/cavity distribution, known change, comparable baseline, observed actuals, and which evidence sources are available.
3. Expose missing baseline, measurement, machine/mould/material, pressure and cavity evidence without pretending a root cause is known.
4. Review multiple *unranked* candidate mechanisms; learners may label their own evidence as supportive/opposing without implying algorithmic confidence or qualified verification.
5. Identify discriminating tests, compare like-for-like shots, document a recoverability/confirmation criterion and export local learning-case JSON.

Case reports include `rootCauseVerified: false` and `productionSetpointsAuthorized: false`. Data is held transiently in the page; the export is initiated by the user. No hidden cloud service or production device input is involved. Learners are cautioned not to enter confidential recipes, names, serials or identifying site information. This does not replace site safety procedures, resin suppliers, OEM limits or independent engineering validation.

**Non-production scope:** Without physical cavity/measured traces, actual baseline and human verification, the workbench cannot infer the cause, a numerical defect likelihood, validated recovery, process window, or machine recipe.

## #442 multi-cavity evidence hardening

`multiCavityGateTopologyReadiness` operates on the pre-existing research-stage `multiCavityFlowPathGeometry` result. It requires explicit gate ID and referenced gate geometry for **every** named cavity, enforces uniqueness, and rejects tree paths that diverge and then reconverge onto a shared runner segment. It also requires a separate topology verification reference. Independent feed roots are permitted.

Even a passing topology audit returns `status: gate-path-identity-audited-unverified` and `productionAuthority: false`. It does **not** validate actual CAD/as-built connectivity, cavity balance, gate seal, flow timing, viscosity, pressure, gate opening, temperature or machine settings.

## Verification

- `qa_practice_hub.py`: protected single-entry source wiring, nonproduction flags and retired duplicate Practice choices.
- `qa/learner-ui-polish.spec.js`: real browser path from Practice through symptom, intake, missing data, hypotheses and legacy coach route on narrow mobile viewport.
- `qa_multicavity_evidence.mjs`: additional runner-gate contract and reconvergent path rejection.
- Current full QA, browser and release checks are required before merging.

Remaining external human SME/physical validation, provider, accessibility, measured-cavity evidence and production-site review stay on **HOLD**.
