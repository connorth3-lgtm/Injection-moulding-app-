#!/usr/bin/env python3
"""Fail closed on unsupported or stale external-validation claims for the current release."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "data" / "release-external-validation-v1.json"
VERSION = ROOT / "version.json"
ALLOWED_SECTION_STATUS = {
    "governance": {"pending-native-ruleset-apply", "enforced"},
    "accessibility": {"hold", "validated"},
    "pwaPhysicalDevices": {"hold", "validated"},
    "windowsDistribution": {"hold", "validated"},
    "bookSme": {"hold", "validated"},
    "curriculumSme": {"hold", "validated"},
    "learnerOutcomes": {"hold", "validated"},
    "productionUse": {"advisory-only"},
    "visualGovernance": {"pending-native-ruleset-apply", "enforced"},
}
SHA_RE = re.compile(r"^[0-9a-f]{40}$")
FINGERPRINT_RE = re.compile(r"^sha256:[0-9a-f]{64}$")


def fail(message: str) -> None:
    raise SystemExit(f"release external-validation gate failed: {message}")


def load_json(path: Path) -> dict:
    if not path.is_file():
        fail(f"required contract is missing: {path.relative_to(ROOT)}")
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")
    if not isinstance(value, dict):
        fail(f"{path.relative_to(ROOT)} must contain a JSON object")
    return value


def require_nonempty(value: object, message: str) -> str:
    text = str(value or "").strip()
    if not text:
        fail(message)
    return text


def require_repo_file(value: object, message: str) -> str:
    rel = require_nonempty(value, message)
    path = ROOT / rel
    if not path.is_file():
        fail(f"referenced file is missing: {rel}")
    return rel


def require_release_packet(value: object, expected_release: str, expected_path: str, label: str) -> str:
    rel = require_repo_file(value, f"{label} release packet is missing")
    if rel != expected_path:
        fail(f"{label} release packet must be {expected_path}, got {rel}")
    if expected_release not in Path(rel).name:
        fail(f"{label} packet is not visibly bound to release {expected_release}")
    return rel


def require_sha(value: object, label: str) -> str:
    text = require_nonempty(value, f"{label} is missing")
    if SHA_RE.fullmatch(text) is None:
        fail(f"{label} must be a 40-character lowercase commit SHA")
    return text


def require_fingerprint(value: object, label: str) -> str:
    text = require_nonempty(value, f"{label} is missing")
    if FINGERPRINT_RE.fullmatch(text) is None:
        fail(f"{label} must be sha256:<64 lowercase hex characters>")
    return text


def load_current_release() -> str:
    if not VERSION.is_file():
        fail("canonical release source is missing: version.json")
    try:
        value = json.loads(VERSION.read_text(encoding="utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        fail(f"invalid JSON in version.json: {exc}")
    if not isinstance(value, dict):
        fail("version.json must contain a JSON object")
    return require_nonempty(
        value.get("web_release"),
        "version.json.web_release must identify the canonical web release",
    )


def require_current_release(evidence: dict, expected_release: str, label: str) -> None:
    if evidence.get("release") != expected_release:
        fail(f"{label} evidence/contract must be bound to release {expected_release}")


def validate_accessibility(section: dict, expected_release: str) -> None:
    packet = require_release_packet(
        section.get("reviewPacket"),
        expected_release,
        f"qa/ACCESSIBILITY_REAL_AT_{expected_release}.md",
        "accessibility",
    )
    evidence = load_json(ROOT / section["evidenceContract"])
    require_current_release(evidence, expected_release, "accessibility")
    if evidence.get("packet") != packet:
        fail("accessibility contract packet does not match the release ledger")
    source_sha = require_sha(evidence.get("sourceSha"), "accessibility sourceSha")
    fingerprint = require_fingerprint(evidence.get("runtimeFingerprint"), "accessibility runtimeFingerprint")
    candidate = section.get("candidate")
    if not isinstance(candidate, dict):
        fail("accessibility candidate binding is missing")
    if candidate.get("release") != expected_release:
        fail("accessibility candidate release is stale")
    if candidate.get("sourceSha") != source_sha or candidate.get("runtimeFingerprint") != fingerprint:
        fail("accessibility candidate does not match the governed real-AT contract")

    if section["status"] == "hold":
        if evidence.get("status") == "validated":
            fail("accessibility is marked hold although its evidence contract says validated; reconcile explicitly")
        return
    if evidence.get("status") != "validated":
        fail("accessibility cannot be validated until the real-AT contract status is validated")
    matrix = evidence.get("requiredMatrix")
    if not isinstance(matrix, list) or not matrix:
        fail("validated real-AT evidence requires a non-empty requiredMatrix")
    for row in matrix:
        if not isinstance(row, dict) or row.get("status") not in {"pass", "validated"}:
            fail("validated real-AT evidence requires every matrix row to pass")
        for key in ("testedAt", "reviewer", "evidenceRef"):
            require_nonempty(row.get(key), f"validated real-AT row is missing {key}")


def validate_pwa(section: dict, expected_release: str) -> None:
    require_release_packet(
        section.get("reviewPacket"),
        expected_release,
        f"qa/PWA_PHYSICAL_DEVICE_{expected_release}.md",
        "PWA physical-device",
    )
    candidate = section.get("currentCandidate")
    if not isinstance(candidate, dict):
        fail("PWA currentCandidate binding is missing")
    if candidate.get("release") != expected_release:
        fail("PWA candidate release is stale")
    source_sha = require_sha(candidate.get("sourceSha"), "PWA candidate sourceSha")
    require_fingerprint(candidate.get("runtimeFingerprint"), "PWA candidate runtimeFingerprint")
    require_fingerprint(candidate.get("artifactDigest"), "PWA candidate artifactDigest")
    for key in ("pagesRunId", "artifactId"):
        value = candidate.get(key)
        if not isinstance(value, int) or value <= 0:
            fail(f"PWA candidate {key} must be a positive integer")
    expected_name = f"physical-pwa-candidate-{source_sha}"
    if candidate.get("artifactName") != expected_name:
        fail(f"PWA candidate artifactName must be {expected_name}")
    require_nonempty(candidate.get("artifactExpiresAt"), "PWA candidate artifactExpiresAt is missing")

    evidence = load_json(ROOT / section["evidenceContract"])
    if section["status"] == "hold":
        return
    require_current_release(evidence, expected_release, "PWA physical-device")
    if evidence.get("status") != "validated":
        fail("current-release PWA cannot be validated without full physical iOS/iPadOS + Android evidence")
    if evidence.get("runtimeFingerprint") != candidate.get("runtimeFingerprint"):
        fail("validated PWA evidence must match the exact currentCandidate runtime fingerprint")


def validate_book_sme(section: dict, expected_release: str) -> None:
    require_release_packet(
        section.get("reviewPacket"),
        expected_release,
        f"qa/BOOK_SME_REVIEW_{expected_release}.md",
        "Book SME",
    )
    evidence = load_json(ROOT / section["evidenceContract"])
    require_current_release(evidence, expected_release, "Book SME")
    chapter_ids = evidence.get("chapterIds")
    reviews = evidence.get("reviews")
    required_dimensions = set(evidence.get("requiredDimensions") or [])
    if not isinstance(chapter_ids, list) or len(chapter_ids) != 46 or len(set(chapter_ids)) != 46:
        fail("Book SME contract must contain exactly 46 unique governed chapter ids")
    if not isinstance(reviews, list):
        fail("Book SME reviews must be a list")
    if section["status"] == "hold":
        if evidence.get("status") == "validated":
            fail("Book SME is marked hold although its evidence contract says validated; reconcile explicitly")
        return
    if evidence.get("status") != "validated":
        fail("Book SME cannot be validated until the human-review contract status is validated")
    if len(required_dimensions) != 6:
        fail("validated Book SME evidence requires all six governed review dimensions")
    if len(reviews) != 46:
        fail("validated Book SME evidence requires one review record for every governed chapter")
    by_id = {row.get("chapterId"): row for row in reviews if isinstance(row, dict)}
    if set(by_id) != set(chapter_ids):
        fail("validated Book SME reviews must exactly cover the 46 governed chapters")
    for chapter_id, row in by_id.items():
        for key in ("reviewedAt", "reviewerReference", "evidenceRef"):
            require_nonempty(row.get(key), f"validated Book SME review {chapter_id} is missing {key}")
        if row.get("conclusion") != "approved":
            fail(f"validated Book SME review is not approved: {chapter_id}")
        dimensions = row.get("dimensions") or {}
        if set(dimensions) != required_dimensions or any(value != "pass" for value in dimensions.values()):
            fail(f"validated Book SME dimensions do not all pass: {chapter_id}")


def validate_curriculum(section: dict, expected_release: str) -> None:
    packet = require_release_packet(
        section.get("reviewPacket"),
        expected_release,
        f"qa/CURRICULUM_SME_REVIEW_{expected_release}.md",
        "curriculum SME",
    )
    evidence = load_json(ROOT / section["evidenceContract"])
    require_current_release(evidence, expected_release, "curriculum SME")
    if evidence.get("packet") != packet:
        fail("curriculum SME contract packet does not match the release ledger")
    reviews = evidence.get("reviews")
    lesson_ids = evidence.get("lessonIds")
    if not isinstance(lesson_ids, list) or len(lesson_ids) != 120 or len(set(lesson_ids)) != 120:
        fail("curriculum SME contract must contain the canonical 120 unique lesson ids")
    if not isinstance(reviews, list):
        fail("curriculum SME reviews must be a list")
    if section["status"] == "hold":
        return
    if len(reviews) != 120:
        fail("curriculum SME validation requires one review record for each of 120 lessons")
    reviewed_ids = {row.get("lessonId") for row in reviews if isinstance(row, dict)}
    if reviewed_ids != set(lesson_ids):
        fail("curriculum SME review records do not exactly cover the canonical lesson set")


def validate_windows(section: dict, expected_release: str) -> None:
    require_release_packet(
        section.get("readinessPacket"),
        expected_release,
        f"certification/WINDOWS_SIGNING_READINESS_{expected_release}.md",
        "Windows distribution",
    )
    require_sha(section.get("sourceSha"), "Windows sourceSha")
    require_nonempty(section.get("desktopRelease"), "Windows desktopRelease is missing")
    if section["status"] == "hold":
        if section.get("evidence") is not None:
            fail("Windows HOLD must not contain synthetic completion evidence")
        return
    evidence = section.get("evidence")
    if not isinstance(evidence, dict):
        fail("validated Windows distribution requires a release-specific evidence object")
    require_current_release(evidence, expected_release, "Windows distribution")
    for key in ("testedAt", "evidenceRef", "packageSha256", "signer", "windowsVersion", "deviceRef"):
        require_nonempty(evidence.get(key), f"validated Windows evidence is missing {key}")
    checks = evidence.get("checks")
    required = {"signature", "physicalLaunch", "smartscreenOrStore", "packageValidation"}
    if not isinstance(checks, dict) or set(checks) != required or any(v != "pass" for v in checks.values()):
        fail("validated Windows evidence requires all governed real-machine/package checks to pass")


def validate_learner(section: dict, expected_release: str) -> None:
    require_release_packet(
        section.get("pilotPacket"),
        expected_release,
        f"qa/LEARNER_PILOT_{expected_release}.md",
        "learner pilot",
    )
    pilot = load_json(ROOT / section["pilotContract"])
    require_current_release(pilot, expected_release, "learner pilot")
    if section["status"] == "hold":
        if section.get("evidence") is not None:
            fail("learner-outcomes HOLD must not contain synthetic completion evidence")
        return
    evidence = section.get("evidence")
    if not isinstance(evidence, dict):
        fail("validated learner outcomes require a release-specific longitudinal evidence object")
    require_current_release(evidence, expected_release, "learner outcomes")
    for key in ("studyRef", "startedAt", "endedAt", "analysisRef"):
        require_nonempty(evidence.get(key), f"validated learner evidence is missing {key}")
    cohort = evidence.get("realLearnerCohortSize")
    if not isinstance(cohort, int) or cohort <= 0:
        fail("validated learner evidence requires a positive realLearnerCohortSize")
    if evidence.get("synthetic") is not False:
        fail("validated learner evidence must explicitly declare synthetic=false")


def main() -> None:
    expected_release = load_current_release()
    data = load_json(CONTRACT)
    if data.get("schemaVersion") != 1:
        fail("schemaVersion must be 1")
    if data.get("release") != expected_release:
        fail(f"release must match canonical web release {expected_release}")
    require_release_packet(
        data.get("validationIndex"),
        expected_release,
        f"qa/EXTERNAL_VALIDATION_{expected_release}.md",
        "external-validation index",
    )
    if (data.get("technicalAutomation") or {}).get("status") != "pass":
        fail("technicalAutomation.status must be pass for this audited release record")

    for name, allowed in ALLOWED_SECTION_STATUS.items():
        section = data.get(name)
        if not isinstance(section, dict):
            fail(f"{name} section is missing")
        if section.get("status") not in allowed:
            fail(f"{name}.status must be one of {sorted(allowed)}")

    governance = data["governance"]
    policy = governance.get("requiredPolicy") or {}
    maintainer_mode = str(governance.get("maintainerMode") or "multi").strip().lower()
    if maintainer_mode == "solo":
        if governance.get("status") != "enforced":
            fail("solo-maintainer governance must be recorded as enforced")
        if policy.get("minimumApprovals") != 0:
            fail("solo-maintainer governance requires minimumApprovals=0")
        if policy.get("lastPushApproval") is not False:
            fail("solo-maintainer governance requires lastPushApproval=false")
        require_nonempty(
            governance.get("soloMaintainerBoundary"),
            "solo-maintainer governance must document its narrow exception boundary",
        )
    else:
        if policy.get("minimumApprovals", 0) < 1:
            fail("multi-maintainer governance requires at least one independent approval")
        if policy.get("lastPushApproval") is not True:
            fail("multi-maintainer governance requires latest-push approval")
    for key in ("reviewThreadResolution", "dismissStaleReviews"):
        if policy.get(key) is not True:
            fail(f"governance.requiredPolicy.{key} must be true")

    validate_accessibility(data["accessibility"], expected_release)
    validate_pwa(data["pwaPhysicalDevices"], expected_release)
    validate_windows(data["windowsDistribution"], expected_release)
    validate_book_sme(data["bookSme"], expected_release)
    validate_curriculum(data["curriculumSme"], expected_release)
    validate_learner(data["learnerOutcomes"], expected_release)

    production = data["productionUse"]
    if production.get("status") != "advisory-only" or production.get("authority") != "no-automatic-machine-control":
        fail("production use must remain advisory-only with no automatic machine-control authority")

    claims = data.get("claims")
    if not isinstance(claims, dict):
        fail("claims section is missing")
    forbidden_true = {
        "fullyExternallyValidated",
        "accreditationAuthorized",
        "learnerEfficacyEstablished",
        "productionRecipeValidated",
        "automaticMachineControlAuthorized",
    }
    promoted = sorted(key for key in forbidden_true if claims.get(key) is not False)
    if promoted:
        fail("unsupported release claims must remain false until a separately reviewed policy change: " + ", ".join(promoted))

    holds = [
        name for name in ("accessibility", "pwaPhysicalDevices", "windowsDistribution", "bookSme", "curriculumSme", "learnerOutcomes")
        if data[name]["status"] == "hold"
    ]
    print(
        f"Release {expected_release} external-validation boundary verified. "
        f"Automated technical state is PASS; exact release packets are current; explicit HOLD areas: "
        f"{', '.join(holds) if holds else 'none'}; production authority remains advisory-only."
    )


if __name__ == "__main__":
    main()
