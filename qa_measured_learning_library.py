#!/usr/bin/env python3
"""Fail-closed QA for MouldMaster Measured Learning Library V2.

V2 keeps the governed v1 release catalogue at 70 cases while making the
architecture capacity-safe for MLM-071..MLM-100. Expansion identifiers remain
reserved until the explicit expansion gate passes.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "data" / "measured-learning" / "manifest-v1.json"
PROMOTION_INDEX = ROOT / "data" / "measured-learning" / "promoted-v1.json"
POLICY = ROOT / "data" / "measured-learning" / "v2-policy.json"
SOURCE_READINESS = ROOT / "data" / "measured-learning" / "source-readiness-v2.json"
FEATURE_METHODS = ROOT / "data" / "measured-learning" / "feature-methods-v1.json"
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
SHA256_RE = re.compile(r"sha256:[0-9a-f]{64}")
HEX64_RE = re.compile(r"[0-9a-f]{64}")


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_json(value) -> str:
    payload = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def ledger_by_id(ledger: dict) -> dict[str, dict]:
    return {source["datasetId"]: source for source in ledger.get("sources", [])}


def accepted_catalogue_families(ledger: dict) -> set[str]:
    accepted = set()
    for source in ledger.get("sources", []):
        if str(source.get("state", "")).startswith("accepted-profiled"):
            accepted.add(source["datasetId"])
    return accepted


def expand_row(fields: list[str], row: list) -> dict:
    if len(fields) != len(row):
        raise AssertionError(f"catalogue row field mismatch: expected {len(fields)}, got {len(row)}")
    return dict(zip(fields, row))


def collect_authoritative_fingerprints(value, key: str = "") -> set[str]:
    """Collect SHA-256 values already retained in committed benchmark evidence."""
    found: set[str] = set()
    if isinstance(value, dict):
        for child_key, child in value.items():
            found |= collect_authoritative_fingerprints(child, str(child_key))
    elif isinstance(value, list):
        for child in value:
            found |= collect_authoritative_fingerprints(child, key)
    elif isinstance(value, str):
        lower = value.lower()
        if SHA256_RE.fullmatch(lower):
            found.add(lower)
        elif HEX64_RE.fullmatch(lower) and any(token in key.lower() for token in ("sha256", "digest", "hash", "checksum")):
            found.add("sha256:" + lower)
    return found


def source_readiness_by_id(registry: dict, ledger: dict) -> dict[str, dict]:
    ledger_map = ledger_by_id(ledger)
    result = {}
    for source in registry.get("sources", []):
        dataset_id = source["datasetId"]
        assert dataset_id not in result, f"duplicate source-readiness entry: {dataset_id}"
        assert dataset_id in ledger_map, f"source-readiness entry missing from execution ledger: {dataset_id}"
        assert source.get("ledgerState") == ledger_map[dataset_id].get("state"), (
            f"source-readiness ledger state drift for {dataset_id}: "
            f"{source.get('ledgerState')} != {ledger_map[dataset_id].get('state')}"
        )
        if source.get("promotionReady"):
            assert source.get("unitsResolved") is True, f"{dataset_id}: promotion-ready source must have resolved units"
            assert source.get("semanticsResolved") is True, f"{dataset_id}: promotion-ready source must have resolved semantics"
        benchmark = ROOT / source.get("benchmarkResult", "")
        assert benchmark.is_file(), f"{dataset_id}: benchmark evidence file missing: {benchmark}"
        source["_authoritativeFingerprints"] = sorted(collect_authoritative_fingerprints(load_json(benchmark)))
        result[dataset_id] = source
    return result


def feature_registry(registry: dict) -> dict[str, int]:
    methods: dict[str, int] = {}
    for method in registry.get("methods", []):
        method_id = method["id"]
        assert method_id not in methods, f"duplicate feature method: {method_id}"
        methods[method_id] = int(method["version"])
    return methods


def assert_policy(policy: dict):
    assert policy.get("schemaVersion") == 2
    assert policy.get("architectureId") == "measured-learning-library-v2"
    assert policy.get("baseLibraryId") == "measured-learning-library-v1"
    assert policy.get("releaseTargetCaseCount") == 70
    assert policy.get("catalogueCapacity") == 100
    reserved = policy.get("reservedCaseIds", [])
    assert reserved == [f"MLM-{i:03d}" for i in range(71, 101)], "V2 reserved IDs must be MLM-071..MLM-100"
    assert policy.get("learnerVisibleOnlyWhenPromoted") is True
    budgets = policy.get("payloadBudget", {})
    assert 0 < budgets.get("typicalCaseBytes", 0) <= budgets.get("hardCaseBytes", 0)
    assert budgets.get("aggregatePromotedBytes", 0) >= budgets.get("hardCaseBytes", 0)


def assert_catalogue(manifest: dict, eligible: set[str]) -> list[dict]:
    assert manifest.get("schemaVersion") == 1
    assert manifest.get("libraryId") == "measured-learning-library-v1"
    assert manifest.get("targetCaseCount") == 70
    assert manifest.get("learnerVisibleOnlyWhenPromoted") is True
    assert manifest.get("evidencePolicy", {}).get("unboundCandidatesAreNotLearnerCases") is True
    assert manifest.get("evidencePolicy", {}).get("rawThirdPartyRowsCommitted") is False

    fields = manifest.get("fields", [])
    cases = [expand_row(fields, row) for row in manifest.get("cases", [])]
    assert len(cases) == 70, f"expected exactly 70 release-catalogue cases, got {len(cases)}"

    expected_ids = [f"MLM-{i:03d}" for i in range(1, 71)]
    ids = [c["id"] for c in cases]
    assert ids == expected_ids, "release case IDs must be unique, ordered and contiguous MLM-001..MLM-070"
    assert len(set(c["title"] for c in cases)) == 70, "case titles must be unique"

    difficulty = Counter(c["difficulty"] for c in cases)
    assert difficulty == Counter(EXPECTED_DIFFICULTY), f"difficulty mix drifted: {dict(difficulty)}"

    sources = Counter(c["sourceFamily"] for c in cases)
    unknown = sorted(set(sources) - eligible)
    assert not unknown, f"catalogue references non-profiled measured families: {unknown}"
    assert max(sources.values(), default=0) <= 14, f"one source exceeds 20% of 70 release cases: {dict(sources)}"

    tags = Counter(tag for c in cases for tag in c.get("coverageTags", []))
    for tag, minimum in MIN_TAGS.items():
        assert tags[tag] >= minimum, f"coverage tag {tag} requires >= {minimum}, found {tags[tag]}"

    return cases


def assert_promotion_index(index: dict, catalogue_ids: set[str], reserved_ids: set[str]) -> list[str]:
    assert index.get("schemaVersion") == 1, "promotion index schemaVersion must be 1"
    assert index.get("libraryId") == "measured-learning-library-v1", "promotion index libraryId drift"
    ids = index.get("caseIds", [])
    assert isinstance(ids, list), "promotion index caseIds must be an array"
    assert len(ids) == len(set(ids)), "promotion index contains duplicate case IDs"
    unknown = sorted(set(ids) - catalogue_ids)
    assert not unknown, f"promotion index contains non-release catalogue IDs: {unknown}"
    assert not (set(ids) & reserved_ids), "reserved MLM-071..MLM-100 IDs cannot be promoted before expansion"
    return ids


def finite_number(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def assert_trace(path: Path, signal: dict):
    for key in ("id", "label", "semantic", "unit", "representation"):
        assert key in signal and signal[key] not in (None, ""), f"{path}: signal missing {key}"
    rep = signal["representation"]
    for key in ("xSemantic", "xUnit", "reductionMethod"):
        assert rep.get(key) not in (None, ""), f"{path}: signal {signal['id']} representation missing {key}"
    x, y = rep.get("x", []), rep.get("y", [])
    assert len(x) == len(y) and len(x) > 1, f"{path}: x/y trace mismatch"
    assert len(y) <= 600, f"{path}: learner trace exceeds 600-point budget"
    assert rep.get("originalPointCount", 0) >= len(y), f"{path}: displayed trace exceeds original count"
    assert all(finite_number(v) for v in x), f"{path}: x values must be finite numbers"
    assert all(finite_number(v) for v in y), f"{path}: y values must be finite numbers"
    assert all(float(a) <= float(b) for a, b in zip(x, x[1:])), f"{path}: x axis must be monotonic non-decreasing"


def validate_promoted_case(path: Path, catalogue: dict, readiness: dict[str, dict], feature_methods: dict[str, int]) -> dict:
    case = load_json(path)
    assert case.get("schemaVersion") == 2, f"{path}: V2 promoted case schemaVersion must be 2"
    assert case.get("id") == catalogue["id"], f"{path}: ID does not match catalogue"
    assert case.get("title") == catalogue["title"], f"{path}: title does not match catalogue"
    assert case.get("promotionState") == "promoted", f"{path}: learner case must declare promotionState=promoted"
    family_id = case.get("source", {}).get("familyId")
    assert family_id == catalogue["sourceFamily"], f"{path}: source family drift"
    assert family_id in readiness, f"{path}: missing source-readiness entry"
    source_gate = readiness[family_id]
    assert source_gate.get("promotionReady") is True, f"{path}: source family is not promotion-ready under V2"

    assert case.get("evidenceTier") in {"measured", "site_validated"}, f"{path}: invalid evidence tier"
    assert case.get("claimScope") in {"observation_only", "association", "validated_mechanism"}
    if case.get("evidenceTier") == "measured":
        assert case.get("claimScope") != "validated_mechanism", f"{path}: public measured case cannot self-promote a validated mechanism"

    source = case.get("source", {})
    for key in ("datasetId", "sourceReference", "sourceFingerprint", "sourceWindowFingerprint", "licenceOrAccessStatus", "extraction"):
        assert source.get(key), f"{path}: missing source.{key}"
    assert SHA256_RE.fullmatch(source["sourceFingerprint"]), f"{path}: invalid source fingerprint"
    assert SHA256_RE.fullmatch(source["sourceWindowFingerprint"]), f"{path}: invalid window fingerprint"
    assert source["licenceOrAccessStatus"] == source_gate.get("rightsScope"), f"{path}: licence/access status must match governed source readiness registry"
    authoritative = set(source_gate.get("_authoritativeFingerprints", []))
    assert source["sourceFingerprint"] in authoritative, f"{path}: source fingerprint is not present in committed benchmark evidence for {family_id}"
    extraction = source["extraction"]
    assert extraction.get("description"), f"{path}: extraction description is required"
    assert extraction.get("sourceArtifact"), f"{path}: exact source artifact identity is required"
    assert extraction.get("sourceOrderingPreserved") is True, f"{path}: source ordering must be explicitly preserved"

    signals = case.get("signals", [])
    assert signals, f"{path}: promoted case requires signals/outcomes"
    signal_ids = [s.get("id") for s in signals]
    assert len(signal_ids) == len(set(signal_ids)), f"{path}: duplicate signal IDs"
    for signal in signals:
        assert_trace(path, signal)

    features = case.get("features", [])
    feature_ids = []
    for feature in features:
        for key in ("id", "method", "methodVersion", "calculationScope", "inputFingerprint", "calculationFingerprint", "value"):
            assert key in feature and feature[key] not in (None, ""), f"{path}: feature missing {key}"
        method = feature["method"]
        assert method in feature_methods, f"{path}: unregistered feature method {method}"
        assert int(feature["methodVersion"]) == feature_methods[method], f"{path}: feature method version drift"
        assert SHA256_RE.fullmatch(feature["inputFingerprint"]), f"{path}: invalid feature inputFingerprint"
        assert SHA256_RE.fullmatch(feature["calculationFingerprint"]), f"{path}: invalid feature calculationFingerprint"
        assert finite_number(feature["value"]), f"{path}: feature value must be finite numeric"
        feature_ids.append(feature["id"])
    assert len(feature_ids) == len(set(feature_ids)), f"{path}: duplicate feature IDs"

    observations = case.get("observations", [])
    assert observations, f"{path}: promoted case requires supported observations"
    valid_support = {f"signal:{value}" for value in signal_ids} | {f"feature:{value}" for value in feature_ids}
    for obs in observations:
        assert obs.get("id") and obs.get("text") and obs.get("support"), f"{path}: every observation must have id, text and linked supporting evidence"
        unknown_support = sorted(set(obs["support"]) - valid_support)
        assert not unknown_support, f"{path}: observation has unknown evidence links: {unknown_support}"

    evidence = case.get("evidence", {})
    assert evidence.get("limitations"), f"{path}: limitations are mandatory"
    assert evidence.get("supportedConclusions"), f"{path}: supported conclusions are mandatory"
    assert evidence.get("unsupportedConclusions"), f"{path}: unsupported conclusions are mandatory"

    learner = case.get("learnerTask", {})
    for key in ("observePrompt", "investigatePrompt", "explanation", "takeaway"):
        assert learner.get(key), f"{path}: learnerTask.{key} is mandatory"

    novelty = case.get("novelty", {})
    assert novelty.get("learningObjective"), f"{path}: novelty.learningObjective is mandatory"
    assert isinstance(novelty.get("sourceWindowReuse"), bool), f"{path}: novelty.sourceWindowReuse must be boolean"
    if novelty["sourceWindowReuse"]:
        assert novelty.get("reuseJustification"), f"{path}: source-window reuse requires explicit justification"

    review = case.get("review", {})
    for key in ("reviewerId", "reviewerRole", "reviewRecord", "reviewedAt"):
        assert review.get(key), f"{path}: review.{key} is mandatory"
    assert review.get("reviewed") is True, f"{path}: review must be explicitly approved"

    visible_text = json.dumps({"observations": observations, "learnerTask": learner, "evidence": evidence}, ensure_ascii=False).lower()
    if case.get("claimScope") != "validated_mechanism":
        for pattern in CAUSAL_PATTERNS:
            assert not re.search(pattern, visible_text), f"{path}: unsupported causal language matches {pattern}"

    declared = case.get("caseFingerprint")
    assert declared and SHA256_RE.fullmatch(declared), f"{path}: missing/invalid caseFingerprint"
    fingerprint_input = {k: v for k, v in case.items() if k != "caseFingerprint"}
    actual = "sha256:" + sha256_json(fingerprint_input)
    assert declared == actual, f"{path}: caseFingerprint is not reproducible"
    return case


def main() -> int:
    manifest = load_json(MANIFEST)
    promotion_index = load_json(PROMOTION_INDEX)
    policy = load_json(POLICY)
    ledger = load_json(LEDGER)
    readiness_registry = load_json(SOURCE_READINESS)
    feature_registry_data = load_json(FEATURE_METHODS)

    assert_policy(policy)
    catalogue_eligible = accepted_catalogue_families(ledger)
    catalogue = assert_catalogue(manifest, catalogue_eligible)
    by_id = {c["id"]: c for c in catalogue}
    reserved_ids = set(policy["reservedCaseIds"])

    readiness = source_readiness_by_id(readiness_registry, ledger)
    catalogue_sources = {c["sourceFamily"] for c in catalogue}
    missing_readiness = sorted(catalogue_sources - set(readiness))
    assert not missing_readiness, f"catalogue sources missing from V2 readiness registry: {missing_readiness}"

    methods = feature_registry(feature_registry_data)
    indexed_ids = assert_promotion_index(promotion_index, set(by_id), reserved_ids)

    ready_families = {dataset_id for dataset_id, source in readiness.items() if source.get("promotionReady")}
    ready_candidate_cases = [c["id"] for c in catalogue if c["sourceFamily"] in ready_families]
    blocked_candidate_cases = [c["id"] for c in catalogue if c["sourceFamily"] not in ready_families]

    promoted = []
    exact_window_signal_keys = set()
    window_to_cases = defaultdict(list)
    learning_objectives = set()
    aggregate_bytes = 0
    hard_case_bytes = int(policy["payloadBudget"]["hardCaseBytes"])

    if CASE_DIR.exists():
        for path in sorted(CASE_DIR.glob("MLM-*.json")):
            case_id = path.stem
            assert case_id not in reserved_ids, f"{path}: reserved V2 expansion ID cannot exist before expansion unlock"
            assert case_id in by_id, f"unexpected promoted case asset {path.name}"
            assert path.stat().st_size <= hard_case_bytes, f"{path}: case exceeds V2 hard payload budget of {hard_case_bytes} bytes"
            aggregate_bytes += path.stat().st_size
            case = validate_promoted_case(path, by_id[case_id], readiness, methods)

            canonical_signals = tuple(sorted(s["id"] for s in case["signals"]))
            exact_key = (case["source"]["sourceWindowFingerprint"], canonical_signals)
            assert exact_key not in exact_window_signal_keys, f"{path}: same source window + canonical signal set is already used by another case"
            exact_window_signal_keys.add(exact_key)

            objective_key = re.sub(r"\s+", " ", case["novelty"]["learningObjective"].strip().lower())
            assert objective_key not in learning_objectives, f"{path}: duplicate normalized learning objective"
            learning_objectives.add(objective_key)

            window_to_cases[case["source"]["sourceWindowFingerprint"]].append(case)
            promoted.append(case_id)

    assert aggregate_bytes <= int(policy["payloadBudget"]["aggregatePromotedBytes"]), f"aggregate measured learner payload exceeds V2 budget: {aggregate_bytes} bytes"

    reused_cases = 0
    reused_windows = {}
    for window, cases in window_to_cases.items():
        if len(cases) <= 1:
            continue
        reused_windows[window] = [case["id"] for case in cases]
        for case in cases:
            assert case["novelty"]["sourceWindowReuse"] is True, f"{case['id']}: repeated source window requires novelty.sourceWindowReuse=true"
            assert case["novelty"].get("reuseJustification"), f"{case['id']}: repeated source window requires reuseJustification"
            reused_cases += 1

    reuse_rate = (reused_cases / len(promoted)) if promoted else 0.0
    max_reuse_rate = float(policy["expansionGate"]["maximumSubstantialWindowReuseRate"])
    assert reuse_rate <= max_reuse_rate, f"source-window reuse rate {reuse_rate:.3f} exceeds V2 maximum {max_reuse_rate:.3f}"

    assert set(indexed_ids) == set(promoted), (
        "promotion index must exactly match QA-valid promoted case assets: "
        f"index_only={sorted(set(indexed_ids)-set(promoted))}, "
        f"asset_only={sorted(set(promoted)-set(indexed_ids))}"
    )
    assert indexed_ids == promoted, "promotion index must use the same stable order as promoted case files"

    expansion = policy["expansionGate"]
    expansion_unlocked = (
        len(promoted) >= int(expansion["minimumPromotedCasesBeforeAuthoringExpansion"])
        and len(ready_families) >= int(expansion["minimumPromotionReadySourceFamilies"])
        and reuse_rate <= max_reuse_rate
    )

    report = {
        "schemaVersion": 2,
        "architectureId": policy["architectureId"],
        "libraryId": manifest["libraryId"],
        "releaseTargetCases": policy["releaseTargetCaseCount"],
        "catalogueCapacity": policy["catalogueCapacity"],
        "reservedExpansionIds": policy["reservedCaseIds"],
        "catalogueCases": len(catalogue),
        "promotedLearnerCases": len(promoted),
        "promotedCaseIds": promoted,
        "promotionIndexMatchesAssets": True,
        "catalogueEligibleFamilies": sorted(catalogue_eligible),
        "promotionReadyFamilies": sorted(ready_families),
        "promotionReadyFamilyCount": len(ready_families),
        "promotionReadyCandidateCases": len(ready_candidate_cases),
        "blockedCandidateCases": len(blocked_candidate_cases),
        "blockedCandidateCaseIds": blocked_candidate_cases,
        "aggregatePromotedPayloadBytes": aggregate_bytes,
        "sourceWindowReuseRate": reuse_rate,
        "reusedSourceWindows": reused_windows,
        "releaseComplete": len(promoted) == int(policy["releaseTargetCaseCount"]),
        "capacityExpansionUnlocked": expansion_unlocked,
        "boundary": "V2 preserves the 70-case release target and reserves MLM-071..MLM-100. Expansion is blocked until the policy gate passes; catalogue rows remain non-learner-visible until exact source/window promotion QA passes."
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
