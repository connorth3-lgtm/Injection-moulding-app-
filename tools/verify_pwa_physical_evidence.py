#!/usr/bin/env python3
"""Create/verify a stable public-runtime fingerprint and physical PWA evidence.

The fingerprint deliberately excludes deployment.json and pages-manifest.json,
which contain source-SHA-specific metadata. A later evidence-only commit therefore
does not invalidate a physical test when the actual public runtime bytes are
unchanged.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

EXCLUDED = {"deployment.json", "pages-manifest.json"}
IOS_CHECKS = (
    "install_standalone",
    "safe_area_navigation",
    "workspace_portrait",
    "offline_restart",
    "offline_reboot",
    "update_recovery",
    "storage_pressure",
    "screen_reader",
)
ANDROID_CHECKS = (
    "install_standalone",
    "fixed_navigation_clearance",
    "offline_restart",
    "offline_reboot",
    "update_recovery",
    "storage_pressure",
    "screen_reader",
)
MAX_AGE_DAYS = 30


def fail(message: str) -> "NoReturn":
    raise SystemExit(f"physical PWA evidence gate failed: {message}")


def file_sha256(path: Path) -> str:
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
        item_hash = file_sha256(path)
        digest.update(rel.encode("utf-8"))
        digest.update(b"\0")
        digest.update(str(path.stat().st_size).encode("ascii"))
        digest.update(b"\0")
        digest.update(item_hash.encode("ascii"))
        digest.update(b"\n")
    return "sha256:" + digest.hexdigest()


def read_evidence(path: Path) -> dict:
    if not path.is_file():
        fail(
            f"required physical evidence file is missing: {path}. "
            "Copy qa/pwa-physical-validation.example.json, test both platforms, and record the current runtime fingerprint."
        )
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        fail(f"invalid UTF-8 JSON evidence: {exc}")
    if not isinstance(data, dict):
        fail("evidence root must be a JSON object")
    return data


def require_shape(data: dict, allow_pending: bool = False) -> None:
    if data.get("schema") != 1:
        fail("evidence schema must be 1")
    if data.get("status") not in ({"pass", "pending"} if allow_pending else {"pass"}):
        fail("evidence status must be pass" if not allow_pending else "template status must be pass or pending")
    for key in ("runtime_fingerprint", "tested_at", "tester_reference", "ios", "android", "failures"):
        if key not in data:
            fail(f"evidence field missing: {key}")
    if not isinstance(data.get("failures"), list):
        fail("failures must be an array")
    tester = str(data.get("tester_reference") or "").strip()
    if not tester:
        fail("tester_reference is required")
    if "@" in tester:
        fail("tester_reference must be a non-personal role/reference, not an email address")

    for platform, required_checks in (("ios", IOS_CHECKS), ("android", ANDROID_CHECKS)):
        record = data.get(platform)
        if not isinstance(record, dict):
            fail(f"{platform} evidence must be an object")
        for field in ("device_model", "os_version", "browser_version", "installed_mode", "checks"):
            if field not in record:
                fail(f"{platform}.{field} is required")
        if not str(record.get("device_model") or "").strip():
            fail(f"{platform}.device_model is required")
        if not str(record.get("os_version") or "").strip():
            fail(f"{platform}.os_version is required")
        if not str(record.get("browser_version") or "").strip():
            fail(f"{platform}.browser_version is required")
        if record.get("installed_mode") not in ("standalone", "pending"):
            fail(f"{platform}.installed_mode must be standalone")
        checks = record.get("checks")
        if not isinstance(checks, dict):
            fail(f"{platform}.checks must be an object")
        missing = [name for name in required_checks if name not in checks]
        if missing:
            fail(f"{platform} checks missing: {', '.join(missing)}")
        allowed_states = {"pass", "pending"} if allow_pending else {"pass"}
        bad = [name for name in required_checks if checks.get(name) not in allowed_states]
        if bad:
            fail(f"{platform} checks are not passing: {', '.join(bad)}")


def parse_tested_at(value: str) -> datetime:
    text = str(value or "").strip()
    if not text:
        fail("tested_at is required")
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        fail("tested_at must be ISO-8601 with timezone")
    if parsed.tzinfo is None:
        fail("tested_at must include a timezone")
    return parsed.astimezone(timezone.utc)


def verify_pass_evidence(data: dict, expected_fingerprint: str) -> None:
    require_shape(data, allow_pending=False)
    if data.get("runtime_fingerprint") != expected_fingerprint:
        fail(
            "physical evidence was recorded for different public runtime bytes: "
            f"expected {expected_fingerprint}, got {data.get('runtime_fingerprint')}"
        )
    if data.get("failures"):
        fail("physical evidence contains unresolved failures")
    tested_at = parse_tested_at(data.get("tested_at"))
    now = datetime.now(timezone.utc)
    age_days = (now - tested_at).total_seconds() / 86400
    if age_days < -0.01:
        fail("tested_at is in the future")
    if age_days > MAX_AGE_DAYS:
        fail(f"physical evidence is stale ({age_days:.1f} days; maximum {MAX_AGE_DAYS})")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifact", default=".pages-dist")
    parser.add_argument("--evidence", default="qa/pwa-physical-validation.json")
    parser.add_argument("--print-fingerprint", action="store_true")
    parser.add_argument("--validate-template", action="store_true")
    args = parser.parse_args()

    if args.validate_template:
        template = read_evidence(Path(args.evidence))
        require_shape(template, allow_pending=True)
        print("Physical PWA evidence template structure is valid.")
        return

    fingerprint = runtime_fingerprint(Path(args.artifact))
    if args.print_fingerprint:
        print(fingerprint)
        return

    evidence = read_evidence(Path(args.evidence))
    verify_pass_evidence(evidence, fingerprint)
    print(
        "Verified physical PWA evidence: "
        f"runtime={fingerprint} iOS={evidence['ios']['device_model']} Android={evidence['android']['device_model']}."
    )


if __name__ == "__main__":
    main()
