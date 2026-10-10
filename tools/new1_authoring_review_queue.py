#!/usr/bin/env python3
"""Read-only NEW1 lesson/Book reviewer discovery queue (never public links).

This tool exposes existing COURSE-LEVEL overlaps to a human author. It never
creates or edits exact lesson↔Book review evidence, navigation, progress, or
assessment credit. Its output is a disposable reviewer aid, not app data.
"""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
import sys
from datetime import date
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from qa_book_curriculum_crosswalk import canonical_curriculum, lesson_course_name
from qa_curriculum_semantic_review import lesson_fingerprint
from qa_new1_semantic_link_review import book_runtime_fingerprint, check, digest, load, need

DISCOVERY = "course-level-overlap-only"
HOLD = "UNREVIEWED — no exact lesson match or SME approval"
SOURCE_FIELDS = frozenset((
    "id", "type", "issuer", "title", "url", "scope", "checked",
    "currentState",
))
# These are source-seed metadata states, not review/approval states.
SOURCE_DECLARATIONS = frozenset((
    "published-confirmed", "active",
    "current-public-manufacturer-document",
))


def validate_source_seed(seed: dict) -> None:
    need(type(seed) is dict and set(seed) == SOURCE_FIELDS,
         "Book source seed missing declared reference fields or injecting approvals")
    for key in SOURCE_FIELDS:
        need(type(seed[key]) is str and bool(seed[key].strip())
             and len(seed[key]) <= 2048 and
             all(ord(ch) >= 32 for ch in seed[key]),
             "missing, oversized or control-character Book source field: " + key)
    need(seed["currentState"] in SOURCE_DECLARATIONS,
         "unreviewed Book source must not claim new/approved evidence state")
    try:
        checked = date.fromisoformat(seed["checked"])
    except ValueError:
        raise AssertionError("Book source checked date is invalid") from None
    need(checked.isoformat() == seed["checked"],
         "Book source checked date must be ISO yyyy-mm-dd")
    url = urlsplit(seed["url"])
    need(url.scheme == "https" and bool(url.hostname)
         and not url.username and not url.password
         and not any(ch.isspace() for ch in seed["url"])
         and not url.fragment,
         "Book source URL must be a bare HTTPS citation with no credentials")


def source_ref(seed: dict) -> dict:
    """Author-only SOURCE DECLARATION, not an approved or rechecked citation."""
    return {
        "sourceId": seed["id"], "sourceType": seed["type"],
        "issuer": seed["issuer"], "title": seed["title"],
        "url": seed["url"], "scope": seed["scope"],
        "checked": seed["checked"], "declaredState": seed["currentState"],
        "reviewStatus": "DECLARED SOURCE ONLY — NOT independently rechecked",
    }


def source_summary(refs: list[dict]) -> str:
    """Readable CSV cell; safe_spreadsheet_cell still guards the whole value."""
    return "; ".join(
        f"{ref['sourceId']} ({ref['issuer']}: {ref['title']}) — "
        f"{ref['url']} — declared scope: {ref['scope']} — "
        f"last declared check: {ref['checked']} — state: {ref['declaredState']}"
        for ref in refs
    )



