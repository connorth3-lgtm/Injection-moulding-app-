#!/usr/bin/env python3
"""Rewrite active runtime HTML event attributes to inert data attributes.

The frozen `MouldMaster_Core_App.html` is deliberately excluded. Its generated
runtime copies are transformed by `externalize_core_scripts.py`; these additional
legacy root layers generate markup after bootstrap and are migrated in place.
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = (
    "assessment-analytics-ui.js",
    "assessment-quality-suite.js",
    "curriculum-integration.js",
    "learning-experience.js",
    "specialist-curriculum.js",
    "specialist-evidence-gap-extension.js",
    "training-upgrade.js",
)
HANDLER_ATTR_RE = re.compile(r"(?P<prefix>[\s<])on(?P<event>click|change|input|keydown)\s*=", re.I)


def transform(source: str) -> tuple[str, int]:
    return HANDLER_ATTR_RE.subn(
        lambda match: f"{match.group('prefix')}data-mm-on{match.group('event').lower()}=",
        source,
    )


def check() -> None:
    remaining=[]
    for rel in TARGETS:
        path=ROOT/rel
        if not path.is_file():
            raise SystemExit(f"Missing handler migration target: {rel}")
        matches=list(HANDLER_ATTR_RE.finditer(path.read_text(encoding="utf-8")))
        if matches:
            remaining.append(f"{rel}:{len(matches)}")
    if remaining:
        raise SystemExit("Active root runtime still emits inline handler attributes: "+", ".join(remaining))
    print(f"Inline handler source migration passed: {len(TARGETS)} legacy runtime files emit data-mm-on* attributes only.")


def apply() -> None:
    total=0
    for rel in TARGETS:
        path=ROOT/rel
        source=path.read_text(encoding="utf-8")
        updated,count=transform(source)
        if count:
            path.write_text(updated,encoding="utf-8")
            total+=count
    check()
    print(f"Rewrote {total} inline handler attribute occurrence(s) across active legacy root runtime files.")


def main() -> None:
    parser=argparse.ArgumentParser()
    parser.add_argument("--check",action="store_true")
    args=parser.parse_args()
    check() if args.check else apply()


if __name__=="__main__":
    main()
