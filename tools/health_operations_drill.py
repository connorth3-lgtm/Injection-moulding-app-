#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RECORD = ROOT / "data" / "health-drill-record-2026-09-18.json"
HEX64 = re.compile(r"^[a-f0-9]{64}$")
RAW_COMMIT = re.compile(r"^https://raw\.githubusercontent\.com/[^/]+/[^/]+/[a-f0-9]{40}/.+$")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> None:
    record = json.loads(RECORD.read_text(encoding="utf-8"))
    latest = json.loads((ROOT / "latest.json").read_text(encoding="utf-8"))

    require(record.get("environment") == "repository-synthetic-no-production-mutation", "drill must not mutate production")
    backup = record.get("backupRestore", {})
    require(backup.get("status") == "pass" and backup.get("realLearnerDataUsed") is False, "backup drill boundary invalid")

    rollback = record.get("releaseRollback", {})
    require(rollback.get("status") == "pass" and rollback.get("productionChanged") is False, "rollback drill must be synthetic")
    require(HEX64.fullmatch(rollback.get("from", {}).get("sha256", "")) is not None, "synthetic current digest invalid")
    require(HEX64.fullmatch(rollback.get("restored", {}).get("sha256", "")) is not None, "synthetic restored digest invalid")
    for rule in ["select-retained-exact-artifact", "verify-digest-before-restore", "do-not-mutate-governed-release", "preserve-protected-release-path"]:
        require(rule in rollback.get("rulesVerified", []), f"rollback rule missing: {rule}")

    frozen = record.get("frozenRecovery", {})
    require(frozen.get("status") == "pass" and frozen.get("productionChanged") is False, "frozen recovery drill boundary invalid")
    for key in ["app_url", "launcher_url"]:
        require(RAW_COMMIT.fullmatch(str(latest.get(key, ""))) is not None, f"{key} is not immutable-commit pinned")
        require("/main/" not in str(latest.get(key, "")), f"{key} must not track main")
    for key in ["sha256", "launcher_sha256"]:
        require(HEX64.fullmatch(str(latest.get(key, ""))) is not None, f"{key} is not a SHA-256 digest")

    recovery_qa = (ROOT / "qa_recovery_immutability.py").read_text(encoding="utf-8")
    require("latest.json" in recovery_qa and "immutable" in recovery_qa.lower(), "frozen recovery QA is not linked")

    print("MouldMaster synthetic rollback/recovery drill passed: exact-artifact selection, digest-before-restore, immutable recovery chain, no production mutation.")


if __name__ == "__main__":
    main()