def make_queue(
    lessons: list[dict], courses: dict[int, str], chapters: list[dict],
    crosswalk: dict, publication: dict, contract: dict, release: str,
    book_sme: dict, source_seeds: list[dict], claim_classes: list[str],
) -> dict:
    """Build deterministic proposals with genuine IDs/hashes and zero approvals."""
    mapping = crosswalk.get("chapterMappings")
    need(isinstance(mapping, list), "missing canonical Book course crosswalk")
    need(
        crosswalk.get("schemaVersion") == 1
        and crosswalk.get("crosswalkId") == "mouldmaster-book-academy-crosswalk"
        and crosswalk.get("mappingLevel") == "course-level semantic reinforcement",
        "canonical course-level crosswalk identity drift",
    )
    declared = crosswalk.get("courseNames")
    need(
        isinstance(declared, list) and len(declared) == 12
        and len(set(declared)) == 12
        and set(declared) == set(courses.values())
        and len(set(courses.values())) == 12,
        "course names do not match authoritative Academy registry",
    )
    # Reuse the release's fail-closed verifier, including fingerprints, bounded
    # review records and the prohibition on learner-facing activation.
    check(contract, lessons, courses, chapters, mapping, publication, release)
    need(book_sme.get("status") == "hold", "independent Book SME HOLD drift")
    current_book_fingerprint = book_runtime_fingerprint(publication)
    need(contract["approvedPublicLinks"] is False,
         "reviewer queue must not grant public link authority")
    need(type(source_seeds) is list and len(source_seeds) >= 1
         and len(source_seeds) <= 100,
         "Book manifest source-seed registry missing or unbounded")
    for seed in source_seeds:
        validate_source_seed(seed)
    need(len({seed["id"] for seed in source_seeds}) == len(source_seeds),
         "Book source-seed IDs must be unique")
    known_sources = {seed["id"]: seed for seed in source_seeds}
    need(type(claim_classes) is list and len(claim_classes) >= 1
         and all(type(name) is str and name.strip()
                 for name in claim_classes)
         and len(set(claim_classes)) == len(claim_classes),
         "Book manifest claim-class registry is missing or malformed")
    known_classes = set(claim_classes)


    for chapter, row in zip(chapters, mapping, strict=True):
        need(
            isinstance(chapter, dict) and isinstance(row, dict)
            and type(chapter.get("id")) is str
            and row.get("chapterId") == chapter["id"]
            and isinstance(row.get("courseNames"), list),
            "Book source and course mapping misaligned",
        )
        themes = row.get("themes")
        sources = chapter.get("sourceIds")
        classes = chapter.get("claimClasses")
        need(type(themes) is list and bool(themes)
             and all(type(theme) is str and theme.strip() for theme in themes)
             and len(set(themes)) == len(themes),
             "Book course overlap lacks declared thematic rationale")
        need(type(sources) is list
             and all(type(src) is str and src in known_sources for src in sources)
             and len(set(sources)) == len(sources),
             "Book chapter references unknown, duplicate or missing source IDs")
        need(type(classes) is list and bool(classes)
             and all(type(cls) is str and cls in known_classes for cls in classes)
             and len(set(classes)) == len(classes),
             "Book chapter declares unknown or missing claim classes")

    queue = []
    for lesson in sorted(lessons, key=lambda item: item["id"]):
        course_name = lesson_course_name(lesson, courses)
        need(course_name in declared, "unknown lesson course name")
        candidates = []
        for chapter, mapping_row in zip(chapters, mapping, strict=True):
            if course_name not in mapping_row["courseNames"]:
                continue
            citations = [source_ref(known_sources[src])
                         for src in chapter["sourceIds"]]
            candidates.append({
                "chapterId": chapter["id"],
                "chapterTitle": chapter.get("title", ""),
                "manifestSourceState": chapter.get("state", "missing"),
                # Declarations are review pointers, NOT validated source claims.
                "declaredBookSourceIds": list(chapter["sourceIds"]),
                "declaredBookSourceDetails": citations,
                "declaredBookSourceReferences": source_summary(citations),
                "declaredBookClaimClasses": list(chapter["claimClasses"]),
                "courseOverlapThemes": list(mapping_row["themes"]),
                "sourceDisclosureStatus": "DECLARED ONLY — SME source/applicability review outstanding",
                "chapterManifestFingerprint": digest(chapter),
                "bookPublicationRelease": publication["version"],
                "bookRuntimeFingerprint": current_book_fingerprint,
                "discoveryBasis": DISCOVERY,
                "reviewStatus": HOLD,
            })
        need(bool(candidates), f"lesson {lesson['id']} has no course-level candidates")
        queue.append({
            "lessonId": lesson["id"],
            "lessonTitle": lesson.get("title", ""),
            "canonicalCourseName": course_name,
            "wholeLessonFingerprint": lesson_fingerprint(lesson),
            "possibleBookModules": candidates,
        })

    need(len(queue) == 120 and len({x["lessonId"] for x in queue}) == 120,
         "lesson discovery coverage drift")
    # No reviewer, evidence reference, competencies, activities, progress or
    # credit fields are emitted. Human authors must separately review and
    # intentionally author all such records under the HOLD contract.
    return {
        "schemaVersion": 1,
        "purpose": "NON-PUBLIC human author discovery queue",
        "webRelease": release,
        "bookPublicationRelease": publication["version"],
        "bookRuntimeFingerprint": current_book_fingerprint,
        "status": "hold-exact-lesson-review",
        "approvedPublicLinks": False,
        "exactLessonMatchesVerified": 0,
        "reviewStatus": HOLD,
        "basis": DISCOVERY,
        "warning": (
            "These are COURSE-level overlaps only, NOT reviewed exact-lesson "
            "matches, verified Book sources or claim applicability, "
            "publication authorizations, competency, practice activities, "
            "training credit or production instructions."
        ),
        "lessons": queue,
    }


