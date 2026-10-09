#!/usr/bin/env python3
"""NEW1-03 fail-closed exact-lesson/Book authoring gate (no public activation).

Course-level thematic discovery is not an approved exact lesson equivalence.
This script validates provenance for prospective *review records* only. It
cannot certify human review, grant learning credit, or turn on public links.
"""
from __future__ import annotations

from datetime import date
from hashlib import sha256
import json
from pathlib import Path
import sys

from qa_book_curriculum_crosswalk import canonical_curriculum, lesson_course_name
from qa_curriculum_semantic_review import lesson_fingerprint

ROOT = Path(__file__).resolve().parent
CONTRACT = "data/new1-semantic-link-review-v1.json"
RECORD_KEYS = {
    "lessonId", "chapterId", "canonicalCourseName",
    "lessonFingerprint", "chapterFingerprint", "bookPublicationRelease",
    "reviewedAt", "reviewer", "reviewEvidenceRef", "rationale",
}


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise AssertionError("New1 exact-link HOLD: " + reason)


def load(path: str) -> dict:
    value = json.loads((ROOT / path).read_text(encoding="utf-8"))
    need(isinstance(value, dict), f"{path} is not a JSON object")
    return value


def digest(value: dict) -> str:
    return "sha256:" + sha256(json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")).hexdigest()


def check(contract: dict, lessons: list[dict], courses: dict[int, str],
          chapters: list[dict], course_links: list[dict], publication: dict,
          current_release: str) -> int:
    need(contract.get("schemaVersion") == 1 and type(contract.get("schemaVersion")) is int,
         "schema version drift")
    fixed = {
        "webRelease": current_release,
        "status": "hold-exact-lesson-review",
        "mappingLevel": "authored exact-lesson to Book-module semantic match",
        "lessonAuthority": "MouldMaster_Core_App.html:window.MM_DATA.lessons",
        "bookAuthority": "data/book-manifest-v1.json",
        "courseCrosswalk": "data/book-curriculum-crosswalk-v1.json",
        "bookPublicationAuthority": "data/book-publication-authorization-v1.json",
        "approvedPublicLinks": False,
    }
    for name, expected in fixed.items():
        need(type(contract.get(name)) is type(expected) and contract.get(name) == expected,
             f"unsafe {name} or unsupported public activation")
    policy = contract.get("policy")
    need(isinstance(policy, str) and all(x.lower() in policy.lower() for x in (
        "not reviewed exact-lesson", "automated shape checks",
        "no public navigation entitlement", "offline/deep-link",
    )), "missing explicit review and release limitations")
    need(len(lessons) == 120 and len(chapters) == 46 and len(courses) == 12,
         "canonical registry membership incomplete")
    need(all(type(row.get("id")) is int for row in lessons) and
         len({row["id"] for row in lessons}) == 120,
         "ambiguous canonical lesson IDs")
    lesson_index = {row["id"]: row for row in lessons}
    chapter_ids = [row.get("id") for row in chapters]
    need(all(type(x) is str and x for x in chapter_ids)
         and len(set(chapter_ids)) == 46, "ambiguous Book chapter identities")
    chapters_by_id = {x["id"]: x for x in chapters}
    need(len(course_links) == 46 and
         [row.get("chapterId") for row in course_links] == chapter_ids,
         "course-level crosswalk must align to all Book modules in manifest order")
    linked_courses = {}
    for row in course_links:
        names = row.get("courseNames")
        need(isinstance(names, list) and names and
             all(type(n) is str and n in set(courses.values()) for n in names)
             and len(names) == len(set(names)),
             "malformed or invented canonical course in Book crosswalk")
        linked_courses[row["chapterId"]] = set(names)

    need(publication.get("status") == "authorized" and
         type(publication.get("version")) is str,
         "Book source publication authority is unavailable")
    links = contract.get("reviewedLinks")
    need(isinstance(links, list) and len(links) <= 360,
         "reviewedLinks must be a bounded list")
    seen: set[tuple[int, str]] = set()
    for row in links:
        need(isinstance(row, dict) and set(row) == RECORD_KEYS,
             "exact-link review has missing/unapproved fields")
        lesson_id = row.get("lessonId")
        chapter_id = row.get("chapterId")
        need(type(lesson_id) is int and type(chapter_id) is str,
             "lesson/chapter identity must not be coerced")
        need(lesson_id in lesson_index and chapter_id in chapters_by_id,
             "invented or unknown lesson/Book module")
        key = (lesson_id, chapter_id)
        need(key not in seen, "duplicate exact lesson-to-Book assertion")
        seen.add(key)
        lesson = lesson_index[lesson_id]
        course_name = lesson_course_name(lesson, courses)
        need(row["canonicalCourseName"] == course_name and
             course_name in linked_courses[chapter_id],
             "course mismatch or an unsupported exact-lesson thematic bridge")
        need(row["lessonFingerprint"] == lesson_fingerprint(lesson),
             "stale or invented whole-lesson fingerprint")
        need(row["chapterFingerprint"] == digest(chapters_by_id[chapter_id]),
             "stale or invented Book manifest-chapter fingerprint")
        need(row["bookPublicationRelease"] == publication["version"],
             "Book publication release changed; rerun authored review")
        for name in ("reviewer", "reviewEvidenceRef", "rationale"):
            value = row[name]
            need(type(value) is str and len(value.strip()) >=
                 (32 if name == "rationale" else 4),
                 f"missing human-authored {name}")
        value = row.get("reviewedAt")
        need(type(value) is str and len(value) == 10, "invalid review date")
        try:
            when = date.fromisoformat(value)
        except ValueError as exc:
            raise AssertionError("New1 exact-link HOLD: invalid review date") from exc
        need(when <= date.today(), "future-dated review cannot be accepted")

    # Even a structurally valid review does not by itself establish genuine
    # human approval or authorize learner-facing links/credit.
    return len(links)


def self_test() -> None:
    lesson = {"id": 1, "course": 1, "title": "Synthetic lesson"}
    chapter = {"id": "book-1", "title": "Synthetic chapter"}
    pub = {"status": "authorized", "version": "book-v1"}
    fixture = {
        "schemaVersion": 1, "webRelease": "2026.10.09.6",
        "status": "hold-exact-lesson-review",
        "mappingLevel": "authored exact-lesson to Book-module semantic match",
        "lessonAuthority": "MouldMaster_Core_App.html:window.MM_DATA.lessons",
        "bookAuthority": "data/book-manifest-v1.json",
        "courseCrosswalk": "data/book-curriculum-crosswalk-v1.json",
        "bookPublicationAuthority": "data/book-publication-authorization-v1.json",
        "approvedPublicLinks": False,
        "policy": "Course suggestion is not reviewed exact-lesson mapping; "
                  "automated shape checks grant no public navigation entitlement. "
                  "offline/deep-link acceptance requires independent review.",
        "reviewedLinks": [],
    }
    # The fixture verifies a bounded HOLD with empty links; full-population
    # integration is checked independently against 120/46 canonical records.
    try:
        check(fixture, [lesson], {1: "Foundations"}, [chapter],
              [{"chapterId": "book-1", "courseNames": ["Foundations"]}],
              pub, "2026.10.09.6")
    except AssertionError as exc:
        need("canonical registry membership incomplete" in str(exc),
             "population guard lost")
    else:
        raise AssertionError("Synthetic partial registries were accepted")
    fixture["approvedPublicLinks"] = True
    try:
        check(fixture, [lesson], {1: "Foundations"}, [chapter],
              [{"chapterId": "book-1", "courseNames": ["Foundations"]}],
              pub, "2026.10.09.6")
    except AssertionError as exc:
        need("unsupported public activation" in str(exc),
             "public activation failed to close")
    else:
        raise AssertionError("Unreviewed public activation was accepted")
    print("New1 exact-link fail-closed contract self-test passed")


def main() -> None:
    contract = load(CONTRACT)
    manifest = load("data/book-manifest-v1.json")
    crosswalk = load("data/book-curriculum-crosswalk-v1.json")
    publication = load("data/book-publication-authorization-v1.json")
    version = load("version.json")
    lessons, courses = canonical_curriculum()
    chapters = [
        chapter for part in manifest.get("parts", [])
        for chapter in part.get("chapters", [])
    ]
    count = check(contract, lessons, courses, chapters,
                  crosswalk.get("chapterMappings", []),
                  publication, str(version.get("web_release") or ""))
    need(load("data/book-sme-review-v1.json").get("status") == "hold",
         "independent Book SME review unexpectedly promoted")
    need(not contract["approvedPublicLinks"],
         "NEW1 links require a distinct reviewed runtime release")
    print(f"NEW1 exact lesson↔Book review: {count} record(s); "
          "public activation HOLD; 120 canonical lessons and 46 Book modules "
          "checked; no learning credit or human signoff inferred")


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        self_test()
    else:
        main()
