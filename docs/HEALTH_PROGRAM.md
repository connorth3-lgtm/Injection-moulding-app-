# MouldMaster long-term health program

This document operationalises the canonical contract in `data/health-program-v1.json` for issues #309 and #311–#315 without weakening release, privacy, engineering or external-validation boundaries. Web release `2026.09.18.1` introduces the repository-controlled completion of #311: current learner backups use a runtime-verifiable SHA-256 integrity envelope that is checked before the existing strict restore transaction can receive the payload. Closure still depends on protected review/CI and merge; external human/device/platform evidence remains a separate HOLD.

## 1. Risk-based CI tiers

The **fast PR tier** exists to catch deterministic correctness, governance and release-binding failures before browser/package jobs consume time. It includes Fast feedback, Deep Audit Governance, Domain Foundation, Frozen Recovery and the Release External Validation Boundary. Its health/domain signals target completion within **10 minutes per workflow** on normal hosted runners. A red product check is a product failure until investigated; a transient runner/network outage is an infrastructure failure and must be recorded/retried as such. An external evidence HOLD is neither green product evidence nor a CI failure.

The **deep/release tier** covers full release integration: Release QA, Pages readiness, Mobile Browser, Premium UI, Open Desktop Build, Production Observability, Physical PWA Contract, question-quality and Read Aloud. These workflows run concurrently where GitHub permits; individual routine workflows target **15 minutes or less** unless packaging/browser installation makes the documented job intentionally longer. Historical defects must keep permanent regressions where practical. Tests must not be deleted, loosened or reclassified solely to obtain green CI.

The machine-readable critical-path matrix is in `data/health-program-v1.json`. New critical defects should add or identify a regression before their issue is closed. A required gate that flakes is tracked as a separate GitHub work item with an owner; repeated reruns are not a substitute for fixing or isolating the cause.

## 2. Persistent data inventory and ownership

### Learner core

`mouldmasterProDB` is learner-core source data in localStorage. Import is bounded to 10 MiB, strictly allowlisted, limited to 500 learner records, validates learner identifiers before commit, rejects arbitrary top-level structure and commits only after the complete proposed database has been validated. A failed import must leave the previous database intact.

Learner-scoped feature keys are registered through `MM_LEARNER_SCOPE`. New learner-local state must use that boundary rather than inventing an unscoped global key.

### Engineering cases

`mouldmaster-engineering-v2` is IndexedDB version 2 with `cases`, `caseLinks` and `migrations`. The legacy `mm_mould_master_cases_v1::<learner-token>` path is migrated additively. Replay must be idempotent, newer canonical data must win, cross-learner ID conflicts must fail closed, and the legacy source is not destroyed during migration proof.

### Process evidence

`mouldmaster-process-data-v1` is IndexedDB version 1 with `datasets`, `shots`, `baselines`, `caseLinks` and `interventions`. It is separate from learner progress. Learner reset and process-evidence deletion are intentionally different operations. Dataset deletion cascades linked process evidence; global process-data reset verifies all governed stores are empty after the transaction.

### Diagnostics

`mm_production_health_v1` is bounded, local-only diagnostic data. It is rebuildable rather than source-of-truth business/learner/process data and is capped at 120 events. Clearing diagnostics is not a learner reset and not a process-data reset.

## 3. Migration, backup and restore policy

Every migration follows: **validate source → stage/normalise → write transactionally where available → verify result → only then declare success**. A failure before verified commit preserves the last-known-good representation. Repeated migration must be idempotent where replay is possible. Derived caches may be rebuilt; source-of-truth learner or process evidence must never be silently regenerated from guesses.

A learner backup does not implicitly include engineering cases or site-local process evidence. Those have separate scope and must be explicitly exported/handled when supported. This prevents a learner-profile restore from silently overwriting workplace evidence.

Current exports use `mouldmaster-backup-v3`. The envelope contains the existing strictly validated `mouldmaster-backup-v2` payload plus integrity metadata: `SHA-256`, canonicalization `json-stable-v1`, and scope `backupFormat+payload`. The runtime computes the digest over canonical envelope input and verifies it **before** handing an isolated payload Blob to the existing bounded/transactional importer. Digest mismatch, unsupported integrity metadata, malformed envelope, invalid learner identity or oversize input fails closed before restore and preserves last-known-good learner data.

The SHA-256 value is an integrity checksum, **not a digital signature or authenticity proof**. A party able to modify a file and recompute its checksum can produce a new internally consistent envelope. Its purpose is to detect corruption or uncoordinated modification before restore, not to establish who created the backup.

Older v2/unversioned backups remain available for compatibility only after explicit user disclosure that they contain no cryptographic integrity checksum. They continue through the existing strict structural/identity/transactional importer and are recorded conceptually as `legacy-unverified`; they are never relabelled as cryptographically verified evidence.

The deterministic health drill in `tools/health_restore_drill.py` exercises valid v3 restore, checksum/metadata tampering, malformed/oversized/identity-conflicting rejection, legacy-v2 compatibility disclosure, last-known-good preservation and additive engineering migration rules. `qa_learner_backup_integrity.cjs` executes the browser-facing envelope implementation directly using Web Crypto. These tests use synthetic records only and create no claim about a real learner/site backup.

## 4. Observability and stuck-state semantics

Production health is local-only. Existing runtime events include runtime/promise/resource failures, connectivity, service-worker update signals and deployment coherence. Event data is bounded and excludes raw learner/process values by design. `data/health-event-catalog-v1.json` assigns stable codes, health classes and human recovery explanations to the current runtime signals plus governance HOLD/stuck conditions.

Operational state classes are:

