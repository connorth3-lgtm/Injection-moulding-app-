# Book first-read depth and omission register — 11 October 2026

**Repository measurement, NOT independent content/Book SME approval or a release gate.** Counts were computed from `data/book-reader-architecture-v2.json`, the three canonical authored batches, and the exact runtime first-read omission list. Method: whitespace-delimited words in the chapter goal, governed module title and applicability, and visible section title/prose. Excludes optional studies, worked cases, notes, evidence, diagrams, and the 53 suppressed default-path sections. The 850-word threshold is an **editorial target**, not a required publication word count.

- **20** first-read chapters / **46** unique governed source modules; all 46 remain in the accessible source-module index.
- **12** first-read chapters have under 850 default-visible words.
- **53** whole authored sections are suppressed from the default reader view (their full source modules remain available).
- **0** currently valid optional supplemental section redirects; the former documentation/ISO-packaging reference pointed to no authored section and was removed.
- No editorial rewrite, new source claim, source/evidence decision, curriculum SME signoff, actual reading comprehension, physical offline measurement or production authority is asserted by this audit.

## Per-reader audit

| Chapter | Default-visible words | Omitted sections | Disposition |
| --- | ---: | ---: | --- |
| 1 · How Injection Moulding Works | 921 | 0 | Review |
| 2 · Machine, Mould and Safety Foundations | 984 | 0 | Review |
| 3 · Polymer Structure and Material Families | 992 | 2 | Review |
| 4 · Rheology, Moisture and Thermal History | 983 | 1 | Review |
| 5 · Plasticising and Machine Delivery | 887 | 3 | Review |
| 6 · Transfer, Packing and Clamp Behaviour | 695 | 3 | **SME depth review** |
| 7 · Feed Systems, Venting and Hot Runners | 540 | 0 | **SME depth review** |
| 8 · Cooling, Release and Cycle Stability | 805 | 6 | **SME depth review** |
| 9 · Establishing a Defensible Process Baseline | 709 | 7 | **SME depth review** |
| 10 · Scientific Process Development | 420 | 0 | **SME depth review** |
| 11 · A Diagnostic Method for Moulding Problems | 566 | 6 | **SME depth review** |
| 12 · Filling and Boundary Defects | 1093 | 4 | Review |
| 13 · Shrinkage, Voids and Warpage | 846 | 3 | **SME depth review** |
| 14 · Surface Defects, Gas and Degradation | 819 | 5 | **SME depth review** |
| 15 · Weld Lines and Flow-Front Interaction | 629 | 6 | **SME depth review** |
| 16 · Cavity Pressure and Process Monitoring | 860 | 5 | Review |
| 17 · DOE, Measurement and Capability | 975 | 0 | Review |
| 18 · Dimensional Stability and Reinforced Materials | 842 | 0 | **SME depth review** |
| 19 · Thin-Wall, Multi-Cavity and High-Performance Processing | 704 | 0 | **SME depth review** |
| 20 · Complex Diagnostics and Engineering Judgment | 820 | 2 | **SME depth review** |

## First SME review queue

**Priority:** chapter 10 (Scientific Process Development), chapter 7 (Feed Systems, Venting and Hot Runners), chapter 11 (A Diagnostic Method for Moulding Problems), chapter 15 (Weld Lines), then the other eight sub-target chapters. The goal is clearer source-faithful explanation—not padding to a word quota. Check causality, machine/grade-specific restrictions, sensor location, safe boundaries and examples against current source documents.

For each omission, independently decide whether the default first-read path loses necessary engineering meaning. If so, revise via governed editorial/source/claim review, with evidence and versioned approval. **Do not auto-reinsert a duplicated claim or auto-approve a new explanation.**

## Full omitted-section trace

### 3. Polymer Structure and Material Families
- `polymer-structure` — Structure changes processing behaviour (51 words omitted from default path; original source module remains accessible)
- `polymer-structure` — Do not turn the categories into absolutes (46 words omitted from default path; original source module remains accessible)

### 4. Rheology, Moisture and Thermal History
- `rheology` — Flow resistance is not a single material number (50 words omitted from default path; original source module remains accessible)

### 5. Plasticising and Machine Delivery
- `plasticising-unit` — Plasticising prepares the next shot (39 words omitted from default path; original source module remains accessible)
- `plasticising-unit` — The non-return valve matters during injection (52 words omitted from default path; original source module remains accessible)
- `plasticising-unit` — Hardware suitability is material dependent (25 words omitted from default path; original source module remains accessible)

### 6. Transfer, Packing and Clamp Behaviour
- `vp-transfer` — What transfer means (33 words omitted from default path; original source module remains accessible)
- `vp-transfer` — Why timing matters (36 words omitted from default path; original source module remains accessible)
- `vp-transfer` — How to establish it (33 words omitted from default path; original source module remains accessible)

