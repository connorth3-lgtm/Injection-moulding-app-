#!/usr/bin/env python3
"""Static QA for the standalone on-device metadata capture helper."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent
HELPER = ROOT / "device-validation.html"


def main() -> None:
    payload = HELPER.read_text(encoding="utf-8")
    lowered = payload.lower()

    required = (
        'data-mm-device-metadata-helper="true"',
        "navigator.useragent",
        "navigator.platform",
        "navigator.maxtouchpoints",
        "display-mode: standalone",
        "navigator.standalone",
        "navigator.clipboard",
        "mouldmaster-on-device-metadata-helper",
        "nothing is uploaded, transmitted, stored, or sent automatically",
    )
    missing = [item for item in required if item not in lowered]
    if missing:
        raise SystemExit("device metadata helper is missing required local-only behavior: " + ", ".join(missing))

    forbidden = (
        "fetch(",
        "xmlhttprequest",
        "sendbeacon",
        "websocket",
        "serviceworker",
        "localstorage",
        "sessionstorage",
        "indexeddb",
        "<script src=",
        "<link ",
    )
    present = [item for item in forbidden if item in lowered]
    if present:
        raise SystemExit("device metadata helper violates privacy/runtime boundary: " + ", ".join(present))

    print("Device metadata helper QA passed: local-only capture, no learner runtime, no transmission or persistence APIs.")


if __name__ == "__main__":
    main()
