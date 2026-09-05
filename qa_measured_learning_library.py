#!/usr/bin/env python3
"""Fail-closed QA for MouldMaster Measured Learning Library V2."""
from __future__ import annotations

import json
import math
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TOOLS = ROOT / "tools"
if str(TOOLS) not in sys.path:
    sys.path.insert(0, str(TOOLS))
from measured_learning_core import (  # noqa: E402
    calculate_feature, canonical_sha, finite_number, load_json, normalize_text,
    raw_window_fingerprint, representation_fingerprint, window_overlap,
)

MANIFEST = ROOT / "data/measured-learning/manifest-v1.json"
EXPANSION = ROOT / "data/measured-learning/expansion-manifest-v2.json"
PROMOTION_INDEX = ROOT / "data/measured-learning/promoted-v1.json"
POLICY = ROOT / "data/measured-learning/v2-policy.json"
READINESS = ROOT / "data/measured-learning/source-readiness-v2.json"
ARTIFACTS = ROOT / "data/measured-learning/source-artifacts-v2.json"
CHANNELS = ROOT / "data/measured-learning/source-channels-v2.json"
REQUIREMENTS = ROOT / "data/measured-learning/case-requirements-v2.json"
FEATURE_METHODS = ROOT / "data/measured-learning/feature-methods-v1.json"
LEDGER = ROOT / "data/measured-dataset-execution-ledger-v1.json"
CASE_DIR = ROOT / "data/measured-learning/cases"
REPORT = ROOT / "measured-learning-library-report.json"

EXPECTED_DIFFICULTY = {"foundation":20,"intermediate":30,"advanced":20}
MIN_TAGS = {"insufficient-evidence":10,"multi-signal":10,"quality-outcome":10,"time-series-interpretation":10,"material-physical":8}
CAUSAL_PATTERNS = (r"\bcaused by\b", r"\broot cause (?:is|was)\b", r"\bproves? that\b", r"\bconfirmed (?:fault|failure|cause)\b", r"\bresulted from\b")
SHA256_RE = re.compile(r"sha256:[0-9a-f]{64}")
HEX64_RE = re.compile(r"[0-9a-f]{64}")
REVIEW_TYPES = {"github-pr","github-issue","signed-review","external-record","test-fixture"}


def expand_rows(manifest: dict) -> list[dict]:
    fields = manifest.get("fields", [])
    cases = []
    for row in manifest.get("cases", []):
        assert len(row) == len(fields), "catalogue row field mismatch"
        cases.append(dict(zip(fields, row)))
    return cases


def ledger_map() -> dict[str, dict]:
    return {s["datasetId"]: s for s in load_json(LEDGER).get("sources", [])}


def readiness_map() -> dict[str, dict]:
    return {s["datasetId"]: s for s in load_json(READINESS).get("sources", [])}


def channels_map() -> dict[str, dict[str, dict]]:
    return {s["datasetId"]:{c["sourceChannel"]:c for c in s.get("channels", [])} for s in load_json(CHANNELS).get("sources", [])}


def artifacts_map() -> dict[str, dict[str, dict]]:
    return {s["datasetId"]:{a["name"]:a for a in s.get("artifacts", [])} for s in load_json(ARTIFACTS).get("sources", [])}


def methods_map() -> dict[str, int]:
    return {m["id"]:int(m["version"]) for m in load_json(FEATURE_METHODS).get("methods", [])}


def collect_hashes(value, key="") -> set[str]:
    found = set()
    if isinstance(value, dict):
        for k, v in value.items():
            found |= collect_hashes(v, str(k))
    elif isinstance(value, list):
        for v in value:
            found |= collect_hashes(v, key)
    elif isinstance(value, str):
        text = value.lower()
        if SHA256_RE.fullmatch(text):
            found.add(text)
        elif HEX64_RE.fullmatch(text) and any(t in key.lower() for t in ("sha256","digest","hash","checksum")):
            found.add("sha256:" + text)
    return found


