#!/usr/bin/env python3
"""Fail-closed QA for the post-.27 v28 measured/source expansion queue."""
from __future__ import annotations
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
QUEUE = ROOT / "data" / "measured-dataset-v28-expansion-queue.json"
CANONICAL = ROOT / "data" / "measured-dataset-inventory-v1.json"
DISCOVERY = ROOT / "data" / "measured-data-discovery-queue-v1.json"


def die(msg: str) -> None:
    raise SystemExit(f"v28 measured-source expansion QA FAILED: {msg}")


def load(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        die(f"cannot load {path.relative_to(ROOT)}: {exc}")


q = load(QUEUE)
canonical = load(CANONICAL)
discovery = load(DISCOVERY)

if q.get("schema") != 1:
    die("schema must be 1")

required_rules = [
    "queueDoesNotChangeCanonicalCounts",
    "metadataDoesNotEqualIngestedData",
    "rightsPayloadSchemaRequiredBeforePromotion",
    "simulationNeverCountsAsMeasuredProcessEvidence",
    "articleLicenseDoesNotAutomaticallyLicenseUnderlyingData",
    "supportingDataRemainSeparateFromInjectionProcessTimeSeries",
    "blockedSourcesCountZero",
    "duplicatesDoNotIncreaseBreadth",
]
for key in required_rules:
    if (q.get("rules") or {}).get(key) is not True:
        die(f"required fail-closed rule missing/false: {key}")

expected_baseline = {
    "inventoriedMeasuredSources": 34,
    "rightsExecutableSources": 21,
    "fullyProfiledMeasuredFamilies": 17,
    "acceptedInjectionProcessTimeSeriesObservations": 85569824,
}
if q.get("baselineCanonical") != expected_baseline:
    die("canonical baseline snapshot changed; reconcile explicitly before updating the queue")

if q.get("acceptedDelta") != {
    "fullyProfiledFamilies": 0,
    "acceptedInjectionProcessTimeSeriesObservations": 0,
}:
    die("discovery/profile queue must not modify accepted evidence counts")

items = q.get("candidates")
if not isinstance(items, list) or len(items) < 18:
    die("expected >=18 active candidates to overshoot the 13-family breadth gap")

ids, sources = set(), set()
canonical_sources = {
    str(d.get("source", "")).lower()
    for d in canonical.get("datasets", [])
    if isinstance(d, dict) and d.get("source")
}
discovery_sources = {
    str(d.get("source", "")).lower()
    for d in discovery.get("activeDiscoveries", [])
    if isinstance(d, dict) and d.get("source")
}

for n, item in enumerate(items, 1):
    if not isinstance(item, dict):
        die(f"candidate {n} is not an object")
    for field in (
        "id", "title", "source", "role", "license", "accessState",
        "promotionState", "measuredStatus", "acceptedMeasuredTimeSeriesSamples", "blockers"
    ):
        if field not in item:
            die(f"candidate {n} missing {field}")
    cid, src = item["id"], item["source"]
    if cid in ids:
        die(f"duplicate candidate id: {cid}")
    ids.add(cid)
    if src in sources:
        die(f"duplicate candidate source: {src}")
    sources.add(src)
    parsed = urlparse(src)
    if parsed.scheme != "https" or not parsed.netloc:
        die(f"candidate {cid} source must be https")
    if item["acceptedMeasuredTimeSeriesSamples"] != 0:
        die(f"candidate {cid} adds measured samples before promotion evidence")
    if not isinstance(item.get("blockers"), list) or not item["blockers"]:
        die(f"candidate {cid} must retain explicit blocker/review requirements")
    if src.lower() in canonical_sources:
        die(f"candidate {cid} is already canonical: {src}")
    if src.lower() in discovery_sources:
        die(f"candidate {cid} is already in the prior active discovery queue: {src}")

    combined = " ".join(str(item.get(k, "")) for k in ("accessState", "promotionState", "license")).lower()
    if any(token in combined for token in ("embargo", "confidential", "request-only", "rights-review", "rights-and")):
        if item["acceptedMeasuredTimeSeriesSamples"] != 0:
            die(f"blocked candidate {cid} contributes measured samples")

    status = str(item.get("measuredStatus", "")).lower()
    if "simulation" in status and "separate" not in status and "plus separate" not in status:
        die(f"simulation-only source {cid} belongs in screened-out evidence")


target = q.get("target") or {}
if target.get("breadthGap") != 13:
    die("baseline breadth gap must remain 13")
if target.get("activeExpansionCandidates") != len(items):
    die("activeExpansionCandidates does not match candidate count")
if target.get("overshootCandidateMargin") != len(items) - 13:
    die("overshootCandidateMargin inconsistent")
if len(items) <= 13:
    die("queue does not exceed the current profiled-family breadth gap")

screened = q.get("screenedOutOrAlreadyGoverned")
if not isinstance(screened, list) or len(screened) < 5:
    die("retain >=5 dedupe/screen-out records as audit evidence")
seen_screened = set()
for item in screened:
    for field in ("id", "source", "decision", "reason"):
        if not item.get(field):
            die(f"screened record missing {field}")
    if item["id"] in seen_screened or item["id"] in ids:
        die(f"duplicate/active screened id: {item['id']}")
    seen_screened.add(item["id"])

print(
    "v28 measured-source expansion QA PASS: "
    f"{len(items)} active candidates, {len(screened)} screened/deduped, canonical accepted delta = 0"
)
