"""Main promotion preflight must not accidentally enable a preview push publisher."""
import unittest
from pathlib import Path

from qa_preview_release_readiness_coverage import WORKFLOWS, ROOT, event_branches, validate


class PreviewReleaseScopeTests(unittest.TestCase):
    def test_all_current_workflows_are_preflight_only(self):
        for path in WORKFLOWS:
            data=(ROOT/path).read_text(encoding="utf-8")
            with self.subTest(path=path):
                validate(data, path)
                self.assertEqual(event_branches(data,"push",path),{"main"})
                self.assertEqual(event_branches(data,"pull_request",path),{"main","preview"})

    def test_branch_substring_and_extra_branch_cannot_satisfy_policy(self):
        path=WORKFLOWS[0]
        text=(ROOT/path).read_text(encoding="utf-8")
        cases=(
            ("[main, preview]", "[main, extra-preview]"),
            ("[main, preview]", "[main, preview, main-backup]"),
            ("[main]", "[main-and-preview]"),
            ("[main]", "[main, release-other]"),
        )
        for original, forged in cases:
            marker="\n  pull_request:\n" if original=="[main, preview]" else "\n  push:\n"
            section=text.split(marker,1)
            if len(section)!=2:
                self.fail("cannot isolate chosen workflow trigger")
            prefix, after=section
            corrupted=prefix+marker+after.replace(original,forged,1)
            with self.subTest(forged=forged), self.assertRaises(AssertionError):
                validate(corrupted,path)

    def test_duplicate_or_unbounded_branch_events_fail_closed(self):
        path=WORKFLOWS[0]
        text=(ROOT/path).read_text(encoding="utf-8")
        for corrupted in (
            text.replace("\n  push:\n", "\n  push:\n    branches: [main]\n",1),
            text.replace("branches: [main]", "branches: [main, main]",1),
            text.replace("branches: [main, preview]", "branches: [main, preview, preview]",1),
            text.replace("branches: [main]", "branches: main",1),
        ):
            with self.subTest(text=corrupted[:150]), self.assertRaises(AssertionError):
                validate(corrupted,path)


if __name__=="__main__":
    unittest.main()
