#!/usr/bin/env python3
"""Build a deduplicated injection-moulding research *candidate* registry from OpenAlex.

This tool intentionally does not promote search results to verified evidence. It creates
bibliographic candidates for human/evidence review. A record may only count toward the
primary-measured target after `verification.primaryMeasuredReviewed` is set true by a
review process that confirms actual experimental/industrial measurements.

No third-party paper text is copied into the repository. Abstracts are used transiently
for classification and only compact derived tags are stored by default.
"""
from __future__ import annotations

import argparse
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

OPENALEX = "https://api.openalex.org/works"

QUERIES = [
    "injection molding cavity pressure experimental",
    "injection moulding cavity pressure experimental",
    "injection molding process monitoring sensors",
    "injection moulding process monitoring sensors",
    "injection molding quality prediction experimental",
    "injection molding time series process data",
    "injection molding machine learning quality experimental",
    "injection molding nozzle pressure viscosity",
    "injection molding tie bar strain clamp force",
    "injection molding ultrasonic sensor monitoring",
    "injection molding dielectric capacitance sensor",
    "injection molding temperature sensor heat transfer",
    "injection molding conformal cooling experimental",
    "injection molding warpage shrinkage experimental",
    "injection molding weld line mechanical experimental",
    "injection molding short shot burn mark experimental",
    "injection molding recycled polypropylene experimental",
    "injection molding recyclate rheology experimental",
    "injection molding moisture drying polycarbonate polyamide experimental",
    "micro injection molding experimental pressure temperature",
    "injection molding energy consumption experimental",
    "injection molding machine condition monitoring fault diagnosis",
    "injection molding vibration motor current monitoring",
    "injection molding screw wear check ring repeatability",
    "injection molding fibre orientation x-ray tomography",
    "injection molding in mold rheology experimental",
    "injection molding pvT inline experimental",
    "injection molding multivariate process quality industrial data",
    "scientific molding experimental cavity sensor",
    "injection moulding process control experimental"
]

MEASURED_MARKERS = {
    "experiment", "experimental", "measured", "measurement", "measurements",
    "sensor", "sensors", "monitoring", "test", "tests", "trial", "trials",
    "industrial", "production", "moulded", "molded", "specimen", "specimens",
    "pressure", "temperature", "weight", "mass", "dimension", "warpage",
    "shrinkage", "tensile", "energy", "current", "vibration", "ultrasonic",
    "ultrasound", "thermocouple", "strain", "cavity", "nozzle"
}
SIM_ONLY_MARKERS = {"simulation only", "numerical study only", "finite element only"}
REVIEW_MARKERS = {"review", "systematic review", "literature review", "survey"}

TAG_RULES = {
    "cavity-pressure": ["cavity pressure"],
    "nozzle-pressure": ["nozzle pressure"],
    "machine-pressure": ["injection pressure", "hydraulic pressure"],
    "temperature": ["temperature", "thermocouple", "thermal"],
    "screw-position-velocity": ["screw position", "screw velocity", "injection velocity"],
    "clamp-tiebar": ["clamp force", "clamping force", "tie bar", "tie-bar"],
    "ultrasound": ["ultrasound", "ultrasonic"],
    "dielectric-capacitance": ["dielectric", "capacitance"],
    "vibration-current": ["vibration", "motor current", "electrical current"],
    "quality-weight-dimensions": ["part weight", "product weight", "dimension", "dimensional"],
    "warpage-shrinkage": ["warpage", "shrinkage", "sink mark", "sink marks"],
    "weld-line": ["weld line", "knit line"],
    "short-shot-burn": ["short shot", "short-shot", "burn mark", "dieseling"],
    "recycled-material": ["recycled", "recyclate", "post-consumer", "pcr"],
    "moisture-drying": ["moisture", "drying", "hydrolysis"],
    "micro-moulding": ["micro injection", "micro-injection", "microinjection"],
    "energy": ["energy consumption", "specific energy", "electricity consumption"],
    "machine-health": ["fault diagnosis", "condition monitoring", "wear", "maintenance", "drift"],
    "machine-learning": ["machine learning", "neural network", "random forest", "support vector"],
    "cooling-heat-transfer": ["conformal cooling", "heat transfer", "cooling channel", "solidification"],
    "fibre-composite": ["fiber orientation", "fibre orientation", "glass fiber", "glass fibre", "composite"],
    "rheology-viscosity": ["rheology", "viscosity", "melt flow", "pvt", "pvt"]
}


