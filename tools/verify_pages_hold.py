#!/usr/bin/env python3
"""Verify the live GitHub Pages release-hold boundary.

The hold page is intentionally tiny and non-application content. Verification proves
that the hold marker is live and that representative files from the previously leaked
legacy branch artifact are no longer publicly served.
"""

from __future__ import annotations

import argparse
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

MARKER = 'data-mm-release-hold="true"'
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
            print("Pages release-hold verification passed: minimal hold page live; legacy/non-public probes return 404.")
            return
        except (AssertionError, RuntimeError) as exc:
            last_error = exc
            if attempt < attempts:
                time.sleep(max(0.0, args.convergence_delay))

    raise SystemExit(f"release-hold verification failed after {attempts} attempt(s): {last_error}")


if __name__ == "__main__":
    main()
