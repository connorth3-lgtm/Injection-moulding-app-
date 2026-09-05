#!/usr/bin/env python3
"""Verify the live GitHub Pages release-hold boundary.

The root publication remains a production release hold. Verification proves that the
hold marker is live, the privacy-safe on-device metadata helper is available, the
separate non-production /preview/ learner runtime is reachable, and representative
legacy/non-public repository paths remain inaccessible.
"""

from __future__ import annotations

import argparse
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

MARKER = 'data-mm-release-hold="true"'
HELPER_MARKER = 'data-mm-device-metadata-helper="true"'
PREVIEW_MARKER = 'content="non-production-preview"'
FORBIDDEN_PATHS = (
    "MouldMasterAcademy.exe",
    "MouldMaster_Academy_App.html",
    "tools/quarantine_legacy_pages.py",
    "qa/PWA_PHYSICAL_DEVICE_CHECKLIST.md",
    "data/pwa-physical-device-validation-v1.json",
)


def fetch(url: str) -> tuple[int, bytes]:
    request = Request(url, headers={"User-Agent": "MouldMaster-Pages-Hold-Verifier/1"})
    try:
        with urlopen(request, timeout=15) as response:
            return int(response.status), response.read()
    except HTTPError as exc:
        return int(exc.code), exc.read()
    except URLError as exc:
        raise RuntimeError(f"could not fetch {url}: {exc}") from exc


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
    for path in ("manifest.webmanifest", "service-worker.js", "version.json"):
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
                "Pages release-hold verification passed: production root remains held, local-only "
                "device metadata helper and non-production /preview/ are live, and legacy/non-public probes return 404."
            )
            return
        except (AssertionError, RuntimeError) as exc:
            last_error = exc
            if attempt < attempts:
                time.sleep(max(0.0, args.convergence_delay))

    raise SystemExit(f"release-hold verification failed after {attempts} attempt(s): {last_error}")


if __name__ == "__main__":
    main()
