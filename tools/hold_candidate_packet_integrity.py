#!/usr/bin/env python3
"""Check the current retained public candidate against every release-specific HOLD packet.

A source SHA, build artifact and runtime fingerprint are technical identities,
not real-device, AT, SME, learner, signing, provider or production approvals.
"""
from __future__ import annotations

import datetime as dt
import re
from pathlib import Path

SHA = re.compile(r"[0-9a-f]{40}\Z")
FINGERPRINT = re.compile(r"sha256:[0-9a-f]{64}\Z")
RELEASE = re.compile(r"\d{4}\.\d{2}\.\d{2}\.\d+\Z")
PACKETS = {
    "accessibility": ("reviewPacket", "ACCESSIBILITY_REAL_AT"),
    "pwaPhysicalDevices": ("reviewPacket", "PWA_PHYSICAL_DEVICE"),
    "windowsDistribution": ("readinessPacket", "WINDOWS_SIGNING_READINESS"),
    "bookSme": ("reviewPacket", "BOOK_SME_REVIEW"),
    "curriculumSme": ("reviewPacket", "CURRICULUM_SME_REVIEW"),
    "learnerOutcomes": ("pilotPacket", "LEARNER_PILOT"),
    "nzqaProvider": ("reviewPacket", "NZQA_EXTERNAL_VALIDATION"),
}


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError("External HOLD provenance: " + message)


def candidate_identity(candidate: dict, release: str) -> dict:
    require(isinstance(candidate, dict), "candidate object is missing")
    require(RELEASE.fullmatch(str(release or "")) is not None, "invalid release")
    require(candidate.get("release") == release, "candidate release mismatch")
    sha = candidate.get("sourceSha")
    fp = candidate.get("runtimeFingerprint")
    digest = candidate.get("artifactDigest")
    require(isinstance(sha, str) and SHA.fullmatch(sha) is not None, "invalid exact source SHA")
    require(isinstance(fp, str) and FINGERPRINT.fullmatch(fp) is not None, "invalid fingerprint")
    require(isinstance(digest, str) and FINGERPRINT.fullmatch(digest) is not None, "invalid artifact digest")
    for name in ("candidateRunId", "artifactId"):
        value = candidate.get(name)
        require(type(value) is int and value > 0, f"invalid {name}")
    require(candidate.get("candidateWorkflow") == "Pre-merge Public Candidate", "incorrect producer workflow")
    require(candidate.get("artifactName") == f"physical-pwa-candidate-{sha}", "artifact name does not match exact SHA")
    expiry = candidate.get("artifactExpiresAt")
    require(isinstance(expiry, str), "artifact expiry is missing")
    try:
        timestamp = dt.datetime.fromisoformat(expiry.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("External HOLD provenance: invalid artifact expiry") from exc
    require(timestamp.tzinfo is not None, "artifact expiry lacks timezone")
    require(timestamp.astimezone(dt.timezone.utc) > dt.datetime.now(dt.timezone.utc),
            "retained candidate artifact is expired")
    return candidate


def hold_statuses(ledger: dict) -> None:
    for name in PACKETS:
        require((ledger.get(name) or {}).get("status") == "hold", f"{name} is no longer HOLD")
    require((ledger.get("productionUse") or {}).get("status") == "advisory-only", "production authority was promoted")
    claims = ledger.get("claims") or {}
    for name in ("fullyExternallyValidated", "accreditationAuthorized", "learnerEfficacyEstablished",
                 "productionRecipeValidated", "automaticMachineControlAuthorized"):
        require(claims.get(name) is False, f"{name} must remain false")


def validate_packet(text: str, path: str, candidate: dict, release: str) -> None:
    """Require current candidate metadata in the first review banner, not just in history."""
    require(text.startswith("# ") and release in text.splitlines()[0], f"{path}: incorrect release heading")
    lines = text.splitlines()
    banners = [line for line in lines[:12] if line.startswith("> **RETAINED ")]
    require(len(banners) == 1, f"{path}: missing or ambiguous current-candidate banner")
    banner = banners[0]
    require(release in banner, f"{path}: banner release stale")
    # Reject substring forgeries: artifact 123 must not accept 91234;
    # a historical correct SHA must not satisfy the current provenance banner.
    token_patterns = (
        ("source", r"\bsource\s+`?([0-9a-f]{40})`?(?=[\s,.;]|$)", candidate["sourceSha"]),
        ("runtime fingerprint", r"\bfingerprint\s+`?(sha256:[0-9a-f]{64})`?(?=[\s,.;]|$)",
         candidate["runtimeFingerprint"]),
        ("artifact digest", r"\bdigest\s+`?(sha256:[0-9a-f]{64})`?(?=[\s,.;]|$)",
         candidate["artifactDigest"]),
        ("artifact id", r"\bartifact\s+\*\*([1-9][0-9]*)\*\*", str(candidate["artifactId"])),
        ("expiry", r"\bexpiry\s+`?([0-9TZ:+.-]+)`?(?=[\s,.;]|$)", candidate["artifactExpiresAt"]),
        ("run URL", r"/actions/runs/([1-9][0-9]*)\)", str(candidate["candidateRunId"])),
    )
    for label, pattern, expected in token_patterns:
        matches = re.findall(pattern, banner)
        require(matches == [expected],
                f"{path}: current {label} missing, ambiguous or mismatched in active banner")
    require("HOLD" in banner, f"{path}: independent acceptance must remain HOLD")
    current_intro = "\n".join(lines[:12])
    require("STATUS: HOLD" in current_intro or "STATUS: ALL SEVEN" in current_intro,
            f"{path}: current review HOLD statement missing")


def validate_packets(root: Path, ledger: dict) -> int:
    release = ledger.get("release")
    candidate = candidate_identity(ledger.get("webCandidate"), release)
    hold_statuses(ledger)
    require(ledger["pwaPhysicalDevices"].get("currentCandidate") == candidate,
            "physical PWA candidate drift")
    identity = {k: candidate[k] for k in ("release", "sourceSha", "runtimeFingerprint")}
    require(ledger["accessibility"].get("candidate") == identity, "real-AT candidate drift")
    require(ledger["nzqaProvider"].get("candidate") == identity, "provider candidate drift")

    for area, (field, tag) in PACKETS.items():
        path = ledger[area].get(field)
        require(isinstance(path, str) and path.endswith(f"{tag}_{release}.md"),
                f"{area}: release-specific packet path incorrect")
        target = (root / path).resolve()
        require(target.is_relative_to(root.resolve()), f"{area}: packet path escapes repository")
        require(target.is_file(), f"{area}: packet missing")
        validate_packet(target.read_text(encoding="utf-8"), path, candidate, release)
    return len(PACKETS)
