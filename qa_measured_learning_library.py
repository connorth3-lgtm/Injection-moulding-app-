#!/usr/bin/env python3
"""Fail-closed QA for the MouldMaster Measured Learning Library.

The 70-row catalogue is a curriculum target, not proof that 70 measured learner
cases have been built. A case becomes learner-visible only when a promoted
per-case JSON asset exists, is listed in the promotion index and satisfies the
provenance/evidence contract below.
"""
from __future__ import annotations

import hashlib
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "data" / "measured-learning" / "manifest-v1.json"
PROMOTION_INDEX = ROOT / "data" / "measured-learning" / "promoted-v1.json"
LEDGER = ROOT / "data" / "measured-dataset-execution-ledger-v1.json"
CASE_DIR = ROOT / "data" / "measured-learning" / "cases"
REPORT = ROOT / "measured-learning-library-report.json"

EXPECTED_DIFFICULTY = {"foundation": 20, "intermediate": 30, "advanced": 20}
MIN_TAGS = {
    "insufficient-evidence": 10,
    "multi-signal": 10,
    "quality-outcome": 10,
    "time-series-interpretation": 10,
    "material-physical": 8,
}
CAUSAL_PATTERNS = (
    r"\bcaused by\b",
    r"\broot cause (?:is|was)\b",
    r"\bproves? that\b",
    r"\bconfirmed (?:fault|failure|cause)\b",
    r"\bresulted from\b",
)


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_json(value) -> str:
    payload = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def accepted_families(ledger: dict) -> set[str]:
    accepted = set()
    for source in ledger.get("sources", []):
        state = str(source.get("state", ""))
        # Fully profiled families only. Partial, retrieved-not-accepted, rights-blocked,
        # embargoed, request-only and confidential families remain ineligible.
        if state.startswith("accepted-profiled"):
            accepted.add(source["datasetId"])
    return accepted


def expand_row(fields: list[str], row: list) -> dict:
    if len(fields) != len(row):
        raise AssertionError(f"catalogue row field mismatch: expected {len(fields)}, got {len(row)}")
    return dict(zip(fields, row))


def assert_catalogue(manifest: dict, eligible: set[str]) -> list[dict]:
    assert manifest.get("schemaVersion") == 1
    assert manifest.get("libraryId") == "measured-learning-library-v1"
    assert manifest.get("targetCaseCount") == 70
    assert manifest.get("learnerVisibleOnlyWhenPromoted") is True
    assert manifest.get("evidencePolicy", {}).get("unboundCandidatesAreNotLearnerCases") is True
    assert manifest.get("evidencePolicy", {}).get("rawThirdPartyRowsCommitted") is False

    fields = manifest.get("fields", [])
    cases = [expand_row(fields, row) for row in manifest.get("cases", [])]
    assert len(cases) == 70, f"expected exactly 70 catalogue cases, got {len(cases)}"

    expected_ids = [f"MLM-{i:03d}" for i in range(1, 71)]
    ids = [c["id"] for c in cases]
    assert ids == expected_ids, "case IDs must be unique, ordered and contiguous MLM-001..MLM-070"
    assert len(set(c["title"] for c in cases)) == 70, "case titles must be unique"

    difficulty = Counter(c["difficulty"] for c in cases)
    assert difficulty == Counter(EXPECTED_DIFFICULTY), f"difficulty mix drifted: {dict(difficulty)}"

    sources = Counter(c["sourceFamily"] for c in cases)
    unknown = sorted(set(sources) - eligible)
    assert not unknown, f"catalogue references non-eligible measured families: {unknown}"
    assert max(sources.values(), default=0) <= 14, f"one source exceeds 20% of 70 cases: {dict(sources)}"

    tags = Counter(tag for c in cases for tag in c.get("coverageTags", []))
    for tag, minimum in MIN_TAGS.items():
        assert tags[tag] >= minimum, f"coverage tag {tag} requires >= {minimum}, found {tags[tag]}"

    return cases


def assert_promotion_index(index: dict, catalogue_ids: set[str]) -> list[str]:
    assert index.get("schemaVersion") == 1, "promotion index schemaVersion must be 1"
    assert index.get("libraryId") == "measured-learning-library-v1", "promotion index libraryId drift"
    ids = index.get("caseIds", [])
    assert isinstance(ids, list), "promotion index caseIds must be an array"
    assert len(ids) == len(set(ids)), "promotion index contains duplicate case IDs"
    unknown = sorted(set(ids) - catalogue_ids)
    assert not unknown, f"promotion index contains unknown catalogue IDs: {unknown}"
    return ids


