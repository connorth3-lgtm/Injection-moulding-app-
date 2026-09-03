#!/usr/bin/env python3
"""Inventory inline HTML event-handler attributes across active MouldMaster runtime sources.

The frozen recovery core is reported separately from active browser/PWA/Electron
runtime sources so CSP debt is not double-counted. `--check` requires the active
runtime source inventory to be zero while allowing the immutable recovery payload
to retain its historical attributes.
"""
from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
CORE = ROOT / "MouldMaster_Core_App.html"
MANIFEST = ROOT / "runtime-domain-manifest.json"
# Require an HTML-style attribute boundary so inert data-mm-on* attributes are not
# accidentally counted as native on* event-handler attributes.
HANDLER_RE = re.compile(r"(?P<prefix>[\s<])on(?P<event>[a-z][a-z0-9_-]*)\s*=\s*(?P<q>['\"])(?P<body>.*?)(?P=q)", re.I | re.S)
BODY_SCRIPT_RE = re.compile(r"\['(?P<src>\./[^']+\.js)'\s*,\s*'<script")


def compact(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())


def active_files() -> list[Path]:
    files: set[Path] = {INDEX}
    index = INDEX.read_text(encoding="utf-8")
    for match in BODY_SCRIPT_RE.finditer(index):
        candidate = ROOT / match.group("src").removeprefix("./")
        if candidate.is_file():
            files.add(candidate)
    if MANIFEST.is_file():
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        for raw in [*manifest.get("assets", []), *manifest.get("dataAssets", [])]:
            if isinstance(raw, str) and raw.startswith("./"):
                candidate = ROOT / raw[2:]
                if candidate.is_file() and candidate.suffix.lower() == ".js":
                    files.add(candidate)
    core_runtime = ROOT / "src/core-runtime"
    if core_runtime.is_dir():
        files.update(p for p in core_runtime.rglob("*.js") if p.is_file())
    return sorted(files)


def scan(paths: list[Path]) -> dict:
    rows = []
    by_event = Counter()
    expressions: dict[str, Counter[str]] = defaultdict(Counter)
    by_file = Counter()
    for path in paths:
        text = path.read_text(encoding="utf-8")
        for match in HANDLER_RE.finditer(text):
            event = match.group("event").lower()
            body = compact(match.group("body"))
            by_event[event] += 1
            expressions[event][body] += 1
            rel = str(path.relative_to(ROOT))
            by_file[rel] += 1
            rows.append({"file": rel, "event": event, "handler": body})
    return {
        "total": len(rows),
        "events": dict(sorted(by_event.items())),
        "files": dict(sorted(by_file.items())),
        "unique_handlers": {event: len(values) for event, values in sorted(expressions.items())},
        "handlers": {
            event: [{"handler": body, "count": count} for body, count in values.most_common()]
            for event, values in sorted(expressions.items())
        },
        "occurrences": rows,
    }


def main() -> None:
    parser=argparse.ArgumentParser()
    parser.add_argument("--check",action="store_true")
    args=parser.parse_args()
    report = {
        "active_runtime": scan(active_files()),
        "frozen_recovery_core": scan([CORE]),
    }
    if args.check:
        active=report["active_runtime"]
        if active["total"]:
            details=", ".join(f"{path}:{count}" for path,count in active["files"].items())
            raise SystemExit(f"Active runtime still contains {active['total']} inline handler attribute occurrence(s): {details}")
        frozen=report["frozen_recovery_core"]
        if not frozen["total"]:
            raise SystemExit("Frozen recovery handler inventory unexpectedly reached zero; verify recovery payload provenance")
        print(f"Inline handler CSP audit passed: active runtime 0; frozen recovery payload unchanged with {frozen['total']} historical handler occurrence(s).")
        return
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
