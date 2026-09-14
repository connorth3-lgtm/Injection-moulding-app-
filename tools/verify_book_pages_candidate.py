#!/usr/bin/env python3
"""Verify the live Pages candidate contains the governed MouldMaster Book release.

This is a network verifier for the bytes actually served by GitHub Pages. It is
intentionally narrower than browser/device validation: it proves Book identity,
authorization, authored coverage, runtime parity markers and release-cache wiring.
It does not claim physical-device, accessibility, SME or learner-outcome evidence.
"""
from __future__ import annotations

import argparse
import json
import re
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

BOOK_ROOT = "src/domains/learning/book-data/"
MANIFEST = BOOK_ROOT + "book-manifest-v1.json"
AUTH = BOOK_ROOT + "book-publication-authorization-v1.json"
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
    "verifiedChapterHtml",
    "startVerifiedListening",
    "reader.refresh?.()",
    "play.click()",
    "Authored draft cannot self-promote to verified",
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


def fetch_text(root: str, path: str) -> str:
    status, body = fetch(urljoin(root, path))
    if status != 200:
        raise AssertionError(f"{path} unavailable: HTTP {status}")
    return body.decode("utf-8", errors="strict")


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
    for path in (RUNTIME, MANIFEST, AUTH, *BATCHES):
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
    if auth.get("version") != manifest.get("version"):
        raise AssertionError("live Book manifest/authorization version mismatch")
    snapshot = auth.get("governanceSnapshot")
    if not isinstance(snapshot, dict):
        raise AssertionError("live Book authorization governance snapshot is missing")
    for key, expected in EXPECTED_SNAPSHOT.items():
        if snapshot.get(key) != expected:
            raise AssertionError(f"live Book authorization snapshot mismatch for {key}: {snapshot.get(key)!r}")
    authorized = auth.get("authorizedChapterIds")
    if not isinstance(authorized, list) or len(authorized) != 46 or len(set(authorized)) != 46:
        raise AssertionError("live Book authorization must contain exactly 46 unique chapter ids")
    if set(authorized) != set(ids):
        raise AssertionError("live Book authorization chapter set does not exactly match the manifest")

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
