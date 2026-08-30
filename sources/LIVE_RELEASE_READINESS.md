# MouldMaster live-release readiness boundary

Reviewed: 2026-08-31  
Machine-readable policy: `data/live-release-readiness.json`

## Decision

MouldMaster's **public learner release is not blocked by completion of the first authorised real-site pilot**.

The hosted PWA and open Windows learner build are eligible for live release when the normal release, browser, desktop, assessment, evidence, provenance and safety QA gates pass on the exact source head being released.

The authorised real-site pilot is a separate **evidence-maturity and claim-validation lane**. It is required before MouldMaster may claim that its diagnostic-learning workflow has been validated against an authorised site's real production history and independently investigated engineering finding. It is not required merely to publish or use the educational application.

## Three separate states

### 1. Public learner release

Release condition: `eligible-when-release-qa-passes`.

This covers:

- hosted PWA learner use;
- open Windows desktop learner use;
- device-local lessons, labs, assessments and analytics;
- synthetic process-data learning;
- reviewed public measured-evidence and benchmark material within its stated provenance boundaries.

The real-site pilot does **not** block this lane.

### 2. Real-site evidence validation

Current maturity: `pilot-ready-human-comparison-required` until issue #50's evidence criteria are actually satisfied.

This lane requires external site authorisation, governed handling of prepared production data and comparison against an independently investigated or defensibly reviewed engineering finding. Until that is complete, the permitted claim is **pilot-ready**. The claim **validated on real production data** remains prohibited.

### 3. Production-control authority

Status: `not-provided`.

MouldMaster does not authorise machine settings, production release, maintenance intervention, safeguarding changes or process changes. A real site must continue to use its approved procedures, competent engineering review, machine/material documentation, risk controls and change-control process.

This absence of production-control authority does not block learner deployment; it defines the product's safe scope.

## Release-gate rule

CI must fail if repository metadata collapses these three states into one. In particular it must reject any change that:

- makes an authorised site pilot a prerequisite for ordinary public learner deployment;
- represents a public benchmark as an authorised site pilot;
- claims real-production validation before issue #50's external evidence exists;
- grants production-control authority to the educational app;
- removes the fail-closed real-site intake/preflight governance boundary.

The policy is intentionally machine-readable so release wording cannot drift back into treating an external validation milestone as a software deployment blocker.
