#!/usr/bin/env python3
from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "tools"
sys.path.insert(0, str(TOOLS))

import promote_measured_learning_release as production  # noqa: E402


class MeasuredLearningProductionGateTests(unittest.TestCase):
    def binding(self) -> dict:
        return {
            "schemaVersion": 2,
            "caseId": "MLM-001",
            "reviewed": True,
            "authorId": "case-author",
            "reviewerId": "independent-engineer",
            "reviewerRole": "engineering-evidence-review",
            "reviewRecordType": "github-pr",
            "reviewRecord": "https://github.com/example/mouldmaster/pull/123#pullrequestreview-456",
            "reviewedAt": "2026-09-05T07:00:00Z",
            "sourceEstablishesCausality": False,
        }

    def test_valid_production_review_metadata_passes(self):
        production.validate_production_review(self.binding())

    def test_author_and_reviewer_must_be_independent(self):
        binding = self.binding()
        binding["reviewerId"] = binding["authorId"]
        with self.assertRaises(SystemExit):
            production.validate_production_review(binding)

    def test_test_fixture_review_is_forbidden_in_production(self):
        binding = self.binding()
        binding["reviewRecordType"] = "test-fixture"
        binding["reviewRecord"] = "tests/test_measured_learning_v2.py"
        with self.assertRaises(SystemExit):
            production.validate_production_review(binding)

    def test_engineering_reviewer_role_is_required(self):
        binding = self.binding()
        binding["reviewerRole"] = "test-evidence-review"
        with self.assertRaises(SystemExit):
            production.validate_production_review(binding)

    def test_public_binding_must_explicitly_disclaim_source_causality(self):
        binding = self.binding()
        binding["sourceEstablishesCausality"] = True
        with self.assertRaises(SystemExit):
            production.validate_production_review(binding)

    def test_review_timestamp_must_be_explicit_utc(self):
        binding = self.binding()
        binding["reviewedAt"] = "2026-09-05"
        with self.assertRaises(SystemExit):
            production.validate_production_review(binding)

    def test_github_review_reference_must_be_resolvable_shape(self):
        binding = self.binding()
        binding["reviewRecord"] = "PR #123"
        with self.assertRaises(SystemExit):
            production.validate_production_review(binding)

    def test_registry_loads_and_validates_every_declared_binding(self):
        _, registry, loaded = production.load_registry()
        self.assertEqual(len(loaded), len(registry["bindings"]))


if __name__ == "__main__":
    unittest.main()
