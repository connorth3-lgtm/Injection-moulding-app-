# MouldMaster health status

Baseline review: **2026-09-18**  
Source commit: `3e020626205ebdb3c62a155105b6bfb91b8e70df`  
Current learner-facing web release: **2026.09.24.2**

This file is generated from `data/health-program-v1.json`. It reports engineering/operations health separately from deliberate external-validation HOLDs.

## Health-state model

| State | Meaning | Required response |
| --- | --- | --- |
| **OK** | Software-controlled checks and governed bindings are coherent. | Continue normal operation/review cadence. |
| **DEGRADED** | A recoverable operational condition exists, such as offline/unreachable resources, without proven integrity loss. | Preserve state, diagnose the bounded signal, and restore normal service without bypassing gates. |
| **BLOCKED / HOLD** | A deliberate governance boundary is waiting for named external evidence or authorised action. | Keep the HOLD visible until the real exit condition is satisfied; age alone does not make it stuck. |
| **FAILED / STUCK** | Integrity cannot be verified, a canonical binding is missing/contradictory, or a public lifecycle is in an illegal transient state. | Stop promotion/affected workflow, repair the authoritative governed source, and rerun validation. |

Current repository engineering baseline: **OK**. Current external-validation boundary: **BLOCKED / HOLD**.

## Current baseline

- Protected PR evidence: PR #373 — 16 PR-triggered workflows — **SUCCESS**.
- External validation: **HOLD**. This is a governed evidence boundary, not a software defect.
- Platform-admin immutable-release work: issue **#278** remains external to repository source changes.
- Canonical governance orphan/stuck detection: required by protected health/deep-audit QA.
- Backup/restore drill: deterministic synthetic drill required by protected health QA.

## Indicators

| Indicator | Healthy interpretation | Failure condition |
| --- | --- | --- |
| `required-pr-gates` | all required gates successful | any required product gate red |
| `flaky-required-gates` | 0 accepted flaky required gates | flakiness normalized instead of repaired or isolated |
| `critical-defects` | 0 unresolved critical correctness/security defects | critical defect left without explicit HOLD/owner |
| `backup-restore-recency` | drill age <= 90 days | drill overdue |
| `release-recovery-recency` | drill age <= 90 days | drill overdue |
| `stuck-orphan` | 0 canonical stuck/orphan workflows | unexplained stuck/orphan state exists |
| `external-validation` | reported truthfully as PASS or HOLD | HOLD omitted, relabelled or treated as software pass |

## Maintenance cadence

Dependency review: **30 days**; security review: **30 days**; backup/restore drill: **90 days**; release/recovery drill: **90 days**; health review: **30 days**.

## Boundaries

A truthful HOLD for physical-device, assistive-technology, independent human SME, learner-outcome, signed/Store distribution or accreditation evidence must remain HOLD until genuine evidence exists. Health metrics cannot be improved by deleting/weaking required tests or by relabelling a HOLD as PASS.
