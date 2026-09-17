#!/usr/bin/env python3
"""Synthetic, deterministic MouldMaster data integrity / restore drill.

This is deliberately repository-local and uses synthetic records. It verifies the current
runtime contracts and demonstrates last-known-good preservation without claiming that a
real learner/site backup has been restored.
"""
from __future__ import annotations

import copy
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAX_BACKUP_BYTES = 10 * 1024 * 1024
MAX_LEARNERS = 500
LEARNER_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:@+-]{0,159}$")
BACKUP_FORMAT = "mouldmaster-backup-v3"
LEGACY_FORMAT = "mouldmaster-backup-v2"
INTEGRITY_ALGORITHM = "SHA-256"
CANONICALIZATION = "json-stable-v1"
INTEGRITY_SCOPE = "backupFormat+payload"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def stable_json(value: object) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def digest(value: object) -> str:
    return hashlib.sha256(stable_json(value).encode("utf-8")).hexdigest()


def integrity_input(payload: dict) -> dict:
    return {"backupFormat": BACKUP_FORMAT, "payload": payload}


def build_v3_envelope(payload: dict) -> dict:
    return {
        "backupFormat": BACKUP_FORMAT,
        "integrity": {
            "algorithm": INTEGRITY_ALGORITHM,
            "canonicalization": CANONICALIZATION,
            "scope": INTEGRITY_SCOPE,
            "digest": digest(integrity_input(payload)),
        },
        "payload": copy.deepcopy(payload),
    }


def verify_v3_envelope(candidate: object) -> dict:
    if not isinstance(candidate, dict) or set(candidate) != {"backupFormat", "integrity", "payload"}:
        raise ValueError("invalid-v3-envelope")
    if candidate.get("backupFormat") != BACKUP_FORMAT:
        raise ValueError("unsupported-backup-format")
    integrity = candidate.get("integrity")
    if not isinstance(integrity, dict) or set(integrity) != {"algorithm", "canonicalization", "scope", "digest"}:
        raise ValueError("invalid-integrity-metadata")
    if integrity.get("algorithm") != INTEGRITY_ALGORITHM:
        raise ValueError("unsupported-integrity-algorithm")
    if integrity.get("canonicalization") != CANONICALIZATION or integrity.get("scope") != INTEGRITY_SCOPE:
        raise ValueError("unsupported-integrity-contract")
    recorded = integrity.get("digest")
    if not isinstance(recorded, str) or not re.fullmatch(r"[0-9a-f]{64}", recorded):
        raise ValueError("invalid-integrity-digest")
    payload = candidate.get("payload")
    if not isinstance(payload, dict) or payload.get("backupFormat") != LEGACY_FORMAT:
        raise ValueError("invalid-v3-payload")
    if digest(integrity_input(payload)) != recorded:
        raise ValueError("integrity-mismatch")
    return copy.deepcopy(payload)


def validate_learner_backup(candidate: object, encoded_size: int | None = None) -> dict:
    if encoded_size is not None and encoded_size > MAX_BACKUP_BYTES:
        raise ValueError("backup-too-large")
    if not isinstance(candidate, dict):
        raise ValueError("invalid-top-level-structure")
    allowed = {"activeUser", "users", "backupFormat", "trainingExtras"}
    if not set(candidate).issubset(allowed) or not {"activeUser", "users"}.issubset(candidate):
        raise ValueError("invalid-top-level-structure")
    if candidate.get("backupFormat") not in (None, LEGACY_FORMAT):
        raise ValueError("unsupported-legacy-format")
    users = candidate.get("users")
    if not isinstance(users, dict) or not users or len(users) > MAX_LEARNERS:
        raise ValueError("invalid-learner-set")
    clean: dict[str, dict] = {}
    for key, record in users.items():
        if not isinstance(key, str) or not LEARNER_ID.fullmatch(key):
            raise ValueError("invalid-learner-id")
        if key in clean:
            raise ValueError("duplicate-learner-id")
        if not isinstance(record, dict):
            raise ValueError("invalid-learner-record")
        embedded = str(record.get("id") or key)
        if embedded != key or not LEARNER_ID.fullmatch(embedded):
            raise ValueError("learner-id-mismatch")
        clean[key] = {
            "id": key,
            "name": str(record.get("name") or "Learner")[:120],
            "role": "instructor" if record.get("role") == "instructor" else "learner",
            "completed": list(record.get("completed") or []),
            "bookmarks": list(record.get("bookmarks") or []),
            "notes": dict(record.get("notes") or {}),
            "examScores": dict(record.get("examScores") or {}),
            "certificates": [],
            "certificateMeta": {},
            "examPassStatus": {},
        }
    active = candidate.get("activeUser")
    if not isinstance(active, str) or not LEARNER_ID.fullmatch(active) or active not in clean:
        raise ValueError("missing-active-learner")
    return {"activeUser": active, "users": clean}


