#!/usr/bin/env python3
"""Fail closed on unsupported or stale external-validation claims for the current release."""
from __future__ import annotations

import datetime as dt
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from qa_curriculum_semantic_review import canonical_lessons as canonical_curriculum_lessons, validate_contract as validate_curriculum_semantics

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
    "nzqaProvider": {"hold", "validated"},
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


def require_not_future_release(evidence: dict, expected_release: str, label: str) -> None:
    release = require_nonempty(evidence.get("release"), f"{label} release is missing")
    if release > expected_release:
        fail(f"{label} cannot target future release {release}")


def candidate_identity(candidate: dict) -> dict:
    return {
        "release": candidate.get("release"),
        "sourceSha": candidate.get("sourceSha"),
        "runtimeFingerprint": candidate.get("runtimeFingerprint"),
    }


def validate_web_candidate(data: dict, expected_release: str) -> dict:
    candidate = data.get("webCandidate")
    if not isinstance(candidate, dict):
        fail("canonical webCandidate binding is missing")
    if candidate.get("release") != expected_release:
        fail("canonical webCandidate release is stale")
    source_sha = require_sha(candidate.get("sourceSha"), "canonical webCandidate sourceSha")
    require_fingerprint(candidate.get("runtimeFingerprint"), "canonical webCandidate runtimeFingerprint")
    require_fingerprint(candidate.get("artifactDigest"), "canonical webCandidate artifactDigest")
    run_id = candidate.get("candidateRunId")
    if not isinstance(run_id, int) or run_id <= 0:
        fail("canonical webCandidate candidateRunId must be a positive integer")
    artifact_id = candidate.get("artifactId")
    if not isinstance(artifact_id, int) or artifact_id <= 0:
        fail("canonical webCandidate artifactId must be a positive integer")
    if candidate.get("candidateWorkflow") != "Pre-merge Public Candidate":
        fail("canonical webCandidate must come from Pre-merge Public Candidate")
    expected_name = f"physical-pwa-candidate-{source_sha}"
    if candidate.get("artifactName") != expected_name:
        fail(f"canonical webCandidate artifactName must be {expected_name}")
    artifact_expires_at = require_nonempty(candidate.get("artifactExpiresAt"), "canonical webCandidate artifactExpiresAt is missing")
    try:
        artifact_expiry = dt.datetime.fromisoformat(artifact_expires_at.replace("Z", "+00:00"))
    except ValueError:
        fail("canonical webCandidate artifactExpiresAt must be an ISO-8601 instant")
    if artifact_expiry.tzinfo is None:
        fail("canonical webCandidate artifactExpiresAt must include a timezone")
    # Wall-clock liveness is intentionally enforced by
    # tools/verify_external_validation_live_bindings.py in the promotion gate.
    # Keeping this repository-only validator time-independent leaves a repair path
    # available to re-retain/rebind an expired artifact on preview.
    artifact_expiry.astimezone(dt.timezone.utc)

    policy = data.get("candidatePolicy")
    if not isinstance(policy, dict):
        fail("candidatePolicy is missing")
    if policy.get("previewBranchAuthoritative") is not False:
        fail("mutable preview branch must never be authoritative external-evidence identity")
    if policy.get("evidenceAuthority") != "retained-exact-head-artifact":
        fail("candidatePolicy.evidenceAuthority must be retained-exact-head-artifact")
    require_nonempty(policy.get("rule"), "candidatePolicy.rule is missing")
    return candidate


