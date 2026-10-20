#!/usr/bin/env python3
"""Generate a classic-browser adapter from the pure engineering ESM domain.

The browser/PWA runtime still loads governed domain assets as classic scripts.
This generator removes only ESM export keywords, preserves the engineering-core
implementation byte-for-byte otherwise, and exposes the same exported symbols
under window.MM_ENGINEERING_CORE. The generated adapter must never be hand-edited.
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src" / "domains" / "process" / "engineering-core.mjs"
OUTPUT = ROOT / "src" / "domains" / "process" / "engineering-core-browser.js"
EXPORT_RE = re.compile(r"^export\s+(?:const|function)\s+([A-Za-z_$][A-Za-z0-9_$]*)", re.M)


def render() -> str:
    source = SOURCE.read_text(encoding="utf-8")
    names = EXPORT_RE.findall(source)
    if not names or len(names) != len(set(names)):
        raise SystemExit("engineering-core export discovery failed or contains duplicates")
    transformed = re.sub(r"^export\s+(?=(?:const|function)\s)", "", source, flags=re.M)
    if re.search(r"^export\s+", transformed, flags=re.M):
        raise SystemExit("engineering-core contains an unsupported export form")
    exposed = ",\n  ".join(names)
    return (
        "/* GENERATED from engineering-core.mjs — do not hand-edit. */\n"
        "(function(){\n"
        "'use strict';\n"
        + transformed.rstrip()
        + "\n\nwindow.MM_ENGINEERING_CORE=Object.freeze({\n  "
        + exposed
        + "\n});\n"
        "})();\n"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    expected = render()
    if args.check:
        if not OUTPUT.is_file() or OUTPUT.read_text(encoding="utf-8") != expected:
            raise SystemExit("engineering-core-browser.js is stale; run tools/generate_engineering_browser_adapter.py")
        print("Engineering browser adapter is current")
        return
    OUTPUT.write_text(expected, encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
