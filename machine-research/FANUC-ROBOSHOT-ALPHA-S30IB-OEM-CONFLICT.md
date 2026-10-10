# FANUC ROBOSHOT α-S30iB — conflicting OEM region specifications

**Research state (10 October 2026): HOLD — regional OEM platen dimension conflict; not an installed/verified machine.** Issue [#430](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/430).

## Two independent official manufacturer pages for the SAME labelled model

| Source | Exact URL | Published "Platen size (H × V)" | Source scope |
| --- | --- | --- | --- |
| FANUC Europe | https://www.fanuc.eu/eu-en/product/roboshot/fanuc-roboshot-a-s30ib | **440 × 420 mm** | EU technical-specification page, checked 2026-10-10 |
| FANUC America | https://www.fanucamerica.com/products/roboshot/roboshot-a-s30ib | **440 × 240 mm** | US product technical-details page, checked 2026-10-10 |

**Additional revision-bound manufacturer document:** FANUC Europe’s linked [α-S30iB Mechanical specifications PDF (MDS-04995-EN, © 2024 FANUC Europe)](https://d16ohktstcjvly.cloudfront.net/asset/513891251684/document_juqs5kiecp567ad5pq7p4up070), page 1, separately publishes **440 × 420 mm** H×V platen. It supports the European variant's stated value and contains injection-unit-versus-resin-pressure and theoretical-speed caveats, but does **not** by itself explain or retract the contradictory live FANUC America **440 × 240 mm** value.

**The numbers conflict by 180 mm in the vertical platen dimension.** Both pages identify ROBOSHOT α-S30iB, but no source examined here establishes whether this is a region/revision/variant difference, source-page typo, or another explanation. The discrepancy is **UNRESOLVED**, not a reason to average, select the more convenient number or claim a safe tooling envelope. Keep the α-S30iB die-platen/clearance claim **UNKNOWN** for any installed or recommended machine until FANUC supplies a revision-bound answer.

## Commonly published model-level figures (not an as-built configuration)

Both official pages show:

- Nominal clamping force: **300 kN**; clamping mechanism **double toggle**.
- Double-platen mould height: **150–330 mm**; clamp stroke **230 mm**.
- Tie-bar spacing H × V: **310 × 290 mm**.
- Ejector stroke: **60 mm**; ejector force **8 kN** (0.8 tonf).
- Five possible screw diameters: **14, 16, 18, 20, 22 mm**.
- Matching maximum injection volumes in the **same screw order**: **9, 11, 19, 24, 29 cm³**.
- Matching injection strokes: **56, 56, 75, 75, 75 mm**.

FANUC Europe additionally displays a **600 mm/s** maximum injection-speed table with separate five-column `pressure 1`, `pressure 2`, and **high-pressure filling mode** entries. Those published rows must remain distinct, and no mode's ratings are adopted here as a process window, fitted screw, available resin pressure or simultaneous performance guarantee. Do not transfer the α-S50iB/α-S100iB or other model options.

## Machine-readable source-conflict gate

The versioned [unresolved conflict register](oem-source-conflicts-v1.json) retains both manufacturer-page observations and the Europe MDS-04995-EN 2024 technical sheet as **distinct source claims**. The fail-closed `qa_oem_source_conflicts.py` validator and its adversarial tests run under protected Release QA. They reject changing either dimension, fabricating a resolution/approval, or introducing α-S30iB as a published machine-library model or alias before a separately reviewed OEM resolution. This is a CI safety contract, **not** an automated determination that either region is correct or that an actual machine is suitable.

## Quarantine and OEM resolution requirements

1. Preserve **both source URLs**, region and checked date as source variants. Do not add a single definitive platen dimension to `machine-library-v1.json` on the strength of either page alone.
2. Obtain FANUC's explicitly revision-identified α-S30iB datasheet and confirmation of the published US/EU **440 × 240 vs 440 × 420** discrepancy, including any region/configuration applicability.
3. For an actual installed unit, independently confirm serial/build revision, fitted platen configuration, injection unit/screw and CNC/HMI firmware. Current-series CNC advertising is **not** proof of a specific installed controller.
4. Only then consider an exact OEM model registry entry with an explicit variant/resolution record, machine-library QA and separate verified safety/site installation acceptance. An unresolved/conflicting required dimension must fail closed to **UNKNOWN**, never PASS.
5. Any learner-facing machine-record/runtime changes require the governed new-release and exact candidate validation process; physical measurement and qualified site/OEM signoff remain independent HOLDs.

**Scope:** research only. No machine-fit settings, pressure/recipe advice, machine-control authority, physical-site clearance, SME acceptance or public app release is granted.
