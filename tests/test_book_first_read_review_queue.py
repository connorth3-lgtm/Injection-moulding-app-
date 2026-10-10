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
        self.assertEqual(packet["chaptersBelowSoftTarget"], 12)
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

    def test_soft_word_threshold_is_not_an_approval_gate(self):
        rows, modules, omissions = audit()
        packet = editorial_review_packet(rows, modules, omissions)
        self.assertTrue(any(r["belowNonGatingTarget"] for r in packet["chapters"]))
        self.assertFalse(any("approved" in str(r["independentSmeStatus"]).lower() for r in packet["chapters"]))


if __name__ == "__main__":
    unittest.main()
