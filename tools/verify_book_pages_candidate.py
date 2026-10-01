#!/usr/bin/env python3
"""Verify the live Pages candidate contains the governed MouldMaster Book release.

This is a network verifier for the bytes actually served by GitHub Pages. It is
intentionally narrower than browser/device validation: it proves Book identity,
authorization, authored coverage, runtime parity markers, governed SME-status
reporting and release-cache wiring. It does not claim physical-device,
accessibility, independent SME approval or learner-outcome evidence.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

BOOK_ROOT = "src/domains/learning/book-data/"
MANIFEST = BOOK_ROOT + "book-manifest-v1.json"
AUTH = BOOK_ROOT + "book-publication-authorization-v1.json"
SME = BOOK_ROOT + "book-sme-review-v1.json"
WORKED = BOOK_ROOT + "book-worked-engineering-cases-v1.json"
DIAGRAMS = BOOK_ROOT + "book-engineering-diagrams-v1.json"
ENRICHMENT = BOOK_ROOT + "book-evidence-enrichment-v2.json"
MATERIAL_ATLAS = BOOK_ROOT + "book-material-grade-atlas-v1.json"
MATERIAL_REGIONAL = BOOK_ROOT + "book-material-regional-evidence-v1.json"
MATERIAL_CATALOG = "material-catalog-v1.json"
RUNTIME = "src/domains/learning/book-runtime.js"
BATCHES = (
    BOOK_ROOT + "book-authored-foundations-v1.json",
    BOOK_ROOT + "book-evidence-registry-v1.json",
    BOOK_ROOT + "book-chapters-materials-machine-v1.json",
    BOOK_ROOT + "book-authored-remaining-v1.json",
)
EXPECTED_SNAPSHOT = {
    "chapters": 46,
    "claims": 137,
    "supported": 116,
    "qualified": 21,
    "hold": 0,
    "conflicting": 0,
    "scopeQualifiedClaimsBlockingPublication": 0,
}
RUNTIME_MARKERS = (
    "applyPublicationAuthorization",
    "book-publication-authorization-v1.json",
    "book-sme-review-v1.json",
    "validateSmeReview",
    "Independent human SME review:",
    "status unavailable — do not infer approval",
    "verifiedChapterHtml",
    "startVerifiedListening",
    "reader.refresh?.()",
    "play.click()",
    "Authored draft cannot self-promote to verified",
    "WORKED_CASES_PATH",
    "validateWorkedCases",
    "workedCaseHtml",
    "ENRICHMENT_PATH",
    "validateEvidenceEnrichment",
    "getEvidenceEnrichment",
    "MATERIAL_ATLAS_PATH",
    "validateMaterialAtlas",
    "materialAtlasHtml",
    "getMaterialAtlas",
    "MATERIAL_REGIONAL_PATH",
    "MATERIAL_CATALOG_PATH",
    "validateMaterialCatalog",
    "validateMaterialRegionalEvidence",
    "getMaterialCatalog",
    "getMaterialRegionalEvidence",
    "includeTechnicalMaterial:false",
)


def fetch(url: str) -> tuple[int, bytes]:
    request = Request(url, headers={"User-Agent": "MouldMaster-Book-Pages-Verifier/1"})
    try:
        with urlopen(request, timeout=15) as response:
            return int(response.status), response.read()
    except HTTPError as exc:
        return int(exc.code), exc.read()
    except URLError as exc:
        raise RuntimeError(f"could not fetch {url}: {exc}") from exc


def git_blob_sha(body: bytes) -> str:
    return hashlib.sha1(f"blob {len(body)}\0".encode() + body).hexdigest()


def fetch_bytes(root: str, path: str) -> bytes:
    status, body = fetch(urljoin(root, path))
    if status != 200:
        raise AssertionError(f"{path} unavailable: HTTP {status}")
    return body


def fetch_text(root: str, path: str) -> str:
    return fetch_bytes(root, path).decode("utf-8", errors="strict")


def fetch_json(root: str, path: str) -> dict:
    text = fetch_text(root, path)
    try:
        value = json.loads(text)
    except json.JSONDecodeError as exc:
        raise AssertionError(f"{path} is invalid JSON") from exc
    if not isinstance(value, dict):
        raise AssertionError(f"{path} must contain a JSON object")
    return value


def chapter_ids(manifest: dict) -> list[str]:
    parts = manifest.get("parts")
    if not isinstance(parts, list) or len(parts) != 8:
        raise AssertionError("Book manifest must expose exactly 8 parts")
    ids: list[str] = []
    for part in parts:
        chapters = part.get("chapters") if isinstance(part, dict) else None
        if not isinstance(chapters, list):
            raise AssertionError("Book manifest part is missing its chapter list")
        for chapter in chapters:
            if not isinstance(chapter, dict) or not str(chapter.get("id") or "").strip():
                raise AssertionError("Book manifest contains a chapter without an id")
            ids.append(str(chapter["id"]))
    if len(ids) != 46 or len(set(ids)) != 46:
        raise AssertionError(f"Book manifest chapter identity mismatch: {len(ids)} rows / {len(set(ids))} unique")
    return ids


def sme_summary(sme: dict, ids: list[str]) -> tuple[str, int, int]:
    if sme.get("schemaVersion") != 1 or sme.get("bookId") != "mouldmaster-book":
        raise AssertionError("live Book SME review contract identity mismatch")
    chapter_rows = sme.get("chapterIds")
    reviews = sme.get("reviews")
    if not isinstance(chapter_rows, list) or len(chapter_rows) != 46 or len(set(chapter_rows)) != 46:
        raise AssertionError("live Book SME review contract must contain exactly 46 unique chapter ids")
    if set(chapter_rows) != set(ids):
        raise AssertionError("live Book SME review chapter set does not exactly match the Book manifest")
    if not isinstance(reviews, list):
        raise AssertionError("live Book SME review contract reviews must be a list")
    approved: set[str] = set()
    for review in reviews:
        if not isinstance(review, dict) or review.get("chapterId") not in set(ids):
            raise AssertionError("live Book SME review contains an unknown or missing chapter id")
        if review.get("conclusion") == "approved":
            approved.add(str(review["chapterId"]))
    status = str(sme.get("status") or "")
    if status == "validated" and len(approved) != 46:
        raise AssertionError("live Book SME review claims validated without 46 approved chapter reviews")
    return status, len(approved), len(chapter_rows)


def verify_once(base_url: str, candidate_path: str, expected_release: str | None) -> None:
    base = base_url.rstrip("/") + "/"
    candidate = urljoin(base, candidate_path.strip("/") + "/") if candidate_path.strip("/") else base

    version = fetch_json(candidate, "version.json")
    web_release = str(version.get("web_release") or "")
    if not re.fullmatch(r"\d{4}\.\d{2}\.\d{2}\.\d+", web_release):
        raise AssertionError("candidate version.json has an invalid web_release")
    if expected_release and web_release != expected_release:
        raise AssertionError(f"candidate release mismatch: expected {expected_release}, got {web_release}")

    worker = fetch_text(candidate, "service-worker.js")
    cache_match = re.search(r"CACHE_VERSION\s*=\s*['\"]([^'\"]+)['\"]", worker)
    if not cache_match or cache_match.group(1) != web_release:
        raise AssertionError("candidate service-worker release does not match version.json")
    for path in (RUNTIME, MANIFEST, AUTH, SME, WORKED, DIAGRAMS, ENRICHMENT, MATERIAL_ATLAS, MATERIAL_REGIONAL, MATERIAL_CATALOG, *BATCHES):
        marker = f"'./{path}'"
        if marker not in worker and f'"./{path}"' not in worker:
            raise AssertionError(f"candidate service worker does not govern Book asset: {path}")

    runtime = fetch_text(candidate, RUNTIME)
    missing_runtime = [marker for marker in RUNTIME_MARKERS if marker not in runtime]
    if missing_runtime:
        raise AssertionError("live Book runtime is missing governed markers: " + ", ".join(missing_runtime))

    manifest = fetch_json(candidate, MANIFEST)
    if manifest.get("schema") != 1 or manifest.get("bookId") != "mouldmaster-book":
        raise AssertionError("live Book manifest identity mismatch")
    ids = chapter_ids(manifest)

    auth = fetch_json(candidate, AUTH)
    if auth.get("schema") != 1 or auth.get("bookId") != "mouldmaster-book" or auth.get("status") != "authorized":
        raise AssertionError("live Book publication authorization is not authorized")
    snapshot = auth.get("governanceSnapshot")
    if not isinstance(snapshot, dict):
        raise AssertionError("live Book authorization governance snapshot is missing")
    if snapshot.get("manifestVersion") != manifest.get("version"):
        raise AssertionError("live Book authorization governance snapshot does not bind the served manifest version")
    for key, expected in EXPECTED_SNAPSHOT.items():
        if snapshot.get(key) != expected:
            raise AssertionError(f"live Book authorization snapshot mismatch for {key}: {snapshot.get(key)!r}")
    authorized = auth.get("authorizedChapterIds")
    if not isinstance(authorized, list) or len(authorized) != 46 or len(set(authorized)) != 46:
        raise AssertionError("live Book authorization must contain exactly 46 unique chapter ids")
    if set(authorized) != set(ids):
        raise AssertionError("live Book authorization chapter set does not exactly match the manifest")

    integrity = auth.get("runtimeIntegrity")
    hashes = integrity.get("gitBlobSha1ByFile") if isinstance(integrity, dict) else None
    if not isinstance(hashes, dict) or integrity.get("algorithm") != "git-blob-sha1":
        raise AssertionError("live Book exact-byte authorization contract is missing")
    integrity_paths = (MANIFEST, SME, WORKED, DIAGRAMS, ENRICHMENT, MATERIAL_ATLAS, MATERIAL_REGIONAL, MATERIAL_CATALOG, *BATCHES)
    for path in integrity_paths:
        name = path.rsplit("/", 1)[-1]
        expected = hashes.get(name)
        if not isinstance(expected, str) or not re.fullmatch(r"[0-9a-f]{40}", expected):
            raise AssertionError(f"live Book exact-byte authorization missing: {name}")
        actual = git_blob_sha(fetch_bytes(candidate, path))
        if actual != expected:
            raise AssertionError(f"live Book exact-byte authorization mismatch: {name}")

    worked_auth = auth.get("workedCasesAuthorization")
    if not isinstance(worked_auth, dict) or worked_auth.get("status") != "authorized":
        raise AssertionError("live Book worked-case authorization is missing")
    if worked_auth.get("caseCount") != 18 or worked_auth.get("claimCount") != 18:
        raise AssertionError("live Book worked-case authorization counts drifted")
    if worked_auth.get("independentSmeStatus") != "hold":
        raise AssertionError("live Book worked-case authorization must preserve independent SME HOLD")

    enrichment_auth = auth.get("evidenceEnrichmentAuthorization")
    if not isinstance(enrichment_auth, dict) or enrichment_auth.get("status") != "authorized":
        raise AssertionError("live Book evidence-enrichment authorization is missing")
    if enrichment_auth.get("chapterCount") != 10 or enrichment_auth.get("sectionCount") != 13:
        raise AssertionError("live Book evidence-enrichment authorization counts drifted")
    if enrichment_auth.get("independentSmeStatus") != "hold":
        raise AssertionError("live Book evidence-enrichment authorization must preserve independent SME HOLD")

    atlas = fetch_json(candidate, MATERIAL_ATLAS)
    if atlas.get("schemaVersion") != 2 or atlas.get("bookId") != "mouldmaster-book" or atlas.get("status") != "technical-review-material-atlas":
        raise AssertionError("live Book material atlas identity mismatch")
    if (atlas.get("canonicalCatalog") or {}).get("gradeCount") != 260:
        raise AssertionError("live Book material atlas must declare all 260 canonical grades")
    if (atlas.get("regionalEvidence") or {}).get("recordCount") != 284:
        raise AssertionError("live Book material atlas must declare all 284 regional evidence rows")
    catalog = fetch_json(candidate, MATERIAL_CATALOG)
    grades = catalog.get("grades")
    if catalog.get("status") != "validated" or not isinstance(grades, list) or len(grades) != 260:
        raise AssertionError("live canonical material catalogue coverage mismatch")
    regional = fetch_json(candidate, MATERIAL_REGIONAL)
    rows = regional.get("records")
    if regional.get("version") != "2026-09-28.40" or not isinstance(rows, list) or len(rows) != 284:
        raise AssertionError("live regional material evidence coverage mismatch")
    status_counts = {}
    for row in rows:
        if not isinstance(row, dict):
            raise AssertionError("live regional material evidence contains a non-object row")
        key = row.get("status")
        status_counts[key] = status_counts.get(key, 0) + 1
    if status_counts != {"candidate-complete":161,"conditional":4,"discovery-only":112,"candidate-partial":7}:
        raise AssertionError(f"live regional material evidence status counts drifted: {status_counts}")
    atlas_auth = auth.get("materialAtlasAuthorization")
    if not isinstance(atlas_auth, dict) or atlas_auth.get("status") != "authorized-technical-review-appendix":
        raise AssertionError("live Book material atlas authorization is missing")
    if atlas_auth.get("canonicalGradeCount") != 260 or atlas_auth.get("regionalEvidenceRowCount") != 284 or atlas_auth.get("independentSmeStatus") != "hold":
        raise AssertionError("live Book material atlas authorization counts/boundary drifted")

    sme = fetch_json(candidate, SME)
    sme_status, sme_approved, sme_total = sme_summary(sme, ids)
    worked = fetch_json(candidate, WORKED)
    cases = worked.get("cases")
    worked_release = str(worked.get("release") or "")
    if worked.get("schemaVersion") != 1 or worked.get("bookId") != "mouldmaster-book" or not worked_release:
        raise AssertionError("live Book worked-case ledger identity/release mismatch")
    if worked_release > web_release or worked_auth.get("release") != worked_release:
        raise AssertionError("live Book worked-case authorization is not bound to its governed content release")
    if not isinstance(cases, list) or len(cases) != 18 or len({str(x.get("id")) for x in cases if isinstance(x, dict)}) != 18:
        raise AssertionError("live Book worked-case ledger must contain exactly 18 unique cases")
    worked_ids = [str(x.get("id")) for x in cases]
    diagrams = fetch_json(candidate, DIAGRAMS)
    diagram_rows = diagrams.get("diagrams")
    diagram_auth = auth.get("diagramAuthorization")
    if not isinstance(diagram_auth, dict) or diagram_auth.get("status") != "authorized-instructional-diagrams" or diagram_auth.get("diagramCount") != 8 or diagram_auth.get("independentSmeStatus") != "hold":
        raise AssertionError("live Book engineering-diagram authorization is missing or weakened")
    if diagrams.get("schemaVersion") != 1 or diagrams.get("bookId") != "mouldmaster-book" or diagrams.get("release") != worked_release or not isinstance(diagram_rows, list) or len(diagram_rows) != 8:
        raise AssertionError("live Book engineering-diagram ledger identity/count mismatch")
    diagram_ids=[]
    for item in diagram_rows:
        asset=str(item.get("asset") or "")
        expected=str(item.get("gitBlobSha1") or "")
        if not re.fullmatch(r"assets/book-diagrams/[a-z0-9-]+\.svg", asset) or not re.fullmatch(r"[0-9a-f]{40}", expected):
            raise AssertionError("live Book engineering-diagram asset contract is invalid")
        if git_blob_sha(fetch_bytes(candidate, asset)) != expected:
            raise AssertionError(f"live Book engineering-diagram byte mismatch: {asset}")
        diagram_ids.append(str(item.get("id") or ""))
    if len(set(diagram_ids)) != 8 or sme.get("diagramIds") != diagram_ids:
        raise AssertionError("live Book SME contract does not cover the governed engineering diagrams")
    if sme.get("release") != worked_release or sme.get("workedCaseIds") != worked_ids:
        raise AssertionError("live Book SME contract does not cover the governed worked-case release")
    enrichment = fetch_json(candidate, ENRICHMENT)
    patches = enrichment.get("chapterPatches")
    enrichment_release = str(enrichment.get("release") or "")
    if enrichment.get("schemaVersion") != 1 or enrichment.get("bookId") != "mouldmaster-book" or not enrichment_release:
        raise AssertionError("live Book evidence-enrichment ledger identity/release mismatch")
    if enrichment_release > web_release or enrichment_auth.get("release") != enrichment_release:
        raise AssertionError("live Book evidence-enrichment authorization is not bound to its governed content release")
    if not isinstance(patches, list) or len(patches) != 10 or len({str(x.get("chapterId")) for x in patches if isinstance(x, dict)}) != 10:
        raise AssertionError("live Book evidence-enrichment ledger must contain exactly 10 unique chapter patches")
    if sum(len(x.get("sections") or []) for x in patches if isinstance(x, dict)) != 13:
        raise AssertionError("live Book evidence-enrichment ledger must contain exactly 13 governed sections")
    enrichment_ids = [str(x.get("chapterId")) for x in patches]
    sme_enrichment_ids = sme.get("enrichmentChapterIds")
    if sme.get("release") != enrichment_release:
        raise AssertionError("live Book SME contract does not cover the governed enrichment release")
    if (
        not isinstance(sme_enrichment_ids, list)
        or len(sme_enrichment_ids) != len(enrichment_ids)
        or len(set(map(str, sme_enrichment_ids))) != len(enrichment_ids)
        or set(map(str, sme_enrichment_ids)) != set(enrichment_ids)
    ):
        raise AssertionError("live Book SME contract does not cover the served enrichment chapter set")
    if sme_status != "hold":
        raise AssertionError("live Book independent SME status must remain HOLD until genuine review exists")

    authored: set[str] = set()
    for path in BATCHES:
        batch = fetch_json(candidate, path)
        if batch.get("schema") != 1 or batch.get("bookId") != "mouldmaster-book":
            raise AssertionError(f"live Book authored batch identity mismatch: {path}")
        chapters = batch.get("chapters")
        if not isinstance(chapters, list):
            raise AssertionError(f"live Book authored batch lacks chapters: {path}")
        for chapter in chapters:
            if not isinstance(chapter, dict) or not chapter.get("id"):
                raise AssertionError(f"live Book authored batch contains invalid chapter: {path}")
            if chapter.get("state") == "verified":
                raise AssertionError(f"authored chapter illegally self-promotes to verified: {chapter.get('id')}")
            chapter_id = str(chapter["id"])
            if chapter_id in authored:
                raise AssertionError(f"duplicate authored Book chapter in live candidate: {chapter_id}")
            authored.add(chapter_id)
    if authored != set(ids):
        missing = sorted(set(ids) - authored)
        extra = sorted(authored - set(ids))
        raise AssertionError(f"live authored Book coverage mismatch; missing={missing}, extra={extra}")

    print(
        f"Live MouldMaster Book candidate verified at {candidate}: release {web_release}; "
        "8 parts / 46 chapters; authorization 116 supported / 21 scoped-qualified / 0 hold / 0 conflict; "
        f"Book content release {worked_release}; independent SME contract status={sme_status!r}, approved={sme_approved}/{sme_total}; "
        "18 byte-authorized worked cases, 8 governed engineering diagrams and 13 enrichment sections are covered by the SME HOLD; "
        "the technical-review material reference exposes 260 canonical grades plus all 284 regional evidence rows and is excluded from listen-all; "
        "authored drafts remain non-self-promoting; Read/Listen shared-runtime markers are present."
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--candidate-path", default="")
    parser.add_argument("--expected-release")
    parser.add_argument("--convergence-attempts", type=int, default=8)
    parser.add_argument("--convergence-delay", type=float, default=2.0)
    args = parser.parse_args()

    attempts = max(1, args.convergence_attempts)
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            verify_once(args.base_url, args.candidate_path, args.expected_release)
            return
        except (AssertionError, RuntimeError, UnicodeDecodeError) as exc:
            last_error = exc
            if attempt < attempts:
                time.sleep(max(0.0, args.convergence_delay))
    raise SystemExit(f"live Book candidate verification failed after {attempts} attempt(s): {last_error}")


if __name__ == "__main__":
    main()
