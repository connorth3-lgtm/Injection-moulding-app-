# MouldMaster question-and-answer deep dive

Reviewed: 30 August 2026

## Scope

This review now covers the complete keyed learner-assessment surface: **all 57 live exam questions** plus **100 optional practice questions**, for **157 evidence-approved keyed questions** in total.

The 57 live items comprise **30 technical questions** and **27 regional UK/US/NZ safety/compliance questions**. The optional practice bank comprises **40 shop-floor scenario drills**, **36 Diagnostic Learning Lab decisions** across nine four-stage labs, and **24 Material Behaviour Lab decisions** across six four-stage labs.

All regional safety/compliance stems and options were upgraded from rule-name recall to applied workplace decisions. **Regional answer changes remain 0**: the existing safety-critical key positions were preserved and are guarded at runtime. Current official-source checks continue to support the keyed jurisdiction logic.

**All 30 technical questions are now evidence-reasoning questions.** They require interpretation, diagnosis, discrimination, verification or a justified insufficient-evidence conclusion rather than simple definition spotting.

The optional bank is not treated as second-class content. Its release gates require one defensible answer, four distinct choices, aligned feedback, safe educational boundaries and evidence approval. The Diagnostic Learning Labs deliberately use the sequence **Observe → Best next test → Controlled response → Explain**; Material Behaviour Labs require exactly one correct decision per four-choice stage and explicit evidence-source mappings; all 40 scenarios retain stable identities, four choices, a valid key, feedback, category and difficulty metadata.

## Five evidence-reasoning modes

The bank deliberately covers five evidence-reasoning modes:

1. **Observation** — interpret linked signals, outcomes, timing and locality rather than one isolated number.
2. **Decision** — choose the best-supported mechanism, investigation or engineering action.
3. **Discrimination** — choose evidence or a controlled test that separates plausible competing causes.
4. **Verification** — identify recovery, confirmation or repeatability evidence that supports or challenges a conclusion.
5. **Insufficient evidence** — fail closed when units, references, signal semantics, confounding or measurement adequacy do not support a defensible conclusion.

## Main findings and corrections

- Definition spotting was too easy in the old technical bank; all 30 technical questions now require applied evidence reasoning.
- All **27 regional** items now ask what action or interpretation follows from the applicable safety/compliance evidence rather than testing statute-name recall. Their safety-critical keys remain unchanged.
- Single-signal root-cause claims were weakened in favour of linked evidence, repeatability and known-good comparison.
- Setpoints are explicitly separated from physical process actuals.
- Cavity and branch identity are preserved instead of being averaged away before local causes are investigated.
- Gate-seal wording remains qualified to the tested stable condition and measurement resolution.
- Cooling questions use circuit, thermal and product evidence rather than unrelated compensation.
- MFR is treated as a specified-condition material measure, not a complete moulding rheology description.
- Capability questions require stability, measurement adequacy and process-structure awareness.
- DOE questions test interactions, confounding and independent confirmation.
- **Insufficient evidence is a valid expert answer.** Quantitative pressure-loss claims are blocked when channel location, unit/reference or timing semantics are unresolved.
- Machine transfer is framed around reproducing validated physical outputs, not copying machine-specific recipe numbers.
- Optional scenarios and labs are evidence-led practice. Their distractors are learning contrasts, not authorised operating instructions, and safeguard bypass is explicitly rejected.

## Optional-question release coverage

The additional 100 keyed questions are release-gated as follows:

- **40 scenario drills** — exact stable-ID/title uniqueness, four-choice/key/feedback integrity, category/difficulty metadata, evidence approval and answer-cue/near-duplicate review.
- **36 Diagnostic Learning Lab decisions** — nine labs × four reasoning stages, exact one-best-answer structure, four distinct choices, feedback for every choice, evidence-first learning loop, local-only progress, no universal recipes and explicit safeguard-bypass rejection.
- **24 Material Behaviour Lab decisions** — six labs × four reasoning stages, exact one correct answer among four choices, explicit material/source mappings, grade-specific processing boundaries and safety controls.
- **157/157 evidence approval** — the evidence-approval gate covers the 57 live items plus all 100 optional questions and fails closed if a keyed item loses suitable evidence.

Good optional questions were retained rather than mechanically rewritten. Items are changed only when a stronger question, distractor, explanation or evidence boundary is needed; unchanged strong items remain covered by the same structural and evidence gates.

## Measured-evidence connection

Questions use the **types of evidence** represented in MouldMaster's audited measured-data layer—pressure, flow, cavity pressure, thermal/cooling behaviour, shot/cycle actuals, machine/mould sensing and quality outcomes—to teach interpretation. No raw third-party rows are copied into the question bank and study-specific values are not converted into universal production settings.

## Current source anchors

Peer-reviewed and technical evidence includes AVAPS/scatimdata pressure/flow evidence, Jansen/Pantani/Titomanlio gate-seal evidence, Hamdi MFR/flow-length work, Tsou oil/nozzle/cavity-pressure work, Araújo in-cavity failure diagnosis, Liew real-time sensing, Zhao shrinkage/warpage evidence, and NIST process-capability/DOE/confirmation guidance.

Current safety anchors include:

- **ISO 20430:2020** — injection moulding machine safety requirements: https://www.iso.org/standard/68000.html
- **OSHA 29 CFR 1910.147** — hazardous-energy control and its narrow minor-servicing exception: https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147
- **WorkSafe New Zealand** — machine lockout/isolation guidance: https://www.worksafe.govt.nz/topic-and-industry/machinery/keeping-workers-safe-with-machine-lockouts/

## Question-design rules retained

- One defensible best answer and four distinct options per keyed item.
- Regional questions remain safety-critical and jurisdiction-specific.
- Wrong answers are distractors, not authorised procedures.
- No universal drying, temperature, pressure, speed, clamp or cooling setting is taught as a rule.
- Explanations identify why the nearest competing answer is weaker.
- Research results support mechanisms and methods, not automatic local production settings.
- Unresolved measurement units, references, semantics or provenance fail closed.
- Supplier grade data, machine/mould documentation, approved procedures, applicable law and product-specific validation remain controlling.
