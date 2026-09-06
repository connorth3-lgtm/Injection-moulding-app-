#!/usr/bin/env python3
"""Verify the live GitHub Pages release-hold boundary.

The root publication remains a production release hold. Verification proves that the
hold marker is live, the privacy-safe on-device metadata helper is available, the
separate non-production /preview/ learner runtime is internally version-consistent,
stale installed MouldMaster root-entry PWAs are migrated to that preview without
capturing helper/unrelated pages, and non-public repository paths remain inaccessible.
"""

from __future__ import annotations

import argparse
import json
import re
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

MARKER = 'data-mm-release-hold="true"'
HELPER_MARKER = 'data-mm-device-metadata-helper="true"'
PREVIEW_MARKER = 'content="non-production-preview"'
MIGRATION_REGISTER_MARKER = 'data-mm-release-hold-migration="true"'
MIGRATION_WORKER_MARKER = "MouldMaster release-hold migration worker"
FORBIDDEN_PATHS = (
    "MouldMasterAcademy.exe",
    "MouldMaster_Academy_App.html",
    "tools/quarantine_legacy_pages.py",
    "qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md",
    "data/pwa-physical-device-validation-v1.json",
)


def fetch(url: str) -> tuple[int, bytes]:
    request = Request(url, headers={"User-Agent": "MouldMaster-Pages-Hold-Verifier/2"})
    try:
        with urlopen(request, timeout=15) as response:
            return int(response.status), response.read()
    except HTTPError as exc:
        return int(exc.code), exc.read()
    except URLError as exc:
        raise RuntimeError(f"could not fetch {url}: {exc}") from exc


def require_match(pattern: str, text: str, label: str) -> str:
    match = re.search(pattern, text)
    if not match:
        raise AssertionError(f"could not determine {label}")
    return match.group(1)


