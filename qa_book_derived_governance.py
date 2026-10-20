#!/usr/bin/env python3
"""Recompute Book governance counts from claim records and ordered overlays.

The individual claim records are authoritative. Historical ledger summaries may
remain immutable for audit traceability, but every current release-governance
count must be reproducible from those records rather than trusted as a second
hand-maintained source of truth.
"""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent

REVIEW_PATHS = [
    "data/book-claim-review-high-risk-v1.json",
    "data/book-claim-review-process-tooling-v1.json",
    "data/book-claim-review-foundations-materials-machine-v1.json",
    "data/book-claim-review-troubleshooting-v1.json",
    "data/book-claim-review-engineering-advanced-v1.json",
]
RESOLUTION_PATHS = [
    "data/book-claim-resolution-high-risk-v1.json",
    "data/book-claim-resolution-high-risk-v2.json",
    "data/book-claim-resolution-all-v1.json",
    "data/book-qualification-resolution-all-v1.json",
]
ALLOWED = {"supported", "qualified", "hold", "conflicting"}


def load(rel: str) -> dict:
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def normalized_counts(claims: list[dict]) -> dict[str, int]:
    counts = Counter(claim["conclusion"] for claim in claims)
    return {
        "claims": len(claims),
        "supported": counts["supported"],
        "qualified": counts["qualified"],
        "hold": counts["hold"],
        "conflicting": counts["conflicting"],
    }


def effective_counts(effective: dict[str, str], chapters: int) -> dict[str, int]:
    counts = Counter(effective.values())
    return {
        "chapters": chapters,
        "claims": len(effective),
        "supported": counts["supported"],
        "qualified": counts["qualified"],
        "hold": counts["hold"],
        "conflicting": counts["conflicting"],
    }


