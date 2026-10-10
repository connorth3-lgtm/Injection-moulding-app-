"""Current NZQA tracker binding must not be laundered by archived issue history."""
import copy
import unittest

from tools.verify_external_validation_live_bindings import verify_current_tracker

CANDIDATE = {
    "release": "2026.10.11.3",
    "sourceSha": "a" * 40,
    "runtimeFingerprint": "sha256:" + "b" * 64,
    "candidateRunId": 12345,
    "artifactId": 6789,
}


def fixture():
    release, sha, fp = (
        CANDIDATE["release"], CANDIDATE["sourceSha"], CANDIDATE["runtimeFingerprint"]
    )
    return {
        "state": "open",
        "title": f"NZQA/provider HOLD — {release} technical candidate; G1–G8 outstanding",
        "body": (
            "## Current triage\n\n"
            "**Disposition: KEEP OPEN.**\n\n"
            f"**Current governed technical candidate:** Release %BT%{release}%BT%; "
            f"exact retained source %BT%{sha}%BT%, successful "
            f"[producer 12345](https://github.com/org/repo/actions/runs/12345), "
            f"artifact %BT%6789%BT%, public fingerprint %BT%{fp}%BT%.\n\n"
            "**Still required:** G1–G8 remain %BT%pending-external%BT%, no provider approval.\n\n"
            "---\n\n## Historical release\n"
        ).replace("%BT%", chr(96)),
    }


class TrackerCurrentCandidateTests(unittest.TestCase):
    def test_current_issue_with_pending_external_gates_matches(self):
        verify_current_tracker(fixture(), 379, CANDIDATE)

    def test_historical_mentions_cannot_launder_incorrect_current_source(self):
        item = fixture()
        item["body"] = item["body"].replace(CANDIDATE["sourceSha"], "c" * 40)
        item["body"] += "Historical source " + CANDIDATE["sourceSha"]
        with self.assertRaisesRegex(SystemExit, "current source SHA"):
            verify_current_tracker(item, 379, CANDIDATE)

    def test_old_source_disclaimer_and_digit_collision_do_not_count(self):
        item = fixture()
        item["body"] = item["body"].replace("/actions/runs/12345", "/actions/runs/912345")
        with self.assertRaisesRegex(SystemExit, "producer run"):
            verify_current_tracker(item, 379, CANDIDATE)
        item = fixture()
        item["body"] = item["body"].replace("artifact %BT%6789%BT%".replace("%BT%",chr(96)),
                                            "artifact %BT%96789%BT%".replace("%BT%",chr(96)))
        with self.assertRaisesRegex(SystemExit, "artifact id"):
            verify_current_tracker(item, 379, CANDIDATE)

    def test_release_and_pending_gate_status_are_current(self):
        item = fixture()
        item["title"] = item["title"].replace("2026.10.11.3", "2026.10.11.1")
        item["body"] += "\n2026.10.11.3 (old historical mention)\n"
        with self.assertRaisesRegex(SystemExit, "title"):
            verify_current_tracker(item, 379, CANDIDATE)
        item = fixture()
        item["body"] = item["body"].replace("pending-external", "validated")
        item["body"] += "\nArchived G1–G8 pending-external"
        with self.assertRaisesRegex(SystemExit, "external HOLD"):
            verify_current_tracker(item, 379, CANDIDATE)

    def test_closed_or_pr_tracker_is_rejected(self):
        item = fixture()
        item["state"] = "closed"
        with self.assertRaisesRegex(SystemExit, "must remain open"):
            verify_current_tracker(item, 379, CANDIDATE)
        item = fixture()
        item["pull_request"] = {"url": "forged"}
        with self.assertRaisesRegex(SystemExit, "not a normal issue"):
            verify_current_tracker(item, 379, CANDIDATE)


if __name__ == "__main__":
    unittest.main()
