#!/usr/bin/env python3
"""Promote one governed measured-learning candidate under the V2 contract.

The builder does not download third-party datasets and does not infer root cause.
It consumes a reviewed compact binding, verifies that its source is promotion-ready,
checks the source fingerprint against committed benchmark evidence, enforces numeric
trace integrity, and atomically updates the promotion index.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data" / "measured-learning" / "manifest-v1.json"
PROMOTION_INDEX = ROOT / "data" / "measured-learning" / "promoted-v1.json"
POLICY = ROOT / "data" / "measured-learning" / "v2-policy.json"
SOURCE_READINESS = ROOT / "data" / "measured-learning" / "source-readiness-v2.json"
FEATURE_METHODS = ROOT / "data" / "measured-learning" / "feature-methods-v1.json"
OUT_DIR = ROOT / "data" / "measured-learning" / "cases"
SHA256_RE = re.compile(r"sha256:[0-9a-f]{64}")
HEX64_RE = re.compile(r"[0-9a-f]{64}")


def canonical_sha(value) -> str:
    payload = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return "sha256:" + hashlib.sha256(payload).hexdigest()


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: dict):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def catalogue_by_id() -> dict[str, dict]:
    manifest = load(MANIFEST)
    fields = manifest["fields"]
    return {row[0]: dict(zip(fields, row)) for row in manifest["cases"]}


def readiness_by_id() -> dict[str, dict]:
    registry = load(SOURCE_READINESS)
    return {source["datasetId"]: source for source in registry.get("sources", [])}


def feature_methods() -> dict[str, int]:
    registry = load(FEATURE_METHODS)
    return {method["id"]: int(method["version"]) for method in registry.get("methods", [])}


def require(condition: bool, message: str):
    if not condition:
        raise SystemExit(message)


def finite_number(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def collect_authoritative_fingerprints(value, key: str = "") -> set[str]:
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


def authoritative_fingerprints(source_gate: dict) -> set[str]:
    path = ROOT / source_gate.get("benchmarkResult", "")
    require(path.is_file(), f"benchmark evidence file is missing: {path}")
    return collect_authoritative_fingerprints(load(path))


def validate_signal(signal: dict):
    signal_id = signal.get("id")
    require(bool(signal_id), "every signal requires a stable id")
    require(bool(signal.get("label")), f"signal {signal_id} lacks a learner label")
    require(bool(signal.get("semantic")), f"signal {signal_id} lacks resolved semantic")
    require(bool(signal.get("unit")), f"signal {signal_id} lacks resolved unit")
    rep = signal.get("representation", {})
    require(bool(rep.get("xSemantic")), f"signal {signal_id} lacks xSemantic")
    require(bool(rep.get("xUnit")), f"signal {signal_id} lacks xUnit")
    require(bool(rep.get("reductionMethod")), f"signal {signal_id} lacks reduction method")
    x, y = rep.get("x", []), rep.get("y", [])
    require(len(x) == len(y) and len(x) > 1, f"signal {signal_id} has invalid x/y representation")
    require(len(y) <= 600, f"signal {signal_id} exceeds 600 displayed points")
    require(rep.get("originalPointCount", 0) >= len(y), f"signal {signal_id} originalPointCount is invalid")
    require(all(finite_number(v) for v in x), f"signal {signal_id} x values must be finite numeric")
    require(all(finite_number(v) for v in y), f"signal {signal_id} y values must be finite numeric")
    require(all(float(a) <= float(b) for a, b in zip(x, x[1:])), f"signal {signal_id} x axis must be monotonic non-decreasing")


def validate_feature(feature: dict, methods: dict[str, int]):
    feature_id = feature.get("id")
    require(bool(feature_id), "every feature requires a stable id")
    for key in ("method", "methodVersion", "calculationScope", "inputFingerprint", "calculationFingerprint", "value"):
        require(key in feature and feature[key] not in (None, ""), f"feature {feature_id} missing {key}")
    method = feature["method"]
    require(method in methods, f"feature {feature_id} uses unregistered method {method}")
    require(int(feature["methodVersion"]) == methods[method], f"feature {feature_id} method version drift")
    require(bool(SHA256_RE.fullmatch(str(feature["inputFingerprint"]))), f"feature {feature_id} invalid inputFingerprint")
    require(bool(SHA256_RE.fullmatch(str(feature["calculationFingerprint"]))), f"feature {feature_id} invalid calculationFingerprint")
    require(finite_number(feature["value"]), f"feature {feature_id} value must be finite numeric")


def build(candidate: dict, binding: dict) -> dict:
    policy = load(POLICY)
    require(policy.get("schemaVersion") == 2, "V2 policy is unavailable or invalid")
    require(binding.get("schemaVersion") == 2, "binding schemaVersion must be 2")
    require(binding.get("caseId") == candidate["id"], "binding caseId does not match requested candidate")
    require(binding.get("sourceFamily") == candidate["sourceFamily"], "binding source family does not match catalogue")
    require(binding.get("caseId") not in set(policy.get("reservedCaseIds", [])), "MLM-071..MLM-100 are reserved until expansion is unlocked")

    readiness = readiness_by_id()
    require(candidate["sourceFamily"] in readiness, "source family is missing from V2 readiness registry")
    source_gate = readiness[candidate["sourceFamily"]]
    require(source_gate.get("promotionReady") is True, f"source family is not promotion-ready: {source_gate.get('gateReason')}")
    require(source_gate.get("unitsResolved") is True, "source family has unresolved units")
    require(source_gate.get("semanticsResolved") is True, "source family has unresolved semantics")

    require(binding.get("reviewed") is True, "binding must be explicitly engineering-reviewed")
    for key in ("reviewedAt", "reviewerId", "reviewerRole", "reviewRecord"):
        require(bool(binding.get(key)), f"binding {key} is required")
    require(bool(binding.get("sourceReference")), "exact source reference is required")
    require(binding.get("licenceOrAccessStatus") == source_gate.get("rightsScope"), "binding licence/access status must match V2 source readiness registry")
    require(bool(SHA256_RE.fullmatch(str(binding.get("sourceFingerprint", "")))), "exact source SHA-256 is required")
    authoritative = authoritative_fingerprints(source_gate)
    require(binding["sourceFingerprint"] in authoritative, "source SHA-256 is not present in committed benchmark evidence")

    extraction = binding.get("extraction", {})
    require(bool(extraction.get("description")), "an exact extraction/window description is required")
    require(bool(extraction.get("sourceArtifact")), "exact source artifact identity is required")
    require(extraction.get("sourceOrderingPreserved") is True, "source ordering must be explicitly preserved")

    signals = binding.get("signals", [])
    require(bool(signals), "at least one governed measured signal/outcome is required")
    signal_ids = [signal.get("id") for signal in signals]
    require(len(signal_ids) == len(set(signal_ids)), "signal IDs must be unique")
    for signal in signals:
        validate_signal(signal)

    methods = feature_methods()
    features = binding.get("features", [])
    feature_ids = [feature.get("id") for feature in features]
    require(len(feature_ids) == len(set(feature_ids)), "feature IDs must be unique")
    for feature in features:
        validate_feature(feature, methods)

    observations = binding.get("observations", [])
    require(bool(observations), "reviewed observations are required")
    valid_support = {f"signal:{value}" for value in signal_ids} | {f"feature:{value}" for value in feature_ids}
    for observation in observations:
        require(bool(observation.get("id")), "every observation requires a stable id")
        require(bool(observation.get("text")), "every observation requires text")
        require(bool(observation.get("support")), "every observation requires evidence links")
        unknown = sorted(set(observation["support"]) - valid_support)
        require(not unknown, f"observation contains unknown evidence links: {unknown}")

    require(bool(binding.get("limitations")), "evidence limitations are required")
    require(bool(binding.get("supportedConclusions")), "supported conclusions are required")
    require(bool(binding.get("unsupportedConclusions")), "unsupported conclusions are required")
    learner = binding.get("learnerTask", {})
    for key in ("observePrompt", "investigatePrompt", "explanation", "takeaway"):
        require(bool(learner.get(key)), f"learnerTask.{key} is required")

    novelty = binding.get("novelty", {})
    require(bool(novelty.get("learningObjective")), "novelty.learningObjective is required")
    require(isinstance(novelty.get("sourceWindowReuse"), bool), "novelty.sourceWindowReuse must be boolean")
    if novelty["sourceWindowReuse"]:
        require(bool(novelty.get("reuseJustification")), "source-window reuse requires explicit reuseJustification")

    ordered_representations = [
        {"id": signal["id"], "representation": signal["representation"]}
        for signal in sorted(signals, key=lambda item: item["id"])
    ]
    extraction_fingerprint_input = {
        "sourceFingerprint": binding["sourceFingerprint"],
        "extraction": extraction,
        "representations": ordered_representations,
    }
    source_window_fingerprint = canonical_sha(extraction_fingerprint_input)

    case = {
        "schemaVersion": 2,
        "architectureId": "measured-learning-library-v2",
        "id": candidate["id"],
        "title": candidate["title"],
        "difficulty": candidate["difficulty"],
        "analysisLens": candidate["analysisLens"],
        "coverageTags": candidate["coverageTags"],
        "evidenceTier": "measured",
        "claimScope": binding.get("claimScope", "observation_only"),
        "promotionState": "promoted",
        "source": {
            "familyId": candidate["sourceFamily"],
            "datasetId": binding.get("datasetId", candidate["sourceFamily"]),
            "sourceReference": binding["sourceReference"],
            "sourceFingerprint": binding["sourceFingerprint"],
            "sourceWindowFingerprint": source_window_fingerprint,
            "licenceOrAccessStatus": binding["licenceOrAccessStatus"],
            "extraction": extraction,
        },
        "signals": signals,
        "features": features,
        "observations": observations,
        "learnerTask": learner,
        "novelty": novelty,
        "evidence": {
            "sourceEstablishesCausality": bool(binding.get("sourceEstablishesCausality", False)),
            "supportedConclusions": binding["supportedConclusions"],
            "unsupportedConclusions": binding["unsupportedConclusions"],
            "limitations": binding["limitations"],
        },
        "review": {
            "reviewed": True,
            "reviewerId": binding["reviewerId"],
            "reviewerRole": binding["reviewerRole"],
            "reviewRecord": binding["reviewRecord"],
            "reviewedAt": binding["reviewedAt"],
        },
    }
    require(case["claimScope"] in {"observation_only", "association"}, "public measured promotion permits only observation_only or association")
    case["caseFingerprint"] = canonical_sha(case)
    return case


def promote_index(case_id: str):
    index = load(PROMOTION_INDEX)
    require(index.get("libraryId") == "measured-learning-library-v1", "promotion index libraryId drift")
    ids = list(index.get("caseIds", []))
    if case_id not in ids:
        ids.append(case_id)
    ids.sort(key=lambda value: int(value.split("-")[1]))
    index["caseIds"] = ids
    write_json(PROMOTION_INDEX, index)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("case_id", help="MLM-001..MLM-070 under the current V2 release gate")
    parser.add_argument("binding", type=Path, help="reviewed V2 local binding JSON")
    parser.add_argument("--output-dir", type=Path, default=OUT_DIR)
    parser.add_argument("--no-index", action="store_true", help="do not update promoted-v1.json (scratch/test output only)")
    args = parser.parse_args()

    catalogue = catalogue_by_id()
    require(args.case_id in catalogue, f"unknown release-catalogue case {args.case_id}")
    binding = load(args.binding)
    case = build(catalogue[args.case_id], binding)

    hard_case_bytes = int(load(POLICY)["payloadBudget"]["hardCaseBytes"])
    rendered = json.dumps(case, indent=2, ensure_ascii=False) + "\n"
    require(len(rendered.encode("utf-8")) <= hard_case_bytes, f"promoted case exceeds V2 hard payload budget of {hard_case_bytes} bytes")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    out = args.output_dir / f"{args.case_id}.json"
    out.write_text(rendered, encoding="utf-8")
    if not args.no_index:
        require(args.output_dir.resolve() == OUT_DIR.resolve(), "promotion index can only be updated for the canonical cases directory")
        promote_index(args.case_id)
    print(out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
