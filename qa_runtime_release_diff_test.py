"""Regression contract for the exact-base learner-runtime release gate."""
import unittest

from tools.runtime_release_diff import choose_comparison_base

BASE = "a" * 40


class ReleaseDiffBaseTests(unittest.TestCase):
    def test_pull_request_uses_target_branch_merge_base_not_head_parent(self):
        commands = []

        def fake_git(*args):
            commands.append(args)
            if args[0] == "merge-base":
                return BASE + "\n"
            return "verified\n"

        self.assertEqual(
            choose_comparison_base(
                fake_git, event_name="pull_request", base_ref="main"
            ),
            BASE,
        )
        self.assertEqual(
            commands,
            [
                ("rev-parse", "--verify", "refs/remotes/origin/main"),
                ("merge-base", "refs/remotes/origin/main", "HEAD"),
            ],
        )

    def test_preview_pr_uses_preview_base(self):
        def fake_git(*args):
            if args[0] == "merge-base":
                self.assertEqual(args[1], "refs/remotes/origin/preview")
                return BASE
            return "ok"

        self.assertEqual(
            choose_comparison_base(
                fake_git, event_name="pull_request", base_ref="preview"
            ),
            BASE,
        )

    def test_push_uses_parent_commit(self):
        calls = []

        def fake_git(*args):
            calls.append(args)
            return BASE

        self.assertEqual(
            choose_comparison_base(fake_git, event_name="push", base_ref=""),
            BASE,
        )
        self.assertEqual(calls, [("rev-parse", "HEAD^")])

    def test_missing_or_untrusted_pr_base_fails_closed(self):
        for candidate in ("", "../main", "/main", "some//main", "bad@{ref", "bad name"):
            with self.subTest(candidate=candidate):
                with self.assertRaises(SystemExit):
                    choose_comparison_base(
                        lambda *args: self.fail("must not invoke git on bad ref"),
                        event_name="pull_request",
                        base_ref=candidate,
                    )

    def test_missing_merge_base_fails_closed(self):
        def fake_git(*args):
            if args[0] == "merge-base":
                raise SystemExit("no common ancestor")
            return "ok"

        with self.assertRaises(SystemExit):
            choose_comparison_base(
                fake_git, event_name="pull_request", base_ref="main"
            )

    def test_malformed_merge_base_fails_closed(self):
        def fake_git(*args):
            return "bad-sha"

        with self.assertRaises(SystemExit):
            choose_comparison_base(
                fake_git, event_name="pull_request", base_ref="main"
            )


if __name__ == "__main__":
    unittest.main()
