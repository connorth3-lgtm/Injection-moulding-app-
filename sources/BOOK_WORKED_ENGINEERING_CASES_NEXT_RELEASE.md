# MouldMaster Book — governed worked engineering cases

**Status:** integrated into governed `2026.09.24.12` learner runtime as exact-byte-authorized synthetic teaching content. The cases remain **not independently SME-approved**; independent human Book SME validation is still a separate HOLD.

Every number below is **SYNTHETIC TEACHING DATA** unless explicitly stated otherwise. The cases teach calculation and evidence structure, not universal production settings. Each case is mapped into `data/book-worked-engineering-cases-v1.json` with a unique case-level claim ID, evidence source IDs, assumptions/boundaries, runtime byte-integrity authorization, and explicit inclusion in the independent Book SME review scope.

## 1. Clamp-force estimate: expose every assumption

**Question.** A synthetic part/runner system has projected area `120 cm²`. An engineering study uses an assumed representative cavity pressure of `55 MPa` only to illustrate the relationship between pressure and separating force.

Convert area: `120 cm² = 0.012 m²`.

Estimate separating force:

`F = P × A = 55,000,000 Pa × 0.012 m² = 660,000 N = 660 kN`.

**Interpretation.** `660 kN` is the arithmetic result of the stated assumptions. It is not automatically the required machine clamp rating. Real decisions must account for actual projected area including applicable feed-system area, pressure distribution, cavity count, mould stiffness/support, machine/mould limits and the site's engineering margin policy.

**Evidence anchors:** ISO 20430 safety boundary; ISO 294-1 process context; Autodesk clamp-force result documentation.

## 2. Staged pressure-loss study: upstream pressure is not cavity pressure

**SYNTHETIC TEACHING DATA**, captured at a controlled comparable fill condition:

| Flow path present | Displayed upstream injection pressure |
| --- | ---: |
| Nozzle only | 18 MPa |
| Nozzle + sprue/runner | 34 MPa |
| + gate / early cavity | 58 MPa |
| Full intended fill path | 72 MPa |

Apparent incremental pressure demands are `18`, `16`, `24`, and `14 MPa` across the staged additions.

**Interpretation.** The largest observed increment in this synthetic sequence is associated with adding the gate/early-cavity portion. That is evidence for where to investigate; it is not proof that the gate is defective. The displayed pressure remains an upstream machine signal and must not be relabelled as cavity pressure.

**Evidence anchors:** ISO 294-1; Autodesk fill/pack documentation; cavity-pressure sensing literature already in the MouldMaster evidence register.

## 3. Gate-seal study: find a response plateau, not a universal hold time

**SYNTHETIC TEACHING DATA**, all other selected conditions held constant:

| Hold duration | Mean part mass |
| --- | ---: |
| 2 s | 18.42 g |
| 4 s | 18.70 g |
| 6 s | 18.82 g |
| 8 s | 18.83 g |
| 10 s | 18.83 g |

The change from `6 → 8 s` is `0.01 g`; `8 → 10 s` is `0.00 g` at the shown resolution.

**Interpretation.** The synthetic mass response is approaching a plateau around the 6–8 s region. A real study would repeat observations, consider measurement resolution and critical dimensions/quality, and bind the result to that material, gate, mould and thermal state. It does not establish a generic hold time.

**Evidence anchors:** ASTM D955; ISO 294-1; Jansen, Pantani & Titomanlio gate-freeze evidence.

## 4. Pressure-trace interpretation: peak alone can hide history

Two **SYNTHETIC** cavity-pressure traces both reach a peak of `60 MPa`.

- Trace A pressure-time area: `90 MPa·s`
- Trace B pressure-time area: `120 MPa·s`

The equal peak does not make the traces equivalent. Trace B contains `33.3%` greater pressure-time area: `(120 - 90) / 90 × 100`.

**Interpretation.** Peak pressure is one feature. Transfer timing, packing duration, decay shape and pressure-time area can reveal process-history differences that a single maximum hides. Sensor location, calibration, sampling and cavity identity remain part of the evidence.

**Evidence anchors:** in-cavity pressure/quality literature and current MouldMaster cavity-pressure evidence sources.

## 5. Two-factor DOE: an interaction can reverse the apparent answer

**SYNTHETIC TEACHING DATA.** Response is warpage in millimetres; lower is better for this example only.

| Fill-speed level | Mould-temperature level | Warpage |
| --- | --- | ---: |
| Low | Low | 0.42 mm |
| High | Low | 0.31 mm |
| Low | High | 0.29 mm |
| High | High | 0.30 mm |

At low mould temperature, moving fill speed low → high changes warpage by `-0.11 mm`. At high mould temperature, the same speed change is `+0.01 mm`.

**Interpretation.** The effect of speed depends on temperature; a one-factor-at-a-time conclusion such as “higher speed reduces warpage” would be misleading. Replication, randomisation/blocking, residual checks and confirmation runs are still required before a real process conclusion.

**Evidence anchors:** NIST/SEMATECH experimental-design guidance; ISO 20457 dimensional influences.

## 6. Multi-cavity variation: pooled data can hide a cavity problem

**SYNTHETIC TEACHING SUMMARY:**