- **OK** — required software checks are coherent and no governed failure is active.
- **DEGRADED** — software remains usable but a recoverable signal such as offline/unreachable resource exists.
- **BLOCKED / HOLD** — a deliberate governance boundary is awaiting external evidence or authorised action. HOLD is not a runtime failure.
- **FAILED / STUCK** — a canonical invariant is violated, release/data integrity cannot be verified, or a workflow is outside an allowed transition/timeout state.

A canonical HOLD must never be reported as stuck simply because it is old. `qa_governance_orphan_detection.py` owns authoritative lifecycle binding validation, while `qa_health_stuck_state.py` deliberately injects synthetic HOLD, orphan, transient and unowned-HOLD scenarios to prove the health classification and repair guidance. The health program consumes the canonical model rather than inventing a competing production state machine.

## 5. Release, rollback and recovery runbook

### Operator checks

From a clean checkout of the exact commit under review, the repository-controlled health checks are:

```text
python qa_health_program.py
python qa_health_stuck_state.py
node qa_learner_backup_integrity.cjs
python tools/health_restore_drill.py
python tools/health_operations_drill.py
python qa_production_observability.py
python qa_governance_orphan_detection.py
python qa_recovery_immutability.py
python qa_dependency_maintenance.py
python tools/render_health_status.py --check
```

These commands validate contracts and synthetic drills only. They do not replace protected GitHub review or external validation.

### Browser / PWA

Before release: required protected-review gates must be green, release identity/fingerprint must be coherent, external-validation metadata must bind to the exact public bytes, and deliberate HOLDs must remain visible. Publication must use the governed Pages path.

After release: verify deployment/manifest/service-worker coherence and the expected release identity. If integrity or deployment coherence fails, stop publication/promotion. Rollback means selecting a previously retained exact Pages artifact, verifying its identity/digest, and redeploying it through the protected release procedure; do not hand-edit production files or relabel evidence from another fingerprint.

### Open desktop

Before release: dependency lock, SBOM/licence inventory, asset-integrity manifest, desktop security QA and package build must pass. Release artifacts are governed by hashes and one-shot semantics. Rollback means returning users to a previously hashed desktop artifact/release. Do not mutate an already governed release to impersonate a rollback. Repository-level immutable-release enforcement remains a separate platform-admin requirement (#278).

### Frozen recovery

Recovery payload and launcher are immutable-commit pinned and independently SHA-256 locked. A recovery drill must verify the pinned URL and hash before use. If either differs, recovery fails closed. The recovery lane must not silently track `main`.

### Incident triage

Classify first: `runtime-defect`, `data-corruption`, `ci-infrastructure`, `release-integrity`, or `governance-evidence-hold`.

Stop/hold immediately for release-fingerprint mismatch, unverified data restore, critical security/integrity failure, or contradictory governance state. Capture release identity, failing gate/code, affected scope and non-sensitive reproduction evidence. Do not capture raw learner notes, proprietary process rows, credentials or secrets in public issues.

A CI infrastructure outage may justify retrying the same immutable inputs. It does not justify bypassing a required gate. A governance HOLD requires the named external evidence/action; it must not be converted into PASS by automation.

The dated synthetic drill record is `data/health-drill-record-2026-09-18.json`. It records exactly what was selected/restored in the synthetic rollback scenario and proves the immutable frozen-recovery chain without mutating production.

## 6. Dependency and security maintenance policy

The current automation baseline is Node 22 and Python 3.12. Critical build/release actions remain pinned/governed by repository QA. Automated dependency PRs are review-only and must pass the same applicable protected checks as human-authored upgrades.

`data/dependency-maintenance-v1.json` is the reviewed critical-component inventory. It records owners, rationale, upstream support evidence and a `reviewBy` deadline. `qa_dependency_maintenance.py` fails if that review becomes stale, a recorded runtime passes EOL, package versions drift from the inventory, critical Action majors drift, or an exception lacks an owner/expiry/work item. This makes stale/EOL support status a fail-closed maintenance signal rather than a memory task.

Review dependencies/security at least every 30 days. Critical vulnerabilities trigger an immediate release/security hold and protected remediation; high severity is prioritised into the next protected change; medium and low findings are tracked for a maintenance cycle according to exposure and exploitability. Exceptions require an owner, reason, compensating control where relevant and an expiry date. An exception may not disable a required integrity/evidence gate.

At each maintenance review, verify supported Electron/Node/browser/toolchain status from the authoritative source URLs, critical GitHub Action provenance/version policy, dependency licences/SBOM generation, CSP/supply-chain controls, and whether any runtime has reached EOL or lost upstream security support.

## 7. Health indicators and review cadence

Review monthly using `docs/HEALTH_REVIEW_TEMPLATE.md`. Required PR gates should have zero accepted flaky-red checks. Critical correctness/security defects should have no unowned backlog. Backup/restore and release/recovery drills must be no older than 90 days. Canonical stuck/orphan count should be zero. Domain calculations remain covered by independent pure-domain regression tests.

External validation is reported separately: a truthful HOLD is healthy governance, not poor software quality. Metrics must never improve merely because checks were deleted, weakened or reclassified.

The baseline review is generated into `HEALTH_STATUS.md` from the same machine-readable contract. When a review identifies an overdue recovery/security/dependency action, create or link a GitHub issue before considering the review complete. The current baseline carries platform-admin issue #278 explicitly rather than hiding it.

## 8. Current boundaries

The health program does not manufacture physical iOS/Android evidence, real NVDA/VoiceOver evidence, human Book/Academy SME approval, learner efficacy, Windows signing/Store validation, accreditation or production authority. Those remain separate governed workstreams.