def main() -> int:
    manifest = load("data/book-manifest-v1.json")
    audit = load("data/book-verification-audit-all-v1.json")
    authorization = load("data/book-publication-authorization-v1.json")
    reviews = {Path(path).name: load(path) for path in REVIEW_PATHS}
    overlays = [load(path) for path in RESOLUTION_PATHS]

    manifest_chapters = [
        chapter
        for part in manifest.get("parts", [])
        for chapter in part.get("chapters", [])
    ]
    manifest_ids = [chapter["id"] for chapter in manifest_chapters]
    assert len(manifest_ids) == len(set(manifest_ids)), "manifest chapter IDs must be unique"

    base_claims: dict[str, dict] = {}
    reviewed_chapters: list[str] = []
    for filename, review in reviews.items():
        assert review.get("chapterPromotionAuthorized") is False, f"{filename} unexpectedly authorizes promotion"
        claims_in_review: list[dict] = []
        for chapter in review.get("chapters", []):
            reviewed_chapters.append(chapter["chapterId"])
            for claim in chapter.get("claims", []):
                cid = claim.get("claimId")
                assert cid and cid not in base_claims, f"duplicate or missing claim ID: {cid}"
                assert claim.get("conclusion") in ALLOWED, f"invalid base conclusion for {cid}"
                base_claims[cid] = claim
                claims_in_review.append(claim)

        # Current ledgers should self-reconcile. Two immutable historical ledgers
        # are allowed to differ only when a governed audit correction records both
        # the old stored summary and the recount from individual claim records.
        summary = review.get("summary", {})
        assert summary.get("chaptersReviewed") == len(review.get("chapters", [])), f"{filename} chapter summary drift"
        assert summary.get("claimsReviewed") == len(claims_in_review), f"{filename} claim summary drift"

    assert len(reviewed_chapters) == len(set(reviewed_chapters)), "chapter reviewed more than once across base ledgers"
    assert set(reviewed_chapters) == set(manifest_ids), "base claim ledgers must cover the manifest exactly"

    all_resolution = overlays[2]
    corrections = {item["ledger"]: item for item in all_resolution.get("auditCorrections", [])}
    assert len(corrections) == 2, "historical summary exceptions must remain explicit and minimal"

    for filename, review in reviews.items():
        claims_in_review = [claim for chapter in review.get("chapters", []) for claim in chapter.get("claims", [])]
        derived = normalized_counts(claims_in_review)
        stored = review.get("summary", {})
        stored_normalized = {
            "claims": stored.get("claimsReviewed"),
            "supported": stored.get("supported"),
            "qualified": stored.get("qualified"),
            "hold": stored.get("hold"),
            "conflicting": stored.get("conflicting"),
        }
        correction = corrections.get(filename)
        if correction is None:
            assert stored_normalized == derived, f"{filename} summary drifted from individual claim records"
        else:
            assert correction.get("storedSummary") == stored_normalized, f"{filename} correction no longer matches immutable stored summary"
            assert correction.get("recountFromClaimRecords") == derived, f"{filename} correction no longer matches claim-record recount"
            assert correction.get("storedSummary") != derived, f"{filename} correction no longer documents a real historical mismatch"

    effective = {cid: claim["conclusion"] for cid, claim in base_claims.items()}
    counts_after_each_overlay: list[dict[str, int]] = []
    for path, overlay in zip(RESOLUTION_PATHS, overlays):
        assert overlay.get("chapterPromotionAuthorized") is False, f"{path} unexpectedly authorizes promotion"
        seen: set[str] = set()
        for resolution in overlay.get("resolutions", []):
            cid = resolution.get("claimId")
            assert cid in effective, f"{path} targets unknown claim {cid}"
            assert cid not in seen, f"{path} resolves {cid} more than once"
            seen.add(cid)
            assert resolution.get("previous") == effective[cid], (
                f"{path} previous-state drift for {cid}: "
                f"expected {effective[cid]}, got {resolution.get('previous')}"
            )
            new_state = resolution.get("newConclusion")
            assert new_state in ALLOWED, f"{path} has invalid conclusion for {cid}"
            effective[cid] = new_state
        counts_after_each_overlay.append(effective_counts(effective, len(manifest_ids)))

    after_all_resolution = counts_after_each_overlay[2]
    assert all_resolution.get("effectiveCountsAfterAllResolutions") == after_all_resolution, (
        "book-claim-resolution-all-v1.json derived count drift"
    )

    qualification = overlays[3]
    final_counts = counts_after_each_overlay[3]
    assert qualification.get("effectiveCountsAfterQualificationReview") == final_counts, (
        "book-qualification-resolution-all-v1.json derived count drift"
    )

    remaining_qualified = qualification.get("remainingQualifiedClaims", [])
    qualified_ids = {cid for cid, state in effective.items() if state == "qualified"}
    remaining_ids = {item.get("claimId") for item in remaining_qualified}
    assert None not in remaining_ids and len(remaining_ids) == len(remaining_qualified), "remaining qualified claim IDs must be unique"
    assert remaining_ids == qualified_ids, "remaining-qualified inventory drifted from effective claim states"
    blocking_qualified = sum(item.get("blockingPublication") is True for item in remaining_qualified)

    readiness = qualification.get("publicationReadinessEffect", {})
    assert readiness.get("claimEvidenceGapsRemaining") == final_counts["hold"]
    assert readiness.get("claimConflictsRemaining") == final_counts["conflicting"]
    assert readiness.get("scopeQualifiedClaimsRemaining") == final_counts["qualified"]
    assert readiness.get("scopeQualifiedClaimsBlockingPublication") == blocking_qualified

    audit_scope = audit.get("scope", {})
    assert audit_scope.get("parts") == len(manifest.get("parts", []))
    assert audit_scope.get("chapters") == final_counts["chapters"]
    assert audit_scope.get("claims") == final_counts["claims"]
    audit_disposition = audit.get("effectiveClaimDisposition", {})
    for key in ("supported", "qualified", "hold", "conflicting"):
        assert audit_disposition.get(key) == final_counts[key], f"Book audit {key} count drift"

    publication = audit.get("publicationDecision", {})
    assert publication.get("claimLevelEvidenceBlockersRemaining") == final_counts["hold"]
    assert publication.get("claimLevelConflictsRemaining") == final_counts["conflicting"]
    assert publication.get("scopeQualifiedClaimsRemaining") == final_counts["qualified"]
    assert publication.get("scopeQualifiedClaimsBlockingPublication") == blocking_qualified

    snapshot = authorization.get("governanceSnapshot", {})
    expected_snapshot_counts = {
        "parts": len(manifest.get("parts", [])),
        **final_counts,
        "scopeQualifiedClaimsBlockingPublication": blocking_qualified,
    }
    for key, expected in expected_snapshot_counts.items():
        assert snapshot.get(key) == expected, (
            f"publication authorization snapshot drift for {key}: "
            f"expected derived {expected}, got {snapshot.get(key)}"
        )

    assert set(authorization.get("authorizedChapterIds", [])) == set(manifest_ids), (
        "publication authorization chapter inventory drifted from manifest"
    )

    print(
        "PASS: Book governance counts are derived from individual claim records and ordered resolution overlays; "
        f"parts={expected_snapshot_counts['parts']}, chapters={final_counts['chapters']}, claims={final_counts['claims']}."
    )
    print(
        "PASS: effective claim dispositions reconcile across qualification, audit and publication authorization: "
        f"supported={final_counts['supported']}, qualified={final_counts['qualified']}, "
        f"hold={final_counts['hold']}, conflicting={final_counts['conflicting']}."
    )
    print(
        "PASS: the two immutable historical summary mismatches remain explicitly corrected from claim-record recounts; "
        "all current release-governance counts are reproducible."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
