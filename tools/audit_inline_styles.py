#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
CORE = ROOT / "MouldMaster_Core_App.html"
REPORT = ROOT / "inline-style-audit-report.json"

STYLE_ATTR_RE = re.compile(r"(?<![\w-])style\s*=\s*([\"'])(.*?)\1", re.I | re.S)
STYLE_BLOCK_RE = re.compile(r"<style\b[^>]*>(.*?)</style\s*>", re.I | re.S)
BODY_SCRIPT_RE = re.compile(r"\['(\./[^']+\.js)'\s*,\s*'<script")
BLOCKED_SET_ATTRIBUTE_RE = re.compile(r"\.setAttribute\(\s*['\"]style['\"]", re.I)
BLOCKED_CSSTEXT_RE = re.compile(r"\.style\.cssText\s*=", re.I)
CREATE_STYLE_RE = re.compile(r"createElement\(\s*['\"]style['\"]\s*\)", re.I)
DIRECT_STYLE_RE = re.compile(r"\.style\.([A-Za-z_$][\w$]*)\s*=")


def line_of(source: str, offset: int) -> int:
    return source.count("\n", 0, offset) + 1


def sample(source: str, start: int, end: int, limit: int = 220) -> str:
    left = max(0, start - 70)
    right = min(len(source), end + 110)
    return " ".join(source[left:right].replace("\n", " ").split())[:limit]


def findings(path: Path, pattern: re.Pattern[str]) -> list[dict[str, object]]:
    source = path.read_text(encoding="utf-8")
    result = []
    for match in pattern.finditer(source):
        result.append({
            "line": line_of(source, match.start()),
            "sample": sample(source, match.start(), match.end()),
        })
    return result


def active_script_paths(index: str) -> list[Path]:
    paths: set[Path] = set()
    for src in BODY_SCRIPT_RE.findall(index):
        path = ROOT / src.removeprefix("./")
        if path.is_file():
            paths.add(path)
    paths.update((ROOT / "src/core-runtime").glob("*.js"))
    paths.update((ROOT / "src/domains").rglob("*.js"))
    return sorted(paths)


def main() -> None:
    index = INDEX.read_text(encoding="utf-8")
    core = CORE.read_text(encoding="utf-8")
    scripts = active_script_paths(index)

    script_report: dict[str, object] = {}
    totals = {
        "activeLiteralStyleAttributes": 0,
        "activeSetAttributeStyle": 0,
        "activeCssTextAssignments": 0,
        "activeCreateStyleElements": 0,
        "activeDirectStyleAssignments": 0,
    }

    for path in scripts:
        rel = path.relative_to(ROOT).as_posix()
        literal = findings(path, STYLE_ATTR_RE)
        set_attr = findings(path, BLOCKED_SET_ATTRIBUTE_RE)
        css_text = findings(path, BLOCKED_CSSTEXT_RE)
        create_style = findings(path, CREATE_STYLE_RE)
        direct = findings(path, DIRECT_STYLE_RE)
        if literal or set_attr or css_text or create_style or direct:
            script_report[rel] = {
                "literalStyleAttributes": literal,
                "setAttributeStyle": set_attr,
                "cssTextAssignments": css_text,
                "createStyleElements": create_style,
                "directStyleAssignments": direct,
            }
        totals["activeLiteralStyleAttributes"] += len(literal)
        totals["activeSetAttributeStyle"] += len(set_attr)
        totals["activeCssTextAssignments"] += len(css_text)
        totals["activeCreateStyleElements"] += len(create_style)
        totals["activeDirectStyleAssignments"] += len(direct)

    report = {
        "schemaVersion": 1,
        "frozenCore": {
            "styleBlocks": len(STYLE_BLOCK_RE.findall(core)),
            "literalStyleAttributes": len(STYLE_ATTR_RE.findall(core)),
        },
        "bootstrap": {
            "styleBlocks": len(STYLE_BLOCK_RE.findall(index)),
            "literalStyleAttributes": len(STYLE_ATTR_RE.findall(index)),
            "cspUnsafeInline": index.count("'unsafe-inline'"),
        },
        "activeRuntime": totals,
        "files": script_report,
    }
    REPORT.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
