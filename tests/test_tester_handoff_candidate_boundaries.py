"""Adversarial, fully offline tester-handoff candidate checks.

These synthetic fixtures exercise the local, fail-closed no-send boundary.
They never create a release candidate, publish Pages, or confer approval.
"""
import copy
import json
import unittest
from unittest.mock import patch

import qa_tester_handoff as handoff


RELEASE = "2026.10.18.2"
ROOT_URL = "https://connorth3-lgtm.github.io/Injection-moulding-app-/"
PREVIEW_URL = ROOT_URL + "preview/"
SHA = "a" * 40
FINGERPRINT = "sha256:" + "b" * 64


def fixture():
    ledger = {
        "release": RELEASE,
        "webCandidate": {
            "release": RELEASE,
            "sourceSha": SHA,
            "runtimeFingerprint": FINGERPRINT,
        },
        "productionUse": {"status": "advisory-only"},
        "claims": {
            "fullyExternallyValidated": False,
            "accreditationAuthorized": False,
            "learnerEfficacyEstablished": False,
            "productionRecipeValidated": False,
            "automaticMachineControlAuthorized": False,
        },
    }
    for section in handoff.HOLD_SECTIONS:
        ledger[section] = {"status": "hold"}
    return {
        "version.json": json.dumps({"web_release": RELEASE, "pages_url": ROOT_URL}),
        "data/release-external-validation-v1.json": json.dumps(ledger),
        "docs/TESTER_HANDOFF.md": (
            f"Non-production preview {RELEASE} {PREVIEW_URL}\n"
            "not cleared to circulate; --expected-source-sha protected-main "
            "STOP / no-send; PR's pre-merge SHA is not the protected-main release."
        ),
        "docs/TESTER_QUICK_START.md": (
            f"Non-production preview {RELEASE} {PREVIEW_URL}; "
            "No questionnaire or learning outcome is automatically submitted. "
            "Use fictional data. Data & Reset; SECURITY.md; record device and browser."
        ),
        "docs/TESTER_INVITATION.md": (
            f"Non-production preview {RELEASE} {PREVIEW_URL}; "
            "voluntary privacy GitHub fictional 15–20 minutes."
        ),
        "docs/TESTER_FEEDBACK_TRIAGE.md": (
            "Non-production feedback: P0 P1 P2 P3; SECURITY.md; release HOLD."
        ),
        ".github/ISSUE_TEMPLATE/learner-problem.yml": (
            "Do not include learner names; Reproduction steps; What did you expect; "
            "Browser or app; Learner impact; Safe diagnostics."
        ),
        "support.html": handoff.ISSUE_FORM,
        "privacy.html": "The app does not currently upload learner analytics.",
        ".github/workflows/pages.yml": (
            "branches: [main]\n"
            "python3 tools/build_pages_hold.py --preview-source .pages-dist"
        ),
        "tools/build_pages_hold.py": (
            "PREVIEW_MARKER = 'content=\"non-production-preview\"'"
        ),
        "tools/verify_pages_hold.py": (
            'parser.add_argument("--expected-source-sha") '
            "preview/deployment.json"
        ),
    }


def verify(files):
    def read(path):
        return files[path]

    def load(path):
        return json.loads(files[path])

    # Local validation must never query live publication or inspect secrets.
    with patch.object(handoff, "read", side_effect=read), \
         patch.object(handoff, "load", side_effect=load), \
         patch.object(handoff, "urlopen", side_effect=AssertionError("network forbidden")):
        return handoff.verify_local()


class TesterHandoffCandidateBoundaries(unittest.TestCase):
    def test_matching_synthetic_candidate_remains_an_unapproved_handoff(self):
        self.assertEqual(verify(fixture()), (RELEASE, ROOT_URL))

    def test_missing_or_malformed_candidate_identity_fails_closed(self):
        changes = [
            ("sourceSha", None),
            ("sourceSha", "not-a-commit"),
            ("sourceSha", "A" * 40),
            ("runtimeFingerprint", None),
            ("runtimeFingerprint", "sha256:incorrect"),
            ("runtimeFingerprint", "sha256:" + "Z" * 64),
        ]
        for key, value in changes:
            files = fixture()
            row = json.loads(files["data/release-external-validation-v1.json"])
            row["webCandidate"][key] = value
            files["data/release-external-validation-v1.json"] = json.dumps(row)
            with self.subTest(field=key, value=value), self.assertRaises(AssertionError):
                verify(files)

    def test_stale_release_cannot_reuse_previous_candidate(self):
        for changed in ("version.json", "data/release-external-validation-v1.json"):
            files = fixture()
            row = json.loads(files[changed])
            row["release" if changed.startswith("data/") else "web_release"] = "2026.10.17.1"
            files[changed] = json.dumps(row)
            with self.subTest(file=changed), self.assertRaises(AssertionError):
                verify(files)
        files = fixture()
        row = json.loads(files["data/release-external-validation-v1.json"])
        row["webCandidate"]["release"] = "2026.10.17.1"
        files["data/release-external-validation-v1.json"] = json.dumps(row)
        with self.assertRaises(AssertionError):
            verify(files)

    def test_human_device_and_provider_holds_cannot_be_promoted_by_handoff(self):
        for section in handoff.HOLD_SECTIONS:
            files = fixture()
            row = json.loads(files["data/release-external-validation-v1.json"])
            row[section]["status"] = "validated"
            files["data/release-external-validation-v1.json"] = json.dumps(row)
            with self.subTest(section=section), self.assertRaises(AssertionError):
                verify(files)

    def test_unapproved_machine_or_assessment_claim_cannot_be_enabled(self):
        for claim in json.loads(fixture()["data/release-external-validation-v1.json"])["claims"]:
            files = fixture()
            row = json.loads(files["data/release-external-validation-v1.json"])
            row["claims"][claim] = True
            files["data/release-external-validation-v1.json"] = json.dumps(row)
            with self.subTest(claim=claim), self.assertRaises(AssertionError):
                verify(files)

    def test_stale_or_wrong_preview_invitation_cannot_pass(self):
        for document in (
            "docs/TESTER_HANDOFF.md",
            "docs/TESTER_QUICK_START.md",
            "docs/TESTER_INVITATION.md",
        ):
            files = fixture()
            files[document] = files[document].replace(PREVIEW_URL, ROOT_URL)
            with self.subTest(document=document), self.assertRaises(AssertionError):
                verify(files)

    def test_main_only_publisher_cannot_be_replaced_with_preview_push(self):
        files = fixture()
        files[".github/workflows/pages.yml"] = files[".github/workflows/pages.yml"].replace(
            "branches: [main]", "branches: [main, preview]"
        )
        with self.assertRaises(AssertionError):
            verify(files)

    def test_no_private_reporting_or_nonproduction_notice_cannot_pass(self):
        modifications = [
            (".github/ISSUE_TEMPLATE/learner-problem.yml", "Do not include learner names", ""),
            ("privacy.html", "does not currently upload", "uploads"),
            ("docs/TESTER_INVITATION.md", "Non-production", "Production"),
            ("tools/verify_pages_hold.py", "preview/deployment.json", "unknown.json"),
        ]
        for path, old, new in modifications:
            files = fixture()
            files[path] = files[path].replace(old, new)
            with self.subTest(path=path), self.assertRaises(AssertionError):
                verify(files)


if __name__ == "__main__":
    unittest.main()
