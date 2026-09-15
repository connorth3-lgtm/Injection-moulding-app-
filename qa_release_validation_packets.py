#!/usr/bin/env python3
"""Prove current external-validation packets are bound to the actual public runtime bytes."""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PAGES = ROOT / ".pages-dist"
FP_RE = re.compile(r"^sha256:[0-9a-f]{64}$")
SHA_RE = re.compile(r"^[0-9a-f]{40}$")


def need(ok: bool, message: str) -> None:
    if not ok:
        raise AssertionError(message)


def load(path: str) -> dict:
    target = ROOT / path
    need(target.is_file(), f"missing required validation file: {path}")
    value = json.loads(target.read_text(encoding="utf-8"))
    need(isinstance(value, dict), f"validation JSON must be an object: {path}")
    return value


version = load("version.json")
release = version.get("web_release")
need(isinstance(release, str) and release, "version.json web_release is missing")
ledger = load("data/release-external-validation-v1.json")
need(ledger.get("release") == release, "external-validation ledger release is stale")

index_rel = ledger.get("validationIndex")
need(index_rel == f"qa/EXTERNAL_VALIDATION_{release}.md", "release validation index path is stale")
index_path = ROOT / index_rel
need(index_path.is_file(), "release validation index is missing")
index_text = index_path.read_text(encoding="utf-8")

packet_expectations = {
    "accessibility": ("reviewPacket", f"qa/ACCESSIBILITY_REAL_AT_{release}.md"),
    "pwaPhysicalDevices": ("reviewPacket", f"qa/PWA_PHYSICAL_DEVICE_{release}.md"),
    "windowsDistribution": ("readinessPacket", f"certification/WINDOWS_SIGNING_READINESS_{release}.md"),
    "bookSme": ("reviewPacket", f"qa/BOOK_SME_REVIEW_{release}.md"),
    "curriculumSme": ("reviewPacket", f"qa/CURRICULUM_SME_REVIEW_{release}.md"),
    "learnerOutcomes": ("pilotPacket", f"qa/LEARNER_PILOT_{release}.md"),
}
for section_name, (key, expected) in packet_expectations.items():
    section = ledger.get(section_name) or {}
    need(section.get(key) == expected, f"{section_name} packet path is stale")
    need((ROOT / expected).is_file(), f"{section_name} packet is missing: {expected}")
    need(expected in index_text, f"release validation index does not reference {expected}")

access = load("data/accessibility-real-at-validation-v1.json")
access_section = ledger["accessibility"]
access_candidate = access_section.get("candidate") or {}
need(access.get("release") == release, "real-AT contract release is stale")
need(access.get("packet") == access_section.get("reviewPacket"), "real-AT packet binding drifted")
need(SHA_RE.fullmatch(str(access.get("sourceSha") or "")) is not None, "real-AT source SHA is invalid")
need(FP_RE.fullmatch(str(access.get("runtimeFingerprint") or "")) is not None, "real-AT runtime fingerprint is invalid")
need(access_candidate.get("release") == release, "real-AT candidate release is stale")
need(access_candidate.get("sourceSha") == access.get("sourceSha"), "real-AT candidate source SHA drifted")
need(access_candidate.get("runtimeFingerprint") == access.get("runtimeFingerprint"), "real-AT candidate fingerprint drifted")

curriculum = load("qa/curriculum-semantic-review.json")
need(curriculum.get("release") == release, "curriculum SME contract release is stale")
need(curriculum.get("packet") == ledger["curriculumSme"].get("reviewPacket"), "curriculum SME packet binding drifted")
need(len(curriculum.get("lessonIds") or []) == 120, "curriculum SME contract must retain 120 lessons")

pwa = ledger.get("pwaPhysicalDevices") or {}
candidate = pwa.get("currentCandidate") or {}
need(candidate.get("release") == release, "physical PWA candidate release is stale")
source_sha = str(candidate.get("sourceSha") or "")
need(SHA_RE.fullmatch(source_sha) is not None, "physical PWA candidate source SHA is invalid")
expected_name = f"physical-pwa-candidate-{source_sha}"
need(candidate.get("artifactName") == expected_name, "physical PWA artifact name/source SHA binding drifted")
need(FP_RE.fullmatch(str(candidate.get("runtimeFingerprint") or "")) is not None, "physical PWA candidate fingerprint is invalid")
need(FP_RE.fullmatch(str(candidate.get("artifactDigest") or "")) is not None, "physical PWA artifact digest is invalid")
candidate_run_id = candidate.get("candidateRunId", candidate.get("pagesRunId"))
need(isinstance(candidate_run_id, int) and candidate_run_id > 0, "physical PWA candidate build run id is invalid")
need(isinstance(candidate.get("artifactId"), int) and candidate["artifactId"] > 0, "physical PWA artifact id is invalid")
need(bool(candidate.get("artifactExpiresAt")), "physical PWA artifact expiry is missing")

# Rebuild the current public artifact and compare the stable learner-facing fingerprint.
try:
    subprocess.run([sys.executable, "tools/build_pages_artifact.py"], cwd=ROOT, check=True)
    sys.path.insert(0, str(ROOT / "tools"))
    from verify_pwa_physical_evidence import runtime_fingerprint  # type: ignore

    actual_fp = runtime_fingerprint(PAGES)
    need(
        actual_fp == candidate.get("runtimeFingerprint"),
        f"physical PWA packet fingerprint is stale: expected {candidate.get('runtimeFingerprint')} actual {actual_fp}",
    )
    need(
        actual_fp == access.get("runtimeFingerprint"),
        f"real-AT packet fingerprint is stale: expected {access.get('runtimeFingerprint')} actual {actual_fp}",
    )
finally:
    if PAGES.exists():
        shutil.rmtree(PAGES)

for name in ("accessibility", "pwaPhysicalDevices", "windowsDistribution", "bookSme", "curriculumSme", "learnerOutcomes"):
    need((ledger.get(name) or {}).get("status") == "hold", f"{name} must remain HOLD until genuine external evidence exists")

print(
    f"Release validation packet QA passed for {release}: exact public runtime {candidate['runtimeFingerprint']} is bound to "
    "physical-device and real-AT packets; all six external workstreams remain explicit HOLDs."
)