def validate_accessibility(section: dict, expected_release: str, web_candidate: dict) -> None:
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
    if candidate != candidate_identity(web_candidate):
        fail("accessibility candidate does not match canonical webCandidate")
    if candidate.get("sourceSha") != source_sha or candidate.get("runtimeFingerprint") != fingerprint:
        fail("accessibility candidate does not match the governed real-AT contract")

    if section["status"] == "hold":
        if evidence.get("status") == "validated":
            fail("accessibility is marked hold although its evidence contract says validated; reconcile explicitly")
        return
    if evidence.get("status") != "validated":
        fail("accessibility cannot be validated until the real-AT contract status is validated")
    task_ids = evidence.get("requiredTaskIds")
    task_labels = evidence.get("requiredTasks")
    if not isinstance(task_ids, list) or len(task_ids) != 12 or len(set(task_ids)) != 12:
        fail("validated real-AT evidence requires exactly 12 unique requiredTaskIds")
    if not isinstance(task_labels, list) or len(task_labels) != 12 or len(set(task_labels)) != 12:
        fail("validated real-AT evidence requires exactly 12 unique requiredTasks")
    matrix = evidence.get("requiredMatrix")
    if not isinstance(matrix, list) or not matrix:
        fail("validated real-AT evidence requires a non-empty requiredMatrix")
    for row in matrix:
        if not isinstance(row, dict) or row.get("status") not in {"pass", "validated"}:
            fail("validated real-AT evidence requires every matrix row to pass")
        for key in ("testedAt", "reviewer", "evidenceRef"):
            require_nonempty(row.get(key), f"validated real-AT row is missing {key}")
        task_evidence = row.get("taskEvidence")
        if not isinstance(task_evidence, dict) or set(task_evidence) != set(task_ids):
            fail("validated real-AT row must contain exact taskEvidence for all 12 required tasks")
        for task_id in task_ids:
            record = task_evidence.get(task_id)
            if not isinstance(record, dict) or record.get("status") != "pass":
                fail(f"validated real-AT task did not pass: {task_id}")
            require_nonempty(record.get("evidenceRef"), f"validated real-AT task is missing evidenceRef: {task_id}")


