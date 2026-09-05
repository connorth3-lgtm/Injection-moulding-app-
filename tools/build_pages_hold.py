#!/usr/bin/env python3
"""Build the minimal GitHub Pages release-hold artifact.

This artifact is deliberately not the MouldMaster application. It exists only to
replace any stale/legacy Pages publication while production PWA release evidence is
still pending. The production runtime continues to be built separately for exact
fingerprinting and is not published until the governed physical-device contract is
validated.

The hold site also exposes one standalone, inline-only device metadata helper so a
physical device can report the non-sensitive values needed by the governed validation
contract. The helper does not load the learner runtime, register a service worker,
transmit data, or persist captured values.
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ALLOWED_FILES = {"index.html", "404.html", "device-validation.html"}
MARKER = 'data-mm-release-hold="true"'
HELPER_MARKER = 'data-mm-device-metadata-helper="true"'


def document(*, not_found: bool = False) -> str:
    heading = "MouldMaster page unavailable" if not_found else "MouldMaster release not published"
    detail = (
        "This path is not part of the currently published release-hold site."
        if not_found
        else "The production PWA is intentionally unavailable while required physical-device validation is pending."
    )
    helper = (
        ""
        if not_found
        else '<p><a href="device-validation.html">Capture device validation metadata on this device</a></p>'
    )
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>MouldMaster release hold</title>
</head>
<body>
  <main {MARKER}>
    <h1>{heading}</h1>
    <p>{detail}</p>
    <p>No learner application runtime, assessment content, repository tooling or legacy distribution files are served from this Pages publication.</p>
    {helper}
  </main>
</body>
</html>
"""


def validate_helper(payload: str) -> None:
    if HELPER_MARKER not in payload:
        raise SystemExit("device metadata helper marker is missing")
    lowered = payload.lower()
    forbidden_network_tokens = (
        "fetch(",
        "xmlhttprequest",
        "sendbeacon",
        "websocket",
        "serviceworker",
        "localstorage",
        "sessionstorage",
        "indexeddb",
    )
    found = [token for token in forbidden_network_tokens if token in lowered]
    if found:
        raise SystemExit("device metadata helper must remain local-only; forbidden token(s): " + ", ".join(found))
    if '<script src=' in lowered or '<link ' in lowered:
        raise SystemExit("device metadata helper must not reference external runtime assets")


def build(target: Path) -> set[str]:
    if target.exists():
        shutil.rmtree(target)
    target.mkdir(parents=True)
    (target / "index.html").write_text(document(), encoding="utf-8")
    (target / "404.html").write_text(document(not_found=True), encoding="utf-8")

    helper_source = ROOT / "device-validation.html"
    if not helper_source.is_file():
        raise SystemExit("device-validation.html source is missing")
    helper_payload = helper_source.read_text(encoding="utf-8")
    validate_helper(helper_payload)
    (target / "device-validation.html").write_text(helper_payload, encoding="utf-8")

    files = {path.relative_to(target).as_posix() for path in target.rglob("*") if path.is_file()}
    if files != ALLOWED_FILES:
        raise SystemExit(f"release-hold artifact boundary mismatch: {sorted(files)}")

    for name in ("index.html", "404.html"):
        payload = (target / name).read_text(encoding="utf-8")
        if MARKER not in payload:
            raise SystemExit(f"release-hold marker missing from {name}")
        lowered = payload.lower()
        if "<script" in lowered or "<link" in lowered or "service-worker" in lowered:
            raise SystemExit(f"release-hold document unexpectedly references active runtime assets: {name}")

    return files


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=".pages-hold")
    args = parser.parse_args()
    files = build(Path(args.output))
    print(
        f"Pages release-hold artifact ready: {len(files)} public files; "
        "no learner app runtime is included; device metadata helper remains local-only."
    )


if __name__ == "__main__":
    main()
