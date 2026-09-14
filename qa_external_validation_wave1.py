#!/usr/bin/env python3
"""Static integrity checks for External Validation Wave 1.

The gate verifies readiness contracts and prevents automation from manufacturing
physical, human, signing or real-learner completion evidence.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def load(path: str) -> dict:
    value = json.loads((ROOT / path).read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise SystemExit(f"EXTERNAL WAVE QA FAILED: {path} must contain an object")
    return value


def require(ok: bool, message: str) -> None:
    if not ok:
        raise SystemExit(f"EXTERNAL WAVE QA FAILED: {message}")


version = load("version.json")
release = version["web_release"]
wave = load("data/external-validation-wave1-v1.json")
external = load("data/release-external-validation-v1.json")
manifest = load("data/book-manifest-v1.json")
auth = load("data/book-publication-authorization-v1.json")
book_sme = load("data/book-sme-review-v1.json")
pilot = load("data/learner-pilot-v1.json")

require(wave.get("schemaVersion") == 1, "Wave schemaVersion must be 1")
require(wave.get("release") == release == external.get("release"), "Wave/external release must match version.json")
require(re.fullmatch(r"[0-9a-f]{40}", str(wave.get("releaseSourceSha") or "")) is not None, "Wave releaseSourceSha must be a full commit SHA")

live = wave.get("livePages") or {}
live_status = live.get("status")
require(live_status in {"pending-main-deployment", "partial-pass", "pass"}, "livePages status is invalid")
require(live.get("productionRootState") in {"release-hold", "production"}, "productionRootState is invalid")
require(live.get("bookVerifier") == "tools/verify_book_pages_candidate.py", "live Book verifier path mismatch")
require((ROOT / live["bookVerifier"]).is_file(), "live Book verifier is missing")
if live_status == "pending-main-deployment":
    require(live.get("pagesRun") is None, "pending current release must not reuse a prior Pages run")
    require(live.get("pagesRunConclusion") is None, "pending current release must not claim a Pages conclusion")
    require(live.get("bookVerifierStatus") == "pending-main-deployment", "pending current release must keep Book verifier pending")
    prior_live = live.get("priorReleaseEvidence") or {}
    require(isinstance(prior_live, dict) and prior_live.get("release") != release, "pending release must identify prior Pages evidence only as historical provenance")
    require(isinstance(prior_live.get("pagesRun"), int) and prior_live["pagesRun"] > 0, "historical Pages provenance must identify its prior run")
    require(prior_live.get("pagesRunConclusion") == "success", "historical Pages provenance must describe a successful prior run")
    require(re.fullmatch(r"[0-9a-f]{40}", str(prior_live.get("sourceSha") or "")) is not None, "historical Pages provenance source SHA is invalid")
else:
    require(isinstance(live.get("pagesRun"), int) and live["pagesRun"] > 0, "livePages must identify its successful Pages run")
    require(live.get("pagesRunConclusion") == "success", "recorded Pages run must be successful")
    require(live.get("bookVerifierStatus") in {"pending-main-deployment", "pass"}, "live Book verifier status is invalid")

pages_workflow = (ROOT / ".github/workflows/book-live-pages-validation.yml").read_text(encoding="utf-8")
for marker in (
    "MouldMaster Pages Release Readiness",
    "github.event.workflow_run.head_sha",
    "data-mm-release-hold",
    "preview/",
    "tools/verify_book_pages_candidate.py",
    "--expected-release",
):
    require(marker in pages_workflow, f"live Pages Book workflow missing marker: {marker}")

for section in ("pwaPhysicalDevices", "windowsDistribution", "curriculumSme", "learnerOutcomes"):
    require((external.get(section) or {}).get("status") == "hold", f"{section} must remain hold in Wave 1 preparation")
require((external.get("windowsDistribution") or {}).get("evidence") is None, "Windows HOLD must not contain completion evidence")
require((external.get("learnerOutcomes") or {}).get("evidence") is None, "learner outcomes HOLD must not contain completion evidence")

for section in ("physicalPwa", "windowsDistribution", "bookSme", "curriculumSme"):
    require((wave.get(section) or {}).get("status") == "hold", f"Wave {section} must remain hold")
require((wave.get("learnerPilot") or {}).get("status") == "prepared-evidence-hold", "learner pilot must be prepared but evidence-held")

physical = wave.get("physicalPwa") or {}
candidate = physical.get("currentCandidate")
if candidate is None:
    require(live_status == "pending-main-deployment", "current physical candidate may be absent only before current-release Pages verification")
    require(physical.get("releasePacket") is None, "pending current release must not point at a prior release-specific physical packet")
    prior = physical.get("priorCandidate") or {}
    require(isinstance(prior, dict) and prior.get("release") != release, "prior physical candidate must remain explicitly bound to an older release")
    require(re.fullmatch(r"[0-9a-f]{40}", str(prior.get("sourceSha") or "")) is not None, "prior physical candidate source SHA is invalid")
    require(prior.get("sourceSha") != wave.get("releaseSourceSha"), "prior physical candidate must not be relabelled as the current release source")
    require(re.fullmatch(r"sha256:[0-9a-f]{64}", str(prior.get("runtimeFingerprint") or "")) is not None, "prior physical candidate runtime fingerprint is invalid")
    require(prior.get("artifactName") == f"physical-pwa-candidate-{prior.get('sourceSha')}", "prior physical candidate artifact name must remain bound to its source SHA")
    require(isinstance(prior.get("artifactId"), int) and prior["artifactId"] > 0, "prior physical candidate artifact ID is missing")
    require(re.fullmatch(r"[0-9a-f]{64}", str(prior.get("artifactZipSha256") or "")) is not None, "prior physical candidate ZIP SHA-256 is invalid")
    require(isinstance(prior.get("artifactBytes"), int) and prior["artifactBytes"] > 0, "prior physical candidate artifact size is invalid")
    require(prior.get("retentionDays") == 30, "prior physical candidate must preserve its governed 30-day handoff record")
    prior_packet = str(prior.get("releasePacket") or "").strip()
    require(prior_packet != "" and (ROOT / prior_packet).is_file(), "prior release-specific physical PWA packet is missing")
else:
    release_packet = str(physical.get("releasePacket") or "").strip()
    require(release_packet != "" and (ROOT / release_packet).is_file(), "current release-specific physical PWA packet is missing")
    require(candidate.get("sourceSha") == wave.get("releaseSourceSha"), "physical candidate source SHA must match Wave release source")
    require(candidate.get("pagesRun") == live.get("pagesRun"), "physical candidate Pages run must match live Pages evidence")
    require(re.fullmatch(r"sha256:[0-9a-f]{64}", str(candidate.get("runtimeFingerprint") or "")) is not None, "physical candidate runtime fingerprint is invalid")
    require(candidate.get("artifactName") == f"physical-pwa-candidate-{candidate.get('sourceSha')}", "physical candidate artifact name must bind to source SHA")
    require(isinstance(candidate.get("artifactId"), int) and candidate["artifactId"] > 0, "physical candidate artifact ID is missing")
    require(re.fullmatch(r"[0-9a-f]{64}", str(candidate.get("artifactZipSha256") or "")) is not None, "physical candidate ZIP SHA-256 is invalid")
    require(isinstance(candidate.get("artifactBytes"), int) and candidate["artifactBytes"] > 0, "physical candidate artifact size is invalid")
    require(candidate.get("retentionDays") == 30, "physical candidate must retain the governed 30-day handoff window")
    old_fingerprint = str((load("data/pwa-physical-device-validation-v1.json")).get("runtimeFingerprint") or "")
    require(old_fingerprint != candidate.get("runtimeFingerprint"), "Wave must not relabel prior device evidence as the current candidate")

manifest_ids = [ch["id"] for part in manifest["parts"] for ch in part["chapters"]]
require(len(manifest_ids) == 46 and len(set(manifest_ids)) == 46, "Book manifest must contain 46 unique chapter ids")
require(book_sme.get("release") == release, "Book SME contract must be release-bound")
require(book_sme.get("manifestVersion") == manifest.get("version"), "Book SME manifest version mismatch")
require(set(book_sme.get("chapterIds") or []) == set(manifest_ids), "Book SME contract must cover exactly all 46 manifest chapters")
require(set(auth.get("authorizedChapterIds") or []) == set(manifest_ids), "Book publication authorization must cover the same 46 chapters")
required_dimensions = set(book_sme.get("requiredDimensions") or [])
require(len(required_dimensions) == 6, "Book SME contract must define six review dimensions")
reviews = book_sme.get("reviews")
require(isinstance(reviews, list), "Book SME reviews must be a list")
if book_sme.get("status") == "validated":
    require(len(reviews) == 46, "Validated Book SME evidence requires 46 review records")
    by_id = {row.get("chapterId"): row for row in reviews if isinstance(row, dict)}
    require(set(by_id) == set(manifest_ids), "Validated Book SME reviews must exactly cover all chapters")
    for chapter_id, row in by_id.items():
        require(str(row.get("reviewedAt") or "").strip() != "", f"SME review missing reviewedAt: {chapter_id}")
        require(str(row.get("reviewerReference") or "").strip() != "", f"SME review missing reviewerReference: {chapter_id}")
        require(row.get("conclusion") == "approved", f"SME review is not approved: {chapter_id}")
        dimensions = row.get("dimensions") or {}
        require(set(dimensions) == required_dimensions and all(value == "pass" for value in dimensions.values()), f"SME dimensions do not all pass: {chapter_id}")
else:
    require(book_sme.get("status") == "hold", "Book SME status must be hold or validated")

require(pilot.get("schemaVersion") == 1 and pilot.get("release") == release, "learner pilot identity/release mismatch")
require(pilot.get("status") == "prepared", "learner pilot must remain prepared before execution")
require(pilot.get("synthetic") is False, "learner pilot must explicitly require real, non-synthetic participants")
require(pilot.get("evidence") is None, "prepared learner pilot must not contain synthetic completion evidence")
require("7-14" in str((pilot.get("design") or {}).get("delayed") or ""), "learner pilot must include delayed transfer")
require("8-15" in str((pilot.get("cohort") or {}).get("targetCompletedParticipants") or ""), "learner pilot exploratory cohort target is missing")

store_workflow = (ROOT / ".github/workflows/microsoft-store-msix.yml").read_text(encoding="utf-8")
for marker in (
    "MM_STORE_IDENTITY_NAME",
    "MM_STORE_PUBLISHER",
    "MM_STORE_PUBLISHER_DISPLAY_NAME",
    "--verify-toolchain",
    "createMsixupload=true",
    "enforcePackageIntegrity=true",
    "SHA256SUMS-STORE.txt",
    "SOURCE_COMMIT.txt",
):
    require(marker in store_workflow, f"Windows Store workflow missing readiness marker: {marker}")
require((ROOT / "certification/WINDOWS_SIGNING_READINESS_2026.09.14.md").is_file(), "Windows signing readiness packet is missing")
require((ROOT / "qa/BOOK_SME_REVIEW_2026.09.14.md").is_file(), "Book SME execution packet is missing")
require((ROOT / "qa/LEARNER_PILOT_2026.09.14.md").is_file(), "learner pilot execution packet is missing")
require((ROOT / "qa/EXTERNAL_VALIDATION_WAVE1_2026.09.14.md").is_file(), "Wave 1 execution index is missing")

claims = wave.get("claims") or {}
for key in (
    "fullyExternallyValidated",
    "physicalDeviceValidatedForCurrentRelease",
    "windowsDistributionValidated",
    "bookSmeValidated",
    "curriculumSmeValidated",
    "learnerEfficacyEstablished",
):
    require(claims.get(key) is False, f"unsupported Wave 1 claim must remain false: {key}")

require((wave.get("productImprovement") or {}).get("status") == "armed", "evidence-to-product improvement loop must be armed")
print(
    f"External Validation Wave 1 integrity passed for {release}: current Pages/physical evidence is "
    f"{'pending and explicitly held' if live_status == 'pending-main-deployment' else 'release-bound'}; "
    "physical PWA, Windows distribution, Book/curriculum SME and real-learner evidence remain fail-closed HOLDs."
)
