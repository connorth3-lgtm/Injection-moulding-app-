#!/usr/bin/env python3
"""Build the minimal GitHub Pages release-hold artifact.

This artifact is deliberately not the MouldMaster application. It exists only to
replace any stale/legacy Pages publication while production PWA release evidence is
still pending. The production runtime continues to be built separately for exact
fingerprinting and is not published until the governed physical-device contract is
validated.

The Pages upload action excludes dotfiles, so this builder intentionally emits only
the two HTML documents that are actually archived and deployed. Keeping the local
boundary identical to the uploaded boundary avoids a false three-file invariant.
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

ALLOWED_FILES = {"index.html", "404.html"}
MARKER = 'data-mm-release-hold="true"'


def document(*, not_found: bool = False) -> str:
    heading = "MouldMaster page unavailable" if not_found else "MouldMaster release not published"
    detail = (
        "This path is not part of the currently published release-hold site."
        if not_found
        else "The production PWA is intentionally unavailable while required physical-device validation is pending."
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
  </main>
</body>
</html>
"""


def build(target: Path) -> set[str]:
    if target.exists():
        shutil.rmtree(target)
    target.mkdir(parents=True)
    (target / "index.html").write_text(document(), encoding="utf-8")
    (target / "404.html").write_text(document(not_found=True), encoding="utf-8")

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
    print(f"Pages release-hold artifact ready: {len(files)} public files; no app runtime is included.")


if __name__ == "__main__":
    main()
