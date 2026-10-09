#!/usr/bin/env python3
"""Source-pinned, human-only NEW1 canonical lesson / actual Book passage inspection.

All content comes from current repository authorities. A course-overlap candidate
is NEVER promoted to an exact mapping or human review by printing the texts.
No learner runtime, progress record, credentials, or public navigation is written.
"""
from __future__ import annotations

import argparse
from hashlib import sha1
import html
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from qa_book_curriculum_crosswalk import canonical_curriculum
from qa_curriculum_semantic_review import lesson_fingerprint
from qa_new1_semantic_link_review import (
    book_runtime_fingerprint, digest, load, need,
)
from tools.new1_authoring_review_queue import current_queue
from tools.new1_review_packet import markdown_text, render_packet

# These three batches contain all 46 canonical authored Book chapters.
# They are part of the publication authorization's pinned git-blob inventory.
AUTHORED_BATCHES = (
    "book-authored-foundations-v1.json",
    "book-chapters-materials-machine-v1.json",
    "book-authored-remaining-v1.json",
)
MAX_BATCH_BYTES = 2_000_000
MAX_RENDERED_TEXT = 200_000


def git_blob_sha1(data: bytes) -> str:
    return sha1(b"blob " + str(len(data)).encode("ascii") + b"\0" + data).hexdigest()


def inert_pre(value: object) -> str:
    """Preserve literal prose/source characters, never execute embedded markup."""
    if not isinstance(value, str):
        value = json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False)
    need(0 < len(value) <= MAX_RENDERED_TEXT,
         "empty or oversized source content in passage inspection")
    return "<pre>\n" + html.escape(value, quote=True) + "\n</pre>"


def authored_chapter_index(publication: dict, manifest_chapters: list[dict],
                           root: Path) -> dict[str, tuple[str, dict]]:
    """Load genuine authoring bytes only when they match the published Book SHA."""
    need(type(manifest_chapters) is list and len(manifest_chapters) == 46,
         "complete 46-module manifest required")
    ids = [chapter.get("id") for chapter in manifest_chapters
           if type(chapter) is dict]
    need(len(ids) == 46 and len(set(ids)) == 46
         and all(type(cid) is str and cid for cid in ids),
         "invalid or duplicate Book manifest IDs")
    need(type(publication) is dict and publication.get("status") == "authorized",
         "Book publication authority is unavailable")
    inventory = publication.get("runtimeIntegrity", {}).get("gitBlobSha1ByFile")
    need(type(inventory) is dict, "missing Book source integrity inventory")
    indexed: dict[str, tuple[str, dict]] = {}
    authored_order = []
    for name in AUTHORED_BATCHES:
        expected = inventory.get(name)
        need(type(expected) is str and len(expected) == 40,
             "missing pinned authored Book batch hash: " + name)
        path = root / "data" / name
        need(path.is_file(), "missing authored Book batch: " + name)
        raw = path.read_bytes()
        need(0 < len(raw) <= MAX_BATCH_BYTES
             and git_blob_sha1(raw) == expected,
             "authored Book bytes differ from published fingerprint: " + name)
        try:
            batch = json.loads(raw)
        except (UnicodeError, ValueError) as exc:
            raise AssertionError("invalid published Book batch: " + name) from exc
        need(type(batch) is dict and batch.get("schema") == 1
             and batch.get("bookId") == "mouldmaster-book"
             and batch.get("status") == "technical-review",
             "authored Book batch review boundary invalid: " + name)
        rows = batch.get("chapters")
        need(type(rows) is list and rows, "Book batch has no chapters: " + name)
        for chapter in rows:
            need(type(chapter) is dict and type(chapter.get("id")) is str
                 and chapter["id"] not in indexed,
                 "duplicate/invalid authored Book chapter")
            need(chapter.get("state", batch["status"]) == "technical-review"
                 and type(chapter.get("applicability")) is str
                 and bool(chapter["applicability"].strip()),
                 "authored Book passage lacks review/applicability boundary")
            sections = chapter.get("sections")
            need(type(sections) is list and len(sections) >= 2
                 and all(type(section) is dict
                         and type(section.get("title")) is str
                         and bool(section["title"].strip())
                         and type(section.get("text")) is str
                         and bool(section["text"].strip())
                         for section in sections),
                 "authored Book contains missing or malformed passages")
            refs = chapter.get("sourceIds")
            need(type(refs) is list and refs
                 and all(type(ref) is str and ref for ref in refs)
                 and len(set(refs)) == len(refs),
                 "authored Book has no declared source anchors")
            indexed[chapter["id"]] = (name, chapter)
            authored_order.append(chapter["id"])
    # Every Book module must resolve to one and only one *actual* published
    # chapter, not merely a matching name or loosely linked course.
    need(authored_order == ids, "published Book chapter order/coverage drift")
    return indexed


