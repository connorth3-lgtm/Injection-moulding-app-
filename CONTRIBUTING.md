# Contributing to MouldMaster Academy

Thank you for improving MouldMaster Academy.

## Licence and rights

Unless explicitly agreed otherwise before submission, contributions intentionally submitted for inclusion in this repository are contributed under **Apache License 2.0**, including its contributor patent grant.

By contributing, you represent that you have the right to submit the contribution under those terms. Do not submit copied proprietary code, paid standards text, confidential employer material, learner personal information or content you are not authorised to license.

If you know of a patent restriction, standards-essential patent issue, incompatible licence, attribution requirement or other third-party right that could affect a contribution, disclose it before merge.

## Project patent policy

Read `OPEN_SOURCE_AND_PATENT_POLICY.md` before contributing. The maintainers do not intend to seek patents covering implementation contributed to this public repository. This does not guarantee freedom from unknown third-party patents.

## Technical and safety requirements

MouldMaster is training software for injection moulding. Contributions must preserve these principles:

- do not turn general training material into universal production recipes;
- grade-specific material handling/drying limits must defer to current supplier or validated site data;
- machine/tool limits must defer to manufacturer documentation and approved site procedures;
- safeguards, interlocks, emergency stops and energy isolation must not be presented as interchangeable controls;
- a failed safeguard must not be normalised as an acceptable production condition;
- legal statements must distinguish jurisdictions and use authoritative/current sources;
- legacy guidance must be visibly labelled where it is not controlling current guidance.

## Assessment integrity

Do not weaken or bypass:

- the required pass score;
- the zero-wrong safety-critical regional gate;
- attempt locking after grading;
- certificate re-earning after imported backups;
- restrictions against answer-revealing general sources before an assessment is graded.

Question-bank changes require technical review, safety review where applicable and a version/integrity update.

## Sources

Prefer primary/authoritative references in this order where practical:

1. legislation/regulators for legal and safety duties;
2. current standards-body metadata for standards status;
3. manufacturer/supplier documentation for material or equipment-specific requirements;
4. peer-reviewed research for mechanisms and evidence;
5. reputable engineering references for general statistical/process concepts.

Do not paste full copyrighted standards, papers, figures or manufacturer documents into the repository unless redistribution rights are clear. Linking/citing is not relicensing.

Update `sources/AUTHORITATIVE_SOURCE_REGISTER.md` or `THIRD_PARTY_NOTICES.md` when a change introduces a material new source or dependency.

## Software dependencies

Before adding a runtime/build dependency:

- prefer a recognised open-source licence;
- record the dependency and relevant licence/provenance;
- avoid unnecessary dependencies;
- pin direct build dependencies exactly where release reproducibility depends on them;
- regenerate the lockfile, licence inventory and SBOM;
- do not add proprietary/commercial-only dependencies to the default open build without explicit review.

## Desktop security

Read `desktop/electron/THREAT_MODEL.md` before changing the desktop wrapper.

Do not enable Node integration in the renderer, disable sandbox/context isolation, expose a generic preload bridge, bind the local server to non-loopback interfaces, permit arbitrary local files, or bypass asset verification merely to make a build work.

If a native capability is genuinely required, expose the smallest validated API surface possible and document the new threat boundary.

## Validation

Before merge, run or ensure CI runs:

- `python qa_release.py`
- `python qa_open_desktop.py`
- JavaScript syntax checks from `.github/workflows/qa.yml`
- desktop dependency-lock/build QA for changes under `desktop/electron/`

Do not describe a build as passing until the relevant CI/build result has actually completed successfully.

## Security reports

For vulnerabilities, follow `SECURITY.md`. Do not place secrets, real learner data or exploit payloads in a public issue.