### 8. Cooling, Release and Cycle Stability
- `cooling` — Cooling drives repeatability (31 words omitted from default path; original source module remains accessible)
- `cooling` — Setpoint is not surface temperature (23 words omitted from default path; original source module remains accessible)
- `cooling` — Measure the system (24 words omitted from default path; original source module remains accessible)
- `ejection-draft` — Release is mechanical and thermal (26 words omitted from default path; original source module remains accessible)
- `ejection-draft` — Ejection evidence matters (28 words omitted from default path; original source module remains accessible)
- `ejection-draft` — Do not cure tooling problems blindly (28 words omitted from default path; original source module remains accessible)

### 9. Establishing a Defensible Process Baseline
- `process-baseline` — Start inside known limits (16 words omitted from default path; original source module remains accessible)
- `process-baseline` — Record what can reproduce the state (19 words omitted from default path; original source module remains accessible)
- `process-baseline` — Stability before optimization (22 words omitted from default path; original source module remains accessible)
- `process-baseline` — Baseline before optimisation (57 words omitted from default path; original source module remains accessible)
- `documentation` — Record the conditions that matter (22 words omitted from default path; original source module remains accessible)
- `documentation` — Preserve context (24 words omitted from default path; original source module remains accessible)
- `documentation` — Link changes to evidence (19 words omitted from default path; original source module remains accessible)

### 11. A Diagnostic Method for Moulding Problems
- `diagnostic-method` — Start with the symptom (15 words omitted from default path; original source module remains accessible)
- `diagnostic-method` — Build competing mechanisms (18 words omitted from default path; original source module remains accessible)
- `diagnostic-method` — Change to learn (22 words omitted from default path; original source module remains accessible)
- `diagnostic-method` — Start with the symptom boundary (57 words omitted from default path; original source module remains accessible)
- `diagnostic-method` — Write competing mechanisms and predicted evidence (42 words omitted from default path; original source module remains accessible)
- `diagnostic-method` — Verify recovery and guard against coincidence (50 words omitted from default path; original source module remains accessible)

### 12. Filling and Boundary Defects
- `short-shot` — Use evidence (21 words omitted from default path; original source module remains accessible)
- `short-shot` — Locate where filling stops (50 words omitted from default path; original source module remains accessible)
- `flash` — Locate before correcting (25 words omitted from default path; original source module remains accessible)
- `flash` — Map flash before changing clamp or pressure (47 words omitted from default path; original source module remains accessible)

### 13. Shrinkage, Voids and Warpage
- `sink-voids` — Both arise from contraction (18 words omitted from default path; original source module remains accessible)
- `sink-voids` — Surface sink and internal void are different outcomes (30 words omitted from default path; original source module remains accessible)
- `sink-voids` — Test the pressure-and-cooling history (17 words omitted from default path; original source module remains accessible)

### 14. Surface Defects, Gas and Degradation
- `splay` — Appearance is not a unique diagnosis (24 words omitted from default path; original source module remains accessible)
- `burns` — Separate gas compression from degradation (23 words omitted from default path; original source module remains accessible)
- `burns` — Location and timing discriminate (21 words omitted from default path; original source module remains accessible)
- `burns` — Correct the mechanism (20 words omitted from default path; original source module remains accessible)
- `black-specks` — Separate continuous contamination from event-driven contamination (57 words omitted from default path; original source module remains accessible)

### 15. Weld Lines and Flow-Front Interaction
- `weld-lines` — How they form (20 words omitted from default path; original source module remains accessible)
- `weld-lines` — Quality depends on the meeting conditions (19 words omitted from default path; original source module remains accessible)
- `weld-lines` — Treat location as a design-process interaction (24 words omitted from default path; original source module remains accessible)
- `weld-lines` — Evaluate both location and performance (53 words omitted from default path; original source module remains accessible)
- `weld-lines` — Geometry can dominate where the line forms (59 words omitted from default path; original source module remains accessible)
- `weld-lines` — Formation begins with divided flow (60 words omitted from default path; original source module remains accessible)

### 16. Cavity Pressure and Process Monitoring
- `cavity-pressure` — Why measure in the cavity (21 words omitted from default path; original source module remains accessible)
- `cavity-pressure` — Curve features need context (24 words omitted from default path; original source module remains accessible)
- `cavity-pressure` — Use correlations carefully (24 words omitted from default path; original source module remains accessible)
- `cavity-pressure` — Use the trace as evidence of sequence (56 words omitted from default path; original source module remains accessible)
- `cavity-pressure` — Understand the measurement location (54 words omitted from default path; original source module remains accessible)

### 20. Complex Diagnostics and Engineering Judgment
- `complex-diagnostics` — Rank hypotheses by consequence as well as likelihood (51 words omitted from default path; original source module remains accessible)
- `complex-diagnostics` — Distinguish containment from root-cause correction (48 words omitted from default path; original source module remains accessible)

## Acceptance still outstanding

Qualified independent Book/source SMEs must assess the 20 chapter transitions and 53 omissions against all 46 governed modules. Real learners and real screen readers, Android/iPad/200%-zoom, release-specific PWA first-install/offline/storage conditions, and protected-main Pages publish remain externally controlled HOLDs. The matching machine-readable inventory is rebuilt by `python3 qa_book_first_read_audit.py --check`.
