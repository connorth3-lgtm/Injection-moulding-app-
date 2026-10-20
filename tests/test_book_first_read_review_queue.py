"""Editorial triage is useful but must not invent independent Book review."""
import unittest

from qa_book_first_read_audit import audit, editorial_review_packet


class FirstReadReviewQueueTests(unittest.TestCase):
    def test_source_derived_queue_covers_all_and_prioritizes_requested_chapters(self):
        rows, modules, omissions = audit()
        packet = editorial_review_packet(rows, modules, omissions)
        self.assertEqual(packet["readerChapterCount"], 20)
        self.assertEqual(packet["governedModuleCount"], 46)
        self.assertEqual(packet["omittedSourceSectionCount"], 53)
        self.assertEqual(packet["chaptersBelowSoftTarget"], sum(r["belowTarget"] for r in rows))
        self.assertEqual({r["readerId"] for r in packet["chapters"]},
                         {f"r{i:02d}" for i in range(1, 21)})
        self.assertEqual({r["readerId"] for r in packet["chapters"] if r["priority"] == "first-review"},
                         {"r07", "r10", "r11", "r15"})
        self.assertTrue(all(r["reviewerFindings"] is None and r["independentSmeStatus"] == "UNREVIEWED"
                            for r in packet["chapters"]))
        self.assertEqual(sum(len(r["moduleIds"]) for r in packet["chapters"]), 46)
        self.assertEqual(sum(len(r["sourceSectionsBehindDisclosure"]) for r in packet["chapters"]), 53)
        self.assertTrue(all(r["wordGapToSoftTarget"] >= 0 for r in packet["chapters"]))
        self.assertIn("non-gating", packet["governance"])
        self.assertIn("not-a-technical-approval", packet["kind"])

    def test_hidden_section_evidence_is_exact_source_bound_and_unapproved(self):
        from pathlib import Path
        import hashlib
        import json
        import re
        rows, modules, omissions = audit()
        packet = editorial_review_packet(rows, modules, omissions)
        evidence = [entry for row in packet["chapters"] for entry in row["sourceSectionsBehindDisclosure"]]
        self.assertEqual(len(evidence), 53)
        self.assertEqual(len({(entry["moduleId"], entry["sectionTitle"]) for entry in evidence}), 53)
        datasets = {}
        for entry in evidence:
            path = entry["authoredSource"]
            self.assertRegex(path, r"^data/book-[a-z0-9-]+\.json$")
            self.assertRegex(entry["sourceTextSha256"], r"^[0-9a-f]{64}$")
            self.assertEqual(entry["disclosure"], "omitted-from-first-read")
            if path not in datasets:
                datasets[path] = {chapter["id"]: chapter for chapter in
                                  json.loads((Path(__file__).resolve().parents[1] / path).read_text())["chapters"]}
            sections = [item for item in datasets[path][entry["moduleId"]]["sections"]
                        if item["title"] == entry["sectionTitle"]]
            self.assertEqual(len(sections), 1)
            self.assertEqual(entry["sourceTextSha256"],
                             hashlib.sha256(sections[0]["text"].encode("utf-8")).hexdigest())
        self.assertTrue(all(r["independentSmeStatus"] == "UNREVIEWED"
                            for r in packet["chapters"]))

    def test_conflicting_omission_and_optional_source_mappings_fail_closed(self):
        import unittest.mock as mock
        from qa_book_first_read_audit import presentation_map
        real = presentation_map
        omissions, _modules, _suppressed = audit()
        reader = next(row for row in omissions if row["omitted"])
        module, title, _count = reader["omitted"][0]

        def overlapping(runtime, name):
            if name == "READER_SUPPLEMENT_SECTIONS":
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
        self.assertTrue(any(r["belowNonGatingTarget"] for r in packet["chapters"]))
        self.assertFalse(any("approved" in str(r["independentSmeStatus"]).lower() for r in packet["chapters"]))


if __name__ == "__main__":
    unittest.main()
