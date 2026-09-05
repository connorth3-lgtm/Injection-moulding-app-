#!/usr/bin/env python3
"""Promote one governed measured-learning candidate from a reviewed binding package.

This tool deliberately does not download third-party datasets or infer a root cause.
A reviewer supplies a local JSON binding containing only the selected compact trace /
outcome representation, exact provenance, calculated features and reviewed teaching text.
The output is deterministic and is checked by qa_measured_learning_library.py.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data" / "measured-learning" / "manifest-v1.json"
PROMOTION_INDEX = ROOT / "data" / "measured-learning" / "promoted-v1.json"
OUT_DIR = ROOT / "data" / "measured-learning" / "cases"
SHA256_RE = re.compile(r"sha256:[0-9a-f]{64}")


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


def require(condition: bool, message: str):
    if not condition:
        raise SystemExit(message)


def build(candidate: dict, binding: dict) -> dict:
    require(binding.get("caseId") == candidate["id"], "binding caseId does not match requested candidate")
    require(binding.get("sourceFamily") == candidate["sourceFamily"], "binding source family does not match catalogue")
    require(binding.get("reviewed") is True, "binding must be explicitly engineering-reviewed")
    require(bool(binding.get("reviewedAt")), "binding reviewedAt is required")
    require(bool(binding.get("sourceReference")), "exact source reference is required")
    require(bool(binding.get("licenceOrAccessStatus")), "source licence/access status is required")
    require(bool(SHA256_RE.fullmatch(str(binding.get("sourceFingerprint", "")))), "exact source SHA-256 is required")
    require(binding.get("extraction"), "an exact extraction/window description is required")
    require(binding.get("signals"), "at least one governed measured signal/outcome is required")
    require(binding.get("observations"), "reviewed observations are required")
    require(binding.get("limitations"), "evidence limitations are required")
    require(binding.get("supportedConclusions"), "supported conclusions are required")
    require(binding.get("unsupportedConclusions"), "unsupported conclusions are required")
    require(binding.get("learnerTask"), "reviewed learner task is required")

    for signal in binding["signals"]:
        require(signal.get("id"), "every signal requires a stable id")
        require(signal.get("label"), f"signal {signal.get('id')} lacks a learner label")
        require(signal.get("semantic"), f"signal {signal.get('id')} lacks resolved semantic")
        require(signal.get("unit"), f"signal {signal.get('id')} lacks resolved unit")
        rep = signal.get("representation", {})
        x, y = rep.get("x", []), rep.get("y", [])
        require(len(x) == len(y) and len(x) > 1, f"signal {signal.get('id')} has invalid x/y representation")
        require(len(y) <= 600, f"signal {signal.get('id')} exceeds 600 displayed points")
        require(rep.get("originalPointCount", 0) >= len(y), f"signal {signal.get('id')} originalPointCount is invalid")
        require(rep.get("reductionMethod"), f"signal {signal.get('id')} lacks reduction method")

    extraction_fingerprint_input = {
        "sourceFingerprint": binding["sourceFingerprint"],
        "extraction": binding["extraction"],
        "signalIds": [s["id"] for s in binding["signals"]],
        "representations": [s["representation"] for s in binding["signals"]],
    }
    source_window_fingerprint = canonical_sha(extraction_fingerprint_input)

    case = {
        "schemaVersion": 1,
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
            "extraction": binding["extraction"],
        },
        "signals": binding["signals"],
        "features": binding.get("features", []),
        "observations": binding["observations"],
        "learnerTask": binding["learnerTask"],
        "evidence": {
            "sourceEstablishesCausality": bool(binding.get("sourceEstablishesCausality", False)),
            "supportedConclusions": binding["supportedConclusions"],
            "unsupportedConclusions": binding["unsupportedConclusions"],
            "limitations": binding["limitations"],
        },
        "review": {
            "reviewed": True,
            "reviewerRole": binding.get("reviewerRole", "engineering-evidence-review"),
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
    parser.add_argument("case_id", help="MLM-001..MLM-070")
    parser.add_argument("binding", type=Path, help="reviewed local binding JSON")
    parser.add_argument("--output-dir", type=Path, default=OUT_DIR)
    parser.add_argument("--no-index", action="store_true", help="do not update promoted-v1.json (for scratch/test output only)")
    args = parser.parse_args()

    catalogue = catalogue_by_id()
    require(args.case_id in catalogue, f"unknown catalogue case {args.case_id}")
    binding = load(args.binding)
    case = build(catalogue[args.case_id], binding)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    out = args.output_dir / f"{args.case_id}.json"
    write_json(out, case)
    if not args.no_index:
        require(args.output_dir.resolve() == OUT_DIR.resolve(), "promotion index can only be updated for the canonical cases directory")
        promote_index(args.case_id)
    print(out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
