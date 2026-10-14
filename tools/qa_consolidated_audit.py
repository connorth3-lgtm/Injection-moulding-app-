#!/usr/bin/env python3
"""Offline, fail-closed audit issue consolidation guard.

Master tracking is repository bookkeeping, not field/device/provider approval.
This guard intentionally never consults live GitHub issue state and never
mistakes a passing CI check for independent real-world acceptance.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAP = ROOT / "qa/audit-issue-consolidation-v1.json"
REPORT = ROOT / "docs/UNIFIED_AUDIT_2026.10.13.3.md"
LEDGER = ROOT / "data/release-external-validation-v1.json"
VERSION = ROOT / "version.json"

EXPECTED_HOLDS = {
    "pwaPhysicalDevices": 325, "accessibility": 362,
    "windowsDistribution": 328, "bookSme": 326,
    "curriculumSme": 327, "learnerOutcomes": 329,
    "nzqaProvider": 619,
}
EXPECTED_OTHER = {520, 512, 582, 589, 521, 278, 430, 428, 334, 335, 336}
EXPECTED_HISTORIC = {625, 624, 379}
EXPECTED_CLAIMS_FALSE = {
    "fullyExternallyValidated", "accreditationAuthorized",
    "learnerEfficacyEstablished", "productionRecipeValidated",
    "automaticMachineControlAuthorized",
}

def need(condition: bool, problem: str) -> None:
    if not condition:
        raise AssertionError("Unified audit map: " + problem)

def load(path: Path) -> dict:
    result = json.loads(path.read_text(encoding="utf-8"))
    need(isinstance(result, dict), f"{path.name} must be a JSON object")
    return result

def validate(source: dict, report: str, release: dict, ledger: dict) -> None:
    need(source.get("schemaVersion") == 1 and source.get("masterIssue") == 632,
         "master schema/issue identity mismatch")
    need(source.get("release") == release.get("web_release") == ledger.get("release"),
         "release identity out of sync")
    need(source.get("publishedMergeSha") == "89fe3e24c11c3eb660953870fce7e819280c55df",
         "audited original main merge source must remain immutable history")
    candidate = ledger.get("webCandidate")
    technical = (ledger.get("technicalAutomation") or {}).get("status")
    if candidate is None:
        # A new release must stage as technical FAIL/HOLD until the *new*
        # producer exists. This is not a permission to merge an unbound build:
        # the normal release external validator still rejects webCandidate=null.
        need(technical == "fail" and source.get("candidateSourceSha") is None,
             "unverified successor must remain fail-closed")
        previous = source.get("previousVerifiedCandidate") or {}
        retained = ledger.get("previousCandidate") or {}
        need(previous.get("release") == retained.get("release")
             and previous.get("sourceSha") == retained.get("sourceSha")
             and re.fullmatch(r"[0-9a-f]{40}", str(retained.get("sourceSha") or "")) is not None,
             "historical previous producer cannot be forged or presented as current")
    else:
        need(source.get("candidateSourceSha") == candidate.get("sourceSha")
             and re.fullmatch(r"[0-9a-f]{40}", str(candidate.get("sourceSha") or "")) is not None,
             "source-bound verified producer candidate absent/stale")
        need(technical == "pass", "technical automation has not been proven")
    need((ledger.get("productionUse") or {}).get("status") == source.get("productionAuthority") == "advisory-only",
         "production release HOLD must not be silently lifted")
    groups = source.get("issueGroups") or {}
    need(groups.get("externalHolds") == EXPECTED_HOLDS,
         "external issue ownership changed without a reviewed migration")
    need(set(groups.get("evidenceAndUX") or ()) == EXPECTED_OTHER
         and len(groups.get("evidenceAndUX") or ()) == len(EXPECTED_OTHER),
         "non-external evidence items missing or duplicated")
    need(set(groups.get("supersededTrackers") or ()) == EXPECTED_HISTORIC,
         "historical provenance list missing or duplicated")
    all_issues = list(EXPECTED_HOLDS.values()) + list(groups["evidenceAndUX"]) + list(groups["supersededTrackers"])
    need(len(all_issues) == len(set(all_issues)) == 21,
         "expected all 21 unique open source issues from review")
    for area, issue in EXPECTED_HOLDS.items():
        need((ledger.get(area) or {}).get("status") == "hold",
             f"{area} independent human/device/provider evidence not HOLD")
        need(f"#{issue}" in report, f"unlinked external issue #{issue}")
    need(all((ledger.get("claims") or {}).get(key) is False for key in EXPECTED_CLAIMS_FALSE),
         "unsupported learner, provider or machine-control claim was promoted")
    need(source.get("humanEvidenceStatus") == "hold"
         and "seven independent" in report.lower()
         and "advisory-only" in report,
         "reader-facing HOLD language absent")
    for n in EXPECTED_OTHER | EXPECTED_HISTORIC:
        need(f"#{n}" in report, f"unlinked additional issue #{n}")
    next_release = source.get("nextVersionedReleaseOnly") or {}
    need(next_release.get("privacyRevision") == "pending-governed-release"
         and next_release.get("publicationDateMetadata") == "pending-governed-release",
         "next-version public metadata corrections improperly marked complete")
    need("Do not quietly change the SHA-pinned public asset." in report,
         "asset fingerprint/release-boundary warning removed")

def main() -> None:
    validate(load(MAP), REPORT.read_text(encoding="utf-8"), load(VERSION), load(LEDGER))
    print("Unified issue map: 21 issue references, 7 independent HOLDs and non-production policy verified")

if __name__ == "__main__":
    main()