def render_passages(
    queue: dict, lesson_id: int, chapter_id: str, *,
    lessons: list[dict], manifest_chapters: list[dict],
    publication: dict, root: Path = ROOT,
) -> str:
    """Generate an immutable source reading aid; decisions remain human-only."""
    render_packet(queue, lesson_id)  # Full fail-closed unreviewed-queue checks.
    need(type(chapter_id) is str and bool(chapter_id),
         "provide one canonical Book module ID")
    entry = next(row for row in queue["lessons"] if row["lessonId"] == lesson_id)
    candidate = next((row for row in entry["possibleBookModules"]
                      if row["chapterId"] == chapter_id), None)
    need(candidate is not None,
         "Book chapter is not even a course-level discovery candidate for this lesson")
    need(type(lessons) is list and len(lessons) == 120,
         "complete canonical lesson registry required")
    lesson_matches = [lesson for lesson in lessons
                      if type(lesson) is dict and lesson.get("id") == lesson_id
                      and type(lesson.get("id")) is int]
    need(len(lesson_matches) == 1, "ambiguous canonical lesson record")
    lesson = lesson_matches[0]
    need(lesson.get("title") == entry["lessonTitle"]
         and lesson_fingerprint(lesson) == entry["wholeLessonFingerprint"],
         "canonical lesson content differs from discovery packet")
    need(book_runtime_fingerprint(publication) == queue["bookRuntimeFingerprint"]
         and publication.get("version") == queue["bookPublicationRelease"],
         "Book source inventory or release differs from discovery packet")
    book = authored_chapter_index(publication, manifest_chapters, root)
    authored_name, chapter = book[chapter_id]
    manifest = next(row for row in manifest_chapters if row["id"] == chapter_id)
    need(digest(manifest) == candidate["chapterManifestFingerprint"]
         and manifest.get("title") == candidate["chapterTitle"],
         "candidate Book manifest content differs from source registry")

    sections = chapter["sections"]
    lines = [
        f"# NEW1 passage inspection — lesson {lesson_id} / {markdown_text(chapter_id)}",
        "",
        "**UNREVIEWED — HUMAN-ONLY — NOT AN EXACT SEMANTIC MATCH.**",
        "",
        "The following are actual byte-pinned *source texts for comparison*,",
        "NOT a review conclusion, evidence of valid applicability or permission",
        "for learner navigation, assessment credit or production machine settings.",
        "",
        f"- Canonical lesson ID: {lesson_id}",
        f"- Book module: {markdown_text(chapter_id)}",
        f"- Course-overlap basis ONLY: {markdown_text(entry['canonicalCourseName'])}",
        f"- Lesson SHA-256: {markdown_text(entry['wholeLessonFingerprint'])}",
        f"- Book publication: {markdown_text(queue['bookPublicationRelease'])}",
        f"- Book source inventory SHA-256: {markdown_text(queue['bookRuntimeFingerprint'])}",
        f"- Authored source file: {markdown_text('data/' + authored_name)}",
        f"- Published source git blob SHA-1: "
        f"{publication['runtimeIntegrity']['gitBlobSha1ByFile'][authored_name]}",
        f"- Authored chapter review state: {markdown_text(chapter.get('state', 'technical-review'))}",
        "",
        "## A. Canonical Academy lesson — exact source record",
        "",
        "Full canonical lesson JSON follows, including all original fields;",
        "do not infer equivalence from the title or a shared course.",
        "",
        inert_pre(lesson),
        "",
        "## B. Actual published Book chapter — authored technical-review passages",
        "",
        f"- Applicability boundary (authored, unverified): {markdown_text(chapter['applicability'])}",
        "- Book-declared source IDs in authored chapter (not independently checked): "
        + "; ".join(markdown_text(ref) for ref in chapter["sourceIds"]),
        f"- Section count: {len(sections)}",
        "",
    ]
    for number, section in enumerate(sections, start=1):
        lines.extend((
            f"### Section {number}: {markdown_text(section['title'])}",
            "",
            f"- Exact section SHA-256: {digest(section)}",
            "- This is authored draft prose, not an SME-verified process instruction.",
            "",
            inert_pre(section["text"]),
            "",
        ))
    lines.extend((
        "## Independent reviewer decision — NOT supplied by the tool",
        "",
        "A qualified reviewer must compare the exact lesson fields against each",
        "relevant Book section, check evidence and scope with the source itself,",
        "identify the specific passage location, and document omissions/conflicts.",
        "Competency and practice references need *separate* authored verification.",
        "Record genuine reviewer decisions only through the existing governed",
        "review process; this text dump cannot issue an attestation.",
        "",
        "**No exact link, reviewer record, SME approval, learner progress, exam",
        "credit, workplace competence, production authority or PWA route is created.**",
        "",
    ))
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lesson-id", type=int, required=True,
                        help="Canonical Academy lesson ID 1–120")
    parser.add_argument("--chapter-id", required=True,
                        help="Exact Book module ID from the unreviewed worklist")
    args = parser.parse_args()
    lessons, _ = canonical_curriculum()
    manifest = load("data/book-manifest-v1.json")
    chapters = [chapter for part in manifest["parts"]
                for chapter in part["chapters"]]
    print(render_passages(
        current_queue(), args.lesson_id, args.chapter_id,
        lessons=lessons, manifest_chapters=chapters,
        publication=load("data/book-publication-authorization-v1.json"),
    ), end="")


if __name__ == "__main__":
    main()