def validate_pwa(section: dict, expected_release: str, web_candidate: dict) -> None:
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
    if candidate != web_candidate:
        fail("PWA currentCandidate must exactly match canonical webCandidate")
    source_sha = require_sha(candidate.get("sourceSha"), "PWA candidate sourceSha")
    require_fingerprint(candidate.get("runtimeFingerprint"), "PWA candidate runtimeFingerprint")
    require_fingerprint(candidate.get("artifactDigest"), "PWA candidate artifactDigest")
    candidate_run_id = candidate.get("candidateRunId", candidate.get("pagesRunId"))
    if not isinstance(candidate_run_id, int) or candidate_run_id <= 0:
        fail("PWA candidate build run id must be a positive integer")
    artifact_id = candidate.get("artifactId")
    if not isinstance(artifact_id, int) or artifact_id <= 0:
        fail("PWA candidate artifactId must be a positive integer")
    expected_name = f"physical-pwa-candidate-{source_sha}"
    if candidate.get("artifactName") != expected_name:
        fail(f"PWA candidate artifactName must be {expected_name}")
    require_nonempty(candidate.get("artifactExpiresAt"), "PWA candidate artifactExpiresAt is missing")

    evidence = load_json(ROOT / section["evidenceContract"])
    require_current_release(evidence, expected_release, "PWA physical-device")
    if evidence.get("candidate") != web_candidate:
        fail("PWA physical-device contract candidate must exactly match canonical webCandidate")
    if section["status"] == "hold":
        if evidence.get("status") == "validated":
            fail("PWA physical-device ledger is HOLD although its evidence contract says validated")
        if evidence.get("runtimeFingerprint") is not None:
            fail("PWA HOLD must not record a validated runtimeFingerprint before genuine device evidence")
        return
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
    binding = load_json(ROOT / "data" / "book-sme-release-binding-v1.json")
    worked = load_json(ROOT / "data" / "book-worked-engineering-cases-v1.json")
    enrichment = load_json(ROOT / "data" / "book-evidence-enrichment-v2.json")
    diagrams = load_json(ROOT / "data" / "book-engineering-diagrams-v1.json")

    content_release = binding.get("contentRelease")
    if evidence.get("release") != content_release:
        fail("Book SME content release must equal book-sme-release-binding.contentRelease")
    if binding.get("boundWebRelease") != expected_release:
        fail("Book SME release binding must target the current learner web release")
    if binding.get("status") not in {"hold", "validated"}:
        fail("Book SME release binding status is invalid")

    chapter_ids = evidence.get("chapterIds")
    reviews = evidence.get("reviews")
    required_dimensions = set(evidence.get("requiredDimensions") or [])
    if not isinstance(chapter_ids, list) or len(chapter_ids) != 46 or len(set(chapter_ids)) != 46:
        fail("Book SME contract must contain exactly 46 unique governed chapter ids")
    if not isinstance(reviews, list):
        fail("Book SME reviews must be a list")

    governed_worked = evidence.get("workedCaseIds")
    actual_worked = [row.get("id") for row in worked.get("cases", []) if isinstance(row, dict)]
    if governed_worked != actual_worked or len(actual_worked) != 18:
        fail("Book SME workedCaseIds must exactly match all 18 governed worked engineering cases")
    governed_enrichment = evidence.get("enrichmentChapterIds")
    actual_enrichment = [row.get("chapterId") for row in enrichment.get("chapterPatches", []) if isinstance(row, dict)]
    if governed_enrichment != actual_enrichment:
        fail("Book SME enrichmentChapterIds must exactly match current governed enrichment chapters")
    governed_diagrams = evidence.get("diagramIds")
    actual_diagrams = [row.get("id") for row in diagrams.get("diagrams", []) if isinstance(row, dict)]
    if governed_diagrams != actual_diagrams:
        fail("Book SME diagramIds must exactly match current governed instructional diagrams")

    if section["status"] == "hold":
        if evidence.get("status") == "validated":
            fail("Book SME is marked hold although its evidence contract says validated; reconcile explicitly")
        return

    if evidence.get("status") != "validated":
        fail("Book SME cannot be validated until the human-review contract status is validated")
    if binding.get("status") != "validated":
        fail("Book SME cannot be promoted until the content-release to web-release binding is validated")
    if len(required_dimensions) != 6:
        fail("validated Book SME evidence requires all six governed review dimensions")
    if len(reviews) != 46:
        fail("validated Book SME evidence requires one review record for every governed chapter")

    by_id = {row.get("chapterId"): row for row in reviews if isinstance(row, dict)}
    if set(by_id) != set(chapter_ids):
        fail("validated Book SME reviews must exactly cover the 46 governed chapters")

    worked_by_chapter = {}
    for row in worked.get("cases", []):
        worked_by_chapter.setdefault(row.get("chapterId"), []).append(row.get("id"))
    diagram_by_chapter = {}
    for row in diagrams.get("diagrams", []):
        diagram_by_chapter.setdefault(row.get("chapterId"), []).append(row.get("id"))
    enrichment_chapters = set(actual_enrichment)

    for chapter_id, row in by_id.items():
        for key in ("reviewedAt", "reviewerReference", "evidenceRef"):
            require_nonempty(row.get(key), f"validated Book SME review {chapter_id} is missing {key}")
        if row.get("conclusion") != "approved":
            fail(f"validated Book SME review is not approved: {chapter_id}")
        dimensions = row.get("dimensions") or {}
        if set(dimensions) != required_dimensions or any(value != "pass" for value in dimensions.values()):
            fail(f"validated Book SME dimensions do not all pass: {chapter_id}")

        expected_worked = worked_by_chapter.get(chapter_id, [])
        if row.get("workedCaseIdsReviewed", []) != expected_worked:
            fail(f"validated Book SME review does not prove exact worked-case coverage: {chapter_id}")
        expected_diagrams = diagram_by_chapter.get(chapter_id, [])
        if row.get("diagramIdsReviewed", []) != expected_diagrams:
            fail(f"validated Book SME review does not prove exact diagram coverage: {chapter_id}")
        expected_enrichment = chapter_id in enrichment_chapters
        if row.get("enrichmentReviewed") is not expected_enrichment:
            fail(f"validated Book SME review does not prove enrichment coverage: {chapter_id}")


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
    try:
        semantic = validate_curriculum_semantics(evidence, canonical_curriculum_lessons())
    except AssertionError as exc:
        fail(f"curriculum SME semantic-review contract failed: {exc}")
    complete = semantic.get("status") == "HUMAN_SME_SEMANTIC_REVIEW_COMPLETE"
    if section["status"] == "hold":
        if complete:
            fail("curriculum SME release ledger is HOLD although all seven human-reviewed dimensions are complete for all 120 current lesson fingerprints")
        return
    if not complete:
        fail(
            "curriculum SME cannot be validated until all 120 current lesson fingerprints have explicit approved human reviews "
            "for all seven governed semantic dimensions"
        )


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


