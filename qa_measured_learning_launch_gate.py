#!/usr/bin/env python3
"""Fail-closed QA for the measured-learning launch-review tranche and shell activation path."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data" / "measured-learning"
TRANCHE = DATA / "review-tranche-launch-v1.json"
MANIFEST = DATA / "manifest-v1.json"
READINESS = DATA / "source-readiness-v2.json"
PROMOTED = DATA / "promoted-v1.json"
RUNTIME = ROOT / "measured-learning-library.js"
FINALIZER = ROOT / "app-shell-finalize.js"
SERVICE_WORKER = ROOT / "service-worker.js"

REQUIRED_DIFFICULTIES = {"foundation", "intermediate", "advanced"}
REQUIRED_TAGS = {
    "time-series",
    "multi-signal",
    "material-physical",
    "quality-outcome",
    "insufficient-evidence",
}
REQUIRED_OFFLINE_ASSETS = {
    "./measured-learning-library.js",
    "./measured-learning-library.css",
    "./data/measured-learning/promoted-v1.json",
    "./data/measured-learning/manifest-v1.json",
    "./data/measured-learning/expansion-manifest-v2.json",
    "./data/measured-learning/v2-policy.json",
    "./data/measured-learning/source-readiness-v2.json",
}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def decode_manifest(doc):
    fields = doc.get("fields") or []
    rows = doc.get("cases") or []
    return {row[0]: dict(zip(fields, row, strict=True)) for row in rows}


def main() -> int:
    tranche = load(TRANCHE)
    manifest_doc = load(MANIFEST)
    readiness = load(READINESS)
    promoted = load(PROMOTED)
    catalogue = decode_manifest(manifest_doc)

    assert tranche.get("schemaVersion") == 1
    assert tranche.get("trancheId") == "measured-learning-launch-review-v1"
    assert tranche.get("targetReviewCount") == 12
    assert tranche.get("rolloutMilestones") == [12, 30, 50, 70]
    assert tranche.get("reviewRecordsStoredHere") is False
    assert tranche.get("promotionAuthority") is False
    assert tranche.get("boundary")

    cases = tranche.get("cases") or []
    assert len(cases) == 12, f"Launch tranche must contain exactly 12 cases, got {len(cases)}"
    ids = [row.get("caseId") for row in cases]
    assert len(set(ids)) == len(ids), "Launch tranche case IDs must be unique"

    difficulties = set()
    tags = set()
    families = set()
    for row in cases:
        case_id = row.get("caseId")
        assert case_id in catalogue, f"Unknown launch-tranche case: {case_id}"
        source = catalogue[case_id].get("sourceFamily")
        assert row.get("sourceFamily") == source, f"{case_id}: tranche source family drifted from catalogue"
        assert row.get("evidencePattern"), f"{case_id}: evidencePattern is required"
        assert row.get("reviewState") == "unreviewed", f"{case_id}: scheduling artifact cannot claim review"
        assert row.get("reviewerId") is None, f"{case_id}: scheduling artifact cannot name a reviewer"
        assert row.get("decision") is None, f"{case_id}: scheduling artifact cannot contain a decision"
        assert row.get("reviewedAt") is None, f"{case_id}: scheduling artifact cannot contain a review timestamp"
        assert row.get("promotionEligible") is False, f"{case_id}: scheduling artifact cannot authorize promotion"
        families.add(source)
        difficulties.add(catalogue[case_id].get("difficulty"))
        tags.update(catalogue[case_id].get("coverageTags") or [])

    expected_families = {
        row["datasetId"]
        for row in readiness.get("sources") or []
        if row.get("promotionReady") is True
    }
    assert families == expected_families, (
        "Launch tranche must exercise every and only currently promotion-ready source family; "
        f"missing={sorted(expected_families - families)}, extra={sorted(families - expected_families)}"
    )
    assert REQUIRED_DIFFICULTIES <= difficulties, f"Missing difficulty bands: {sorted(REQUIRED_DIFFICULTIES - difficulties)}"
    assert REQUIRED_TAGS <= tags, f"Missing coverage tags: {sorted(REQUIRED_TAGS - tags)}"

    coverage = tranche.get("coverageRequirements") or {}
    assert coverage.get("allPromotionReadySourceFamilies") is True
    assert set(coverage.get("difficultyBands") or []) == REQUIRED_DIFFICULTIES
    assert set(coverage.get("requiredCoverageTags") or []) == REQUIRED_TAGS

    # The current launch state intentionally remains zero promoted. This assertion is
    # release-state specific; once a real reviewed binding is promoted, the production
    # promotion PR must update this launch-state expectation alongside its release QA.
    assert promoted.get("caseIds") == [], "Initial production-gate launch must remain at zero promoted learner cases"

    runtime = RUNTIME.read_text(encoding="utf-8")
    finalizer = FINALIZER.read_text(encoding="utf-8")
    sw = SERVICE_WORKER.read_text(encoding="utf-8")

    assert "function activePromotionManifest" in runtime
    assert "api.activationPromise=bootstrap()" in runtime
    assert "if(!activePromotionManifest(promoted))" in runtime
    assert "function deactivateNavigation" in runtime
    assert "function registerNavigation" in runtime
    assert "loadMeasuredLearningRuntime" in finalizer
    assert "window.MM_APP_SHELL.finalize();\nloadMeasuredLearningRuntime();" in finalizer, (
        "Measured-learning runtime must load only after the canonical app shell is finalized"
    )
    missing_assets = sorted(asset for asset in REQUIRED_OFFLINE_ASSETS if repr(asset)[1:-1] not in sw and asset not in sw)
    assert not missing_assets, f"Measured-learning optional offline warm set is incomplete: {missing_assets}"

    report = {
        "trancheCases": len(cases),
        "sourceFamilies": len(families),
        "difficultyBands": sorted(difficulties),
        "requiredTagsCovered": sorted(REQUIRED_TAGS),
        "promotedCases": len(promoted.get("caseIds") or []),
        "navigationGate": "fail-closed-until-nonempty-valid-promotion-manifest",
        "offlineWarmAssets": len(REQUIRED_OFFLINE_ASSETS),
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