def case_required_capabilities(candidate: dict) -> set[str]:
    registry = load_json(REQUIREMENTS)
    required = set()
    for tag in candidate.get("coverageTags", []):
        required.update(registry.get("requirementsByCoverageTag", {}).get(tag, []))
    required.update(registry.get("caseOverrides", {}).get(candidate["id"], []))
    return required


def assert_registries() -> tuple[dict, dict, dict, dict]:
    ledger = ledger_map()
    readiness = readiness_map()
    channels = channels_map()
    artifacts = artifacts_map()
    source_artifact_registry = {s["datasetId"]:s for s in load_json(ARTIFACTS).get("sources", [])}
    assert len(readiness) == len(set(readiness)), "duplicate source readiness entries"
    for dataset_id, gate in readiness.items():
        assert dataset_id in ledger, f"readiness source absent from ledger: {dataset_id}"
        assert gate.get("ledgerState") == ledger[dataset_id].get("state"), f"ledger-state drift: {dataset_id}"
        if gate.get("promotionReady"):
            assert gate.get("unitsResolved") is True and gate.get("semanticsResolved") is True, f"ready source unresolved: {dataset_id}"
            assert artifacts.get(dataset_id), f"ready source lacks exact artifact registry: {dataset_id}"
            assert channels.get(dataset_id), f"ready source lacks promotable channel registry: {dataset_id}"
            assert any(c.get("promotionReady") for c in channels[dataset_id].values()), f"ready source lacks ready channels: {dataset_id}"
    for dataset_id, source in source_artifact_registry.items():
        benchmark_path = ROOT / source.get("benchmarkResult", "")
        assert benchmark_path.is_file(), f"artifact benchmark missing: {dataset_id}"
        benchmark_hashes = collect_hashes(load_json(benchmark_path))
        names = set()
        for artifact in source.get("artifacts", []):
            name = artifact.get("name")
            assert name and name not in names, f"duplicate artifact name: {dataset_id}/{name}"
            names.add(name)
            assert SHA256_RE.fullmatch(str(artifact.get("sha256", ""))), f"invalid artifact SHA: {dataset_id}/{name}"
            assert artifact["sha256"] in benchmark_hashes, f"artifact SHA is not evidenced by benchmark: {dataset_id}/{name}"
    return ledger, readiness, artifacts, channels


def assert_base_catalogue(manifest: dict, ledger: dict) -> list[dict]:
    assert manifest.get("schemaVersion") == 1 and manifest.get("targetCaseCount") == 70
    cases = expand_rows(manifest)
    assert [c["id"] for c in cases] == [f"MLM-{i:03d}" for i in range(1,71)]
    assert len({c["title"] for c in cases}) == 70
    assert Counter(c["difficulty"] for c in cases) == Counter(EXPECTED_DIFFICULTY)
    accepted = {k for k,v in ledger.items() if str(v.get("state","")).startswith("accepted-profiled")}
    unknown = sorted({c["sourceFamily"] for c in cases} - accepted)
    assert not unknown, f"base catalogue uses non-profiled families: {unknown}"
    source_counts = Counter(c["sourceFamily"] for c in cases)
    assert max(source_counts.values()) <= 14
    tags = Counter(tag for c in cases for tag in c.get("coverageTags", []))
    for tag, minimum in MIN_TAGS.items():
        assert tags[tag] >= minimum, f"coverage {tag} below minimum"
    return cases


def assert_expansion_manifest(expansion: dict, unlocked: bool) -> list[dict]:
    assert expansion.get("schemaVersion") == 2
    capacity_ids = [f"MLM-{i:03d}" for i in range(71,101)]
    assert expansion.get("capacityCaseIds") == capacity_ids
    cases = expand_rows(expansion)
    if not cases:
        return []
    assert unlocked, "expansion manifest must remain empty until expansion gate passes"
    assert [c["id"] for c in cases] == capacity_ids, "expansion must propose the full ordered MLM-071..MLM-100 set"
    assert len({c["title"] for c in cases}) == 30
    return cases


