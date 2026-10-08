# MouldMaster tester feedback triage

**Operator-only, non-production preview feedback workflow.** Use with [TESTER_HANDOFF.md](TESTER_HANDOFF.md). This is not a substitute for a human safety, security, accessibility or SME review.

## Intake and data minimisation

1. Use the repository's [Learner problem](https://github.com/connorth3-lgtm/Injection-moulding-app-/issues/new?template=learner-problem.yml) issue form for **non-sensitive** bugs. If the tester has no GitHub account, accept a sanitised private message from the inviter and transcribe only its non-identifying facts.
2. Capture platform, browser/version, normal tab vs installed PWA, release/source identifier, observable problem, expectation and minimal reproduction steps. Never request progress backups, actual site/process data, real learner details or screenshots containing private information.
3. Security or privacy vulnerabilities use the private path described in [SECURITY.md](../SECURITY.md), not a public issue. Stop public sharing and limit the copied details.
4. Confirm on the exact deployed preview identified by `preview/deployment.json`. Do not classify a failure against an unknown or older hosted build as a regression in the latest branch.
5. Record whether the issue is reproducible; never label an unverified report as fixed.

## Priority guide

| Level | Examples | Action |
| --- | --- | --- |
| **P0 — stop invitations immediately** | Cross-learner data exposed, secrets/private data leaked, unsafe advice likely to be applied, destructive reset or import without consent, app serves learner runtime from held production root | Pause invitations, preserve safe reproduction steps, handle privacy/security reports privately, block promotion and open an owner-assigned remediation |
| **P1 — block affected activity** | Cannot open/continue learning, repeatable progress loss, severe keyboard/screen-reader blocker, incorrect safety-critical answer or technical instruction | Mark affected route unavailable for the tester, reproduce on governed candidate and fix before wider distribution |
| **P2 — prioritise before wider cohort** | Broken navigation, confusing or ambiguous assessment feedback, recurring layout overflow, offline update trouble, missing reference boundary | Reproduce, assign and resolve with browser/device regression when possible |
| **P3 — planned usability cleanup** | Copy clarity, minor layout inconsistency, discoverability improvements | Group feedback themes and prioritise without claiming validated outcomes |

**Safety/technical-content reports:** stop relying on the disputed content, compare with approved machine/material/site sources, and obtain appropriate competent human review before changing technical advice.

**Accessibility:** automated Axe/Playwright checks and informal screen-reader comments are not a substitute for the governed NVDA and VoiceOver task matrix. Continue to show real-AT evidence as HOLD until fully completed.

**Learner efficacy:** do not count informal usability reports as pilot participants, psychometric validity, controlled transfer improvement or an accredited outcome.

## Retest and close-out

- Repair on a branch, include a meaningful regression, review the exact code and rerun the affected QA plus required PR checks.
- If public learner-runtime bytes change, follow the release/cache bump and **new retained exact-runtime candidate** process; never rebind old device evidence as validated.
- Recheck actual live `/preview/` after the governed deployment using `tools/verify_pages_hold.py --expected-source-sha`. Link the verified deployment SHA in the tester handoff record.
- Confirm production and all human/device/SME/provider HOLDs remain unchanged unless genuine governed evidence authorises a change.
- Tell affected testers what changed without sharing other people's reports or records.
