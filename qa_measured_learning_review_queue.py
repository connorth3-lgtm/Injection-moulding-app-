#!/usr/bin/env python3
"""Fail-closed QA for the transient measured-learning independent-review queue."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROOF = ROOT / "measured-source-proof"
QUEUE = PROOF / "measured-learning-review-queue-v2.json"
MANIFEST = ROOT / "data/measured-learning/manifest-v1.json"
REQUIREMENTS = ROOT / "data/measured-learning/case-requirements-v2.json"
COVERAGE = PROOF / "measured-learning-authoring-coverage-v2.json"


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def catalogue() -> dict[str, dict]:
    manifest = load(MANIFEST)
    fields = manifest["fields"]
    rows = [dict(zip(fields, row)) for row in manifest["cases"]]
    return {row["id"]: row for row in rows}


def required(case_id: str) -> set[str]:
    return set(load(REQUIREMENTS).get("requiredSourceChannelsByCase", {}).get(case_id, []))


def main() -> int:
    queue = load(QUEUE)
    cases = catalogue()
    coverage = load(COVERAGE)
    assert coverage.get("status") == "authoring-coverage-qa-passed"
    assert coverage.get("directBindingShapeCatalogueCoverage") == 70
    direct = {
        item["candidateId"]: item
        for item in coverage.get("candidates", [])
        if item.get("directBindingShapeReady") is True
    }

    assert queue.get("schemaVersion") == 1
    assert queue.get("queueId") == "measured-learning-independent-review-v2"
    assert queue.get("status") == "independent-review-required"
    assert queue.get("promotionEligible") is False
    assert queue.get("releaseCaseCount") == 70
    entries = queue.get("cases", [])
    assert len(entries) == 70
    assert [entry["caseId"] for entry in entries] == [f"MLM-{i:03d}" for i in range(1, 71)]
    assert len({entry["caseId"] for entry in entries}) == 70
    assert queue.get("selectedCandidateCount") == len({entry["candidate"]["candidateId"] for entry in entries})
    assert queue.get("reviewChecklist") and len({item["id"] for item in queue["reviewChecklist"]}) == len(queue["reviewChecklist"])

    for entry in entries:
        case_id = entry["caseId"]
        case = cases[case_id]
        assert entry["title"] == case["title"]
        assert entry["difficulty"] == case["difficulty"]
        assert entry["analysisLens"] == case["analysisLens"]
        assert entry["coverageTags"] == case["coverageTags"]
        assert entry["sourceFamily"] == case["sourceFamily"]

        candidate = entry["candidate"]
        cid = candidate["candidateId"]
        assert cid in direct, f"{case_id}: queue selected candidate that is not direct-binding ready"
        assert case_id in direct[cid].get("suggestedCatalogueCases", []), f"{case_id}: selected candidate does not map to case"
        assert direct[cid].get("datasetId") == case["sourceFamily"], f"{case_id}: selected candidate source mismatch"
        assert candidate.get("candidateArtifactFile", "").endswith(".json")
        assert str(candidate.get("candidateFingerprint", "")).startswith("sha256:")
        artifacts = candidate.get("sourceArtifacts", [])
        assert artifacts and len({item["name"] for item in artifacts}) == len(artifacts)
        assert all(str(item.get("sha256", "")).startswith("sha256:") for item in artifacts)
        required_channels = required(case_id)
        assert set(candidate.get("requiredSourceChannels", [])) == required_channels
        summaries = candidate.get("signalSummaries", [])
        assert summaries
        bound = {signal["sourceChannel"] for signal in summaries}
        assert required_channels <= bound, f"{case_id}: queue signal summary misses required channels"
        if "multi-signal" in case.get("coverageTags", []):
            assert len(summaries) >= 2, f"{case_id}: multi-signal review entry has fewer than two signals"
        for signal in summaries:
            assert signal.get("semantic") and signal.get("unit") not in (None, "")
            assert signal.get("xSemantic") and signal.get("xUnit") not in (None, "")
            assert int(signal.get("displayedPointCount", 0)) > 1
            assert int(signal.get("originalPointCount", 0)) >= int(signal["displayedPointCount"])
            assert len(signal.get("xRange", [])) == 2 and len(signal.get("yRange", [])) == 2
            assert str(signal.get("representationFingerprint", "")).startswith("sha256:")
        assert candidate.get("evidenceBoundary"), f"{case_id}: evidence boundary missing"

        review = entry.get("review", {})
        assert review.get("state") == "unreviewed"
        for key in ("authorId", "reviewerId", "reviewerRole", "reviewRecord", "reviewedAt", "decision", "notes"):
            assert review.get(key) is None, f"{case_id}: review queue must not fabricate {key}"

    policy = queue.get("selectionPolicy", {})
    assert policy.get("onePinnedCandidatePerCase") is True
    assert policy.get("ambiguousCandidateSelectionMustBeExplicit") is True
    assert policy.get("selectionDoesNotApproveOrPromote") is True
    assert queue.get("boundary")
    print(json.dumps({
        "status": "review-queue-qa-passed",
        "caseCount": len(entries),
        "selectedCandidateCount": queue["selectedCandidateCount"],
        "reviewedCases": 0,
    }, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
