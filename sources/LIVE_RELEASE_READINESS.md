# MouldMaster live-release readiness boundary

Reviewed: 2026-10-02  
Machine-readable policy: `data/live-release-readiness.json`

## Decision

MouldMaster separates **learner preview availability**, **production-root PWA publication**, **real-site evidence validation**, and **production-control authority**.

The current governed learner candidate may be served under the explicitly non-production `/preview/` path after its software-controlled release gates pass. The GitHub Pages production root remains fail-closed until the exact learner-runtime fingerprint has current physical-device authorization under the governed PWA evidence contract.

The first authorised real-site pilot is a separate evidence-maturity lane. It does **not** block the learner preview and it does **not** substitute for, or satisfy, the production-root physical-device gate.

## Four separate states

### 1. Learner preview lane

Current condition: `preview-available-production-root-held-until-exact-runtime-physical-authorization`.

The non-production `/preview/` lane may expose the current governed learner candidate for ordinary review, usability work and physical-device validation when:

- release QA passes on the exact candidate;
- preview copy clearly states that it is non-production;
- source/evidence provenance and safety boundaries remain intact;
- the preview does not claim external validation, production recipe authority or automatic machine control.

This lane is intentionally available while current-release physical-device evidence is still HOLD.

### 2. Production-root hosted PWA

Production-root publication requires **current exact-runtime physical authorization**.

The authorization must be bound to the candidate runtime fingerprint and must come from the governed physical-device contract. Full validation requires the required current physical-device matrix. A narrowly governed platform-risk authorization may be accepted only where the release workflow explicitly permits it; prior-release evidence never silently authorizes changed runtime bytes.

The authorised real-site pilot is **not** a prerequisite for this gate.

### 3. Real-site evidence validation

Current maturity: `pilot-ready-human-comparison-required`.

This lane requires external site authorisation, governed handling of prepared production data and comparison against an independently investigated or defensibly reviewed engineering finding. Until that is complete, the permitted claim is **pilot-ready**. The claim **validated on real production data** remains prohibited.

Real-site evidence maturity does not block either the non-production preview lane or production-root release once the separate release/device gates are satisfied.

### 4. Production-control authority

Status: `not_provided`.

MouldMaster does not authorise machine settings, production release, maintenance intervention, safeguarding changes or process changes. A real site must continue to use its approved procedures, competent engineering review, machine/material documentation, risk controls and change-control process.

This absence of production-control authority defines the product's safe scope; it does not grant or imply production authority through learner publication.

## Release-gate rule

CI must reject changes that collapse these namespaces. In particular it must reject any change that:

- serves the current learner candidate at the production root while the exact-runtime physical-device gate is still HOLD;
- treats the `/preview/` lane as a production release;
- makes an authorised real-site pilot a prerequisite for learner preview or production-root publication;
- represents a public benchmark as an authorised site pilot;
- claims real-production validation before the external evidence exists;
- carries physical-device evidence forward across changed runtime fingerprints without explicit re-authorization;
- grants production-control authority to the educational app;
- removes the fail-closed real-site intake/preflight governance boundary.

The policy is machine-readable so historical release wording cannot override the current publisher and external-validation contracts.
