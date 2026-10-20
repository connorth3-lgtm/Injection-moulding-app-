# MouldMaster periodic health review template

Use this template at least every 30 days. Copy it into a dated review record or issue. Do not overwrite prior review evidence.

## Review identity

- Review date:
- Reviewer / maintainer reference:
- `main` commit reviewed:
- Current web release:
- Current desktop release:
- Previous review date:

## 1. Required CI and regression health

- [ ] Required fast PR signals are present and deterministic.
- [ ] Required deep/release signals are present.
- [ ] No required red check is being accepted as “flaky enough”.
- [ ] Any flaky required gate has its own GitHub issue and owner.
- [ ] Historical defect classes still have explicit regression coverage.
- [ ] Current pure engineering-domain tests remain independent of DOM/storage/network dependencies.

Evidence / issue references:

## 2. Data integrity, backup and restore

- [ ] Run `node qa_learner_backup_integrity.cjs`.
- [ ] Run `python tools/health_restore_drill.py`.
- [ ] Confirm current exports use `mouldmaster-backup-v3` with SHA-256 / `json-stable-v1` integrity metadata verified before restore.
- [ ] Confirm checksum mismatch, unsupported integrity metadata, oversize input and learner-identity failure cannot reach the restore transaction and preserve last-known-good data.
- [ ] Confirm legacy v2/unversioned import remains explicitly disclosed as cryptographically unverified before the existing strict importer is allowed to run.
- [ ] Confirm the UI/documentation still states that the embedded SHA-256 checksum detects corruption/modification but is not a digital signature or authenticity proof.
- [ ] Confirm learner import bounds and validation still match the runtime.
- [ ] Confirm engineering-case migration remains additive/non-destructive/idempotent.
- [ ] Confirm process-data reset verification still covers all governed stores.
- [ ] Check the last real/representative restore evidence age; if older than 90 days, create a GitHub issue before closing this review.

Evidence / issue references:

## 3. Observability and lifecycle health

- [ ] Run `python qa_health_stuck_state.py`.
- [ ] Run `python qa_governance_orphan_detection.py`.
- [ ] Run `python qa_production_observability.py`.
- [ ] Confirm diagnostics remain bounded and local-only by default.
- [ ] Confirm `OK`, `DEGRADED`, `BLOCKED / HOLD` and `FAILED / STUCK` remain distinct.
- [ ] Confirm no legitimate external HOLD has been relabelled as PASS or STUCK.

Evidence / issue references:

## 4. Release, rollback and recovery

- [ ] Run `python tools/health_operations_drill.py`.
- [ ] Run `python qa_recovery_immutability.py`.
- [ ] Confirm Pages rollback still means selecting a retained exact artifact and returning through the protected release path.
- [ ] Confirm desktop rollback still uses a previously hashed artifact/release rather than mutating an existing governed release.
- [ ] Confirm frozen recovery URLs remain immutable-commit pinned and SHA-256 locked.
- [ ] Check the last release/recovery drill age; if older than 90 days, create a GitHub issue before closing this review.

Evidence / issue references:

## 5. Dependency and security maintenance

- [ ] Run `python qa_dependency_maintenance.py`.
- [ ] Re-check Node, Python and Electron support status from the authoritative URLs in `data/dependency-maintenance-v1.json` before `reviewBy`.
- [ ] Review Electron/electron-builder, critical GitHub Actions, dependency lock, SBOM/licence generation and CSP/supply-chain controls.
- [ ] Record any vulnerability exception with an owner, expiry and GitHub issue; it may not disable a required gate.
- [ ] If any required runtime/tool is EOL or the support review is overdue, create an upgrade/remediation issue before closing this review.

Evidence / issue references:

## 6. Governance and external validation

- [ ] Read `GOVERNANCE_STATUS.md` and `HEALTH_STATUS.md`.
- [ ] Distinguish engineering defects from deliberate external-validation HOLDs.
- [ ] Confirm physical-device, real-AT, human SME, learner-outcome, Windows signing/Store and accreditation claims remain evidence-bound.
- [ ] Confirm platform-admin immutable-release issue #278 remains explicit until actually completed.

External HOLDs / evidence references:

## 7. Health indicators

| Indicator | Current | Prior | Interpretation / action |
| --- | --- | --- | --- |
| Required PR gates |  |  |  |
| Accepted flaky required gates |  |  |  |
| Unresolved critical defects |  |  |  |
| Backup/restore drill age |  |  |  |
| Release/recovery drill age |  |  |  |
| Canonical stuck/orphan count |  |  |  |
| External validation state |  |  |  |

## 8. Accepted risks and overdue work

Every overdue recovery, security or dependency action must have a GitHub issue before this review can be marked complete.

| Risk / overdue item | Owner | GitHub issue | Expiry / due date | Compensating control |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## 9. Next priorities

1.
2.
3.

## Completion declaration

- [ ] No required gate was deleted or weakened to improve a metric.
- [ ] Every critical/overdue action has an explicit work item and owner.
- [ ] HOLDs are reported truthfully rather than counted as software PASS/FAIL.
- [ ] Review evidence is retained against the reviewed commit/release identities.