def current_queue() -> dict:
    lessons, courses = canonical_curriculum()
    manifest = load("data/book-manifest-v1.json")
    chapters = [
        chapter for part in manifest.get("parts", [])
        for chapter in part.get("chapters", [])
    ]
    version = load("version.json")
    return make_queue(
        lessons, courses, chapters,
        load("data/book-curriculum-crosswalk-v1.json"),
        load("data/book-publication-authorization-v1.json"),
        load("data/new1-semantic-link-review-v1.json"),
        version.get("web_release"),
        load("data/book-sme-review-v1.json"),
        manifest.get("sourceSeeds"),
        manifest.get("claimClasses"),
    )


def safe_spreadsheet_cell(value: object) -> object:
    """Stop workbook applications evaluating a CSV cell as a formula."""
    if not isinstance(value, str):
        return value
    # Whitespace/BOM prefixes do not reliably prevent spreadsheet execution.
    leading = value.lstrip(" \t\r\n\ufeff")
    if leading.startswith(("=", "+", "-", "@")):
        return "'" + value
    return value


def write_csv(queue: dict) -> None:
    fields = (
        "lessonId", "lessonTitle", "canonicalCourseName",
        "wholeLessonFingerprint", "chapterId", "chapterTitle",
        "manifestSourceState", "declaredBookSourceIds", "declaredBookSourceReferences",
        "declaredBookClaimClasses",
        "courseOverlapThemes", "sourceDisclosureStatus", "chapterManifestFingerprint",
        "bookPublicationRelease", "bookRuntimeFingerprint", "discoveryBasis", "reviewStatus",
    )
    writer = csv.DictWriter(sys.stdout, fieldnames=fields, lineterminator="\n")
    writer.writeheader()
    for lesson in queue["lessons"]:
        for chapter in lesson["possibleBookModules"]:
            row = {
                **{k: lesson[k] for k in fields[:4]},
                **{k: chapter[k] for k in fields[4:]},
            }
            writer.writerow({
                key: safe_spreadsheet_cell(
                    "; ".join(value) if isinstance(value, list) else value
                ) for key, value in row.items()
            })


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--json", action="store_true", help="Print read-only discovery worklist as JSON")
    mode.add_argument("--csv", action="store_true", help="Print read-only discovery worklist as CSV")
    args = parser.parse_args()
    queue = current_queue()
    if args.json:
        print(json.dumps(queue, indent=2, ensure_ascii=False))
    elif args.csv:
        write_csv(queue)
    else:
        print(
            f"NEW1 author discovery QA passed: {len(queue['lessons'])} "
            "canonical lessons; source-scoped Book course overlaps only; "
            "zero verified exact matches; public links and all independent "
            "review/production permissions HOLD."
        )


if __name__ == "__main__":
    main()
