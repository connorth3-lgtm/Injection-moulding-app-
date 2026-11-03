"""Editorial triage is useful but must not invent independent Book review."""
import unittest

from qa_book_first_read_audit import audit, editorial_review_packet


class FirstReadReviewQueueTests(unittest.TestCase):
    def test_source_derived_queue_covers_all_and_prioritizes_requested_chapters(self):
        rows, modules, omissions = audit()
        packet = editorial_review_packet(rows, modules, omissions)
        self.assertEqual(packet["readerChapterCount"], 21)
        self.assertEqual(packet["governedModuleCount"], 46)
        self.assertEqual(packet["omittedSourceSectionCount"], 0)
        self.assertEqual(packet["chaptersBelowSoftTarget"], sum(r["belowTarget"] for r in rows))
        self.assertEqual({r["readerId"] for r in packet["chapters"]},
                         {f"r{i:02d}" for i in range(1, 21)} | {"r03a"})
        self.assertEqual({r["readerId"] for r in packet["chapters"] if r["priority"] == "first-review"},
                         {"r07", "r10", "r11", "r15"})
        self.assertTrue(all(r["reviewerFindings"] is None and r["independentSmeStatus"] == "UNREVIEWED"
                            for r in packet["chapters"]))
        self.assertEqual(sum(len(r["moduleIds"]) for r in packet["chapters"]), 46)
        self.assertEqual(sum(len(r["sourceSectionsBehindDisclosure"]) for r in packet["chapters"]), 0)
        self.assertTrue(all(r["wordGapToSoftTarget"] >= 0 for r in packet["chapters"]))
        self.assertIn("non-gating", packet["governance"])
        self.assertIn("not-a-technical-approval", packet["kind"])

    def test_all_authored_sections_are_visible_on_first_read(self):
        rows, modules, omissions = audit()
        packet = editorial_review_packet(rows, modules, omissions)
        evidence = [entry for row in packet["chapters"] for entry in row["sourceSectionsBehindDisclosure"]]
        self.assertEqual(omissions, 0)
        self.assertEqual(packet["omittedSourceSectionCount"], 0)
        self.assertEqual(evidence, [])



    def test_conflicting_omission_and_optional_source_mappings_fail_closed(self):
        import unittest.mock as mock
        from qa_book_first_read_audit import presentation_map
        real = presentation_map
        module = "what-injection-moulding-is"
        title = "Start here: follow one part"

        def overlapping(runtime, name):
            if name in {"READER_SECTION_OMISSIONS", "READER_SUPPLEMENT_SECTIONS"}:
                return {module: [title]}
            return real(runtime, name)

        with mock.patch("qa_book_first_read_audit.presentation_map", side_effect=overlapping):
            with self.assertRaisesRegex(AssertionError, "both omit and supplement"):
                audit()


    def test_non_gating_word_count_change_does_not_fail_check(self):
        import io
        from contextlib import redirect_stdout
        from unittest.mock import patch
        from qa_book_first_read_audit import main

        rows, modules, omitted = audit()
        improved = [dict(row, belowTarget=False) for row in rows]
        with patch("qa_book_first_read_audit.audit", return_value=(improved, modules, omitted)):
            with patch("sys.argv", ["qa_book_first_read_audit.py", "--check"]):
                with redirect_stdout(io.StringIO()) as out:
                    main()
        self.assertIn("0 below", out.getvalue())
        self.assertIn("NOT VERIFIED", out.getvalue())

    def test_soft_word_threshold_is_not_an_approval_gate(self):
        rows, modules, omissions = audit()
        packet = editorial_review_packet(rows, modules, omissions)
        self.assertIn("non-gating", packet["governance"])
        self.assertTrue(all(r["independentSmeStatus"] == "UNREVIEWED" for r in packet["chapters"]))
        self.assertFalse(any("approved" in str(r["independentSmeStatus"]).lower() for r in packet["chapters"]))


if __name__ == "__main__":
    unittest.main()
