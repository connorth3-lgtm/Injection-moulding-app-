#!/usr/bin/env python3
"""Build one governed measured-learning case under the hardened V2 contract."""
from __future__ import annotations

import argparse
import json
import os
import tempfile
from pathlib import Path

from measured_learning_core import (
    calculate_feature, canonical_sha, finite_number, load_json,
    normalize_source_artifacts, normalize_source_members,
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
REVIEW_TYPES = {"github-pr", "github-issue", "signed-review", "external-record", "test-fixture"}


def require(condition: bool, message: str):
    if not condition:
        raise SystemExit(message)


def expand_rows(manifest: dict) -> list[dict]:
    fields = manifest["fields"]
    return [dict(zip(fields, row)) for row in manifest.get("cases", [])]


def ready_sources() -> dict[str, dict]:
    return {s["datasetId"]:s for s in load_json(READINESS).get("sources", [])}


def channel_registry() -> dict[str, dict[str, dict]]:
    result: dict[str, dict[str, dict]] = {}
    docs = [load_json(CHANNELS)]
    for path in sorted((ROOT / "data/measured-learning").glob("source-channels-*-v2.json")):
        doc = load_json(path)
        docs.append({"sources":[{"datasetId":doc["datasetId"],"channels":doc.get("channels", [])}]} if "datasetId" in doc else doc)
    for doc in docs:
        for source in doc.get("sources", []):
            bucket = result.setdefault(source["datasetId"], {})
            for channel in source.get("channels", []):
                key = channel["sourceChannel"]
                require(key not in bucket, f"duplicate governed source channel: {source['datasetId']}/{key}")
                bucket[key] = channel
    return result


def artifact_registry() -> dict[str, dict[str, dict]]:
    return {s["datasetId"]:{a["name"]:a for a in s.get("artifacts", [])} for s in load_json(ARTIFACTS).get("sources", [])}


def feature_methods() -> dict[str, int]:
    return {m["id"]:int(m["version"]) for m in load_json(FEATURE_METHODS).get("methods", [])}


def requirements_doc() -> dict:
    return load_json(REQUIREMENTS)


def case_required_capabilities(candidate: dict) -> set[str]:
    rules = requirements_doc(); required = set()
    for tag in candidate.get("coverageTags", []):
        required.update(rules.get("requirementsByCoverageTag", {}).get(tag, []))
    required.update(rules.get("caseOverrides", {}).get(candidate["id"], []))
    return required


def case_required_source_channels(candidate: dict) -> set[str]:
    return set(requirements_doc().get("requiredSourceChannelsByCase", {}).get(candidate["id"], []))


def expansion_gate_preconditions() -> bool:
    gate = load_json(POLICY)["expansionGate"]
    promoted = load_json(PROMOTION_INDEX).get("caseIds", [])
    ready_count = sum(1 for s in ready_sources().values() if s.get("promotionReady"))
    return len(promoted) >= int(gate["minimumPromotedCasesBeforeAuthoringExpansion"]) and ready_count >= int(gate["minimumPromotionReadySourceFamilies"])


def catalogue_by_id() -> dict[str, dict]:
    base = expand_rows(load_json(MANIFEST)); extra = expand_rows(load_json(EXPANSION))
    if extra:
        require(expansion_gate_preconditions(), "MLM-071..MLM-100 cannot be authored until the V2 expansion gate preconditions pass")
        require([c["id"] for c in extra] == [f"MLM-{i:03d}" for i in range(71,101)], "expansion manifest must contain full ordered MLM-071..MLM-100 set")
    return {c["id"]:c for c in base + extra}


def validate_signal(signal: dict, governed_channels: dict[str, dict], selected_artifact_names: set[str]) -> dict:
    sid = signal.get("id"); require(bool(sid), "every signal requires a stable id")
    ch = signal.get("sourceChannel"); require(ch in governed_channels, f"signal {sid}: unregistered or blocked sourceChannel {ch!r}")
    governed = governed_channels[ch]
    require(governed.get("promotionReady") is True, f"signal {sid}: source channel is not promotion-ready")
    require(signal.get("semantic") == governed.get("semantic"), f"signal {sid}: semantic must exactly match governed source channel")
    require(signal.get("unit") == governed.get("unit"), f"signal {sid}: unit must exactly match governed source channel")
    require(bool(signal.get("label")), f"signal {sid}: label is required")
    if signal.get("sourceArtifact"):
        require(signal["sourceArtifact"] in selected_artifact_names, f"signal {sid}: sourceArtifact is not in selected sourceArtifacts")
    rep = signal.get("representation", {})
    require(rep.get("xSemantic") == governed.get("coordinateSemantic"), f"signal {sid}: xSemantic must match governed coordinate")
    require(rep.get("xUnit") == governed.get("coordinateUnit"), f"signal {sid}: xUnit must match governed coordinate")
    require(bool(rep.get("reductionMethod")), f"signal {sid}: reductionMethod is required")
    x, y = rep.get("x", []), rep.get("y", [])
    require(len(x) == len(y) and len(x) > 1, f"signal {sid}: invalid x/y representation")
    require(len(y) <= 600 and rep.get("originalPointCount", 0) >= len(y), f"signal {sid}: invalid point-count boundary")
    require(all(finite_number(v) for v in x+y), f"signal {sid}: x/y values must be finite numeric")
    try:
        direction = x_direction(x, rep.get("xDirection"))
    except ValueError as exc:
        raise SystemExit(f"signal {sid}: {exc}") from exc
    clean = dict(signal); clean_rep = dict(rep); clean_rep["xDirection"] = direction; clean["representation"] = clean_rep
    return clean


def selected_artifacts_from_binding(binding: dict, extraction: dict, family_artifacts: dict[str, dict]) -> tuple[list[dict], bool]:
    multi = extraction.get("sourceArtifacts") is not None
    if multi:
        require(extraction.get("sourceArtifact") in (None, ""), "use sourceArtifacts or sourceArtifact, not both")
        require(binding.get("sourceFingerprint") in (None, ""), "multi-artifact bindings must not invent one aggregate sourceFingerprint")
        try:
            selected = normalize_source_artifacts(extraction.get("sourceArtifacts"))
        except ValueError as exc:
            raise SystemExit(str(exc)) from exc
    else:
        name = extraction.get("sourceArtifact")
        try:
            selected = normalize_source_artifacts(name, binding.get("sourceFingerprint"))
        except ValueError as exc:
            raise SystemExit(str(exc)) from exc
    for item in selected:
        require(item["name"] in family_artifacts, f"exact source artifact is not registered: {item['name']}")
        require(item["sha256"] == family_artifacts[item["name"]].get("sha256"), f"source artifact hash mismatch: {item['name']}")
    return selected, multi


def build(candidate: dict, binding: dict) -> dict:
    load_json(POLICY)
    require(binding.get("schemaVersion") == 2, "binding schemaVersion must be 2")
    require(binding.get("caseId") == candidate["id"], "binding caseId does not match candidate")
    require(binding.get("sourceFamily") == candidate["sourceFamily"], "binding sourceFamily does not match catalogue")
    readiness = ready_sources(); family = candidate["sourceFamily"]
    require(readiness.get(family, {}).get("promotionReady") is True, f"source family is not promotion-ready: {readiness.get(family, {}).get('gateReason','missing readiness')}")
    source_gate = readiness[family]
    required_capabilities = case_required_capabilities(candidate)
    missing = sorted(cap for cap in required_capabilities if source_gate.get("capabilities", {}).get(cap) is not True)
    require(not missing, f"source family lacks required case capabilities: {missing}")

    extraction = binding.get("extraction", {}); require(bool(extraction.get("description")), "extraction.description is required")
    require(extraction.get("sourceOrderingPreserved") is True, "source ordering must be explicitly preserved")
    family_artifacts = artifact_registry().get(family, {})
    selected_artifacts, multi_artifact = selected_artifacts_from_binding(binding, extraction, family_artifacts)
    selected_names = {a["name"] for a in selected_artifacts}
    legacy_member = extraction.get("sourceMember"); listed_members = extraction.get("sourceMembers")
    require(not (legacy_member is not None and listed_members is not None), "use sourceMember or sourceMembers, not both")
    try:
        source_members = normalize_source_members(listed_members if listed_members is not None else legacy_member)
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc

    governed_channels = channel_registry().get(family, {})
    signals = [validate_signal(s, governed_channels, selected_names) for s in binding.get("signals", [])]
    require(signals, "at least one governed measured signal/outcome is required")
    require(len({s["id"] for s in signals}) == len(signals), "signal IDs must be unique")
    if "multi-signal" in candidate.get("coverageTags", []):
        require(len(signals) >= 2, "multi-signal case requires at least two bound signals")
    required_channels = case_required_source_channels(candidate); bound_channels = {s["sourceChannel"] for s in signals}
    require(not sorted(required_channels-bound_channels), f"case is missing required governed source channels: {sorted(required_channels-bound_channels)}")
    for ch in required_channels:
        require(governed_channels.get(ch, {}).get("promotionReady") is True, f"required source channel is not promotion-ready: {ch}")
    governed_members = {governed_channels[s["sourceChannel"]].get("sourceMember") for s in signals if governed_channels[s["sourceChannel"]].get("sourceMember")}
    if governed_members:
        require(set(source_members) == governed_members, f"extraction sourceMembers must exactly match bound channel members: {sorted(governed_members)}")
    elif source_members:
        require(len(selected_artifacts) == 1, "archive sourceMembers require exactly one selected archive artifact")
        require(set(source_members) <= set(family_artifacts[selected_artifacts[0]["name"]].get("members", [])), "source member is not governed for selected artifact")

    if multi_artifact:
        raw_fp = raw_window_fingerprint(None, selected_artifacts, source_members, extraction)
    else:
        raw_fp = raw_window_fingerprint(binding["sourceFingerprint"], selected_artifacts[0]["name"], source_members, extraction)
    rep_fp = representation_fingerprint(raw_fp, signals)
    methods = feature_methods(); signals_by_id = {s["id"]:s for s in signals}; features = []
    for spec in binding.get("features", []):
        try:
            features.append(calculate_feature(spec, signals_by_id, methods))
        except ValueError as exc:
            raise SystemExit(str(exc)) from exc
    require(len({f["id"] for f in features}) == len(features), "feature IDs must be unique")
    observations = binding.get("observations", []); require(observations, "reviewed observations are required")
    valid_support = {f"signal:{s['id']}" for s in signals} | {f"feature:{f['id']}" for f in features}
    for obs in observations:
        require(obs.get("id") and obs.get("text") and obs.get("support"), "every observation requires id, text and evidence links")
        require(not (set(obs["support"])-valid_support), f"observation contains unknown evidence links: {sorted(set(obs['support'])-valid_support)}")
    for key in ("supportedConclusions","unsupportedConclusions","limitations"):
        require(binding.get(key), f"{key} is required")
    learner = binding.get("learnerTask", {})
    for key in ("observePrompt","investigatePrompt","explanation","takeaway"):
        require(learner.get(key), f"learnerTask.{key} is required")
    novelty = binding.get("novelty", {}); require(novelty.get("learningObjective"), "novelty.learningObjective is required")
    require(isinstance(novelty.get("sourceWindowReuse"), bool), "novelty.sourceWindowReuse must be boolean")
    if novelty["sourceWindowReuse"]:
        require(novelty.get("reuseJustification"), "source-window reuse requires reuseJustification")
    require(binding.get("reviewed") is True, "binding must be explicitly reviewed")
    for key in ("authorId","reviewerId","reviewerRole","reviewRecordType","reviewRecord","reviewedAt"):
        require(binding.get(key), f"binding {key} is required")
    require(binding["authorId"] != binding["reviewerId"], "reviewerId must differ from authorId")
    require(binding["reviewRecordType"] in REVIEW_TYPES, "unsupported reviewRecordType")
    claim_scope = binding.get("claimScope", "observation_only"); require(claim_scope in {"observation_only","association"}, "public measured promotion permits observation_only or association")
    require(binding.get("licenceOrAccessStatus") == source_gate.get("rightsScope"), "licence/access status must match source readiness registry")

    source = {
        "familyId":family,"datasetId":binding.get("datasetId",family),"sourceReference":binding["sourceReference"],
        "sourceMembers":source_members,"rawWindowFingerprint":raw_fp,"representationFingerprint":rep_fp,
        "licenceOrAccessStatus":binding["licenceOrAccessStatus"],"extraction":extraction,
    }
    if multi_artifact:
        source["sourceArtifacts"] = selected_artifacts
    else:
        source["sourceArtifact"] = selected_artifacts[0]["name"]; source["sourceFingerprint"] = selected_artifacts[0]["sha256"]
    case = {
        "schemaVersion":3,"architectureId":"measured-learning-library-v2","id":candidate["id"],"title":candidate["title"],"difficulty":candidate["difficulty"],
        "analysisLens":candidate["analysisLens"],"coverageTags":candidate["coverageTags"],"requiredCapabilities":sorted(required_capabilities),"requiredSourceChannels":sorted(required_channels),
        "evidenceTier":"measured","claimScope":claim_scope,"promotionState":"promoted","source":source,"signals":signals,"features":features,"observations":observations,
        "learnerTask":learner,"novelty":novelty,
        "evidence":{"sourceEstablishesCausality":False,"supportedConclusions":binding["supportedConclusions"],"unsupportedConclusions":binding["unsupportedConclusions"],"limitations":binding["limitations"]},
        "review":{"reviewed":True,"authorId":binding["authorId"],"reviewerId":binding["reviewerId"],"reviewerRole":binding["reviewerRole"],"reviewRecordType":binding["reviewRecordType"],"reviewRecord":binding["reviewRecord"],"reviewedAt":binding["reviewedAt"]},
    }
    case["caseFingerprint"] = canonical_sha(case); return case


def write_staged(path: Path, text: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=path.name+".", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd,"w",encoding="utf-8") as handle:
            handle.write(text); handle.flush(); os.fsync(handle.fileno())
        os.replace(temp_name, path)
    finally:
        if os.path.exists(temp_name): os.unlink(temp_name)


def main() -> int:
    parser = argparse.ArgumentParser(); parser.add_argument("case_id"); parser.add_argument("binding", type=Path); parser.add_argument("--output-dir", type=Path, default=OUT_DIR); parser.add_argument("--no-index", action="store_true"); args = parser.parse_args()
    catalogue = catalogue_by_id(); require(args.case_id in catalogue, f"unknown or gated catalogue case {args.case_id}")
    case = build(catalogue[args.case_id], load_json(args.binding)); rendered = json.dumps(case, indent=2, ensure_ascii=False)+"\n"
    hard = int(load_json(POLICY)["payloadBudget"]["hardCaseBytes"]); require(len(rendered.encode("utf-8")) <= hard, f"promoted case exceeds hard payload budget of {hard} bytes")
    out = args.output_dir / f"{args.case_id}.json"
    if args.no_index:
        write_staged(out, rendered)
    else:
        require(args.output_dir.resolve() == OUT_DIR.resolve(), "promotion index may only be updated with canonical case output")
        index = load_json(PROMOTION_INDEX); ids = list(index.get("caseIds", []))
        if args.case_id not in ids: ids.append(args.case_id)
        ids.sort(key=lambda value:int(value.split("-")[1])); index["caseIds"] = ids
        write_staged(out, rendered); write_staged(PROMOTION_INDEX, json.dumps(index, indent=2, ensure_ascii=False)+"\n")
    print(out); return 0


if __name__ == "__main__":
    raise SystemExit(main())
