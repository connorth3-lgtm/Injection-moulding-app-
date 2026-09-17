# MouldMaster health status

Baseline review: **2026-09-18**  
Source commit: `e5b93cdf24dee9b446a80e91da601f9067a5d97b`  
Current learner-facing web release: **2026.09.16.2**

This file is generated from `data/health-program-v1.json`. It reports engineering/operations health separately from deliberate external-validation HOLDs.

## Current baseline

- Protected PR evidence: PR #372 — 18 PR-triggered workflows — **SUCCESS**.
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