def verify_once(base_url: str) -> None:
    root = base_url.rstrip("/") + "/"
    status, body = fetch(root)
    text = body.decode("utf-8", errors="replace")
    if status != 200 or MARKER not in text or "No learner application runtime" not in text:
        raise AssertionError(f"release-hold root mismatch: HTTP {status}")
    if 'href="device-validation.html"' not in text:
        raise AssertionError("release-hold root does not expose the device metadata helper")
    if 'href="preview/"' not in text:
        raise AssertionError("release-hold root does not expose the non-production preview")
    if MIGRATION_REGISTER_MARKER not in text:
        raise AssertionError("release-hold root does not register the stale-PWA migration worker")

    worker_status, worker_body = fetch(urljoin(root, "service-worker.js"))
    worker_text = worker_body.decode("utf-8", errors="replace")
    if worker_status != 200 or MIGRATION_WORKER_MARKER not in worker_text:
        raise AssertionError(f"release-hold migration worker mismatch: HTTP {worker_status}")
    for marker in (
        "./preview/",
        "LEGACY_ENTRY_FILES",
        "MouldMaster_Academy_App.html",
        "self.skipWaiting()",
        "self.clients.claim()",
        "client.navigate(preview.href)",
        "Response.redirect(previewUrl().href,302)",
    ):
        if marker not in worker_text:
            raise AssertionError(f"release-hold migration worker is missing: {marker}")
    worker_lower = worker_text.lower()
    if "caches.open" in worker_lower or ".put(" in worker_lower or "mouldmaster_core_app" in worker_lower:
        raise AssertionError("release-hold migration worker must not cache or serve learner runtime assets")
    if "!url.pathname.startsWith(preview.pathname)" in worker_text:
        raise AssertionError("release-hold migration worker still contains the broad same-origin redirect predicate")
    if "device-validation.html" in worker_text:
        raise AssertionError("device-validation helper must not be part of the migration allowlist")
    if "new Set(['','index.html','MouldMaster_Academy_App.html'])" not in worker_text:
        raise AssertionError("release-hold migration allowlist is not the exact approved MouldMaster entry set")

    helper_status, helper_body = fetch(urljoin(root, "device-validation.html"))
    helper_text = helper_body.decode("utf-8", errors="replace")
    if helper_status != 200 or HELPER_MARKER not in helper_text:
        raise AssertionError(f"device metadata helper mismatch: HTTP {helper_status}")
    helper_lower = helper_text.lower()
    forbidden_helper_tokens = (
        "fetch(",
        "xmlhttprequest",
        "sendbeacon",
        "websocket",
        "serviceworker",
        "localstorage",
        "sessionstorage",
        "indexeddb",
        "mouldmaster_core_app.html",
    )
    present = [token for token in forbidden_helper_tokens if token in helper_lower]
    if present:
        raise AssertionError("device metadata helper violates local-only boundary: " + ", ".join(present))

    preview_status, preview_body = fetch(urljoin(root, "preview/"))
    preview_text = preview_body.decode("utf-8", errors="replace")
    if preview_status != 200 or PREVIEW_MARKER not in preview_text:
        raise AssertionError(f"non-production preview mismatch: HTTP {preview_status}")

    version_status, version_body = fetch(urljoin(root, "preview/version.json"))
    if version_status != 200:
        raise AssertionError(f"non-production preview version.json unavailable: HTTP {version_status}")
    try:
        version = json.loads(version_body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise AssertionError("non-production preview version.json is invalid JSON") from exc
    web_release = str(version.get("web_release") or "")
    question_bank_version = str(version.get("question_bank_version") or "")
    if not web_release or not question_bank_version:
        raise AssertionError("preview version.json is missing web_release or question_bank_version")

    shell_release = require_match(r'const\s+SHELL_RELEASE="([^"]+)"', preview_text, "preview shell release")
    if shell_release != web_release:
        raise AssertionError(f"preview shell/version mismatch: index={shell_release} version.json={web_release}")

    preview_worker_status, preview_worker_body = fetch(urljoin(root, "preview/service-worker.js"))
    preview_worker_text = preview_worker_body.decode("utf-8", errors="replace")
    if preview_worker_status != 200:
        raise AssertionError(f"non-production preview service worker unavailable: HTTP {preview_worker_status}")
    worker_release = require_match(r"const\s+CACHE_VERSION='([^']+)'", preview_worker_text, "preview service-worker release")
    if worker_release != web_release:
        raise AssertionError(f"preview worker/version mismatch: worker={worker_release} version.json={web_release}")
    fetch_section = preview_worker_text.split("self.addEventListener('fetch'", 1)
    if len(fetch_section) != 2:
        raise AssertionError("preview service worker has no fetch handler")
    if ".put(" in fetch_section[1]:
        raise AssertionError("preview service worker mutates its validated release cache during runtime fetches")
    if "fetchNetwork(event)" not in fetch_section[1]:
        raise AssertionError("preview service worker is missing immutable-cache network handling")

    learner_status, learner_body = fetch(urljoin(root, "preview/learner-ux-repair.js"))
    learner_text = learner_body.decode("utf-8", errors="replace")
    if learner_status != 200:
        raise AssertionError(f"non-production preview learner runtime unavailable: HTTP {learner_status}")
    if f"ASSESSMENT_BANK_VERSION='assessment-{question_bank_version}'" not in learner_text:
        raise AssertionError("preview assessment runtime/question_bank_version mismatch")
    for marker in (
        "mmNonProductionPreviewWarning",
        "Non-production preview",
        "__MM_ASSESSMENT_ROTATION_V4__",
        "ASSESSMENT_RESULT_META_KEY",
    ):
        if marker not in learner_text:
            raise AssertionError(f"preview learner runtime is missing required integrity marker: {marker}")

    for path in ("manifest.webmanifest",):
        probe_status, _ = fetch(urljoin(root, f"preview/{path}"))
        if probe_status != 200:
            raise AssertionError(f"non-production preview runtime asset unavailable: {path} -> HTTP {probe_status}")

    for path in FORBIDDEN_PATHS:
        probe_status, _ = fetch(urljoin(root, path))
        if probe_status != 404:
            raise AssertionError(f"legacy/non-public Pages path is still served: {path} -> HTTP {probe_status}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--convergence-attempts", type=int, default=8)
    parser.add_argument("--convergence-delay", type=float, default=2.0)
    args = parser.parse_args()

    attempts = max(1, args.convergence_attempts)
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            verify_once(args.base_url)
            print(
                "Pages release-hold verification passed: production root remains held, migration is scoped to "
                "approved MouldMaster entry paths, the preview release fingerprint is internally consistent, "
                "the validated preview cache is immutable at runtime, the persistent preview warning is present, "
                "the local-only device helper is live, and legacy/non-public probes return 404."
            )
            return
        except (AssertionError, RuntimeError) as exc:
            last_error = exc
            if attempt < attempts:
                time.sleep(max(0.0, args.convergence_delay))

    raise SystemExit(f"release-hold verification failed after {attempts} attempt(s): {last_error}")


if __name__ == "__main__":
    main()
