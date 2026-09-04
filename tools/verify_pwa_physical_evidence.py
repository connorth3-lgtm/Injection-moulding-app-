#!/usr/bin/env python3
"""Validate MouldMaster physical-device PWA evidence against exact public runtime bytes.

The stable runtime fingerprint excludes deployment.json and pages-manifest.json because
those files contain source-SHA-specific metadata. An evidence-only commit therefore does
not invalidate a physical test when the actual learner-facing public runtime is unchanged.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import NoReturn

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {"deployment.json", "pages-manifest.json"}
CONTRACT = ROOT / "data" / "pwa-physical-device-validation-v1.json"
EXPECTED_CHECKS = {
    "ios": {
        "installStandalone",
        "safeAreaNavigation",
        "workspacePortrait",
        "offlineRestart",
        "offlineReboot",
        "updateRecovery",
        "storagePressure",
    },
    "android": {
        "installStandalone",
        "fixedNavigationClearance",
        "offlineRestart",
        "offlineReboot",
        "updateRecovery",
        "storagePressure",
    },
}
FORBIDDEN_PUBLIC_FIELDS = {
    "learnerName",
    "learnerNames",
    "customerId",
    "customerIdentifier",
    "siteId",
    "siteIdentifier",
    "email",
    "emailAddress",
    "rawProcessData",
    "backupContent",
    "filesystemPath",
    "userPath",
    "screenshot",
    "screenshots",
}


def fail(message: str) -> NoReturn:
    raise SystemExit(f"physical PWA evidence gate failed: {message}")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def runtime_fingerprint(artifact: Path) -> str:
    if not artifact.is_dir():
        fail(f"Pages artifact directory not found: {artifact}")
    files = [
        path
        for path in artifact.rglob("*")
        if path.is_file() and path.relative_to(artifact).as_posix() not in EXCLUDED
    ]
    if len(files) < 20:
        fail(f"public runtime fingerprint input unexpectedly small: {len(files)} files")
    digest = hashlib.sha256()
    for path in sorted(files, key=lambda p: p.relative_to(artifact).as_posix()):
        rel = path.relative_to(artifact).as_posix()
        digest.update(rel.encode("utf-8"))
        digest.update(b"\0")
        digest.update(str(path.stat().st_size).encode("ascii"))
        digest.update(b"\0")
        digest.update(sha256(path).encode("ascii"))
        digest.update(b"\n")
    return "sha256:" + digest.hexdigest()


def read_contract(path: Path) -> dict:
    if not path.is_file():
        fail(f"physical-device validation contract is missing: {path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        fail(f"invalid UTF-8 JSON contract: {exc}")
    if not isinstance(data, dict):
        fail("contract root must be a JSON object")
    return data


def find_forbidden_keys(value, path="root") -> list[str]:
    found: list[str] = []
    if isinstance(value, dict):
        for key, child in value.items():
            if key in FORBIDDEN_PUBLIC_FIELDS:
                found.append(f"{path}.{key}")
            found.extend(find_forbidden_keys(child, f"{path}.{key}"))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found.extend(find_forbidden_keys(child, f"{path}[{index}]"))
    return found


def parse_tested_at(value: str) -> datetime:
    text = str(value or "").strip()
    if not text:
        fail("validated evidence requires testedAt")
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        fail("testedAt must be ISO-8601 with timezone")
    if parsed.tzinfo is None:
        fail("testedAt must include a timezone")
    return parsed.astimezone(timezone.utc)


def validate_contract(data: dict) -> None:
    if data.get("schemaVersion") != 1:
        fail("schemaVersion must be 1")
    status = data.get("status")
    if status not in {"pending-physical-device-validation", "validated"}:
        fail("status must be pending-physical-device-validation or validated")
    if "physical iOS/iPadOS and Android devices" not in str(data.get("boundary", "")):
        fail("physical-device automation boundary is missing")
    if "accessibility-real-at-validation-v1.json" not in str(data.get("boundary", "")):
        fail("assistive-technology evidence boundary must remain separate")
    if find_forbidden_keys(data):
        fail("public contract contains forbidden sensitive-content fields: " + ", ".join(find_forbidden_keys(data)))
    if "must not include learner names" not in str(data.get("privacyBoundary", "")):
        fail("public evidence privacy boundary is missing")
    max_age = data.get("maxEvidenceAgeDays")
    if not isinstance(max_age, int) or not 1 <= max_age <= 90:
        fail("maxEvidenceAgeDays must be an integer from 1 to 90")

    platforms = data.get("platforms")
    if not isinstance(platforms, dict) or set(platforms) != set(EXPECTED_CHECKS):
        fail("platforms must contain exactly ios and android")
    for platform, expected_checks in EXPECTED_CHECKS.items():
        record = platforms.get(platform)
        if not isinstance(record, dict):
            fail(f"{platform} record must be an object")
        if record.get("status") not in {"pending", "validated"}:
            fail(f"{platform}.status must be pending or validated")
        checks = record.get("checks")
        if not isinstance(checks, dict) or set(checks) != expected_checks:
            fail(f"{platform}.checks must contain exactly the governed physical-device checks")
        if any(value not in {"pending", "pass"} for value in checks.values()):
            fail(f"{platform}.checks values must be pending or pass")

    if status == "pending-physical-device-validation":
        if any(data.get(key) is not None for key in ("runtimeFingerprint", "testedAt", "testerReference", "evidenceReference")):
            fail("pending top-level evidence fields must remain null")
        for platform, record in platforms.items():
            if record.get("status") != "pending":
                fail(f"pending contract cannot mark {platform} validated")
            if any(record.get(key) is not None for key in ("deviceModel", "osVersion", "browserVersion", "installedMode")):
                fail(f"pending {platform} device metadata must remain null")
            if any(value != "pending" for value in record["checks"].values()):
                fail(f"pending {platform} checks must remain pending")
        return

    fingerprint = str(data.get("runtimeFingerprint") or "")
    if re.fullmatch(r"sha256:[0-9a-f]{64}", fingerprint) is None:
        fail("validated runtimeFingerprint must be sha256:<64 lowercase hex characters>")
    tested_at = parse_tested_at(data.get("testedAt"))
    now = datetime.now(timezone.utc)
    age_days = (now - tested_at).total_seconds() / 86400
    if age_days < -0.01:
        fail("testedAt is in the future")
    if age_days > max_age:
        fail(f"physical evidence is stale ({age_days:.1f} days; maximum {max_age})")
    tester = str(data.get("testerReference") or "").strip()
    evidence = str(data.get("evidenceReference") or "").strip()
    if not tester or "@" in tester:
        fail("validated testerReference must be a non-personal reference and not an email address")
    if not evidence or "@" in evidence:
        fail("validated evidenceReference must be a non-sensitive reference and not an email address")
    for platform, record in platforms.items():
        if record.get("status") != "validated":
            fail(f"top-level validated status requires {platform}.status=validated")
        for key in ("deviceModel", "osVersion", "browserVersion"):
            if not str(record.get(key) or "").strip():
                fail(f"validated {platform}.{key} is required")
        if record.get("installedMode") != "standalone":
            fail(f"validated {platform}.installedMode must be standalone")
        failed = [name for name, value in record["checks"].items() if value != "pass"]
        if failed:
            fail(f"validated {platform} checks are not passing: {', '.join(sorted(failed))}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifact", default=str(ROOT / ".pages-dist"))
    parser.add_argument("--contract", default=str(CONTRACT))
    parser.add_argument("--contract-only", action="store_true")
    parser.add_argument("--print-fingerprint", action="store_true")
    args = parser.parse_args()

    data = read_contract(Path(args.contract))
    validate_contract(data)
    if args.contract_only:
        print(f"Physical PWA device contract is structurally valid ({data['status']}).")
        return

    fingerprint = runtime_fingerprint(Path(args.artifact))
    if args.print_fingerprint:
        print(fingerprint)
        return
    if data["status"] == "pending-physical-device-validation":
        print(
            "Physical PWA device evidence remains pending; current public-runtime "
            f"fingerprint is {fingerprint}. Real iOS/iPadOS and Android execution is still required."
        )
        return
    if data["runtimeFingerprint"] != fingerprint:
        fail(
            "validated physical-device evidence applies to different public runtime bytes: "
            f"expected {fingerprint}, got {data['runtimeFingerprint']}"
        )
    print(
        "Verified physical PWA device evidence for exact public runtime "
        f"{fingerprint} (iOS/iPadOS + Android, tested {data['testedAt']})."
    )


if __name__ == "__main__":
    main()
