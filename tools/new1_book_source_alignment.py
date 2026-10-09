#!/usr/bin/env python3
"""Read-only NEW1 manifest-versus-authored Book source-declaration audit.

This is a source-disclosure *difference report*, NOT a claim validation,
lesson equivalence, human review, or permission to activate public links.
"""
from __future__ import annotations

import argparse
from datetime import date
import json
from pathlib import Path
import sys
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from qa_new1_semantic_link_review import book_runtime_fingerprint, digest, need
from tools.new1_authoring_review_queue import (
    DISCOVERY, HOLD, SOURCE_FIELDS, current_queue,
    safe_spreadsheet_cell,
)
from tools.new1_passage_inspection import (
    AUTHORED_BATCHES, authored_chapter_index, git_blob_sha1,
)
from tools.new1_review_packet import markdown_text

WARNING = (
    "DECLARATIONS ONLY. A missing/different manifest source ID is an "
    "authoring-registry difference, NOT proof of a bad claim, incorrect "
    "lesson, approved citation, SME review, or production instruction. "
    "Check the published passages and original reference with qualified "
    "human reviewers. No exact links, competency, practice, credits or "
    "public routes are authorized."
)
REGISTRY_FILES = ("book-manifest-v1.json", "book-evidence-registry-v1.json")


def pinned_json(root: Path, publication: dict, name: str) -> dict:
    """Only inspect repository data matching the Book's published byte identity."""
    need(name in REGISTRY_FILES, "unapproved Book source registry requested")
    inventory = publication.get("runtimeIntegrity", {}).get("gitBlobSha1ByFile")
    need(type(inventory) is dict, "Book source inventory unavailable")
    expected = inventory.get(name)
    need(type(expected) is str and len(expected) == 40,
         "source registry not present in publication integrity map")
    path = root / "data" / name
    need(path.is_file(), "missing Book source registry: " + name)
    raw = path.read_bytes()
    need(0 < len(raw) <= 2_000_000 and git_blob_sha1(raw) == expected,
         "Book source registry bytes do not match published authorization: " + name)
    try:
        value = json.loads(raw)
    except (UnicodeError, ValueError) as exc:
        raise AssertionError("invalid source registry JSON: " + name) from exc
    need(type(value) is dict and value.get("schema") == 1
         and value.get("bookId") == "mouldmaster-book",
         "invalid Book registry identity: " + name)
    return value


def source_registry(data: list[tuple[str, dict]]) -> dict[str, dict]:
    """Join declarations by unique ID; never elevate their evidence status."""
    sources: dict[str, dict] = {}
    for filename, batch in data:
        seeds = batch.get("sourceSeeds", [])
        need(type(seeds) is list and len(seeds) <= 500,
             "invalid source-seed registry size")
        for seed in seeds:
            need(type(seed) is dict and set(seed) == SOURCE_FIELDS,
                 "malformed/forged source-seed metadata")
            need(all(type(seed[k]) is str and 0 < len(seed[k].strip()) <= 2048
                     and all(ord(ch) >= 32 for ch in seed[k])
                     for k in SOURCE_FIELDS),
                 "invalid source-seed fields")
            try:
                when = date.fromisoformat(seed["checked"])
            except ValueError as exc:
                raise AssertionError("malformed source-seed check date") from exc
            need(when.isoformat() == seed["checked"],
                 "ambiguous source check date")
            url = urlsplit(seed["url"])
            need(url.scheme == "https" and bool(url.hostname)
                 and not url.username and not url.password
                 and not url.fragment and not any(c.isspace() for c in seed["url"]),
                 "unsafe declared source URL")
            need(seed["id"] not in sources,
                 "duplicate source ID across Book declaration registries")
            sources[seed["id"]] = {
                "sourceId": seed["id"], "issuer": seed["issuer"],
                "title": seed["title"], "url": seed["url"],
                "scope": seed["scope"], "checked": seed["checked"],
                "declaredState": seed["currentState"],
                "registryPath": "data/" + filename,
                "evidenceStatus": "DECLARED ONLY — NOT independently rechecked",
            }
    need(bool(sources), "no declared Book source references")
    return sources