def validate_nzqa(section: dict, expected_release: str, web_candidate: dict) -> None:
    packet = require_release_packet(
        section.get("reviewPacket"),
        expected_release,
        f"qa/NZQA_EXTERNAL_VALIDATION_{expected_release}.md",
        "NZQA provider validation",
    )
    contract = load_json(ROOT / section["evidenceContract"])
    require_current_release(contract, expected_release, "NZQA provider validation")
    if contract.get("packet") != packet:
        fail("NZQA external-validation contract packet does not match the release ledger")
    readiness_path = require_repo_file(contract.get("readinessContract"), "NZQA readiness contract is missing")
    templates_path = require_repo_file(contract.get("providerTemplatesContract"), "NZQA provider evidence-template contract is missing")
    readiness = load_json(ROOT / readiness_path)
    templates = load_json(ROOT / templates_path)
    if readiness.get("id") != "mouldmaster-nzqa-education-readiness":
        fail("NZQA readiness contract identity is invalid")
    readiness_release = require_nonempty(readiness.get("releaseTarget"), "NZQA readiness releaseTarget is missing")
    if readiness_release > expected_release:
        fail(f"NZQA readiness contract cannot target future release {readiness_release}")
    if templates.get("id") != "mouldmaster-nzqa-provider-evidence-templates":
        fail("NZQA provider evidence-template contract identity is invalid")
    candidate = contract.get("candidate")
    if not isinstance(candidate, dict):
        fail("NZQA external-validation candidate binding is missing")
    if candidate != candidate_identity(web_candidate):
        fail("NZQA contract candidate does not match canonical webCandidate")
    ledger_candidate = section.get("candidate")
    if ledger_candidate != candidate_identity(web_candidate):
        fail("NZQA release ledger candidate does not match canonical webCandidate")
    if candidate != ledger_candidate:
        fail("NZQA release ledger and external-validation contract candidate bindings disagree")
    require_sha(candidate.get("sourceSha"), "NZQA candidate sourceSha")
    require_fingerprint(candidate.get("runtimeFingerprint"), "NZQA candidate runtimeFingerprint")
    gates = contract.get("requiredGates")
    expected_ids = {
        "G1-provider", "G2-need", "G3-design", "G4-assessment",
        "G5-consent", "G6-national-moderation", "G7-workplace", "G8-review",
    }
    if not isinstance(gates, list) or len(gates) != len(expected_ids):
        fail("NZQA external-validation contract must contain all eight governed provider gates")
    by_id = {row.get("id"): row for row in gates if isinstance(row, dict)}
    if set(by_id) != expected_ids:
        fail("NZQA external-validation gate identity set is incomplete or duplicated")

    if section["status"] == "hold":
        if contract.get("status") == "validated":
            fail("NZQA provider validation is marked hold although its evidence contract says validated")
        if contract.get("evidence") is not None:
            fail("NZQA provider HOLD must not contain synthetic completion evidence")
        for gate_id, row in by_id.items():
            if row.get("status") in {"pass", "validated"} or row.get("evidenceRef"):
                fail(f"NZQA provider HOLD contains premature completion evidence: {gate_id}")
        return

    if contract.get("status") != "validated":
        fail("NZQA provider validation cannot be promoted until its external contract is validated")
    if readiness_release != expected_release:
        fail("validated NZQA/provider status requires the readiness contract to be rebound to the current release")
    evidence = contract.get("evidence")
    if not isinstance(evidence, dict):
        fail("validated NZQA provider status requires a release-bound evidence object")
    require_current_release(evidence, expected_release, "NZQA provider evidence")
    for gate_id, row in by_id.items():
        if row.get("status") not in {"pass", "validated"}:
            fail(f"validated NZQA provider evidence requires gate completion: {gate_id}")
        require_nonempty(row.get("evidenceRef"), f"validated NZQA gate {gate_id} is missing evidenceRef")


