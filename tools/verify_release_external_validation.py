#!/usr/bin/env python3
"""Fail closed on unsupported external-validation claims for the current release."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "data" / "release-external-validation-v1.json"
EXPECTED_RELEASE = "2026.09.10.9"
ALLOWED_SECTION_STATUS = {
    "governance": {"pending-native-ruleset-apply", "enforced"},
    "accessibility": {"hold", "validated"},
    "pwaPhysicalDevices": {"hold", "validated"},
    "windowsDistribution": {"hold", "validated"},
    "curriculumSme": {"hold", "validated"},
    "learnerOutcomes": {"hold", "validated"},
    "productionUse": {"advisory-only"},
    "visualGovernance": {"pending-native-ruleset-apply", "enforced"},
}


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


def validate_accessibility(section: dict) -> None:
    evidence = load_json(ROOT / section["evidenceContract"])
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


def validate_pwa(section: dict) -> None:
    evidence = load_json(ROOT / section["evidenceContract"])
    if section["status"] == "hold":
        return
    if evidence.get("status") != "validated":
        fail("current-release PWA cannot be validated without full physical iOS/iPadOS + Android evidence")


def validate_curriculum(section: dict) -> None:
    evidence = load_json(ROOT / section["evidenceContract"])
    reviews = evidence.get("reviews")
    lesson_ids = evidence.get("lessonIds")
    if section["status"] == "hold":
        return
    if not isinstance(lesson_ids, list) or len(lesson_ids) != 120:
        fail("curriculum SME validation requires the canonical 120-lesson inventory")
    if not isinstance(reviews, list) or len(reviews) != 120:
        fail("curriculum SME validation requires one review record for each of 120 lessons")
    reviewed_ids = {row.get("lessonId") for row in reviews if isinstance(row, dict)}
    if reviewed_ids != set(lesson_ids):
        fail("curriculum SME review records do not exactly cover the canonical lesson set")


def validate_windows(section: dict) -> None:
    if section["status"] == "hold":
        if section.get("evidence") is not None:
            fail("Windows HOLD must not contain synthetic completion evidence")
        return
    evidence = section.get("evidence")
    if not isinstance(evidence, dict):
        fail("validated Windows distribution requires a release-specific evidence object")
    for key in ("testedAt", "evidenceRef", "packageSha256", "signer", "windowsVersion", "deviceRef"):
        require_nonempty(evidence.get(key), f"validated Windows evidence is missing {key}")
    checks = evidence.get("checks")
    required = {"signature", "physicalLaunch", "smartscreenOrStore", "packageValidation"}
    if not isinstance(checks, dict) or set(checks) != required or any(v != "pass" for v in checks.values()):
        fail("validated Windows evidence requires all governed real-machine/package checks to pass")


def validate_learner(section: dict) -> None:
    if section["status"] == "hold":
        if section.get("evidence") is not None:
            fail("learner-outcomes HOLD must not contain synthetic completion evidence")
        return
    evidence = section.get("evidence")
    if not isinstance(evidence, dict):
        fail("validated learner outcomes require a release-specific longitudinal evidence object")
    for key in ("studyRef", "startedAt", "endedAt", "analysisRef"):
        require_nonempty(evidence.get(key), f"validated learner evidence is missing {key}")
    cohort = evidence.get("realLearnerCohortSize")
    if not isinstance(cohort, int) or cohort <= 0:
        fail("validated learner evidence requires a positive realLearnerCohortSize")
    if evidence.get("synthetic") is not False:
        fail("validated learner evidence must explicitly declare synthetic=false")


def main() -> None:
    data = load_json(CONTRACT)
    if data.get("schemaVersion") != 1:
        fail("schemaVersion must be 1")
    if data.get("release") != EXPECTED_RELEASE:
        fail(f"release must remain bound to {EXPECTED_RELEASE}")
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
    if policy.get("minimumApprovals", 0) < 1:
        fail("governance requires at least one approval")
    for key in ("reviewThreadResolution", "dismissStaleReviews", "lastPushApproval"):
        if policy.get(key) is not True:
            fail(f"governance.requiredPolicy.{key} must be true")

    validate_accessibility(data["accessibility"])
    validate_pwa(data["pwaPhysicalDevices"])
    validate_windows(data["windowsDistribution"])
    validate_curriculum(data["curriculumSme"])
    validate_learner(data["learnerOutcomes"])

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
        name for name in ("accessibility", "pwaPhysicalDevices", "windowsDistribution", "curriculumSme", "learnerOutcomes")
        if data[name]["status"] == "hold"
    ]
    print(
        f"Release {EXPECTED_RELEASE} external-validation boundary verified. "
        f"Automated technical state is PASS; explicit HOLD areas: {', '.join(holds) if holds else 'none'}; "
        "production authority remains advisory-only."
    )


if __name__ == "__main__":
    main()