def request_json(url: str, timeout: int = 45, max_attempts: int = 6) -> dict:
    """Fetch OpenAlex JSON with bounded retry/backoff for transient rate/service errors."""
    retryable_http = {429, 500, 502, 503, 504}
    for attempt in range(max_attempts):
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "MouldMasterResearchRegistry/1.0 (open-source educational project)"},
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.load(r)
        except urllib.error.HTTPError as exc:
            if exc.code not in retryable_http or attempt + 1 >= max_attempts:
                raise
            delay = min(60.0, max(2.0, float(2 ** attempt)))
            retry_after = exc.headers.get("Retry-After") if exc.headers else None
            if retry_after:
                try:
                    delay = min(60.0, max(delay, float(retry_after)))
                except ValueError:
                    pass
            time.sleep(delay)
        except urllib.error.URLError:
            if attempt + 1 >= max_attempts:
                raise
            time.sleep(min(30.0, max(2.0, float(2 ** attempt))))
    raise RuntimeError("OpenAlex request retry loop exhausted unexpectedly")


def abstract_text(work: dict) -> str:
    inv = work.get("abstract_inverted_index") or {}
    if not inv:
        return ""
    positions = []
    for token, idxs in inv.items():
        for idx in idxs:
            positions.append((idx, token))
    positions.sort()
    return " ".join(token for _, token in positions)


def norm_doi(value: str | None) -> str | None:
    if not value:
        return None
    value = value.strip().lower()
    value = re.sub(r"^https?://(dx\.)?doi\.org/", "", value)
    return value or None


def compact_authors(work: dict, limit: int = 12) -> list[str]:
    out = []
    for a in work.get("authorships") or []:
        name = ((a.get("author") or {}).get("display_name") or "").strip()
        if name and name not in out:
            out.append(name)
        if len(out) >= limit:
            break
    return out


def classify(work: dict) -> dict:
    title = (work.get("title") or "").strip()
    abstract = abstract_text(work)
    text = f"{title} {abstract}".lower()
    injection = "injection mold" in text or "injection mould" in text or "micro-injection" in text or "micro injection" in text
    review = any(m in text for m in REVIEW_MARKERS)
    simulation_only = any(m in text for m in SIM_ONLY_MARKERS)
    marker_hits = sorted({m for m in MEASURED_MARKERS if m in text})
    measured_candidate = injection and not review and not simulation_only and len(marker_hits) >= 3
    tags = []
    for tag, needles in TAG_RULES.items():
        if any(n in text for n in needles):
            tags.append(tag)
    return {
        "injectionMouldingRelevant": injection,
        "reviewLike": review,
        "simulationOnlyHeuristic": simulation_only,
        "primaryMeasuredCandidate": measured_candidate,
        "measuredMarkerHits": marker_hits[:20],
        "topicTags": tags
    }


