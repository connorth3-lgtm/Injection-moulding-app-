#!/usr/bin/env python3
"""Fail-closed QA for the complete MouldMaster Book technical-review draft."""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "data" / "book-manifest-v1.json"
BATCHES = [
    ROOT / "data" / "book-authored-foundations-v1.json",
    ROOT / "data" / "book-evidence-registry-v1.json",
    ROOT / "data" / "book-chapters-materials-machine-v1.json",
    ROOT / "data" / "book-authored-remaining-v1.json",
]

def load(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)

def fail(message: str):
    raise AssertionError(message)

manifest = load(MANIFEST)
if manifest.get("schema") != 1 or manifest.get("bookId") != "mouldmaster-book": fail("Book manifest identity mismatch")
planned = {}
for part in manifest.get("parts", []):
    for chapter in part.get("chapters", []):
        cid = chapter.get("id")
        if not cid or cid in planned: fail(f"Missing or duplicate manifest chapter id: {cid!r}")
        planned[cid] = chapter
if len(planned) != 46: fail(f"Expected 46 governed Book chapters, found {len(planned)}")

sources = {}
for source in manifest.get("sourceSeeds", []):
    sid = source.get("id")
    if not sid or sid in sources: fail(f"Missing or duplicate manifest source id: {sid!r}")
    sources[sid] = source

authored = {}
for path in BATCHES:
    batch = load(path)
    if batch.get("schema") != 1 or batch.get("bookId") != manifest["bookId"]: fail(f"Authored batch identity mismatch: {path.name}")
    batch_boundary = str(batch.get("reviewBoundary", batch.get("accuracyBoundary", ""))).strip()
    for source in batch.get("sourceSeeds", []):
        sid = source.get("id")
        if not sid or sid in sources: fail(f"Duplicate or missing authored source id {sid!r} in {path.name}")
        for key in ("title", "url", "scope", "checked", "currentState"):
            if not str(source.get(key, "")).strip(): fail(f"Source {sid} missing {key}")
        sources[sid] = source
    for chapter in batch.get("chapters", []):
        cid = chapter.get("id")
        if not cid or cid in authored: fail(f"Duplicate or missing authored chapter id {cid!r}")
        if cid not in planned: fail(f"Authored chapter not declared in manifest: {cid}")
        state = chapter.get("state", batch.get("status"))
        if state != "technical-review": fail(f"Draft chapter {cid} must remain technical-review, got {state!r}")
        if not str(chapter.get("applicability", "")).strip(): fail(f"Chapter {cid} lacks applicability boundary")
        if not (str(chapter.get("reviewBoundary", "")).strip() or batch_boundary): fail(f"Chapter {cid} lacks review boundary")
        sections = chapter.get("sections")
        if not isinstance(sections, list) or len(sections) < 2: fail(f"Chapter {cid} requires substantive sections")
        if not chapter.get("sourceIds"): fail(f"Chapter {cid} has no evidence anchors")
        authored[cid] = chapter

if set(authored) != set(planned):
    fail(f"Authored coverage mismatch; missing={sorted(set(planned)-set(authored))}, extra={sorted(set(authored)-set(planned))}")
for cid, chapter in authored.items():
    for sid in chapter.get("sourceIds", []):
        if sid not in sources: fail(f"Chapter {cid} references unknown source {sid}")
    text = " ".join(str(section.get("text", "")) for section in chapter["sections"])
    if re.search(r"\b(?:always|guaranteed)\s+(?:fix|solves?|prevents?)\b", text, re.I): fail(f"Chapter {cid} contains guaranteed-fix language")
    if re.search(r"\bset\s+(?:the\s+)?(?:melt|barrel|mould|mold|pressure|speed|temperature)\s+(?:to|at)\s*[-+]?\d", text, re.I): fail(f"Chapter {cid} contains an ungoverned numeric setpoint recipe")

required = {"ISO-294-1-2017","ISO-294-4-2018","ISO-20430-2020","ISO-20457-2026","ASTM-D3641-24","ASTM-D955-21","BASF-INJECTION-TROUBLESHOOTER"}
if required - set(sources): fail(f"Required Book evidence anchors missing: {sorted(required-set(sources))}")
print(f"PASS: {len(authored)}/{len(planned)} Book chapters authored for technical review; 0 self-verified.")
print(f"PASS: {len(sources)} governed evidence anchors resolve across manifest and governed registries.")