def validate_promoted_case(path: Path, catalogue: dict, eligible: set[str]) -> dict:
    case = load_json(path)
    assert case.get("schemaVersion") == 1, f"{path}: schemaVersion must be 1"
    assert case.get("id") == catalogue["id"], f"{path}: ID does not match catalogue"
    assert case.get("title") == catalogue["title"], f"{path}: title does not match catalogue"
    assert case.get("promotionState") == "promoted", f"{path}: learner case must declare promotionState=promoted"
    assert case.get("source", {}).get("familyId") == catalogue["sourceFamily"], f"{path}: source family drift"
    assert case.get("source", {}).get("familyId") in eligible, f"{path}: source family is not fully profiled"
    assert case.get("evidenceTier") in {"measured", "site_validated"}, f"{path}: invalid evidence tier"
    assert case.get("claimScope") in {"observation_only", "association", "validated_mechanism"}
    if case.get("evidenceTier") == "measured":
        assert case.get("claimScope") != "validated_mechanism", f"{path}: public measured case cannot self-promote a validated mechanism"

    source = case.get("source", {})
    for key in ("datasetId", "sourceReference", "sourceFingerprint", "sourceWindowFingerprint", "licenceOrAccessStatus", "extraction"):
        assert source.get(key), f"{path}: missing source.{key}"
    assert re.fullmatch(r"sha256:[0-9a-f]{64}", source["sourceFingerprint"]), f"{path}: invalid source fingerprint"
    assert re.fullmatch(r"sha256:[0-9a-f]{64}", source["sourceWindowFingerprint"]), f"{path}: invalid window fingerprint"

    signals = case.get("signals", [])
    assert signals, f"{path}: promoted case requires signals/outcomes"
    for signal in signals:
        for key in ("id", "label", "semantic", "unit", "representation"):
            assert key in signal and signal[key] not in (None, ""), f"{path}: signal missing {key}"
        rep = signal["representation"]
        x, y = rep.get("x", []), rep.get("y", [])
        assert len(x) == len(y) and len(x) > 1, f"{path}: x/y trace mismatch"
        assert rep.get("originalPointCount", 0) >= len(y), f"{path}: displayed trace exceeds original count"
        assert len(y) <= 600, f"{path}: learner trace exceeds 600-point budget"
        assert rep.get("reductionMethod"), f"{path}: missing deterministic reduction method"

    features = case.get("features", [])
    for feature in features:
        for key in ("id", "method", "methodVersion", "value"):
            assert key in feature, f"{path}: feature missing {key}"

    observations = case.get("observations", [])
    assert observations, f"{path}: promoted case requires supported observations"
    for obs in observations:
        assert obs.get("text") and obs.get("support"), f"{path}: every observation must link to supporting evidence"

    evidence = case.get("evidence", {})
    assert evidence.get("limitations"), f"{path}: limitations are mandatory"
    assert evidence.get("supportedConclusions"), f"{path}: supported conclusions are mandatory"
    assert evidence.get("unsupportedConclusions"), f"{path}: unsupported conclusions are mandatory"

    learner = case.get("learnerTask", {})
    for key in ("observePrompt", "investigatePrompt", "explanation", "takeaway"):
        assert learner.get(key), f"{path}: learnerTask.{key} is mandatory"

    visible_text = json.dumps({"observations": observations, "learnerTask": learner, "evidence": evidence}, ensure_ascii=False).lower()
    if case.get("claimScope") != "validated_mechanism":
        for pattern in CAUSAL_PATTERNS:
            assert not re.search(pattern, visible_text), f"{path}: unsupported causal language matches {pattern}"

    declared = case.get("caseFingerprint")
    assert declared and re.fullmatch(r"sha256:[0-9a-f]{64}", declared), f"{path}: missing/invalid caseFingerprint"
    fingerprint_input = {k: v for k, v in case.items() if k != "caseFingerprint"}
    actual = "sha256:" + sha256_json(fingerprint_input)
    assert declared == actual, f"{path}: caseFingerprint is not reproducible"
    return case


def main() -> int:
    manifest = load_json(MANIFEST)
    promotion_index = load_json(PROMOTION_INDEX)
    ledger = load_json(LEDGER)
    eligible = accepted_families(ledger)
    catalogue = assert_catalogue(manifest, eligible)
    by_id = {c["id"]: c for c in catalogue}
    indexed_ids = assert_promotion_index(promotion_index, set(by_id))

    promoted = []
    duplicate_keys = set()
    if CASE_DIR.exists():
        for path in sorted(CASE_DIR.glob("MLM-*.json")):
            case_id = path.stem
            assert case_id in by_id, f"unexpected promoted case asset {path.name}"
            case = validate_promoted_case(path, by_id[case_id], eligible)
            duplicate_key = (
                case["source"]["sourceWindowFingerprint"],
                tuple(s["id"] for s in case["signals"]),
                by_id[case_id]["analysisLens"],
            )
            assert duplicate_key not in duplicate_keys, f"duplicate source-window/signal/lens case: {case_id}"
            duplicate_keys.add(duplicate_key)
            promoted.append(case_id)

    assert set(indexed_ids) == set(promoted), (
        "promotion index must exactly match QA-valid promoted case assets: "
        f"index_only={sorted(set(indexed_ids)-set(promoted))}, "
        f"asset_only={sorted(set(promoted)-set(indexed_ids))}"
    )
    assert indexed_ids == promoted, "promotion index must use the same stable order as promoted case files"

    report = {
        "schemaVersion": 1,
        "libraryId": manifest["libraryId"],
        "targetCases": 70,
        "catalogueCases": len(catalogue),
        "promotedLearnerCases": len(promoted),
        "promotedCaseIds": promoted,
        "promotionIndexMatchesAssets": True,
        "eligibleFullyProfiledFamilies": sorted(eligible),
        "releaseComplete": len(promoted) == 70,
        "boundary": "Catalogue rows are not learner-visible measured cases until exact source/window binding and promoted-case QA pass.",
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
