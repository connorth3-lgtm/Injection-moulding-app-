# MouldMaster formal evidence-promotion overlay

Reviewed: 2026-08-29

## Why this layer exists

`data/evidence-coverage-v1.json` is retained as the historical mechanism-audit snapshot that recorded 3 promoted and 9 provisional priority mechanisms. It is deliberately not rewritten after later evidence discovery. This preserves an auditable before-state.

`data/primary-measured-evidence-registry-v1.json` is the canonical deduplicated measured-study registry. Its current 60-study snapshot contains 60 unique peer-reviewed primary measured experiments/DOIs, split into 4 Tier A studies with public raw or companion measured data and 56 Tier B publisher-verified measured studies whose reusable raw data are not confirmed public or are request-only.

The later evidence expansion found at least two independent publisher-verified primary measured studies plus independent backup evidence for each of the nine previously provisional mechanisms. Discovery alone does not change learner-visible maturity. Formal promotion requires a mechanism dossier and an explicit downstream transition.

## Formal transition

`data/evidence-promotion-overlay-v2.json` applies nine explicit promotions on top of the historical v1 registry. Each transition points to a schema-2 dossier under `data/mechanism-promotion-evidence/`. The dossier resolves its qualifying DOI records through the canonical measured-study packs rather than duplicating signal/outcome metadata, and author/team metadata is resolved through `data/primary-measured-promotion-authors-v1.json`.

The resolved state is therefore:

- historical v1 promoted mechanisms: 3;
- formal overlay promotions: 9;
- resolved promoted priority mechanisms: 12;
- resolved provisional priority mechanisms: 0;
- resolved gaps: 0.

The nine formal overlay promotions are:

1. fibre breakage and retained fibre length;
2. runner, gate and multicavity imbalance;
3. hot-runner actual thermal/mechanical behaviour;
4. liquid silicone rubber cure and crosslinking behaviour;
5. gas/water/projectile-assisted moulding;
6. moisture, drying and process-induced degradation;
7. recyclate and process variability;
8. surface replication, texture and release;
9. injection-compression and precision optical moulding.

## Promotion standard

A promotion is valid only when executable QA confirms:

- at least two independent publisher-verified primary measured experiments;
- unique DOI and experiment identities;
- distinct evidence programmes rather than duplicate publication/re-analysis;
- real measured signals or material-state evidence;
- physical part-quality, material, dimensional, optical or mechanical outcomes;
- experimental material/tool/process context;
- explicit study limitations;
- a bounded mechanism-level claim;
- no conversion of paper-specific values into universal process recipes.

Backup/supporting studies increase redundancy but do not inflate the two-study qualifying count. Review articles, simulation-only work, synthetic-only work, unverified mirrors and duplicate analyses cannot satisfy the measured promotion count.

## Meaning of "Promoted"

Promoted means that the mechanism-level educational statement has passed the repository evidence gate. It does **not** mean:

- a study setting is a recommended production setpoint;
- a correlation proves a root cause in another mould;
- MouldMaster is authorised to change a production process;
- the evidence transfers unchanged across materials, machines, moulds, sensors or quality specifications;
- a public-data benchmark substitutes for an authorised site validation;
- external certification or accreditation has been granted.

Current resin supplier data, machine/tool manufacturer instructions, approved site procedures, competent engineering review, risk assessment and applicable safety/legal requirements remain controlling for real production work.

## Learner-facing resolution

The optional S13-S20 evidence-depth lessons keep conservative provisional fallback metadata inside `specialist-evidence-gap-extension.js`. `app-shell-finalize.js` exposes the formally resolved evidence state. QA compares its learner badges against the historical registry plus the formal overlay, so learner completion cannot promote evidence and a UI change cannot silently outrun the evidence dossiers.

The canonical 120 core lessons, assessment answers and certificate thresholds are unchanged by mechanism promotion.