| Cavity | Mean part mass | Sample SD |
| --- | ---: | ---: |
| 1 | 12.02 g | 0.03 g |
| 2 | 12.15 g | 0.03 g |
| 3 | 12.01 g | 0.04 g |
| 4 | 11.88 g | 0.03 g |

A pooled average near `12.02 g` could look ordinary while cavities 2 and 4 carry opposite systematic offsets.

**Interpretation.** Analyse cavity identity before pooling. Do not calculate or advertise capability from these summaries alone: specification limits, process stability, sampling design and an adequate measurement system are required.

**Evidence anchors:** ISO 20457; ISO 294-1; NIST process/statistics guidance.

## 7. Capability example: good spread does not compensate for poor centring

**SYNTHETIC TEACHING DATA:** specification `10.00 ± 0.20 mm`, therefore `LSL = 9.80 mm`, `USL = 10.20 mm`; stable-process teaching estimate `mean = 10.08 mm`, `s = 0.04 mm`.

`Cp = (USL - LSL) / (6s) = 0.40 / 0.24 = 1.67`.

`Cpk = min((USL - mean)/(3s), (mean - LSL)/(3s))`

`= min(0.12/0.12, 0.28/0.12) = min(1.00, 2.33) = 1.00`.

**Interpretation.** The synthetic spread is narrower than the tolerance width, but the process is off-centre, so `Cpk` is lower than `Cp`. These indices are not trustworthy merely because the arithmetic can be performed; process stability, distribution assumptions where used, sampling and measurement-system adequacy must be established first.

**Evidence anchors:** NIST/SEMATECH process-capability guidance; ISO 22514 family as applicable.

## 8. Conditioning and dimensional state: define when a dimension is measured

**SYNTHETIC TEACHING DATA** for a reinforced polyamide example:

- measured after a defined dry-state interval: `100.00 mm`
- measured after a defined conditioning protocol: `100.18 mm`

The apparent change is `+0.18 mm` or `+0.18%` relative to the dry-state reading.

**Interpretation.** The example demonstrates why dimensional acceptance must define conditioning/time/environment and measurement method. It does not claim that a specific PA66-GF30 grade will change by 0.18%; real magnitude is grade-, geometry-, orientation- and conditioning-specific.

**Evidence anchors:** ISO 20457; ASTM D955; exact-grade supplier data when a real grade is discussed.

## 9. Cooling/heat-load estimate: useful arithmetic with explicit omissions

**SYNTHETIC TEACHING DATA:** moulded mass including runner `m = 0.080 kg`; illustrative average specific heat `cp = 1,800 J/(kg·K)`; illustrative temperature drop `ΔT = 180 K`.

A simple sensible-heat estimate is:

`Q = m × cp × ΔT = 0.080 × 1,800 × 180 = 25,920 J ≈ 25.9 kJ per shot`.

**Interpretation.** This is a simplified heat quantity, not a cooling-time formula. It omits crystallisation/latent effects where relevant, mould/insert heat capacity, shear heating, heat lost outside the mould, spatial temperature gradients and heat-transfer coefficients. Real cooling design requires geometry/material/tool-specific analysis and measurement.

**Evidence anchors:** ISO 294-1; ASTM D955; mould-cooling technical references.

## 10. End-to-end diagnosis: short shot without reflex tuning

**SYNTHETIC CASE.** One cavity in a four-cavity mould becomes intermittently short while the other three remain full. Global machine actuals and shot mass are stable. The affected cavity also shows a colder local mould-surface measurement and its vent is visibly contaminated during an authorised inspection.

**Competing mechanisms:** local thermal restriction; local vent restriction; gate/runner restriction; cavity-specific damage/obstruction; global delivery limitation.

**Discriminating evidence:** cavity identity, fill progression, local thermal evidence, vent condition, runner/gate comparison, machine actual-vs-commanded response and repeated recovery observations after an authorised local intervention.

**Decision logic.** Stable global delivery plus a repeatable single-cavity pattern weakens the global-machine hypothesis. It does not by itself prove the vent or temperature is causal. The intervention must be safe/authorised and the recovery must repeat before the mechanism is promoted.

**Evidence anchors:** ISO 294-1; BASF troubleshooting guidance; MouldMaster diagnostic-method evidence policy.

---

## Integration record for issue #368

The ten cases are integrated into release `2026.09.18.3` through the governed worked-case ledger and the canonical Book renderer. The authoritative `data/` ledger and generated runtime mirror must remain byte-identical; publication authorization pins the exact served worked-case and SME-scope bytes; executable QA recomputes the numeric examples; and all ten case IDs are inside the current human SME review contract.

This integration does **not** complete independent human SME validation. The Book SME workstream remains HOLD until genuine human review is recorded. Release-specific physical-device, real assistive-technology, curriculum-SME and learner-outcome evidence also remain separate HOLDs. No `.16.2`, `.18.1` or `.18.2` external evidence may be relabelled for the changed `.18.3` bytes.

**Historical retained `.18.2` candidate — not evidence for `.18.3`:** source `f0bbf8410d3736da955fb0256e0c7dc1288d0712`, runtime fingerprint `sha256:dd89c6283eaae5c72abc08b22390610ab4e8326b1a5255ad97890df2fff04752`, candidate run `35288487442`, artifact `10524804805`. Later governance/QA-only commits must remain public-byte-equivalent under the exact release packet verifier.