def build_alignment(queue: dict, publication: dict, root: Path = ROOT) -> dict:
    """Audit all 46 module declarations against exact byte-pinned authoring."""
    need(type(queue) is dict and queue.get("schemaVersion") == 1
         and queue.get("status") == "hold-exact-lesson-review"
         and queue.get("approvedPublicLinks") is False
         and queue.get("exactLessonMatchesVerified") == 0
         and type(queue.get("exactLessonMatchesVerified")) is int
         and queue.get("reviewStatus") == HOLD and queue.get("basis") == DISCOVERY,
         "cannot audit an approved or forged learning-link queue")
    lessons = queue.get("lessons")
    need(type(lessons) is list and len(lessons) == 120
         and len({x.get("lessonId") for x in lessons if type(x) is dict}) == 120,
         "incomplete canonical learning discovery queue")
    need(book_runtime_fingerprint(publication) == queue.get("bookRuntimeFingerprint")
         and publication.get("version") == queue.get("bookPublicationRelease"),
         "stale Book publication inventory or release")

    manifest = pinned_json(root, publication, REGISTRY_FILES[0])
    evidence = pinned_json(root, publication, REGISTRY_FILES[1])
    chapters = [chapter for part in manifest.get("parts", [])
                for chapter in part.get("chapters", [])]
    indexed = authored_chapter_index(publication, chapters, root)

    source_batches = [(REGISTRY_FILES[0], manifest),
                      (REGISTRY_FILES[1], evidence)]
    for name in AUTHORED_BATCHES:
        # The authored index already rejects any divergence from pinned bytes.
        source_batches.append((name, json.loads((root / "data" / name).read_bytes())))
    declared_sources = source_registry(source_batches)

    candidates_by_chapter: dict[str, set[int]] = {cid: set() for cid in indexed}
    for lesson in lessons:
        need(type(lesson) is dict and type(lesson.get("lessonId")) is int,
             "invalid canonical lesson ID in discovery queue")
        possibles = lesson.get("possibleBookModules")
        need(type(possibles) is list and possibles, "missing Book candidates")
        for candidate in possibles:
            cid = candidate.get("chapterId")
            need(cid in indexed and candidate.get("reviewStatus") == HOLD
                 and candidate.get("discoveryBasis") == DISCOVERY
                 and candidate.get("bookRuntimeFingerprint") ==
                 queue["bookRuntimeFingerprint"], "forged candidate Book source identity")
            current = next(ch for ch in chapters if ch["id"] == cid)
            need(candidate.get("chapterManifestFingerprint") == digest(current)
                 and candidate.get("declaredBookSourceIds") == current.get("sourceIds"),
                 "discovery candidate differs from canonical Book manifest")
            need(lesson["lessonId"] not in candidates_by_chapter[cid],
                 "duplicate course-level lesson discovery candidate")
            candidates_by_chapter[cid].add(lesson["lessonId"])
    need(all(candidates_by_chapter.values()),
         "some Book modules have no course-level learner discovery")
    rows = []
    for manifest_chapter in chapters:
        cid = manifest_chapter["id"]
        filename, authored = indexed[cid]
        manifest_ids, authored_ids = (manifest_chapter.get("sourceIds"),
                                     authored.get("sourceIds"))
        need(type(manifest_ids) is list and type(authored_ids) is list
             and len(set(manifest_ids)) == len(manifest_ids)
             and len(set(authored_ids)) == len(authored_ids),
             "duplicate or missing source declaration list")
        need(all(type(sid) is str and sid in declared_sources
                 for sid in manifest_ids + authored_ids),
             "Book chapter refers to a source outside pinned governance registries")
        declared = set(manifest_ids)
        actually_authored = set(authored_ids)
        extra = [sid for sid in authored_ids if sid not in declared]
        absent = [sid for sid in manifest_ids if sid not in actually_authored]
        rows.append({
            "chapterId": cid,
            "chapterTitle": manifest_chapter["title"],
            "authoredSourceFile": "data/" + filename,
            "manifestSourceIds": manifest_ids[:],
            "authoredSourceIds": authored_ids[:],
            "authoredOnlySourceIds": extra,
            "manifestOnlySourceIds": absent,
            "alignment": ("DECLARATIONS DIFFER — human reconciliation needed"
                          if extra or absent else "SAME IDS — claims still unreviewed"),
            "courseOverlapLessonCandidates": len(candidates_by_chapter[cid]),
            "sourceDeclarations": [declared_sources[sid]
                                   for sid in dict.fromkeys(manifest_ids + authored_ids)],
            "reviewStatus": HOLD,
        })
    changed = sum(row["alignment"].startswith("DECLARATIONS DIFFER") for row in rows)
    return {
        "schemaVersion": 1,
        "purpose": "NON-PUBLIC AUTHOR source-declaration reconciliation",
        "status": "HOLD — not reviewed",
        "reviewStatus": HOLD,
        "approvedPublicLinks": False,
        "exactLessonMatchesVerified": 0,
        "bookPublicationRelease": publication["version"],
        "bookRuntimeFingerprint": queue["bookRuntimeFingerprint"],
        "totalBookModules": 46,
        "modulesWithDeclarationDifferences": changed,
        "modulesWithIdenticalDeclaredSourceIds": 46 - changed,
        "warning": WARNING,
        "chapters": rows,
    }