def validate_trace(path: Path, signal: dict, governed: dict) -> None:
    for key in ("id","label","sourceChannel","semantic","unit","representation"):
        assert signal.get(key) not in (None,""), f"{path}: signal missing {key}"
    assert signal["semantic"] == governed.get("semantic"), f"{path}: source-channel semantic mismatch"
    assert signal["unit"] == governed.get("unit"), f"{path}: source-channel unit mismatch"
    assert governed.get("promotionReady") is True, f"{path}: source channel is not promotion-ready"
    rep = signal["representation"]
    assert rep.get("xSemantic") == governed.get("coordinateSemantic"), f"{path}: x semantic mismatch"
    assert rep.get("xUnit") == governed.get("coordinateUnit"), f"{path}: x unit mismatch"
    assert rep.get("reductionMethod"), f"{path}: reduction method missing"
    x, y = rep.get("x", []), rep.get("y", [])
    assert len(x) == len(y) and len(x) > 1
    assert len(y) <= 600 and rep.get("originalPointCount", 0) >= len(y)
    assert all(finite_number(v) for v in x+y)
    assert all(float(a) <= float(b) for a,b in zip(x,x[1:])), f"{path}: x must be monotonic"


def validate_case_object(case: dict, candidate: dict, readiness: dict, artifacts: dict, channels: dict, methods: dict, path: Path = Path("<case>")) -> dict:
    assert case.get("schemaVersion") == 3, f"{path}: case schema must be 3"
    assert case.get("architectureId") == "measured-learning-library-v2"
    assert case.get("id") == candidate["id"] and case.get("title") == candidate["title"]
    assert case.get("promotionState") == "promoted" and case.get("evidenceTier") == "measured"
    assert case.get("claimScope") in {"observation_only","association"}
    family = case.get("source", {}).get("familyId")
    assert family == candidate["sourceFamily"] and readiness.get(family, {}).get("promotionReady") is True
    required = case_required_capabilities(candidate)
    assert set(case.get("requiredCapabilities", [])) == required
    capabilities = readiness[family].get("capabilities", {})
    assert not [cap for cap in required if capabilities.get(cap) is not True], f"{path}: source capability mismatch"

    source = case["source"]
    artifact_name = source.get("sourceArtifact")
    assert artifact_name in artifacts.get(family, {}), f"{path}: unregistered source artifact"
    artifact = artifacts[family][artifact_name]
    assert source.get("sourceFingerprint") == artifact.get("sha256"), f"{path}: artifact/hash mismatch"
    member = source.get("sourceMember")
    if member is not None:
        assert member in artifact.get("members", []), f"{path}: unregistered archive member"
    assert source.get("licenceOrAccessStatus") == readiness[family].get("rightsScope")
    extraction = source.get("extraction", {})
    assert extraction.get("description") and extraction.get("sourceOrderingPreserved") is True
    raw_fp = raw_window_fingerprint(source["sourceFingerprint"], artifact_name, member, extraction)
    assert source.get("rawWindowFingerprint") == raw_fp, f"{path}: raw-window fingerprint mismatch"

    governed_channels = channels.get(family, {})
    signals = case.get("signals", [])
    assert signals
    assert len({s.get("id") for s in signals}) == len(signals)
    for signal in signals:
        assert signal.get("sourceChannel") in governed_channels, f"{path}: unregistered source channel"
        validate_trace(path, signal, governed_channels[signal["sourceChannel"]])
    if "multi-signal" in candidate.get("coverageTags", []):
        assert len(signals) >= 2
    rep_fp = representation_fingerprint(raw_fp, signals)
    assert source.get("representationFingerprint") == rep_fp, f"{path}: representation fingerprint mismatch"

    signals_by_id = {s["id"]:s for s in signals}
    features = case.get("features", [])
    assert len({f.get("id") for f in features}) == len(features)
    for feature in features:
        recalculated = calculate_feature({
            "id":feature["id"], "label":feature.get("label"), "method":feature["method"],
            "methodVersion":feature["methodVersion"], "inputs":feature.get("inputs"),
            "params":feature.get("params"), "calculationScope":feature.get("calculationScope"),
            "unit":feature.get("unit"),
        }, signals_by_id, methods)
        assert math.isclose(float(feature["value"]), float(recalculated["value"]), rel_tol=1e-12, abs_tol=1e-12), f"{path}: feature value not reproducible"
        assert feature.get("inputFingerprint") == recalculated["inputFingerprint"], f"{path}: feature input fingerprint mismatch"
        assert feature.get("calculationFingerprint") == recalculated["calculationFingerprint"], f"{path}: feature calculation fingerprint mismatch"

    signal_ids = {f"signal:{s['id']}" for s in signals}
    feature_ids = {f"feature:{f['id']}" for f in features}
    observations = case.get("observations", [])
    assert observations
    for obs in observations:
        assert obs.get("id") and obs.get("text") and obs.get("support")
        assert not (set(obs["support"]) - signal_ids - feature_ids), f"{path}: unknown observation support"
    evidence = case.get("evidence", {})
    assert evidence.get("sourceEstablishesCausality") is False
    for key in ("supportedConclusions","unsupportedConclusions","limitations"):
        assert evidence.get(key), f"{path}: evidence.{key} required"
    learner = case.get("learnerTask", {})
    for key in ("observePrompt","investigatePrompt","explanation","takeaway"):
        assert learner.get(key)
    visible = json.dumps({"observations":observations,"learnerTask":learner,"evidence":evidence}, ensure_ascii=False).lower()
    for pattern in CAUSAL_PATTERNS:
        assert not re.search(pattern, visible), f"{path}: unsupported causal wording"
    novelty = case.get("novelty", {})
    assert novelty.get("learningObjective") and isinstance(novelty.get("sourceWindowReuse"), bool)
    if novelty["sourceWindowReuse"]:
        assert novelty.get("reuseJustification")
    review = case.get("review", {})
    for key in ("authorId","reviewerId","reviewerRole","reviewRecordType","reviewRecord","reviewedAt"):
        assert review.get(key), f"{path}: review.{key} required"
    assert review.get("reviewed") is True and review["authorId"] != review["reviewerId"]
    assert review["reviewRecordType"] in REVIEW_TYPES
    declared = case.get("caseFingerprint")
    assert SHA256_RE.fullmatch(str(declared or ""))
    assert declared == canonical_sha({k:v for k,v in case.items() if k != "caseFingerprint"}), f"{path}: case fingerprint mismatch"
    return case