def restore_v3_transaction(current: dict, incoming: object, encoded_size: int | None = None) -> tuple[dict, bool]:
    before = copy.deepcopy(current)
    before_hash = digest(before)
    try:
        if encoded_size is not None and encoded_size > MAX_BACKUP_BYTES:
            raise ValueError("backup-too-large")
        payload = verify_v3_envelope(incoming)
        proposed = validate_learner_backup(payload, encoded_size)
    except Exception:
        require(digest(current) == before_hash, "failed v3 restore validation changed last-known-good data")
        return before, False
    committed = copy.deepcopy(proposed)
    require(digest(committed) != "", "committed restore has no integrity digest")
    return committed, True


def restore_legacy_transaction(current: dict, incoming: object, encoded_size: int | None = None) -> tuple[dict, bool, str]:
    before = copy.deepcopy(current)
    before_hash = digest(before)
    try:
        proposed = validate_learner_backup(incoming, encoded_size)
    except Exception:
        require(digest(current) == before_hash, "failed legacy restore validation changed last-known-good data")
        return before, False, "rejected"
    return copy.deepcopy(proposed), True, "legacy-unverified"


def migrate_engineering_cases(existing: dict[str, dict], legacy: list[dict], learner: str) -> tuple[dict[str, dict], dict]:
    out = copy.deepcopy(existing)
    imported = preserved = conflicts = 0
    for row in legacy:
        case_id = str(row.get("id") or "")
        if not case_id:
            continue
        prior = out.get(case_id)
        if prior and prior.get("learnerToken") != learner:
            conflicts += 1
            continue
        if prior and str(prior.get("updatedAt") or "") >= str(row.get("updatedAt") or row.get("createdAt") or ""):
            preserved += 1
            continue
        out[case_id] = {**row, "id": case_id, "learnerToken": learner, "legacySource": "mm_mould_master_cases_v1"}
        imported += 1
    return out, {"imported": imported, "preservedExisting": preserved, "conflicts": conflicts, "destructive": False}


def verify_runtime_contracts() -> None:
    learner = (ROOT / "src/core-runtime/core-inline-007.js").read_text(encoding="utf-8")
    backup = (ROOT / "src/domains/learning/backup-authority-notice.js").read_text(encoding="utf-8")
    engineering = (ROOT / "src/domains/engineering/engineering-store.js").read_text(encoding="utf-8")
    process = (ROOT / "data-integration-runtime.js").read_text(encoding="utf-8")

    for token in [
        "file.size>10*1024*1024",
        'entries.length>500',
        'throw new Error("Duplicate learner identifier")',
        'throw new Error("Learner identifier mismatch")',
        'localStorage.setItem("mouldmasterProDB",serialized)',
        "No existing data was changed",
    ]:
        require(token in learner, f"learner backup runtime contract missing: {token}")

    for token in [
        "const BACKUP_FORMAT='mouldmaster-backup-v3'",
        "const LEGACY_FORMAT='mouldmaster-backup-v2'",
        "const INTEGRITY_ALGORITHM='SHA-256'",
        "const CANONICALIZATION='json-stable-v1'",
        "await verifyEnvelope(parsed)",
        "MM_BACKUP_INTEGRITY_MISMATCH",
        "baseImportData(new Blob",
        "checksum is not a digital signature",
        "window.MM_LEARNER_BACKUP_INTEGRITY",
    ]:
        require(token in backup, f"learner backup integrity runtime contract missing: {token}")
    require(
        backup.index("await verifyEnvelope(parsed)") < backup.index("baseImportData(new Blob"),
        "v3 backup payload can reach restore before integrity verification",
    )

    for token in [
        "const DB_NAME='mouldmaster-engineering-v2'",
        "const DB_VERSION=2",
        "preservedExisting",
        "conflicts",
        "destructive:false",
        "if(prior?.complete)return {...prior,alreadyComplete:true}",
    ]:
        require(token in engineering, f"engineering migration contract missing: {token}")

    for token in [
        "const DB_NAME='mouldmaster-process-data-v1'",
        "['datasets','shots','baselines','caseLinks','interventions']",
        "deleteAllProcessData",
        "Process-data reset verification failed",
    ]:
        require(token in process, f"process-data integrity contract missing: {token}")


