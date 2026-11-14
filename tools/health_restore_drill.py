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
        if n