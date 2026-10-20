"""The operator handoff must fail closed with actionable candidate diagnostics.

These tests mock only the first two locally-read JSON files. Neither test
supplies, fabricates or certifies a real release candidate.
"""
import unittest
from unittest.mock import patch

import qa_tester_handoff as handoff


class CandidateHandoffBoundaryTests(unittest.TestCase):
    VERSION = {
        "web_release": "2026.10.13.1",
        "pages_url": "https://connorth3-lgtm.github.io/Injection-moulding-app-/",
    }

    def check_rejected(self, candidate, message):
        ledger = {"release": "2026.10.13.1", "webCandidate": candidate}

        def load(relative):
            return self.VERSION if relative == "version.json" else ledger

        with patch.object(handoff, "load", side_effect=load):
            with self.assertRaisesRegex(AssertionError, message):
                handoff.verify_local()

    def test_unbound_candidate_is_missing_not_stale(self):
        self.check_rejected(None, "accepted exact-source candidate is missing")

    def test_malformed_candidate_is_missing_not_runtime_exception(self):
        self.check_rejected(["untrusted"], "accepted exact-source candidate is missing")
        self.check_rejected({}, "accepted exact-source candidate is missing")

    def test_real_but_wrong_release_remains_stale(self):
        self.check_rejected({"release": "2026.10.11.11"}, "candidate release is stale")

    def test_current_release_without_source_stays_blocked(self):
        self.check_rejected({"release": "2026.10.13.1"}, "retained source SHA is missing/invalid")


if __name__ == "__main__":
    unittest.main()