def run_drill() -> dict:
    verify_runtime_contracts()
    current = {
        "activeUser": "learner-current",
        "users": {"learner-current": {"id": "learner-current", "name": "Current", "notes": {"1": "keep"}}},
    }
    current_hash = digest(current)

    payload = {
        "backupFormat": LEGACY_FORMAT,
        "activeUser": "learner-restored",
        "users": {"learner-restored": {"id": "learner-restored", "name": "Restored", "completed": [1, 2]}},
        "trainingExtras": {"version": 2, "spacedReview": {"items": {}}, "practicalSignoff": {"checks": {}}},
    }
    envelope = build_v3_envelope(payload)
    restored, committed = restore_v3_transaction(current, envelope, len(stable_json(envelope).encode("utf-8")))
    require(committed and restored["activeUser"] == "learner-restored", "valid v3 restore did not commit")

    tampered = copy.deepcopy(envelope)
    tampered["payload"]["users"]["learner-restored"]["name"] = "Tampered"
    wrong_algorithm = copy.deepcopy(envelope)
    wrong_algorithm["integrity"]["algorithm"] = "SHA-1"
    malformed_cases = [
        (tampered, None),
        (wrong_algorithm, None),
        ({"backupFormat": BACKUP_FORMAT, "integrity": envelope["integrity"], "payload": {}, "extra": True}, None),
        (envelope, MAX_BACKUP_BYTES + 1),
    ]
    for candidate, size in malformed_cases:
        after, ok = restore_v3_transaction(current, candidate, size)
        require(not ok, "invalid/tampered v3 restore unexpectedly committed")
        require(digest(after) == current_hash, "invalid/tampered v3 restore did not preserve last-known-good")

    bad_identity_payload = copy.deepcopy(payload)
    bad_identity_payload["users"] = {"bad id": {"id": "bad id"}}
    bad_identity_payload["activeUser"] = "bad id"
    after, ok = restore_v3_transaction(current, build_v3_envelope(bad_identity_payload))
    require(not ok and digest(after) == current_hash, "identity-invalid v3 backup changed last-known-good")

    legacy_restored, legacy_ok, legacy_status = restore_legacy_transaction(current, payload)
    require(legacy_ok and legacy_status == "legacy-unverified", "legacy v2 compatibility contract was lost")
    require(legacy_restored["activeUser"] == "learner-restored", "legacy v2 structural restore failed")

    existing = {
        "case-a": {"id": "case-a", "learnerToken": "learner-a", "updatedAt": "2026-09-18T00:00:00Z"},
        "case-foreign": {"id": "case-foreign", "learnerToken": "learner-b", "updatedAt": "2026-09-18T00:00:00Z"},
    }
    legacy = [
        {"id": "case-a", "updatedAt": "2026-09-17T00:00:00Z"},
        {"id": "case-new", "updatedAt": "2026-09-18T00:00:00Z"},
        {"id": "case-foreign", "updatedAt": "2026-09-19T00:00:00Z"},
    ]
    migrated, summary = migrate_engineering_cases(existing, legacy, "learner-a")
    require(summary == {"imported": 1, "preservedExisting": 1, "conflicts": 1, "destructive": False}, "migration summary mismatch")
    require(migrated["case-a"] == existing["case-a"], "newer canonical case was overwritten")
    require(migrated["case-foreign"] == existing["case-foreign"], "cross-learner case was overwritten")
    replay, replay_summary = migrate_engineering_cases(migrated, legacy, "learner-a")
    require(digest(replay) == digest(migrated), "engineering migration is not idempotent on replay")
    require(replay_summary["imported"] == 0, "replayed migration imported data again")

    return {
        "learnerV3IntegrityRestore": "pass",
        "tamperAndMetadataRejection": "pass",
        "invalidRestorePreservesLastKnownGood": "pass",
        "legacyV2CompatibilityExplicitlyUnverified": "pass",
        "engineeringMigration": "pass",
        "engineeringMigrationReplay": "pass",
        "processDataResetContract": "pass",
        "syntheticOnly": True,
    }


if __name__ == "__main__":
    print(json.dumps(run_drill(), sort_keys=True))
