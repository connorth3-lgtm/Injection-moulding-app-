# Lesson Evidence Expansion — 25–26 August 2026

## Purpose

Improve the learner-facing **Evidence & further reading** card so lessons do not routinely fall back to an empty-reference message when authoritative supporting material already exists elsewhere in MouldMaster, then audit the full lesson bank for topic-specific evidence depth.

## Behaviour

- Topic-specific evidence mappings are preferred first.
- Course-level curated sources fill remaining display gaps, but **course fallback does not count as topic evidence in QA**.
- Existing lesson references are retained and deduplicated.
- Up to five links are shown in the primary evidence card to keep the phone layout compact.
- The source boundary remains explicit: references support mechanisms, study methods and evidence discipline; they are not universal production settings or recipes.
- Exact resin grade data, machine/mould documentation, approved site procedures, product requirements and applicable law remain controlling for real work.

## Targeted gap audit — 26 August 2026 NZST

The canonical lesson bank contains **120 lessons across 12 courses**.

A title/topic-only baseline audit found **41/120 lessons** that had no topic-specific match and therefore depended on broad course-level fallback evidence.

After targeted mapping and a release-gated re-audit:

- **112 lessons — strong:** two or more topic-specific supporting sources
- **8 lessons — supported:** one topic-specific supporting source
- **0 lessons — fallback-only**
- **120/120 lessons have topic-specific evidence**

The release gate deliberately ignores course fallback when deciding whether a lesson is topic-supported. This prevents a generic course source from hiding a lesson-level evidence gap.

## Targeted source improvements

The gap pass reuses audited MouldMaster sources where possible and adds targeted sources only where the lesson topic needed them. Important additions and mappings include:

- **IQ/OQ/PQ and change control:** FDA *Process Validation: General Principles and Practices* plus peer-reviewed validation-method research. FDA is used to teach validation structure in a regulated-manufacturing context; it is **not presented as a universal plastics regulatory requirement**.
- **MES basics and traceability:** EUROMAP 77 / OPC UA interface guidance for injection-moulding-machine to manufacturing-execution-system data exchange.
- **Draft, texture and ejection:** Autodesk Moldflow draft-angle/ejection technical guidance.
- **Machine controls and drive/energy topics:** peer-reviewed machine-control research plus EUROMAP energy-efficiency references.
- **Vision inspection:** peer-reviewed machine-vision research plus NIST production/model-drift guidance.
- **Fibre orientation:** peer-reviewed fibre-orientation research plus shrinkage/warpage evidence.
- **Maintenance/process interaction:** peer-reviewed injection-moulding predictive-maintenance research plus process-sensing evidence.
- **Regrind/scrap and repeated processing:** peer-reviewed polymer reprocessing/degradation evidence plus MFR/MVR references.
- **Melt-temperature study:** injection-moulding rheology/high-shear research, Moldflow process documentation and troubleshooting guidance.

Random or weakly related PDFs were not added simply to increase link counts.

## Course fallback coverage

All twelve learning courses still retain curated fallback evidence for learner usefulness:

- Foundations
- Machine & Controls
- Materials
- Mould Design
- Process Setup
- Defect Troubleshooting
- Scientific Moulding
- Capability & Validation
- DOE & Statistics
- Automation & Sensors
- Advanced Tooling & Simulation
- Expert Process Engineering

The fallback set reuses sources already present in the audited assessment/source library, including ISO, NIST/SEMATECH, Autodesk Moldflow technical documentation, resin-supplier technical guidance and peer-reviewed injection-moulding research.

## Release controls

`qa_lesson_evidence.py` reconstructs the canonical 120-lesson bank and executes the same lesson evidence-selection logic used by the app. Release QA now fails if:

- any lesson has zero topic-specific sources;
- fewer than 90 lessons have two or more topic-specific sources;
- a topic source is non-HTTPS or duplicated;
- any of the 12 courses disappears from the audit;
- targeted evidence families disappear from IQ/OQ/PQ, MES/traceability, draft/ejection, vision-inspection or maintenance lessons;
- the learner-facing evidence panel exceeds the five-link mobile limit or loses the no-universal-recipe boundary.

The browser/PWA coherent runtime token and installed-PWA cache revision were advanced with the evidence-depth layer. The same QA also runs before Windows and Microsoft Store packaging, and its machine-readable `lesson-evidence-gap-report.json` is included with release artifacts.

This is an **internal evidence-depth audit**, not a claim of external accreditation or named-SME approval.
