"""Guard retained-candidate rebinding and independent external HOLD staging."""
import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from rebind_external_hold_candidate import stage_governance_model, commit_staged_files, update_banner

CANDIDATE = {
    "release": "2026.10.11.3",
    "sourceSha": "e" * 40,
    "runtimeFingerprint": "sha256:" + "e" * 64,
    "candidateRunId": 38089059338,
    "candidateWorkflow": "Pre-merge Public Candidate",
    "artifactId": 11682829264,
    "artifactName": "physical-pwa-candidate-" + "e" * 40,
    "artifactDigest": "sha256:" + "d" * 64,
    "artifactExpiresAt": "2027-01-08T21:48:59Z",
}


class CandidateRebindRegression(unittest.TestCase):
    def test_new_source_demotes_only_technical_model_and_retains_all_holds(self):
        model = json.loads((ROOT / "data/governance-state-model-v1.json").read_text())
        original = copy.deepcopy(model)
        staged = stage_governance_model(model, CANDIDATE)
        self.assertEqual(original, model, "candidate staging must not mutate the active source model")
        self.assertEqual(staged["currentPublicBoundary"]["technicalAutomation"], "fail")
        self.assertEqual(staged["currentAssuranceEvidence"]["staticContract"]["status"], "fail")
        self.assertEqual(staged["currentAssuranceEvidence"]["behavioralBrowser"]["status"], "fail")
        self.assertEqual(staged["currentAssuranceEvidence"]["externalHumanDevice"], original["currentAssuranceEvidence"]["externalHumanDevice"])
        for key, value in original["currentPublicBoundary"].items():
            if key != "technicalAutomation":
                self.assertEqual(staged["currentPublicBoundary"][key], value)
        for key in ("sourceSha", "release"):
            self.assertIn(CANDIDATE[key], staged["currentAssuranceEvidence"]["staticContract"]["meaning"])
        self.assertIn("NOT independently verified", staged["currentAssuranceEvidence"]["staticContract"]["meaning"])

    def test_reviewer_banner_updates_only_current_identity(self):
        existing = (ROOT / "qa/BOOK_SME_REVIEW_2026.10.11.3.md").read_text()
        rewritten = update_banner(existing, CANDIDATE, "qa/BOOK_SME_REVIEW_2026.10.11.3.md")
        self.assertIn(CANDIDATE["sourceSha"], rewritten.splitlines()[2])
        self.assertEqual(rewritten.splitlines()[4:], existing.splitlines()[4:])
        self.assertIn("STATUS: HOLD", rewritten)
        self.assertIn("46 governed", rewritten)

    def test_pending_release_packet_accepts_only_exact_retain_identity(self):
        current = copy.deepcopy(CANDIDATE)
        current["release"] = "2026.10.18.2"
        path = "qa/BOOK_SME_REVIEW_2026.10.18.2.md"
        pending = (ROOT / path).read_text(encoding="utf-8")
        self.assertIn("> **PENDING 2026.10.18.2 ARTIFACT.", pending)
        rewritten = update_banner(pending, current, path)
        self.assertIn("> **RETAINED 2026.10.18.2 TECHNICAL ARTIFACT", rewritten)
        self.assertIn(current["sourceSha"], rewritten.splitlines()[4])
        self.assertIn("STATUS: HOLD", rewritten)
        self.assertEqual(rewritten.splitlines()[5:], pending.splitlines()[5:])
        self.assertEqual(update_banner(rewritten, current, path), rewritten)

        stale = pending.replace(
            "> **PENDING 2026.10.18.2 ARTIFACT.",
            "> **PENDING 2026.10.17.1 ARTIFACT.", 1,
        )
        with self.assertRaises(SystemExit):
            update_banner(stale, current, path)

        duplicate = pending.replace(
            "> **PENDING 2026.10.18.2 ARTIFACT.",
            "> **PENDING 2026.10.18.2 ARTIFACT.\n> **PENDING 2026.10.18.2 ARTIFACT.",
            1,
        )
        with self.assertRaises(SystemExit):
            update_banner(duplicate, current, path)

    def test_staging_handles_multiple_files_without_partial_write(self):
        with tempfile.TemporaryDirectory() as temp:
            one, two = (Path(temp) / name for name in ("a.json", "b.md"))
            one.write_text('{"original":true}\n')
            two.write_text("Human review HOLD\n")
            commit_staged_files({one: '{"pending":true}\n', two: "Human review HOLD, new candidate\n"})
            self.assertEqual(one.read_text(), '{"pending":true}\n')
            self.assertEqual(two.read_text(), "Human review HOLD, new candidate\n")

    def test_packet_rebind_rejects_missing_banner_without_touching_notes(self):
        with self.assertRaises(SystemExit):
            update_banner("# Book review — 2026.10.11.3\n\n**STATUS: HOLD**\n", CANDIDATE, "qa/MISSING.md")


if __name__ == "__main__":
    unittest.main()
