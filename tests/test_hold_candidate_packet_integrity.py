"""Adversarial tests: evidence release packets must bind to the real candidate."""
import copy
import tempfile
import unittest
from pathlib import Path

from tools.hold_candidate_packet_integrity import (
    PACKETS, candidate_identity, hold_statuses, validate_packet, validate_packets
)

RELEASE = "2026.10.11.3"
SHA = "a" * 40
FP = "sha256:" + "b" * 64
DIGEST = "sha256:" + "c" * 64
CANDIDATE = {
    "release": RELEASE,
    "sourceSha": SHA,
    "runtimeFingerprint": FP,
    "artifactDigest": DIGEST,
    "artifactId": 123,
    "candidateRunId": 456,
    "candidateWorkflow": "Pre-merge Public Candidate",
    "artifactName": "physical-pwa-candidate-" + SHA,
    "artifactExpiresAt": "2027-01-01T00:00:00Z",
}


def fixture():
    state = {area: {"status": "hold", field: f"qa/{tag}_{RELEASE}.md"}
             for area, (field, tag) in PACKETS.items()}
    state.update({
        "release": RELEASE,
        "webCandidate": copy.deepcopy(CANDIDATE),
        "productionUse": {"status": "advisory-only"},
        "claims": {key: False for key in (
            "fullyExternallyValidated", "accreditationAuthorized", "learnerEfficacyEstablished",
            "productionRecipeValidated", "automaticMachineControlAuthorized")},
    })
    state["pwaPhysicalDevices"]["currentCandidate"] = copy.deepcopy(CANDIDATE)
    identity = {key: CANDIDATE[key] for key in ("release", "sourceSha", "runtimeFingerprint")}
    state["accessibility"]["candidate"] = copy.deepcopy(identity)
    state["nzqaProvider"]["candidate"] = copy.deepcopy(identity)
    return state


def banner():
    return (
        f"# Technical packet — {RELEASE}\n\n"
        f"> **RETAINED {RELEASE} TECHNICAL ARTIFACT; ALL EXTERNAL REVIEWS HOLD.** "
        f"[producer](https://github.com/org/repo/actions/runs/456) artifact **123** "
        f"source {SHA} digest {DIGEST} expiry 2027-01-01T00:00:00Z fingerprint {FP}\n\n"
        "**STATUS: HOLD — no real testing or approval.**\n"
    )


class PacketBoundaryTests(unittest.TestCase):
    def test_seven_release_packets_match_one_exact_retained_artifact(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            ledger = fixture()
            for area, (field, _) in PACKETS.items():
                target = root / ledger[area][field]
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(banner(), encoding="utf-8")
            self.assertEqual(validate_packets(root, ledger), 7)
            one = root / ledger["bookSme"]["reviewPacket"]
            one.write_text(banner().replace(SHA, "d" * 40), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "source missing"):
                validate_packets(root, ledger)

    def test_historical_candidate_mention_does_not_satisfy_current_banner(self):
        text = banner().replace(FP, "sha256:" + "0" * 64) + "\nHistorical candidate " + FP
        with self.assertRaisesRegex(ValueError, "runtime fingerprint missing"):
            validate_packet(text, "qa/BOOK_SME_REVIEW.md", CANDIDATE, RELEASE)

    def test_artifact_must_be_exact_name_not_suffix(self):
        corrupted = copy.deepcopy(CANDIDATE)
        corrupted["artifactName"] = "unexpected-prefix-physical-pwa-candidate-" + SHA
        with self.assertRaisesRegex(ValueError, "artifact name"):
            candidate_identity(corrupted, RELEASE)

    def test_reject_untrusted_expiry_and_boolean_identifier(self):
        for key, value in (("candidateRunId", True), ("artifactId", 0), ("artifactExpiresAt", "not-a-date"),
                           ("artifactExpiresAt", "2027-01-01")):
            candidate = dict(CANDIDATE, **{key: value})
            with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                candidate_identity(candidate, RELEASE)

    def test_external_approval_and_machine_authority_cannot_be_smuggled_in(self):
        for area in PACKETS:
            ledger = fixture()
            ledger[area]["status"] = "validated"
            with self.subTest(area=area), self.assertRaises(ValueError):
                hold_statuses(ledger)
        ledger = fixture()
        ledger["claims"]["automaticMachineControlAuthorized"] = True
        with self.assertRaisesRegex(ValueError, "automaticMachineControlAuthorized"):
            hold_statuses(ledger)

    def test_registry_and_scoped_candidate_inconsistency_fail_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            ledger = fixture()
            ledger["accessibility"]["candidate"]["sourceSha"] = "f" * 40
            with self.assertRaisesRegex(ValueError, "real-AT candidate drift"):
                validate_packets(Path(directory), ledger)


if __name__ == "__main__":
    unittest.main()
