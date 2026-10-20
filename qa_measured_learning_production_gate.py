#!/usr/bin/env python3
"""Validate that production-reviewed bindings are the sole authority for measured promotion."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TOOLS = ROOT / "tools"
if str(TOOLS) not in sys.path:
    sys.path.insert(0, str(TOOLS))

from measured_learning_core import load_json  # noqa: E402
import promote_measured_learning_release as production  # noqa: E402


def main() -> int:
    gate, registry, loaded = production.load_registry()
    expected_cases = production.build_registered_cases(loaded)
    expected_ids = [case["id"] for case in expected_cases]

    promotion_index = load_json(ROOT / gate["promotionIndex"])
    assert promotion_index.get("schemaVersion") == 1, "promotion index schemaVersion must be 1"
    indexed_ids = promotion_index.get("caseIds", [])
    assert indexed_ids == expected_ids, f"production registry/promotion index mismatch: registry={expected_ids}, promoted={indexed_ids}"

    case_dir = ROOT / gate["caseDirectory"]
    actual_paths = sorted(case_dir.glob("MLM-*.json")) if case_dir.exists() else []
    actual_ids = [path.stem for path in actual_paths]
    assert actual_ids == expected_ids, f"production registry/case asset mismatch: registry={expected_ids}, assets={actual_ids}"

    for path, expected in zip(actual_paths, expected_cases):
        actual = load_json(path)
        assert actual == expected, f"{path}: promoted learner case does not exactly rebuild from its registered reviewed binding"
        review = actual.get("review", {})
        assert review.get("reviewed") is True, f"{path}: promoted case is not reviewed"
        assert review.get("reviewRecordType") != "test-fixture", f"{path}: test fixture review cannot enter production"
        assert review.get("reviewerRole") == gate["requiredReviewerRole"], f"{path}: production reviewer role drift"

    report = {
        "schemaVersion": 1,
        "gateId": gate["gateId"],
        "registeredReviewedBindings": len(loaded),
        "promotedLearnerCases": len(expected_cases),
        "promotedCaseIds": expected_ids,
        "status": "production-gate-synchronized",
        "boundary": registry["boundary"],
    }
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
