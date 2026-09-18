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
ENRICHMENT = BOOK_ROOT + "book-evidence-enrichment-v2.json"
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
    for path in (RUNTIME, MANIFEST, AUTH, SME, WORKED, ENRICHMENT, *BATCHES):
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
    integrity_paths = (MANIFEST, SME, WORKED, ENRICHMENT, *BATCHES)
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
    if worked_auth.get("release") != web_release or worked_auth.get("caseCount") != 10 or worked_auth.get("claimCount") != 10:
        raise AssertionError("live Book worked-case authorization is not bound to the served release")
    if worked_auth.get("independentSmeStatus") != "hold":
        raise AssertionError("live Book worked-case authorization must preserve independent SME HOLD")

    enrichment_auth = auth.get("evidenceEnrichmentAuthorization")
    if not isinstance(enrichment_auth, dict) or enrichment_auth.get("status") != "authorized":
        raise AssertionError("live Book evidence-enrichment authorization is missing")
    if enrichment_auth.get("release") != web_release or enrichment_auth.get("chapterCount") != 10 or enrichment_auth.get("sectionCount") != 13:
        raise AssertionError("live Book evidence-enrichment authorization is not bound to the served release")
    if enrichment_auth.get("independentSmeStatus") != "hold":
        raise AssertionError("live Book evidence-enrichment authorization must preserve independent SME HOLD")

    sme = fetch_json(candidate, SME)
    sme_status, sme_approved, sme_total = sme_summary(sme, ids)
    worked = fetch_json(candidate, WORKED)
    cases = worked.get("cases")
    if worked.get("schemaVersion") != 1 or worked.get("bookId") != "mouldmaster-book" or worked.get("release") != web_release:
        raise AssertionError("live Book worked-case ledger identity/release mismatch")
    if not isinstance(cases, list) or len(cases) != 10 or len({str(x.get("id")) for x in cases if isinstance(x, dict)}) != 10:
        raise AssertionError("live Book worked-case ledger must contain exactly 10 unique cases")
    worked_ids = [str(x.get("id")) for x in cases]
    if sme.get("release") != web_release or sme.get("workedCaseIds") != worked_ids:
        raise AssertionError("live Book SME contract does not cover the served worked-case set")
    enrichment = fetch_json(candidate, ENRICHMENT)
    patches = enrichment.get("chapterPatches")
    if enrichment.get("schemaVersion") != 1 or enrichment.get("bookId") != "mouldmaster-book" or enrichment.get("release") != web_release:
        raise AssertionError("live Book evidence-enrichment ledger identity/release mismatch")
    if not isinstance(patches, list) or len(patches) != 10 or len({str(x.get("chapterId")) for x in patches if isinstance(x, dict)}) != 10:
        raise AssertionError("live Book evidence-enrichment ledger must contain exactly 10 unique chapter patches")
    if sum(len(x.get("sections") or []) for x in patches if isinstance(x, dict)) != 13:
        raise AssertionError("live Book evidence-enrichment ledger must contain exactly 13 governed sections")
    enrichment_ids = [str(x.get("chapterId")) for x in patches]
    if sme.get("enrichmentChapterIds") != enrichment_ids:
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
        f"independent SME contract status={sme_status!r}, approved={sme_approved}/{sme_total}; "
        "10 byte-authorized worked cases and 13 enrichment sections are covered by the SME HOLD; authored drafts remain non-self-promoting; "
        "Read/Listen shared-runtime markers are present."
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
