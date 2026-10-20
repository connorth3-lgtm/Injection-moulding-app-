#!/usr/bin/env python3
"""Build one non-promotional engineering-review packet per release case.

Packets copy the exact candidate signal representations already selected by the reviewed
queue builder so an engineer can inspect the actual bounded measurements without manually
joining queue and candidate files. Interpretation, novelty, author identity, reviewer
identity and promotion decisions are deliberately left empty.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROOF = ROOT / "measured-source-proof"
QUEUE = PROOF / "measured-learning-review-queue-v2.json"
READINESS = ROOT / "data/measured-learning/source-readiness-v2.json"
OUT_DIR = PROOF / "review-packets"
INDEX = PROOF / "measured-learning-review-packets-index-v2.json"


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    queue = load(QUEUE)
    if queue.get("status") != "independent-review-required" or queue.get("promotionEligible") is not False:
        raise AssertionError("review packets require a validated non-promotional review queue")
    if len(queue.get("cases", [])) != 70:
        raise AssertionError("review packets require exactly 70 release queue entries")

    rights = {
        item["datasetId"]: item["rightsScope"]
        for item in load(READINESS).get("sources", [])
    }
    candidate_docs: dict[str, dict] = {}
    candidate_files: dict[str, str] = {}
    for entry in queue["cases"]:
        file_name = entry["candidate"]["candidateArtifactFile"]
        if file_name in candidate_docs:
            continue
        doc = load(PROOF / file_name)
        if doc.get("promotionEligible") is not False:
            raise AssertionError(f"{file_name}: candidate document is unexpectedly promotional")
        candidate_docs[file_name] = {
            candidate["candidateId"]: candidate for candidate in doc.get("candidates", [])
        }
        candidate_files.update({candidate["candidateId"]: file_name for candidate in doc.get("candidates", [])})

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for stale in OUT_DIR.glob("MLM-*.json"):
        stale.unlink()

    index_entries = []
    aggregate_bytes = 0
    for entry in queue["cases"]:
        case_id = entry["caseId"]
        qcandidate = entry["candidate"]
        candidate_id = qcandidate["candidateId"]
        file_name = qcandidate["candidateArtifactFile"]
        candidate = candidate_docs[file_name].get(candidate_id)
        if candidate is None:
            raise AssertionError(f"{case_id}: selected candidate {candidate_id} missing from {file_name}")
        if candidate.get("candidateFingerprint") != qcandidate.get("candidateFingerprint"):
            raise AssertionError(f"{case_id}: queue/candidate fingerprint drift")
        if candidate.get("datasetId") != entry.get("sourceFamily"):
            raise AssertionError(f"{case_id}: queue/candidate source-family drift")
        if candidate.get("datasetId") not in rights:
            raise AssertionError(f"{case_id}: rights scope unavailable for source family")

        packet = {
            "schemaVersion": 1,
            "packetId": f"review-packet-{case_id.lower()}",
            "status": "unreviewed-engineering-review-packet",
            "promotionEligible": False,
            "case": {
                "caseId": case_id,
                "title": entry["title"],
                "difficulty": entry["difficulty"],
                "analysisLens": entry["analysisLens"],
                "coverageTags": entry["coverageTags"],
                "sourceFamily": entry["sourceFamily"],
            },
            "evidence": {
                "candidateId": candidate_id,
                "candidateArtifactFile": file_name,
                "candidateFingerprint": candidate["candidateFingerprint"],
                "sourceReference": candidate.get("sourceReference"),
                "sourceArtifacts": copy.deepcopy(qcandidate["sourceArtifacts"]),
                "licenceOrAccessStatus": rights[candidate["datasetId"]],
                "sourceScope": copy.deepcopy(candidate.get("sourceScope", {})),
                "requiredSourceChannels": copy.deepcopy(qcandidate["requiredSourceChannels"]),
                "signals": copy.deepcopy(candidate["signals"]),
                "recommendedFeatures": copy.deepcopy(candidate.get("recommendedFeatures", [])),
                "evidenceBoundary": qcandidate["evidenceBoundary"],
            },
            "authoring": {
                "observations": [],
                "learnerTask": {
                    "observePrompt": None,
                    "investigatePrompt": None,
                    "explanation": None,
                    "takeaway": None,
                },
                "supportedConclusions": [],
                "unsupportedConclusions": [],
                "limitations": [],
                "novelty": {
                    "learningObjective": None,
                    "sourceWindowReuse": None,
                    "reuseJustification": None,
                },
                "sourceEstablishesCausality": None,
                "claimScope": None,
            },
            "review": {
                "state": "unreviewed",
                "authorId": None,
                "reviewerId": None,
                "reviewerRole": None,
                "reviewRecordType": None,
                "reviewRecord": None,
                "reviewedAt": None,
                "decision": None,
                "notes": None,
            },
            "reviewChecklist": copy.deepcopy(queue["reviewChecklist"]),
            "boundary": "This packet contains measured authoring evidence, not a reviewed learner case. Interpretive fields and reviewer metadata are intentionally blank. Promotion requires a completed case-specific governed binding, novelty/window-reuse checks and independent engineering review.",
        }
        path = OUT_DIR / f"{case_id}.json"
        payload = json.dumps(packet, indent=2, ensure_ascii=False) + "\n"
        encoded = payload.encode("utf-8")
        if len(encoded) > 512 * 1024:
            raise AssertionError(f"{case_id}: review packet exceeds 512 KiB")
        path.write_text(payload, encoding="utf-8")
        aggregate_bytes += len(encoded)
        index_entries.append({
            "caseId": case_id,
            "file": f"review-packets/{case_id}.json",
            "candidateId": candidate_id,
            "candidateFingerprint": candidate["candidateFingerprint"],
            "sourceFamily": entry["sourceFamily"],
            "packetBytes": len(encoded),
            "reviewState": "unreviewed",
        })

    if aggregate_bytes > 20 * 1024 * 1024:
        raise AssertionError(f"aggregate review-packet payload exceeds 20 MiB: {aggregate_bytes}")
    index = {
        "schemaVersion": 1,
        "indexId": "measured-learning-review-packets-v2",
        "status": "unreviewed-review-packets-generated",
        "promotionEligible": False,
        "caseCount": len(index_entries),
        "aggregatePacketBytes": aggregate_bytes,
        "packets": index_entries,
        "boundary": "Packets are transient CI review aids only. They do not count as learner cases and contain no fabricated review or promotion state.",
    }
    INDEX.write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": index["status"],
        "caseCount": index["caseCount"],
        "aggregatePacketBytes": aggregate_bytes,
        "reviewedCases": 0,
    }, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
