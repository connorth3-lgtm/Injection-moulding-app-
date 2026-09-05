#!/usr/bin/env python3
"""Build one governed measured-learning case under the hardened V2 contract.

The binding supplies reviewed teaching intent and compact measured signals. The builder
verifies exact source artifact/channel governance, computes feature values/fingerprints,
and separates raw-window identity from learner-representation identity.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import tempfile
from pathlib import Path

from measured_learning_core import (
    calculate_feature, canonical_sha, finite_number, load_json,
    raw_window_fingerprint, representation_fingerprint, x_direction,
)

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/measured-learning/manifest-v1.json"
EXPANSION = ROOT / "data/measured-learning/expansion-manifest-v2.json"
PROMOTION_INDEX = ROOT / "data/measured-learning/promoted-v1.json"
POLICY = ROOT / "data/measured-learning/v2-policy.json"
READINESS = ROOT / "data/measured-learning/source-readiness-v2.json"
ARTIFACTS = ROOT / "data/measured-learning/source-artifacts-v2.json"
CHANNELS = ROOT / "data/measured-learning/source-channels-v2.json"
REQUIREMENTS = ROOT / "data/measured-learning/case-requirements-v2.json"
FEATURE_METHODS = ROOT / "data/measured-learning/feature-methods-v1.json"
OUT_DIR = ROOT / "data/measured-learning/cases"
SHA256_RE = re.compile(r"sha256:[0-9a-f]{64}")
REVIEW_TYPES = {"github-pr", "github-issue", "signed-review", "external-record", "test-fixture"}


def require(condition: bool, message: str):
    if not condition:
        raise SystemExit(message)


def expand_rows(manifest: dict) -> list[dict]:
    fields = manifest["fields"]
    return [dict(zip(fields, row)) for row in manifest.get("cases", [])]


def ready_sources() -> dict[str, dict]:
    return {s["datasetId"]: s for s in load_json(READINESS).get("sources", [])}


def expansion_gate_preconditions() -> bool:
    policy = load_json(POLICY)["expansionGate"]
    promoted = load_json(PROMOTION_INDEX).get("caseIds", [])
    ready_count = sum(1 for s in ready_sources().values() if s.get("promotionReady"))
    return len(promoted) >= int(policy["minimumPromotedCasesBeforeAuthoringExpansion"]) and ready_count >= int(policy["minimumPromotionReadySourceFamilies"])


def catalogue_by_id() -> dict[str, dict]:
    base = expand_rows(load_json(MANIFEST))
    expansion = load_json(EXPANSION)
    extra = expand_rows(expansion)
    if extra:
        require(expansion_gate_preconditions(), "MLM-071..MLM-100 cannot be authored until the V2 expansion gate preconditions pass")
        require([c["id"] for c in extra] == [f"MLM-{i:03d}" for i in range(71, 101)], "expansion manifest must contain the full ordered MLM-071..MLM-100 set")
    all_cases = base + extra
    return {c["id"]: c for c in all_cases}


def artifact_registry() -> dict[str, dict[str, dict]]:
    result = {}
    for source in load_json(ARTIFACTS).get("sources", []):
        result[source["datasetId"]] = {a["name"]: a for a in source.get("artifacts", [])}
    return result


def channel_registry() -> dict[str, dict[str, dict]]:
    result = {}
    for source in load_json(CHANNELS).get("sources", []):
        result[source["datasetId"]] = {c["sourceChannel"]: c for c in source.get("channels", [])}
    return result


def feature_methods() -> dict[str, int]:
    return {m["id"]: int(m["version"]) for m in load_json(FEATURE_METHODS).get("methods", [])}


def case_required_capabilities(candidate: dict) -> set[str]:
    rules = load_json(REQUIREMENTS)
    required = set()
    for tag in candidate.get("coverageTags", []):
        required.update(rules.get("requirementsByCoverageTag", {}).get(tag, []))
    required.update(rules.get("caseOverrides", {}).get(candidate["id"], []))
    return required


def validate_signal(signal: dict, governed_channels: dict[str, dict]) -> dict:
    signal_id = signal.get("id")
    require(bool(signal_id), "every signal requires a stable id")
    source_channel = signal.get("sourceChannel")
    require(source_channel in governed_channels, f"signal {signal_id}: unregistered or blocked sourceChannel {source_channel!r}")
    governed = governed_channels[source_channel]
    require(governed.get("promotionReady") is True, f"signal {signal_id}: source channel is not promotion-ready")
    require(signal.get("semantic") == governed.get("semantic"), f"signal {signal_id}: semantic must exactly match governed source channel")
    require(signal.get("unit") == governed.get("unit"), f"signal {signal_id}: unit must exactly match governed source channel")
    require(bool(signal.get("label")), f"signal {signal_id}: label is required")
    rep = signal.get("representation", {})
    require(rep.get("xSemantic") == governed.get("coordinateSemantic"), f"signal {signal_id}: xSemantic must match governed coordinate")
    require(rep.get("xUnit") == governed.get("coordinateUnit"), f"signal {signal_id}: xUnit must match governed coordinate")
    require(bool(rep.get("reductionMethod")), f"signal {signal_id}: reductionMethod is required")
    x, y = rep.get("x", []), rep.get("y", [])
    require(len(x) == len(y) and len(x) > 1, f"signal {signal_id}: invalid x/y representation")
    require(len(y) <= 600, f"signal {signal_id}: exceeds 600 displayed points")
    require(rep.get("originalPointCount", 0) >= len(y), f"signal {signal_id}: invalid originalPointCount")
    require(all(finite_number(v) for v in x), f"signal {signal_id}: x values must be finite numeric")
    require(all(finite_number(v) for v in y), f"signal {signal_id}: y values must be finite numeric")
    try:
        direction = x_direction(x, rep.get("xDirection"))
    except ValueError as exc:
        raise SystemExit(f"signal {signal_id}: {exc}") from exc
    clean = dict(signal)
    clean["sourceChannel"] = source_channel
    clean_rep = dict(rep)
    clean_rep["xDirection"] = direction
    clean["representation"] = clean_rep
    return clean


def build(candidate: dict, binding: dict) -> dict:
    load_json(POLICY)
    require(binding.get("schemaVersion") == 2, "binding schemaVersion must be 2")
    require(binding.get("caseId") == candidate["id"], "binding caseId does not match candidate")
    require(binding.get("sourceFamily") == candidate["sourceFamily"], "binding sourceFamily does not match catalogue")

    readiness = ready_sources()
    family = candidate["sourceFamily"]
    require(family in readiness and readiness[family].get("promotionReady") is True, f"source family is not promotion-ready: {readiness.get(family, {}).get('gateReason', 'missing readiness')}" )
    source_gate = readiness[family]
    required = case_required_capabilities(candidate)
    capabilities = source_gate.get("capabilities", {})
    missing = sorted(cap for cap in required if capabilities.get(cap) is not True)
    require(not missing, f"source family lacks required case capabilities: {missing}")

    artifacts = artifact_registry().get(family, {})
    extraction = binding.get("extraction", {})
    source_artifact = extraction.get("sourceArtifact")
    require(source_artifact in artifacts, f"exact source artifact is not registered for {family}: {source_artifact!r}")
    artifact = artifacts[source_artifact]
    require(binding.get("sourceFingerprint") == artifact.get("sha256"), "sourceFingerprint must match the exact registered sourceArtifact")
    require(SHA256_RE.fullmatch(str(binding.get("sourceFingerprint", ""))) is not None, "sourceFingerprint must be SHA-256")
    source_member = extraction.get("sourceMember")
    if source_member is not None:
        require(source_member in artifact.get("members", []), "sourceMember is not governed for the selected artifact")
    require(bool(extraction.get("description")), "extraction.description is required")
    require(extraction.get("sourceOrderingPreserved") is True, "source ordering must be explicitly preserved")

    governed_channels = channel_registry().get(family, {})
    signals = [validate_signal(signal, governed_channels) for signal in binding.get("signals", [])]
    require(signals, "at least one governed measured signal/outcome is required")
    signal_ids = [s["id"] for s in signals]
    require(len(signal_ids) == len(set(signal_ids)), "signal IDs must be unique")
    if "multi-signal" in candidate.get("coverageTags", []):
        require(len(signals) >= 2, "multi-signal case requires at least two bound signals")

    raw_window_fp = raw_window_fingerprint(binding["sourceFingerprint"], source_artifact, source_member, extraction)
    representation_fp = representation_fingerprint(raw_window_fp, signals)

    methods = feature_methods()
    signals_by_id = {s["id"]: s for s in signals}
    features = []
    for spec in binding.get("features", []):
        try:
            features.append(calculate_feature(spec, signals_by_id, methods))
        except ValueError as exc:
            raise SystemExit(str(exc)) from exc
    feature_ids = [f["id"] for f in features]
    require(len(feature_ids) == len(set(feature_ids)), "feature IDs must be unique")

    observations = binding.get("observations", [])
    require(observations, "reviewed observations are required")
    valid_support = {f"signal:{v}" for v in signal_ids} | {f"feature:{v}" for v in feature_ids}
    for observation in observations:
        require(observation.get("id") and observation.get("text") and observation.get("support"), "every observation requires id, text and evidence links")
        unknown = sorted(set(observation["support"]) - valid_support)
        require(not unknown, f"observation contains unknown evidence links: {unknown}")

    for key in ("supportedConclusions", "unsupportedConclusions", "limitations"):
        require(binding.get(key), f"{key} is required")
    learner = binding.get("learnerTask", {})
    for key in ("observePrompt", "investigatePrompt", "explanation", "takeaway"):
        require(learner.get(key), f"learnerTask.{key} is required")

    novelty = binding.get("novelty", {})
    require(novelty.get("learningObjective"), "novelty.learningObjective is required")
    require(isinstance(novelty.get("sourceWindowReuse"), bool), "novelty.sourceWindowReuse must be boolean")
    if novelty["sourceWindowReuse"]:
        require(novelty.get("reuseJustification"), "source-window reuse requires reuseJustification")

    require(binding.get("reviewed") is True, "binding must be explicitly reviewed")
    for key in ("authorId", "reviewerId", "reviewerRole", "reviewRecordType", "reviewRecord", "reviewedAt"):
        require(binding.get(key), f"binding {key} is required")
    require(binding["authorId"] != binding["reviewerId"], "reviewerId must differ from authorId")
    require(binding["reviewRecordType"] in REVIEW_TYPES, "unsupported reviewRecordType")

    claim_scope = binding.get("claimScope", "observation_only")
    require(claim_scope in {"observation_only", "association"}, "public measured promotion permits observation_only or association")
    require(binding.get("licenceOrAccessStatus") == source_gate.get("rightsScope"), "licence/access status must match source readiness registry")

    case = {
        "schemaVersion": 3,
        "architectureId": "measured-learning-library-v2",
        "id": candidate["id"], "title": candidate["title"], "difficulty": candidate["difficulty"],
        "analysisLens": candidate["analysisLens"], "coverageTags": candidate["coverageTags"],
        "requiredCapabilities": sorted(required),
        "evidenceTier": "measured", "claimScope": claim_scope, "promotionState": "promoted",
        "source": {
            "familyId": family, "datasetId": binding.get("datasetId", family),
            "sourceReference": binding["sourceReference"], "sourceArtifact": source_artifact,
            "sourceMember": source_member, "sourceFingerprint": binding["sourceFingerprint"],
            "rawWindowFingerprint": raw_window_fp, "representationFingerprint": representation_fp,
            "licenceOrAccessStatus": binding["licenceOrAccessStatus"], "extraction": extraction,
        },
        "signals": signals, "features": features, "observations": observations,
        "learnerTask": learner, "novelty": novelty,
        "evidence": {
            "sourceEstablishesCausality": False,
            "supportedConclusions": binding["supportedConclusions"],
            "unsupportedConclusions": binding["unsupportedConclusions"],
            "limitations": binding["limitations"],
        },
        "review": {
            "reviewed": True, "authorId": binding["authorId"], "reviewerId": binding["reviewerId"],
            "reviewerRole": binding["reviewerRole"], "reviewRecordType": binding["reviewRecordType"],
            "reviewRecord": binding["reviewRecord"], "reviewedAt": binding["reviewedAt"],
        },
    }
    case["caseFingerprint"] = canonical_sha(case)
    return case


def write_staged(path: Path, text: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(text)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_name, path)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("case_id")
    parser.add_argument("binding", type=Path)
    parser.add_argument("--output-dir", type=Path, default=OUT_DIR)
    parser.add_argument("--no-index", action="store_true")
    args = parser.parse_args()

    catalogue = catalogue_by_id()
    require(args.case_id in catalogue, f"unknown or gated catalogue case {args.case_id}")
    case = build(catalogue[args.case_id], load_json(args.binding))
    rendered = json.dumps(case, indent=2, ensure_ascii=False) + "\n"
    hard = int(load_json(POLICY)["payloadBudget"]["hardCaseBytes"])
    require(len(rendered.encode("utf-8")) <= hard, f"promoted case exceeds hard payload budget of {hard} bytes")

    out = args.output_dir / f"{args.case_id}.json"
    if args.no_index:
        write_staged(out, rendered)
    else:
        require(args.output_dir.resolve() == OUT_DIR.resolve(), "promotion index may only be updated with canonical case output")
        index = load_json(PROMOTION_INDEX)
        ids = list(index.get("caseIds", []))
        if args.case_id not in ids:
            ids.append(args.case_id)
        ids.sort(key=lambda value: int(value.split("-")[1]))
        index["caseIds"] = ids
        index_text = json.dumps(index, indent=2, ensure_ascii=False) + "\n"
        write_staged(out, rendered)
        write_staged(PROMOTION_INDEX, index_text)
    print(out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