def bibliographic_record(work: dict, query: str) -> dict:
    primary = work.get("primary_location") or {}
    source = primary.get("source") or {}
    doi = norm_doi(work.get("doi"))
    c = classify(work)
    return {
        "id": work.get("id"),
        "doi": doi,
        "title": work.get("title"),
        "year": work.get("publication_year"),
        "type": work.get("type"),
        "venue": source.get("display_name"),
        "venueType": source.get("type"),
        "isOpenAccess": bool((work.get("open_access") or {}).get("is_oa")),
        "citedByCount": work.get("cited_by_count", 0),
        "authors": compact_authors(work),
        "discoveredBy": [query],
        "classification": c,
        "verification": {
            "bibliographicReviewed": False,
            "peerReviewedConfirmed": False,
            "primaryMeasuredReviewed": False,
            "measuredSignalsReviewed": [],
            "limitationsReviewed": False,
            "notes": "Candidate only. Must be reviewed before counting toward MouldMaster accepted research/measured-study targets."
        }
    }


def merge_record(existing: dict, incoming: dict) -> None:
    for q in incoming["discoveredBy"]:
        if q not in existing["discoveredBy"]:
            existing["discoveredBy"].append(q)
    existing["classification"]["topicTags"] = sorted(set(existing["classification"]["topicTags"]) | set(incoming["classification"]["topicTags"]))
    existing["classification"]["measuredMarkerHits"] = sorted(set(existing["classification"]["measuredMarkerHits"]) | set(incoming["classification"]["measuredMarkerHits"]))[:20]
    existing["classification"]["primaryMeasuredCandidate"] = bool(existing["classification"]["primaryMeasuredCandidate"] or incoming["classification"]["primaryMeasuredCandidate"])


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", default="data/research-master-candidates.json")
    ap.add_argument("--target", type=int, default=2000, help="Maximum unique candidate records to retain")
    ap.add_argument("--per-query-pages", type=int, default=6, help="Maximum OpenAlex cursor pages per query")
    ap.add_argument("--mailto", default="", help="Optional contact email appended to OpenAlex requests")
    ap.add_argument("--sleep", type=float, default=0.35)
    args = ap.parse_args()

    records: dict[str, dict] = {}
    for query in QUERIES:
        cursor = "*"
        pages = 0
        while cursor and pages < args.per_query_pages and len(records) < args.target:
            params = {
                "search": query,
                "per-page": "200",
                "cursor": cursor,
                "select": "id,doi,title,publication_year,type,primary_location,open_access,cited_by_count,authorships,abstract_inverted_index"
            }
            if args.mailto:
                params["mailto"] = args.mailto
            url = OPENALEX + "?" + urllib.parse.urlencode(params)
            payload = request_json(url)
            for work in payload.get("results") or []:
                rec = bibliographic_record(work, query)
                c = rec["classification"]
                if not c["injectionMouldingRelevant"]:
                    continue
                # Keep likely scholarly articles/conference records. Verification later
                # determines whether each record is truly peer reviewed.
                if rec.get("type") not in {"article", "book-chapter"}:
                    continue
                key = rec.get("doi") or rec.get("id") or (rec.get("title") or "").strip().lower()
                if not key:
                    continue
                if key in records:
                    merge_record(records[key], rec)
                else:
                    records[key] = rec
                if len(records) >= args.target:
                    break
            cursor = (payload.get("meta") or {}).get("next_cursor")
            pages += 1
            time.sleep(args.sleep)

    out = sorted(records.values(), key=lambda r: (not r["classification"]["primaryMeasuredCandidate"], -(r.get("citedByCount") or 0), r.get("year") or 0, r.get("title") or ""))
    payload = {
        "schema": 1,
        "source": "OpenAlex",
        "status": "candidate-registry-not-counted-as-verified",
        "queryCount": len(QUERIES),
        "candidateCount": len(out),
        "primaryMeasuredCandidateCount": sum(1 for r in out if r["classification"]["primaryMeasuredCandidate"]),
        "records": out,
        "boundary": "Search/classification output is discovery evidence only. No record counts toward accepted peer-reviewed or primary-measured targets until its verification fields are explicitly reviewed and approved."
    }
    path = Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(out)} deduplicated candidates to {path}; {payload['primaryMeasuredCandidateCount']} heuristic primary-measured candidates require review.")


if __name__ == "__main__":
    main()
