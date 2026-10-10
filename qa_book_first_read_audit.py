#!/usr/bin/env python3
"""Deterministic inventory of the Book's default first-read surface (NOT an SME opinion).

Run: python3 qa_book_first_read_audit.py [--check]
The 850-word threshold is editorial triage, never a publication or safety gate.
Counts are whitespace-delimited tokens, not measured comprehension or screen-reader timing.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BATCHES = (
    "book-authored-foundations-v1.json",
    "book-chapters-materials-machine-v1.json",
    "book-authored-remaining-v1.json",
)
SOFT_WORD_TARGET = 850


def read(name: str) -> dict:
    return json.loads((ROOT / "data" / name).read_text(encoding="utf-8"))


def word_count(value: object) -> int:
    return len(str(value or "").split())


def presentation_map(runtime: str, name: str) -> dict[str, list[str]]:
    block = re.search(r"const " + re.escape(name) + r"=Object\.freeze\(\{(.*?)\n  \}\);", runtime, re.S)
    # The empty map is intentionally permitted, but a declaration must still exist.
    if not block:
        if f"const {name}=Object.freeze({{}});" in runtime:
            return {}
        raise AssertionError(f"{name} is missing or cannot be inspected")
    rows: dict[str, list[str]] = {}
    for entry in re.finditer(r"'([^']+)':Object\.freeze\(\[([^\]]*)\]\)", block.group(1)):
        module = entry.group(1)
        if module in rows:
            raise AssertionError(f"duplicate presentation mapping for {module}")
        rows[module] = re.findall(r"'([^']+)'", entry.group(2))
    return rows


def audit() -> tuple[list[dict], int, int]:
    architecture = read("book-reader-architecture-v2.json")
    manifest = read("book-manifest-v1.json")
    runtime = (ROOT / "src/domains/learning/book-runtime.js").read_text(encoding="utf-8")
    omissions = presentation_map(runtime, "READER_SECTION_OMISSIONS")
    supplements = presentation_map(runtime, "READER_SUPPLEMENT_SECTIONS")
    metadata = {chapter["id"]: chapter for part in manifest["parts"] for chapter in part["chapters"]}
    authored: dict[str, dict] = {}
    for source in BATCHES:
        for chapter in read(source)["chapters"]:
            if chapter["id"] in authored:
                raise AssertionError(f"duplicate authored module: {chapter['id']}")
            authored[chapter["id"]] = chapter
    if set(metadata) != set(authored):
        raise AssertionError(f"missing/unexpected authored modules: {set(metadata) ^ set(authored)}")
    if set(omissions) - set(authored) or set(supplements) - set(authored):
        raise AssertionError("section presentation references an unknown authored module")
    for mappings, label in ((omissions, "omitted"), (supplements, "supplemental")):
        for module, titles in mappings.items():
            section_titles = [s["title"] for s in authored[module]["sections"]]
            if len(titles) != len(set(titles)) or any(section_titles.count(title) != 1 for title in titles):
                raise AssertionError(f"{label} sections drifted from the governed {module} source")
    rows = []
    all_seen = []
    suppressed = 0
    for number, chapter in enumerate(architecture["readerChapters"], start=1):
        visible = word_count(chapter["goal"])
        omitted_details = []
        for module_id in chapter["moduleIds"]:
            if module_id not in authored:
                raise AssertionError(f"reader chapter uses missing module {module_id}")
            all_seen.append(module_id)
            module = authored[module_id]
            visible += word_count(module.get("title") or metadata[module_id]["title"])
            visible += word_count(module.get("applicability"))
            for section in module["sections"]:
                if section["title"] in omissions.get(module_id, []):
                    omitted_details.append((module_id, section["title"], word_count(section["text"])))
                    suppressed += 1
                elif section["title"] in supplements.get(module_id, []):
                    omitted_details.append((module_id, section["title"] + " [optional]", word_count(section["text"])))
                else:
                    visible += word_count(section["title"]) + word_count(section["text"])
        rows.append({
            "number": number,
            "id": chapter["id"],
            "title": chapter["title"],
            "visibleWords": visible,
            "moduleCount": len(chapter["moduleIds"]),
            "omitted": omitted_details,
            "belowTarget": visible < SOFT_WORD_TARGET,
        })
    if len(rows) != 20 or len(all_seen) != 46 or len(set(all_seen)) != 46:
        raise AssertionError("reader path must cover each of 46 authored modules once in 20 chapters")
    if suppressed != 53:
        raise AssertionError(f"review changed the original 53 first-read omissions: {suppressed}")
    if any("sme" not in str(architecture.get("governanceBoundary", "")).lower() for _ in [0]):
        raise AssertionError("reader architecture lost its independent SME governance boundary")
    return rows, len(all_seen), suppressed


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    rows, modules, omissions = audit()
    under = [row for row in rows if row["belowTarget"]]
    print(f"Book first-read audit: {len(rows)} chapters / {modules} unique modules / "
          f"{omissions} intentionally omitted sections; {len(under)} below the "
          f"{SOFT_WORD_TARGET}-word editorial target (non-gating).")
    for row in rows:
        print(f"{row['id']}  {row['visibleWords']:>4} words / "
              f"{len(row['omitted']):>2} hidden sections  {row['title']}")
    if args.check and len(under) != 12:
        raise AssertionError(f"first-read chapter depth snapshot changed: {len(under)} below target; manually refresh editorial review")
    print("Independent source/Book SME, physical-device/AT and publication signoff: NOT VERIFIED.")


if __name__ == "__main__":
    main()
