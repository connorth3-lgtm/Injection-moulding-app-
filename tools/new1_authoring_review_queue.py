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

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from qa_book_curriculum_crosswalk import canonical_curriculum, lesson_course_name
from qa_curriculum_semantic_review import lesson_fingerprint
from qa_new1_semantic_link_review import check, digest, load, need

DISCOVERY = "course-level-overlap-only"
HOLD = "UNREVIEWED — no exact lesson match or SME approval"


def make_queue(
    lessons: list[dict], courses: dict[int, str], chapters: list[dict],
    crosswalk: dict, publication: dict, contract: dict, release: str,
    book_sme: dict,
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
    need(contract["approvedPublicLinks"] is False,
         "reviewer queue must not grant public link authority")

    for chapter, row in zip(chapters, mapping, strict=True):
        need(
            isinstance(chapter, dict) and isinstance(row, dict)
            and type(chapter.get("id")) is str
            and row.get("chapterId") == chapter["id"]
            and isinstance(row.get("courseNames"), list),
            "Book source and course mapping misaligned",
        )

    queue = []
    for lesson in sorted(lessons, key=lambda item: item["id"]):
        course_name = lesson_course_name(lesson, courses)
        need(course_name in declared, "unknown lesson course name")
        candidates = []
        for chapter, mapping_row in zip(chapters, mapping, strict=True):
            if course_name not in mapping_row["courseNames"]:
                continue
            candidates.append({
                "chapterId": chapter["id"],
                "chapterTitle": chapter.get("title", ""),
                "manifestSourceState": chapter.get("state", "missing"),
                "chapterManifestFingerprint": digest(chapter),
                "bookPublicationRelease": publication["version"],
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
        "status": "hold-exact-lesson-review",
        "approvedPublicLinks": False,
        "exactLessonMatchesVerified": 0,
        "reviewStatus": HOLD,
        "basis": DISCOVERY,
        "warning": (
            "These are COURSE-level overlaps only, NOT reviewed exact-lesson "
            "matches, publication authorizations, competency, practice "
            "activities, training credit or production instructions."
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
    )


def write_csv(queue: dict) -> None:
    fields = (
        "lessonId", "lessonTitle", "canonicalCourseName",
        "wholeLessonFingerprint", "chapterId", "chapterTitle",
        "manifestSourceState", "chapterManifestFingerprint",
        "bookPublicationRelease", "discoveryBasis", "reviewStatus",
    )
    writer = csv.DictWriter(sys.stdout, fieldnames=fields, lineterminator="\n")
    writer.writeheader()
    for lesson in queue["lessons"]:
        for chapter in lesson["possibleBookModules"]:
            writer.writerow({
                **{k: lesson[k] for k in fields[:4]},
                **{k: chapter[k] for k in fields[4:]},
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