def main() -> None:
    expected_release = load_current_release()
    data = load_json(CONTRACT)
    if data.get("schemaVersion") != 1:
        fail("schemaVersion must be 1")
    contract_release = require_nonempty(data.get("release"), "external-validation contract release is missing")
    if contract_release != expected_release:
        fail(f"external-validation contract must be rebound to current release {expected_release}; got {contract_release}")
    require_release_packet(
        data.get("validationIndex"),
        contract_release,
        f"qa/EXTERNAL_VALIDATION_{contract_release}.md",
        "external-validation index",
    )
    if (data.get("technicalAutomation") or {}).get("status") != "pass":
        fail("technicalAutomation.status must be pass for this audited release record")

    web_candidate = validate_web_candidate(data, contract_release)

    for name, allowed in ALLOWED_SECTION_STATUS.items():
        section = data.get(name)
        if not isinstance(section, dict):
            fail(f"{name} section is missing")
        if section.get("status") not in allowed:
            fail(f"{name}.status must be one of {sorted(allowed)}")

    governance = data["governance"]
    policy_ref = require_repo_file(
        governance.get("policyFile"),
        "governance.policyFile must reference the canonical main governance policy",
    )
    if policy_ref != "data/main-governance-policy-v1.json":
        fail("governance.policyFile must be data/main-governance-policy-v1.json")
    policy = load_json(ROOT / policy_ref)
    if policy.get("schemaVersion") != 1:
        fail("canonical main governance policy schemaVersion must be 1")
    pr_policy = policy.get("pullRequest") or {}
    if pr_policy.get("minimumApprovals", 0) < 1:
        fail("canonical governance policy requires at least one independent approval")
    if pr_policy.get("independentReviewerRequired") is not True:
        fail("canonical governance policy must require an independent reviewer")
    for key in ("latestHeadApproval", "reviewThreadResolution", "dismissStaleReviews", "extraApprovalForUnattributedChanges"):
        if pr_policy.get(key) is not True:
            fail(f"canonical governance pullRequest.{key} must be true")
    if policy.get("bypassActors") != []:
        fail("canonical governance policy must prohibit bypass actors")
    if governance.get("status") == "enforced":
        require_nonempty(governance.get("liveRulesetVerifiedAt"), "enforced governance requires liveRulesetVerifiedAt")
        if not isinstance(governance.get("liveRulesetId"), int) or governance.get("liveRulesetId") <= 0:
            fail("enforced governance requires a positive liveRulesetId")
    else:
        require_nonempty(governance.get("required"), "pending native governance must have an explicit exit condition")

    validate_accessibility(data["accessibility"], contract_release, web_candidate)
    validate_pwa(data["pwaPhysicalDevices"], contract_release, web_candidate)
    validate_windows(data["windowsDistribution"], contract_release)
    validate_book_sme(data["bookSme"], contract_release)
    validate_curriculum(data["curriculumSme"], contract_release)
    validate_learner(data["learnerOutcomes"], contract_release)
    validate_nzqa(data["nzqaProvider"], contract_release, web_candidate)

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
        name for name in ("accessibility", "pwaPhysicalDevices", "windowsDistribution", "bookSme", "curriculumSme", "learnerOutcomes", "nzqaProvider")
        if data[name]["status"] == "hold"
    ]
    print(
        f"Current release {expected_release}; external-evidence release {contract_release} boundary verified. "
        f"Automated contract state is PASS; evidence packets remain bound to their exact release; explicit HOLD areas: "
        f"{', '.join(holds) if holds else 'none'}; production authority remains advisory-only."
    )


if __name__ == "__main__":
    main()