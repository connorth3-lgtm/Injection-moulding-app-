#!/usr/bin/env python3
"""Regression for exact-PR-head diff discovery without shallow re-fetching."""
import subprocess
import unittest
from unittest.mock import patch

from tools import verify_ci_risk_coverage as verifier


class ChangedPathsHistoryTests(unittest.TestCase):
    def test_pr_diff_preserves_base_ancestry(self):
        with (
            patch.object(verifier, "EVENT", "pull_request"),
            patch.object(verifier, "BASE_REF", "main"),
            patch.object(verifier.subprocess, "run") as fetch,
            patch.object(
                verifier.subprocess,
                "check_output",
                return_value="version.json\nsrc/domains/shell/pwa-shell.js\n",
            ) as diff,
        ):
            self.assertEqual(
                verifier.changed_paths(),
                ["version.json", "src/domains/shell/pwa-shell.js"],
            )
        fetch.assert_called_once_with(
            ["git", "fetch", "--no-tags", "origin", "main"],
            check=True,
            stdout=subprocess.DEVNULL,
        )
        diff.assert_called_once_with(
            ["git", "diff", "--name-only", "origin/main...HEAD"],
            text=True,
        )

    def test_missing_merge_base_still_fails_closed(self):
        with (
            patch.object(verifier, "EVENT", "pull_request"),
            patch.object(verifier.subprocess, "run"),
            patch.object(
                verifier.subprocess,
                "check_output",
                side_effect=subprocess.CalledProcessError(128, "git diff"),
            ),
        ):
            with self.assertRaises(subprocess.CalledProcessError):
                verifier.changed_paths()

    def test_non_pr_event_does_not_run_git(self):
        with (
            patch.object(verifier, "EVENT", "push"),
            patch.object(verifier.subprocess, "run") as fetch,
            patch.object(verifier.subprocess, "check_output") as diff,
        ):
            self.assertEqual(verifier.changed_paths(), [])
        fetch.assert_not_called()
        diff.assert_not_called()


if __name__ == "__main__":
    unittest.main()
