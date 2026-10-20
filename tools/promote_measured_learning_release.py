#!/usr/bin/env python3
"""Fail-closed production handoff for independently reviewed measured-learning bindings.

The V2 review queue and review packets are intentionally transient and unreviewed. This
module defines the source-controlled handoff that comes after genuine case-specific review:
canonical reviewed binding -> pinned binding registry -> canonical learner case -> promotion
index. It never manufactures review identity or decisions.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import tempfile
from pathlib import Path
from urllib.parse import urlparse

from measured_learning_core import canonical_sha, load_json
import build_measured_learning_case as builder

ROOT = Path(__file__).resolve().parents[1]
GATE_PATH = ROOT / "data/measured-learning/production-gate-v2.json"
REGISTRY_PATH = ROOT / "data/measured-learning/reviewed-bindings-index-v2.json"
PROMOTION_INDEX = ROOT / "data/measured-learning/promoted-v1.json"
CASE_DIR = ROOT / "data/measured-learning/cases"
UTC_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
CASE_ID_RE = re.compile(r"^MLM-\d{3}$")
GITHUB_PR_RE = re.compile(r"^https://github\.com/[^/]+/[^/]+/pull/\d+(?:#pullrequestreview-\d+)?$")
GITHUB_ISSUE_RE = re.compile(r"^https://github\.com/[^/]+/[^/]+/issues/\d+(?:#issuecomment-\d+)?$")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_gate() -> dict:
    gate = load_json(GATE_PATH)
    require(gate.get("schemaVersion") == 2, "production gate schemaVersion must be 2")
    require(gate.get("gateId") == "measured-learning-production-gate-v2", "unexpected production gate id")
    require(gate.get("reviewedBindingRegistry") == "data/measured-learning/reviewed-bindings-index-v2.json", "unexpected reviewed-binding registry path")
    require(gate.get("bindingDirectory") == "data/measured-learning/reviewed-bindings", "unexpected reviewed-binding directory")
    require(gate.get("promotionIndex") == "data/measured-learning/promoted-v1.json", "unexpected promotion index path")
    require(gate.get("caseDirectory") == "data/measured-learning/cases", "unexpected case directory")
    return gate


def _stable_review_reference(kind: str, reference: str) -> bool:
    if kind == "github-pr":
        return bool(GITHUB_PR_RE.fullmatch(reference))
    if kind == "github-issue":
        return bool(GITHUB_ISSUE_RE.fullmatch(reference))
    if kind == "external-record":
        parsed = urlparse(reference)
        return parsed.scheme == "https" and bool(parsed.netloc)
    if kind == "signed-review":
        parsed = urlparse(reference)
        if parsed.scheme == "https" and parsed.netloc:
            return True
        candidate = (ROOT / reference).resolve()
        try:
            candidate.relative_to(ROOT.resolve())
        except ValueError:
            return False
        return candidate.is_file()
    return False


def validate_production_review(binding: dict, gate: dict | None = None) -> None:
    gate = gate or load_gate()
    require(binding.get("schemaVersion") == 2, "production binding schemaVersion must be 2")
    require(binding.get("reviewed") is True, "production binding must be explicitly reviewed")
    author = str(binding.get("authorId") or "").strip()
    reviewer = str(binding.get("reviewerId") or "").strip()
    require(bool(author) and bool(reviewer), "production binding requires authorId and reviewerId")
    if gate.get("requireIndependentReviewer"):
        require(author != reviewer, "production reviewerId must differ from authorId")
    require(binding.get("reviewerRole") == gate.get("requiredReviewerRole"), "production reviewerRole must be engineering-evidence-review")
    kind = binding.get("reviewRecordType")
    allowed = set(gate.get("allowedProductionReviewRecordTypes", []))
    forbidden = set(gate.get("forbiddenProductionReviewRecordTypes", []))
    require(kind in allowed and kind not in forbidden, f"reviewRecordType is not valid for production promotion: {kind!r}")
    reference = str(binding.get("reviewRecord") or "").strip()
    require(_stable_review_reference(kind, reference), f"reviewRecord is not a stable resolvable {kind} reference")
    reviewed_at = str(binding.get("reviewedAt") or "")
    require(bool(UTC_RE.fullmatch(reviewed_at)), "reviewedAt must be an explicit UTC timestamp YYYY-MM-DDTHH:MM:SSZ")
    if gate.get("requireExplicitNonCausalSource"):
        require(binding.get("sourceEstablishesCausality") is False, "public measured production binding must explicitly set sourceEstablishesCausality=false")


def _binding_relpath(case_id: str) -> str:
    return f"data/measured-learning/reviewed-bindings/{case_id}.json"


def _load_registry_document(gate: dict) -> dict:
    registry = load_json(REGISTRY_PATH)
    require(registry.get("schemaVersion") == 2, "reviewed-binding registry schemaVersion must be 2")
    require(registry.get("registryId") == "measured-learning-reviewed-bindings-v2", "unexpected reviewed-binding registry id")
    require(registry.get("bindingDirectory") == gate.get("bindingDirectory"), "reviewed-binding registry directory drift")
    require(isinstance(registry.get("bindings"), list), "reviewed-binding registry bindings must be a list")
    return registry


def load_registry(skip_case_id: str | None = None) -> tuple[dict, dict, list[tuple[dict, dict]]]:
    gate = load_gate()
    registry = _load_registry_document(gate)
    catalogue = builder.catalogue_by_id()
    ids = [entry.get("caseId") for entry in registry["bindings"]]
    require(all(isinstance(case_id, str) and CASE_ID_RE.fullmatch(case_id) for case_id in ids), "every reviewed-binding registry entry requires a valid MLM-xxx caseId")
    require(len(ids) == len(set(ids)), "duplicate caseId in reviewed-binding registry")
    require(ids == sorted(ids, key=lambda value: int(value.split("-")[1])), "reviewed-binding registry must be ordered by caseId")
    loaded: list[tuple[dict, dict]] = []
    for entry in registry["bindings"]:
        case_id = entry["caseId"]
        require(case_id in catalogue, f"reviewed binding is not in the currently available catalogue: {case_id}")
        expected_path = _binding_relpath(case_id)
        require(entry.get("path") == expected_path, f"{case_id}: reviewed binding must use canonical path {expected_path}")
        if case_id == skip_case_id:
            continue
        path = ROOT / expected_path
        require(path.is_file(), f"{case_id}: canonical reviewed binding file is missing")
        binding = load_json(path)
        require(binding.get("caseId") == case_id, f"{case_id}: binding caseId/path mismatch")
        validate_production_review(binding, gate)
        if gate.get("requireBindingFingerprintPin"):
            require(entry.get("bindingFingerprint") == canonical_sha(binding), f"{case_id}: reviewed binding fingerprint mismatch")
        loaded.append((entry, binding))
    return gate, registry, loaded


def build_registered_cases(loaded: list[tuple[dict, dict]] | None = None) -> list[dict]:
    if loaded is None:
        _, _, loaded = load_registry()
    catalogue = builder.catalogue_by_id()
    built = []
    for entry, binding in loaded:
        case_id = entry["caseId"]
        built.append(builder.build(catalogue[case_id], binding))
    return built


def write_atomic(path: Path, text: str) -> None:
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


def register_binding(path_arg: Path) -> dict:
    gate = load_gate()
    registry = _load_registry_document(gate)
    path = path_arg if path_arg.is_absolute() else ROOT / path_arg
    path = path.resolve()
    try:
        relative = path.relative_to(ROOT.resolve()).as_posix()
    except ValueError as exc:
        raise SystemExit("reviewed binding must live inside this repository") from exc
    require(path.is_file(), f"reviewed binding does not exist: {relative}")
    binding = load_json(path)
    case_id = binding.get("caseId")
    require(isinstance(case_id, str) and CASE_ID_RE.fullmatch(case_id), "reviewed binding requires a valid MLM-xxx caseId")
    expected_path = _binding_relpath(case_id)
    require(relative == expected_path, f"reviewed binding must use canonical path {expected_path}")
    validate_production_review(binding, gate)
    catalogue = builder.catalogue_by_id()
    require(case_id in catalogue, f"binding case is not in the currently available catalogue: {case_id}")
    builder.build(catalogue[case_id], binding)
    # Revisions are allowed only for the target case; all other registered bindings must
    # still validate before the target fingerprint is replaced.
    load_registry(skip_case_id=case_id)
    entry = {"caseId": case_id, "path": expected_path, "bindingFingerprint": canonical_sha(binding)}
    remaining = [item for item in registry["bindings"] if item.get("caseId") != case_id]
    remaining.append(entry)
    remaining.sort(key=lambda item: int(item["caseId"].split("-")[1]))
    registry["bindings"] = remaining
    write_atomic(REGISTRY_PATH, json.dumps(registry, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps(entry, indent=2))
    return entry


def materialize_release() -> list[dict]:
    _, _, loaded = load_registry()
    cases = build_registered_cases(loaded)
    ids = [case["id"] for case in cases]
    existing = {path.stem for path in CASE_DIR.glob("MLM-*.json")} if CASE_DIR.exists() else set()
    extra = sorted(existing - set(ids))
    require(not extra, f"refusing to silently remove unregistered promoted case assets: {extra}")
    rendered = [(case, json.dumps(case, indent=2, ensure_ascii=False) + "\n") for case in cases]
    for case, text in rendered:
        write_atomic(CASE_DIR / f"{case['id']}.json", text)
    index = load_json(PROMOTION_INDEX)
    index["caseIds"] = ids
    write_atomic(PROMOTION_INDEX, json.dumps(index, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({"status": "materialized", "promotedCaseCount": len(ids), "promotedCaseIds": ids}, indent=2))
    return cases


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--register", type=Path, help="validate and register one canonical reviewed binding")
    group.add_argument("--write", action="store_true", help="materialize every registered reviewed binding into canonical learner cases and promotion index")
    args = parser.parse_args()
    if args.register:
        register_binding(args.register)
        return 0
    _, _, loaded = load_registry()
    cases = build_registered_cases(loaded)
    if args.write:
        materialize_release()
    else:
        print(json.dumps({"status": "dry-run-valid", "registeredReviewedBindings": len(loaded), "materializableCaseIds": [case["id"] for case in cases]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
