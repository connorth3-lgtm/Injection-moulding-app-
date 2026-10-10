"""Negative exact-source assurance checks — CI cannot launder stale evidence."""
import copy
import unittest

from qa_governance_state_model import validate_assurance_candidate_identity


CANDIDATE = {
    "sourceSha": "a" * 40,
    "runtimeFingerprint": "sha256:" + "b" * 64,
    "candidateRunId": 123,
    "artifactId": 456,
}
RELEASE = "2026.10.11.3"


def fixture():
    return {
        "staticContract": {
            "status": "pass",
            "meaning": (
                f"Successful run 123 retained release {RELEASE}, source {'a' * 40}, "
                f"artifact 456, with fingerprint sha256:{'b' * 64}. "
                "No external approvals."
            ),
        },
        "behavioralBrowser": {
            "status": "pass",
            "meaning": f"Passing browser gates for release {RELEASE} source {'a' * 40}.",
        },
        "externalHumanDevice": {"status": "hold"},
    }


class ExactAssuranceIdentityTests(unittest.TestCase):
    def test_consistent_release_passes_with_external_hold(self):
        validate_assurance_candidate_identity(fixture(), CANDIDATE, RELEASE)

    def test_substring_artifact_and_producer_collisions_fail(self):
        for target, other in (("run 123", "run 9123"), ("artifact 456", "artifact 9456")):
            state = fixture()
            state["staticContract"]["meaning"] = state["staticContract"]["meaning"].replace(target, other)
            with self.subTest(target=target), self.assertRaises(AssertionError):
                validate_assurance_candidate_identity(state, CANDIDATE, RELEASE)

    def test_stale_active_source_cannot_hide_behind_current_disclaimer(self):
        state = fixture()
        state["staticContract"]["meaning"] = state["staticContract"]["meaning"].replace(
            "source " + "a" * 40, "source " + "c" * 40
        ) + "\nThe current SHA " + "a" * 40 + " is recorded elsewhere."
        with self.assertRaisesRegex(AssertionError, "source"):
            validate_assurance_candidate_identity(state, CANDIDATE, RELEASE)

    def test_duplicated_release_and_wrong_browser_identity_fail(self):
        state = fixture()
        state["behavioralBrowser"]["meaning"] += " Prior release 2026.10.11.1."
        with self.assertRaisesRegex(AssertionError, "release"):
            validate_assurance_candidate_identity(state, CANDIDATE, RELEASE)
        state = fixture()
        state["behavioralBrowser"]["meaning"] = state["behavioralBrowser"]["meaning"].replace(
            "source " + "a" * 40, "source " + "c" * 40
        )
        with self.assertRaisesRegex(AssertionError, "source"):
            validate_assurance_candidate_identity(state, CANDIDATE, RELEASE)

    def test_external_human_approval_not_inferred_from_automation(self):
        state = fixture()
        state["externalHumanDevice"]["status"] = "validated"
        with self.assertRaisesRegex(AssertionError, "human/device"):
            validate_assurance_candidate_identity(state, CANDIDATE, RELEASE)


if __name__ == "__main__":
    unittest.main()
