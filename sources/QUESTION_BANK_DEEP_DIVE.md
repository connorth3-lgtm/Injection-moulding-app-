# MouldMaster question-and-answer deep dive

Reviewed: 2 September 2026

## Scope

The canonical keyed learner-assessment inventory is `data/canonical-assessment-manifest-v1.json`, generated from the actual hardened runtime by `tools/generate_assessment_manifest.py`. It currently contains **209 unique keyed learner decisions**:

- 30 technical exam questions;
- 27 regional UK/US/NZ safety/compliance questions;
- 40 scenario drills;
- 36 Diagnostic Learning Lab decisions across nine four-stage labs;
- 24 Material Behaviour Lab decisions across six four-stage labs;
- 40 optional Material Practice decisions;
- 12 Real Measured-Data Evidence decisions across four pinned data-contract cases.

The standardized assessment/practice bank is therefore **197 decisions**, with the measured-data evidence module adding **12**, for **209 total**. The generated manifest, not a prose count in this document, is the release source of truth.

All regional safety/compliance stems and options remain applied workplace decisions rather than rule-name recall. Regional answer changes remain zero in this hardening wave: safety-critical key positions are preserved and governed by direct official sources.

All 30 technical questions remain evidence-reasoning questions requiring interpretation, diagnosis, discrimination, verification or a justified insufficient-evidence conclusion rather than simple definition spotting.

## 2 September discrimination hardening

The adversarial question audit identified wording/testwiseness cues rather than incorrect answer keys. The reviewed population was exactly **179 cue warnings across 111 unique standardized items**:

- 77 evidence/action-verb key cues;
- 45 parameter-change distractor cues;
- 24 correct-answer qualification-density cues;
- 16 moderate correct-answer length-salience cues;
- 15 negation key cues;
- 2 implausibly short distractors.

`assessment-discrimination-hardening.js` is fail-closed against that exact pre-rewrite population. It changes option wording only if all reviewed counts match. It preserves every correct index and assessed proposition, keeps unsafe safeguard-bypass distractors explicitly unacceptable, balances visible option framing, and improves weak distractor feedback. `qa_assessment_discrimination.py` verifies **111 targeted items, 179 audited cue warnings before, zero after, and zero answer-key changes**.

The rewrite does not claim empirical psychometric validity. It removes known language cues so future learner performance is less likely to be inflated by recognising MouldMaster's preferred wording patterns. Real learner item statistics remain necessary for difficulty/discrimination calibration.

## Five evidence-reasoning modes

The bank deliberately covers five evidence-reasoning modes:

1. **Observation** — interpret linked signals, outcomes, timing and locality rather than one isolated number.
2. **Decision** — choose the best-supported mechanism, investigation or engineering action.
3. **Discrimination** — choose evidence or a controlled test that separates plausible competing causes.
4. **Verification** — identify recovery, confirmation or repeatability evidence that supports or challenges a conclusion.
5. **Insufficient evidence** — fail closed when units, references, signal semantics, confounding or measurement adequacy do not support a defensible conclusion.

## Main content findings retained

- Single-signal root-cause claims are avoided in favour of linked evidence, repeatability and known-good comparison.
- Setpoints are separated from physical process actuals.
- Cavity and branch identity are preserved instead of being averaged away before local causes are investigated.
- Gate-seal wording is qualified to the tested stable condition and measurement resolution.
- Cooling questions use circuit, thermal and product evidence rather than unrelated compensation.
- MFR is treated as a specified-condition material measure, not a complete moulding-rheology description.
- Capability questions require stability, measurement adequacy and process-structure awareness.
- DOE questions test interactions, confounding and independent confirmation.
- **Insufficient evidence remains a valid expert answer.** Quantitative pressure-loss claims are blocked when channel location, unit/reference or timing semantics are unresolved.
- Machine transfer is framed around reproducing validated physical outputs, not copying machine-specific recipe numbers.
- Wrong answers are learning contrasts, not authorised operating instructions, and safeguard bypass remains explicitly rejected.

## Release coverage

The 209-item canonical manifest requires stable identity, four distinct choices, one valid key, rationale/feedback, evidence metadata, internal approval metadata, revision and a deterministic content fingerprint.

The historical evidence-approval runtime directly models 157 technical/regional/scenario/diagnostic/material decisions. The canonical manifest extends complete governance to the 40 optional Material Practice decisions and 12 measured-data decisions, so the historical 157 count must no longer be described as the complete question bank.

The optional practice bank is release-gated, not second-class content. Diagnostic Learning Labs deliberately use the sequence **Observe → Best next test → Controlled response → Explain**. Material Behaviour and optional Material Practice decisions use explicit source mappings and grade-specific/safety boundaries.

## Measured-data connection

The 12 Real Measured-Data Evidence decisions use audited aggregate contracts from real public datasets. They teach the distinction between measured values, commands, time samples/cycles, source-defined units, unresolved semantics and bounded experimental evidence.

The current upper-workpiece pressure unit and state-code semantics remain deliberately unresolved; the questions require exclusion/fail-closed interpretation rather than guessing by analogy. No study-specific values are converted into universal production settings.

## Source anchors

Peer-reviewed and technical evidence includes AVAPS/scatimdata pressure/flow evidence, Jansen/Pantani/Titomanlio gate-seal evidence, Hamdi MFR/flow-length work, Tsou oil/nozzle/cavity-pressure work, Araújo in-cavity failure diagnosis, Liew real-time sensing, Zhao shrinkage/warpage evidence, and NIST process-capability/DOE/confirmation guidance.

Current safety anchors include ISO 20430:2020, OSHA 29 CFR 1910.147 and WorkSafe New Zealand machinery isolation/lockout guidance. Jurisdiction-dependent content remains subject to source-freshness review rather than being treated as timeless engineering fact.

## Question-design rules retained

- One defensible best answer and four distinct options per keyed item.
- Regional questions remain safety-critical and jurisdiction-specific.
- Wrong answers are plausible competing interpretations but are not authorised procedures.
- No universal drying, temperature, pressure, speed, clamp or cooling setting is taught as a rule.
- Explanations identify why the nearest competing answer is weaker.
- Research results support mechanisms and methods, not automatic local production settings.
- Unresolved measurement units, references, semantics or provenance fail closed.
- Supplier grade data, machine/mould documentation, approved procedures, applicable law and product-specific validation remain controlling.

## Remaining validation boundary

Automated structural, evidence, cue and cross-browser checks do not replace real learner psychometrics or formal accessibility validation. Item difficulty/discrimination must be monitored from privacy-appropriate learner evidence, and any formal accessibility claim remains subject to the manual NVDA/VoiceOver/real-device protocol in `sources/ACCESSIBILITY_MANUAL_VALIDATION.md`.
