#!/usr/bin/env python3
"""Build deterministic classic-script packs for retired direct bootstrap layers.

The source parts remain ordinary reviewed JavaScript files in the repository. The
browser/PWA/Desktop runtime consumes the generated packs so execution order stays
synchronous and auditable while BODY_SCRIPTS shrinks. No minification, rewriting,
or semantic transformation is performed.
"""

from __future__ import annotations

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "src" / "domains" / "runtime-packs"

PACKS: dict[str, tuple[str, ...]] = {
    "evidence-runtime-pack.js": (
        "reference-data.js",
        "reference-deep-dive.js",
        "reference-research-extension.js",
        "reference-20x-extension.js",
        "reference-2026-expansion.js",
        "reference-sources.js",
        "reference-browser-ui.js",
        "diagnostic-learning-labs.js",
        "material-behaviour-labs.js",
        "assessment-evidence-sources.js",
        "evidence-maturity-deep-dive.js",
        "evidence-maturity-formal-bridge.js",
    ),
    "process-data-runtime-pack.js": (
        "process-data-deep-dive-machine.js",
        "process-data-deep-dive-tooling.js",
        "process-data-deep-dive-material.js",
        "process-data-deep-dive-scientific.js",
        "process-data-deep-dive-quality.js",
        "process-data-deep-dive-50.js",
        "process-data-20-pass-01-05.js",
        "process-data-20-pass-06-10.js",
        "process-data-20-pass-11-15.js",
        "process-data-20-pass-16-20.js",
        "process-data-20-pass-atlas.js",
    ),
}


def render(name: str, sources: tuple[str, ...]) -> str:
    chunks = [
        "/* GENERATED FILE — DO NOT EDIT DIRECTLY.\n"
        " * Built by tools/build_runtime_packs.py from reviewed classic-script parts.\n"
        " * Concatenation preserves the exact historical execution order; no code is transformed.\n"
        f" * Pack: {name}\n"
        " */\n"
    ]
    for source_name in sources:
        source_path = ROOT / source_name
        if not source_path.is_file():
            raise SystemExit(f"Runtime pack source is missing: {source_name}")
        source = source_path.read_text(encoding="utf-8").rstrip()
        chunks.append(f"\n/* >>> {source_name} */\n{source}\n/* <<< {source_name} */\n")
    return "".join(chunks)


def expected_outputs() -> dict[Path, str]:
    return {OUT_DIR / name: render(name, sources) for name, sources in PACKS.items()}


def check() -> None:
    stale: list[str] = []
    for path, expected in expected_outputs().items():
        if not path.is_file() or path.read_text(encoding="utf-8") != expected:
            stale.append(str(path.relative_to(ROOT)))
    if stale:
        raise SystemExit("Runtime pack output is stale or missing: " + ", ".join(stale))
    print(
        "Runtime packs are current: "
        + ", ".join(f"{name}={len(sources)} parts" for name, sources in PACKS.items())
    )


def build() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for path, content in expected_outputs().items():
        path.write_text(content, encoding="utf-8")
        print(f"Wrote {path.relative_to(ROOT)}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="fail if committed packs differ from sources")
    args = parser.parse_args()
    if args.check:
        check()
    else:
        build()


if __name__ == "__main__":
    main()