def render_summary(result: dict, chapter_id: str | None = None) -> str:
    rows = result["chapters"]
    if chapter_id is not None:
        need(type(chapter_id) is str and bool(chapter_id),
             "chapter ID must be a non-empty string")
        rows = [row for row in rows if row["chapterId"] == chapter_id]
        need(len(rows) == 1, "unknown canonical Book module ID")
    out = [
        "# NEW1 Book source declaration difference audit",
        "",
        "**HUMAN-ONLY / UNREVIEWED / NO PUBLIC LINKS.**",
        "",
        result["warning"],
        "",
        f"- Pinned Book release: {markdown_text(result['bookPublicationRelease'])}",
        f"- Source-inventory fingerprint: {markdown_text(result['bookRuntimeFingerprint'])}",
        f"- Modules inspected: {result['totalBookModules']}",
        f"- Different source-ID declarations: {result['modulesWithDeclarationDifferences']}",
        f"- Identical source-ID declarations: {result['modulesWithIdenticalDeclaredSourceIds']}",
        "",
    ]
    for row in rows:
        out.extend((
            f"## {markdown_text(row['chapterId'])}: {markdown_text(row['chapterTitle'])}",
            "",
            f"- {markdown_text(row['alignment'])}",
            f"- Authored source: {markdown_text(row['authoredSourceFile'])}",
            f"- Manifest source IDs: {', '.join(markdown_text(x) for x in row['manifestSourceIds']) or '(none declared)'}",
            f"- Authored chapter source IDs: {', '.join(markdown_text(x) for x in row['authoredSourceIds']) or '(none declared)'}",
            f"- Only in authored chapter: {', '.join(markdown_text(x) for x in row['authoredOnlySourceIds']) or '(none)'}",
            f"- Only in manifest: {', '.join(markdown_text(x) for x in row['manifestOnlySourceIds']) or '(none)'}",
            f"- Course-level candidate lesson count (NOT reviewed matches): {row['courseOverlapLessonCandidates']}",
            "",
        ))
        if chapter_id is not None:
            out.extend(("### Declared reference pointers — independently recheck each", ""))
            for src in row["sourceDeclarations"]:
                out.extend((
                    f"- {markdown_text(src['sourceId'])} — {markdown_text(src['issuer'])}: {markdown_text(src['title'])}",
                    f"  - Declared URL: {markdown_text(src['url'])}",
                    f"  - Declared scope: {markdown_text(src['scope'])}",
                    f"  - Declared check: {markdown_text(src['checked'])}; state: {markdown_text(src['declaredState'])}",
                    f"  - Registry: {markdown_text(src['registryPath'])}",
                ))
            out.append("")
    out.extend((
        "**Discrepancies are not auto-repaired. A content owner must reconcile",
        "them with published Book prose and independently checked sources;",
        "no SME approval, competency evidence or learning credit is inferred.**",
        "",
    ))
    return "\n".join(out)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--chapter-id", help="Inspect one exact canonical Book module")
    parser.add_argument("--json", action="store_true",
                        help="Print complete read-only 46-module source-declaration report")
    args = parser.parse_args()
    from qa_new1_semantic_link_review import load
    audit = build_alignment(current_queue(),
                            load("data/book-publication-authorization-v1.json"))
    if args.chapter_id:
        need(any(row["chapterId"] == args.chapter_id for row in audit["chapters"]),
             "unknown canonical Book module ID")
    if args.json:
        if args.chapter_id:
            audit = {**audit, "chapters": [
                x for x in audit["chapters"] if x["chapterId"] == args.chapter_id
            ]}
        print(json.dumps(audit, indent=2, ensure_ascii=False))
    else:
        print(render_summary(audit, args.chapter_id), end="")


if __name__ == "__main__":
    main()
