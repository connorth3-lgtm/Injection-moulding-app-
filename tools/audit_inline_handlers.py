#!/usr/bin/env python3
"""Inventory HTML inline event-handler attributes in active MouldMaster sources.

This is intentionally syntax-agnostic: it scans HTML plus JavaScript template/string
content so generated markup is included in the debt inventory.
"""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HANDLER_RE = re.compile(r"\bon(?P<event>[a-z][a-z0-9_-]*)\s*=\s*(?P<q>['\"])(?P<body>.*?)(?P=q)", re.I | re.S)

INCLUDE = [
    ROOT / "MouldMaster_Core_App.html",
    ROOT / "index.html",
    ROOT / "src/core-runtime",
]


def iter_files():
    for path in INCLUDE:
        if path.is_file():
            yield path
        elif path.is_dir():
            yield from sorted(p for p in path.rglob("*") if p.is_file() and p.suffix.lower() in {".js", ".html", ".htm"})


def compact(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())


def main() -> None:
    rows = []
    by_event = Counter()
    expressions: dict[str, Counter[str]] = defaultdict(Counter)
    for path in iter_files():
        text = path.read_text(encoding="utf-8")
        for match in HANDLER_RE.finditer(text):
            event = match.group("event").lower()
            body = compact(match.group("body"))
            by_event[event] += 1
            expressions[event][body] += 1
            rows.append({"file": str(path.relative_to(ROOT)), "event": event, "handler": body})

    report = {
        "total": len(rows),
        "events": dict(sorted(by_event.items())),
        "unique_handlers": {event: len(values) for event, values in sorted(expressions.items())},
        "handlers": {
            event: [{"handler": body, "count": count} for body, count in values.most_common()]
            for event, values in sorted(expressions.items())
        },
        "occurrences": rows,
    }
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
