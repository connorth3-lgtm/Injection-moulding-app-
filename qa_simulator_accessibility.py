#!/usr/bin/env python3
"""Regression checks for the legacy-core simulator accessibility bridge.

The current PWA externalises the audited core into ordered core-inline chunks.
A late accessibility patch must preserve the hardened simulator's semantic
relative-to-baseline labels instead of reintroducing stale pre-refactor units.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent
RUNTIME = ROOT / "src" / "core-runtime"
TARGET = RUNTIME / "core-inline-007.js"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> int:
    chunks = sorted(RUNTIME.glob("core-inline-*.js"))
    require(bool(chunks), "No externalised core runtime chunks found")
    require(TARGET.exists(), f"Missing accessibility bridge: {TARGET.relative_to(ROOT)}")

    combined = "\n".join(path.read_text(encoding="utf-8") for path in chunks)
    target = TARGET.read_text(encoding="utf-8")

    semantic_pos = combined.find("function safeSimLabel")
    accessibility_pos = combined.find("Accessibility: explicit names and semantic values for simulator controls")
    require(semantic_pos >= 0, "Hardened simulator semantic formatter safeSimLabel is missing")
    require(accessibility_pos >= 0, "Simulator accessibility bridge is missing")
    require(
        semantic_pos < accessibility_pos,
        "Simulator accessibility bridge loads before safeSimLabel and cannot safely reuse semantic labels",
    )

    require("function pvSafeSimDisplay" in target, "Accessibility bridge does not reuse the semantic display formatter")
    require("safeSimLabel(key,+value)" in target, "Accessibility bridge no longer delegates to safeSimLabel")
    require('aria-valuetext="${esc(display)}"' in target, "Slider is missing semantic aria-valuetext")
    require("PV_simChange_accessibility_base" in target, "Dynamic slider accessibility wrapper is missing")
    require(
        'control.setAttribute("aria-valuetext",pvSafeSimDisplay(k,v))' in target,
        "aria-valuetext is not updated when the slider value changes",
    )
    require('aria-live="polite"' in target, "Semantic current-value display is not exposed as a polite live region")

    stale_fragments = (
        'speed:"%"',
        'holdTime:"s"',
        'melt:""',
        'mould:""',
        'clamp:"%"',
        'moisture:"%"',
        'value="${val}${units[key]||""}"',
    )
    for fragment in stale_fragments:
        require(fragment not in target, f"Stale pre-hardening simulator mapping returned: {fragment}")

    current_keys = (
        "fillAgg",
        "transfer",
        "pack",
        "hold",
        "meltOffset",
        "mouldOffset",
        "cooling",
        "clampMargin",
        "vent",
        "moistureConfidence",
    )
    for key in current_keys:
        require(key in combined, f"Current hardened simulator key missing from assembled runtime: {key}")

    print("SIMULATOR ACCESSIBILITY QA: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