def main() -> int:
    policy = load_json(POLICY)
    assert policy.get("schemaVersion") == 2 and policy.get("catalogueCapacity") == 100 and policy.get("releaseTargetCaseCount") == 70
    ledger, readiness, artifacts, channels = assert_registries()
    methods = methods_map()
    base_cases = assert_base_catalogue(load_json(MANIFEST), ledger)
    base_by_id = {c["id"]:c for c in base_cases}
    ready_families = {k for k,v in readiness.items() if v.get("promotionReady")}

    # Evaluate current promoted base corpus before deciding whether the expansion manifest may be authored.
    promoted_paths = sorted(CASE_DIR.glob("MLM-*.json")) if CASE_DIR.exists() else []
    pre_promoted_count = sum(1 for p in promoted_paths if int(p.stem.split("-")[1]) <= 70)
    gate = policy["expansionGate"]
    pre_unlocked = pre_promoted_count >= int(gate["minimumPromotedCasesBeforeAuthoringExpansion"]) and len(ready_families) >= int(gate["minimumPromotionReadySourceFamilies"])
    expansion_cases = assert_expansion_manifest(load_json(EXPANSION), pre_unlocked)
    catalogue = base_cases + expansion_cases
    by_id = {c["id"]:c for c in catalogue}

    if expansion_cases:
        source_counts = Counter(c["sourceFamily"] for c in catalogue)
        largest = max(source_counts.values()) / 100
        top4 = sum(v for _,v in source_counts.most_common(4)) / 100
        assert largest <= float(gate["maximumLargestFamilyShareAt100"]), "100-case largest-family concentration too high"
        assert top4 <= float(gate["maximumTopFourFamilyShareAt100"]), "100-case top-four concentration too high"

    hard = int(policy["payloadBudget"]["hardCaseBytes"])
    aggregate = 0
    promoted_cases = []
    for path in promoted_paths:
        assert path.stem in by_id, f"unexpected or gated case asset {path.name}"
        assert path.stat().st_size <= hard, f"{path}: hard payload budget exceeded"
        aggregate += path.stat().st_size
        promoted_cases.append(validate_case_object(load_json(path), by_id[path.stem], readiness, artifacts, channels, methods, path))
    assert aggregate <= int(policy["payloadBudget"]["aggregatePromotedBytes"])

    index = load_json(PROMOTION_INDEX)
    indexed = index.get("caseIds", [])
    promoted_ids = [c["id"] for c in promoted_cases]
    assert indexed == promoted_ids, f"promotion index mismatch: indexed={indexed}, assets={promoted_ids}"

    objectives = set()
    substantial_cases = set()
    overlap_threshold = float(gate["substantialWindowOverlapThreshold"])
    for i, a in enumerate(promoted_cases):
        objective = normalize_text(a["novelty"]["learningObjective"])
        assert objective not in objectives, f"duplicate normalized learning objective: {a['id']}"
        objectives.add(objective)
        for b in promoted_cases[i+1:]:
            sa, sb = a["source"], b["source"]
            if (sa["familyId"],sa["sourceArtifact"],sa.get("sourceMember")) != (sb["familyId"],sb["sourceArtifact"],sb.get("sourceMember")):
                continue
            overlap = window_overlap(sa["extraction"]["window"], sb["extraction"]["window"])
            if overlap >= overlap_threshold:
                substantial_cases.update((a["id"],b["id"]))
                assert a["novelty"]["sourceWindowReuse"] and b["novelty"]["sourceWindowReuse"], f"substantial overlapping windows require reuse declaration: {a['id']}/{b['id']}"
                assert a["novelty"].get("reuseJustification") and b["novelty"].get("reuseJustification")
    reuse_rate = len(substantial_cases) / len(promoted_cases) if promoted_cases else 0.0
    assert reuse_rate <= float(gate["maximumSubstantialWindowReuseRate"]), f"substantial window reuse rate too high: {reuse_rate:.3f}"

    expansion_unlocked = len([c for c in promoted_cases if int(c["id"].split("-")[1]) <= 70]) >= int(gate["minimumPromotedCasesBeforeAuthoringExpansion"]) and len(ready_families) >= int(gate["minimumPromotionReadySourceFamilies"]) and reuse_rate <= float(gate["maximumSubstantialWindowReuseRate"])

    source_gate_candidate_counts = Counter(c["sourceFamily"] in ready_families for c in base_cases)
    report = {
        "schemaVersion":3,
        "architectureId":"measured-learning-library-v2",
        "releaseTargetCases":70,
        "catalogueCapacity":100,
        "baseCatalogueCases":len(base_cases),
        "expansionCatalogueCases":len(expansion_cases),
        "promotedLearnerCases":len(promoted_cases),
        "promotedCaseIds":promoted_ids,
        "promotionReadySourceFamilies":sorted(ready_families),
        "promotionReadySourceFamilyCount":len(ready_families),
        "baseCasesOnSourceGateReadyFamilies":source_gate_candidate_counts[True],
        "baseCasesOnSourceGateBlockedFamilies":source_gate_candidate_counts[False],
        "aggregatePromotedPayloadBytes":aggregate,
        "substantialWindowReuseRate":reuse_rate,
        "capacityExpansionUnlocked":expansion_unlocked,
        "releaseComplete":len([i for i in promoted_ids if int(i.split("-")[1]) <= 70]) == 70,
        "boundary":"A source-level gate is necessary but not sufficient: every promoted case must also match an exact artifact hash, governed source channels, reproducible feature calculations and independent review metadata."
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
