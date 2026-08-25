# Lesson Evidence Expansion — 25 August 2026

## Purpose

Improve the learner-facing **Evidence & further reading** card so lessons do not routinely fall back to an empty-reference message when authoritative supporting material already exists elsewhere in MouldMaster.

## Behaviour

- Topic-specific evidence mappings are preferred first.
- Course-level curated sources fill remaining gaps.
- Existing lesson references are retained and deduplicated.
- Up to five links are shown in the primary evidence card to keep the phone layout compact.
- The source boundary remains explicit: references support mechanisms and study methods; they are not universal production settings.
- Exact resin grade data, machine/mould documentation, approved site procedures and applicable law remain controlling for real work.

## Course fallback coverage

All twelve learning courses have curated fallback evidence:

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

The fallback set reuses sources already present in the audited assessment/source library, including ISO 20430, ISO 1133, NIST/SEMATECH, Autodesk Moldflow technical documentation, supplier technical guidance and peer-reviewed injection-moulding research.

## Release controls

The mobile/browser coherent runtime token and installed-PWA cache revision were advanced with this change. Runtime QA now fails if any of the twelve course fallbacks disappear, if the empty-reference replacement is removed, if more than five additional lesson sources can be injected, or if the educational production-setting boundary is removed.
