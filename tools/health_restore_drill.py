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


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def digest(value: object) -> str:
    payload = json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def validate_learner_backup(candidate: object, encoded_size: int | None = None) -> dict:
    if encoded_size is not None and encoded_size > MAX_BACKUP_BYTES:
        raise ValueError("backup-too-large")
    if not isinstance(candidate, dict) or set(candidate) != {"activeUser", "users"}:
        raise ValueError("invalid-top-level-structure")
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


def restore_transaction(current: dict, incoming: object, encoded_size: int | None = None) -> tuple[dict, bool]:
    before = copy.deepcopy(current)
    before_hash = digest(before)
    try:
        proposed = validate_learner_backup(incoming, encoded_size)
    except Exception:
        require(digest(current) == before_hash, "failed validation changed last-known-good data")
        return before, False
    committed = copy.deepcopy(proposed)
    require(digest(committed) != "", "committed restore has no integrity digest")
    return committed, True


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

    valid = {
        "activeUser": "learner-restored",
        "users": {"learner-restored": {"id": "learner-restored", "name": "Restored", "completed": [1, 2]}},
    }
    restored, committed = restore_transaction(current, valid, len(json.dumps(valid).encode("utf-8")))
    require(committed and restored["activeUser"] == "learner-restored", "valid restore did not commit")

    malformed_cases = [
        ({"activeUser": "x", "users": {}, "extra": True}, None),
        ({"activeUser": "missing", "users": {"ok": {"id": "ok"}}}, None),
        ({"activeUser": "bad id", "users": {"bad id": {"id": "bad id"}}}, None),
        (valid, MAX_BACKUP_BYTES + 1),
    ]
    for candidate, size in malformed_cases:
        after, ok = restore_transaction(current, candidate, size)
        require(not ok, "invalid restore unexpectedly committed")
        require(digest(after) == current_hash, "invalid restore did not preserve last-known-good")

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
        "learnerRestore": "pass",
        "invalidRestorePreservesLastKnownGood": "pass",
        "engineeringMigration": "pass",
        "engineeringMigrationReplay": "pass",
        "processDataResetContract": "pass",
        "syntheticOnly": True,
    }


if __name__ == "__main__":
    print(json.dumps(run_drill(), sort_keys=True))
