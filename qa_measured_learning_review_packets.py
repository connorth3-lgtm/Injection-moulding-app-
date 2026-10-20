#!/usr/bin/env python3
"""Fail-closed QA for transient measured-learning engineering-review packets."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROOF = ROOT / "measured-source-proof"
QUEUE = PROOF / "measured-learning-review-queue-v2.json"
INDEX = PROOF / "measured-learning-review-packets-index-v2.json"
PACKETS = PROOF / "review-packets"
READINESS = ROOT / "data/measured-learning/source-readiness-v2.json"
MAX_PACKET_BYTES = 512 * 1024
MAX_AGGREGATE_BYTES = 20 * 1024 * 1024


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def candidate_lookup(queue: dict) -> dict[tuple[str, str], dict]:
    docs: dict[str, dict[str, dict]] = {}
    result: dict[tuple[str, str], dict] = {}
    for entry in queue["cases"]:
        file_name = entry["candidate"]["candidateArtifactFile"]
        if file_name not in docs:
            doc = load(PROOF / file_name)
            assert doc.get("promotionEligible") is False, f"{file_name}: candidate input became promotional"
            docs[file_name] = {c["candidateId"]: c for c in doc.get("candidates", [])}
        candidate_id = entry["candidate"]["candidateId"]
        candidate = docs[file_name].get(candidate_id)
        assert candidate is not None, f"{entry['caseId']}: selected candidate missing from {file_name}"
        result[(file_name, candidate_id)] = candidate
    return result


def main() -> int:
    queue = load(QUEUE)
    index = load(INDEX)
    assert queue.get("status") == "independent-review-required"
    assert queue.get("promotionEligible") is False
    assert len(queue.get("cases", [])) == 70

    rights = {
        source["datasetId"]: source["rightsScope"]
        for source in load(READINESS).get("sources", [])
    }
    candidates = candidate_lookup(queue)
    queue_by_case = {entry["caseId"]: entry for entry in queue["cases"]}

    assert index.get("schemaVersion") == 1
    assert index.get("indexId") == "measured-learning-review-packets-v2"
    assert index.get("status") == "unreviewed-review-packets-generated"
    assert index.get("promotionEligible") is False
    assert index.get("caseCount") == 70
    entries = index.get("packets", [])
    assert len(entries) == 70
    assert [entry["caseId"] for entry in entries] == [f"MLM-{i:03d}" for i in range(1, 71)]
    assert len({entry["caseId"] for entry in entries}) == 70

    files = sorted(PACKETS.glob("MLM-*.json"))
    assert [path.name for path in files] == [f"MLM-{i:03d}.json" for i in range(1, 71)]

    aggregate = 0
    for idx_entry, path in zip(entries, files):
        case_id = idx_entry["caseId"]
        queue_entry = queue_by_case[case_id]
        packet = load(path)
        encoded_bytes = path.stat().st_size
        aggregate += encoded_bytes
        assert encoded_bytes <= MAX_PACKET_BYTES, f"{case_id}: review packet exceeds {MAX_PACKET_BYTES} bytes"
        assert idx_entry.get("packetBytes") == encoded_bytes, f"{case_id}: indexed packet byte count drift"
        assert idx_entry.get("file") == f"review-packets/{case_id}.json"
        assert idx_entry.get("reviewState") == "unreviewed"

        assert packet.get("schemaVersion") == 1
        assert packet.get("packetId") == f"review-packet-{case_id.lower()}"
        assert packet.get("status") == "unreviewed-engineering-review-packet"
        assert packet.get("promotionEligible") is False
        assert packet.get("boundary")

        case = packet.get("case", {})
        for key, queue_key in (
            ("caseId", "caseId"),
            ("title", "title"),
            ("difficulty", "difficulty"),
            ("analysisLens", "analysisLens"),
            ("coverageTags", "coverageTags"),
            ("sourceFamily", "sourceFamily"),
        ):
            assert case.get(key) == queue_entry.get(queue_key), f"{case_id}: packet/queue {key} drift"

        evidence = packet.get("evidence", {})
        qcandidate = queue_entry["candidate"]
        candidate_id = qcandidate["candidateId"]
        file_name = qcandidate["candidateArtifactFile"]
        source_candidate = candidates[(file_name, candidate_id)]
        assert evidence.get("candidateId") == candidate_id
        assert evidence.get("candidateArtifactFile") == file_name
        assert evidence.get("candidateFingerprint") == qcandidate["candidateFingerprint"] == source_candidate["candidateFingerprint"]
        assert idx_entry.get("candidateId") == candidate_id
        assert idx_entry.get("candidateFingerprint") == source_candidate["candidateFingerprint"]
        assert idx_entry.get("sourceFamily") == queue_entry["sourceFamily"]
        assert evidence.get("sourceArtifacts") == qcandidate["sourceArtifacts"]
        assert evidence.get("sourceScope") == source_candidate.get("sourceScope", {})
        assert evidence.get("requiredSourceChannels") == qcandidate["requiredSourceChannels"]
        assert evidence.get("signals") == source_candidate["signals"], f"{case_id}: packet signal representation drift"
        assert evidence.get("recommendedFeatures") == source_candidate.get("recommendedFeatures", [])
        assert evidence.get("evidenceBoundary") == qcandidate["evidenceBoundary"] and evidence.get("evidenceBoundary")
        assert evidence.get("licenceOrAccessStatus") == rights[queue_entry["sourceFamily"]]
        if source_candidate.get("sourceReference") is not None:
            assert evidence.get("sourceReference") == source_candidate.get("sourceReference")

        signals = evidence.get("signals", [])
        assert signals
        bound = {signal["sourceChannel"] for signal in signals}
        assert set(evidence.get("requiredSourceChannels", [])) <= bound
        if "multi-signal" in case.get("coverageTags", []):
            assert len(signals) >= 2, f"{case_id}: multi-signal packet has fewer than two signals"
        for signal in signals:
            rep = signal.get("representation", {})
            assert len(rep.get("x", [])) == len(rep.get("y", [])) > 1
            assert str(signal.get("representationFingerprint", "")).startswith("sha256:")
            assert signal.get("semantic") and signal.get("unit") not in (None, "")
            assert rep.get("xSemantic") and rep.get("xUnit") not in (None, "")

        authoring = packet.get("authoring", {})
        assert authoring.get("observations") == []
        learner = authoring.get("learnerTask", {})
        for key in ("observePrompt", "investigatePrompt", "explanation", "takeaway"):
            assert learner.get(key) is None, f"{case_id}: review packet must not pre-author {key}"
        for key in ("supportedConclusions", "unsupportedConclusions", "limitations"):
            assert authoring.get(key) == [], f"{case_id}: review packet must leave {key} empty"
        novelty = authoring.get("novelty", {})
        for key in ("learningObjective", "sourceWindowReuse", "reuseJustification"):
            assert novelty.get(key) is None, f"{case_id}: review packet must not pre-judge novelty/{key}"
        assert authoring.get("sourceEstablishesCausality") is None
        assert authoring.get("claimScope") is None

        review = packet.get("review", {})
        assert review.get("state") == "unreviewed"
        for key in (
            "authorId", "reviewerId", "reviewerRole", "reviewRecordType", "reviewRecord",
            "reviewedAt", "decision", "notes",
        ):
            assert review.get(key) is None, f"{case_id}: review packet must not fabricate {key}"
        assert packet.get("reviewChecklist") == queue.get("reviewChecklist")

    assert aggregate == index.get("aggregatePacketBytes"), "review packet aggregate byte count drift"
    assert aggregate <= MAX_AGGREGATE_BYTES, f"review packets exceed {MAX_AGGREGATE_BYTES} aggregate bytes"
    assert index.get("boundary")
    print(json.dumps({
        "status": "review-packets-qa-passed",
        "caseCount": len(entries),
        "aggregatePacketBytes": aggregate,
        "reviewedCases": 0,
        "promotionEligible": False,
    }, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
