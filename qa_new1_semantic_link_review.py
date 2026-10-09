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
import re
import sys

from qa_book_curriculum_crosswalk import canonical_curriculum, lesson_course_name
from qa_curriculum_semantic_review import lesson_fingerprint

ROOT = Path(__file__).resolve().parent
CONTRACT = "data/new1-semantic-link-review-v1.json"
RECORD_KEYS = {
    "lessonId", "chapterId", "canonicalCourseName",
    "lessonFingerprint", "chapterFingerprint", "bookPublicationRelease",
    "bookRuntimeFingerprint",
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


# Book-manifest chapter metadata alone does not cover authored Book prose.
# Bind prospective human reviews to the published source-integrity manifest
# covering the authored chapters, reader, citations and source qualification.
BOOK_RUNTIME_REQUIRED_FILES = frozenset((
    "book-manifest-v1.json",
    "book-authored-foundations-v1.json",
    "book-chapters-materials-machine-v1.json",
    "book-authored-remaining-v1.json",
    "book-reader-architecture-v2.json",
    "book-sme-review-v1.json",
))
GIT_BLOB_SHA1 = re.compile(r"^[0-9a-f]{40}$")


def book_runtime_fingerprint(publication: dict) -> str:
    integrity = publication.get("runtimeIntegrity")
    need(type(integrity) is dict and integrity.get("algorithm") == "git-blob-sha1",
         "published Book source-integrity algorithm is missing or unsafe")
    blobs = integrity.get("gitBlobSha1ByFile")
    need(type(blobs) is dict and BOOK_RUNTIME_REQUIRED_FILES.issubset(blobs),
         "published Book payload or reader source is not in the integrity inventory")
    need(len(blobs) <= 128 and all(
        type(name) is str and type(sha) is str
        and name.endswith(".json") and "/" not in name and ".." not in name
        and GIT_BLOB_SHA1.fullmatch(sha)
        for name, sha in blobs.items()
    ), "malformed or invented published Book runtime source fingerprints")
    # Deliberately coarse-grained: any published Book file change should
    # require human re-review, even if the manifest's chapter row is identical.
    return digest({"algorithm": "git-blob-sha1", "gitBlobSha1ByFile": blobs})


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
    current_book_fingerprint = book_runtime_fingerprint(publication)
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
        need(row["bookRuntimeFingerprint"] == current_book_fingerprint,
             "Book authored payload or evidence changed; human re-review required")
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
    # Completely fabricated QA-only registries. A valid shape must never be
    # mistaken for an accepted human review or public learner link.
    from copy import deepcopy

    lessons = [
        {"id": n, "course": ((n - 1) % 12) + 1,
         "title": f"Synthetic QA lesson {n}"}
        for n in range(1, 121)
    ]
    courses = {n: f"QA Course {n}" for n in range(1, 13)}
    chapters = [
        {"id": f"qa-book-{n}", "title": f"Synthetic QA Book {n}"}
        for n in range(1, 47)
    ]
    links = [
        {"chapterId": chapter["id"],
         "courseNames": [courses[((n - 1) % 12) + 1]]}
        for n, chapter in enumerate(chapters, start=1)
    ]
    publication = {
        "status": "authorized", "version": "synthetic-qa-book-v1",
        "runtimeIntegrity": {
            "algorithm": "git-blob-sha1",
            "gitBlobSha1ByFile": {
                name: f"{n:040x}" for n, name in enumerate(
                    sorted(BOOK_RUNTIME_REQUIRED_FILES), start=1
                )
            },
        },
    }
    fixture = {
        "schemaVersion": 1, "webRelease": "2026.10.09.6",
        "status": "hold-exact-lesson-review",
        "mappingLevel": "authored exact-lesson to Book-module semantic match",
        "lessonAuthority": "MouldMaster_Core_App.html:window.MM_DATA.lessons",
        "bookAuthority": "data/book-manifest-v1.json",
        "courseCrosswalk": "data/book-curriculum-crosswalk-v1.json",
        "bookPublicationAuthority": "data/book-publication-authorization-v1.json",
        "approvedPublicLinks": False,
        "policy": "Course suggestions are not reviewed exact-lesson matches. "
                  "Automated shape checks grant no public navigation entitlement. "
                  "All offline/deep-link navigation remains on HOLD.",
        "reviewedLinks": [],
    }

    def run(value: dict) -> int:
        return check(value, lessons, courses, chapters, links, publication,
                     "2026.10.09.6")

    def must_reject(value: dict, label: str) -> None:
        try:
            run(value)
        except AssertionError as exc:
            need(str(exc).startswith("New1 exact-link HOLD:"),
                 f"{label} rejected outside fail-closed contract")
        else:
            raise AssertionError(f"Synthetic {label} was accepted")

    need(run(fixture) == 0, "empty review-HOLD contract failed")
    review = {
        "lessonId": 1, "chapterId": "qa-book-1",
        "canonicalCourseName": "QA Course 1",
        "lessonFingerprint": lesson_fingerprint(lessons[0]),
        "chapterFingerprint": digest(chapters[0]),
        "bookPublicationRelease": publication["version"],
        "bookRuntimeFingerprint": book_runtime_fingerprint(publication),
        "reviewedAt": "2020-01-02",
        "reviewer": "Synthetic fixture only",
        "reviewEvidenceRef": "qa-only:no-human-evidence",
        "rationale": "Synthetic mapping record solely to exercise the guarded parser.",
    }
    one = deepcopy(fixture)
    one["reviewedLinks"] = [review]
    need(run(one) == 1, "validly shaped QA record was not parsed")

    mutations = (
        ("public activation", "approvedPublicLinks", True),
        ("unknown lesson", "reviewedLinks.0.lessonId", 999),
        ("boolean lesson ID", "reviewedLinks.0.lessonId", True),
        ("unknown chapter", "reviewedLinks.0.chapterId", "invented-chapter"),
        ("course mismatch", "reviewedLinks.0.canonicalCourseName", "QA Course 2"),
        ("stale lesson hash", "reviewedLinks.0.lessonFingerprint", "sha256:wrong"),
        ("stale chapter hash", "reviewedLinks.0.chapterFingerprint", "sha256:wrong"),
        ("stale Book release", "reviewedLinks.0.bookPublicationRelease", "obsolete"),
        ("stale authored Book payload", "reviewedLinks.0.bookRuntimeFingerprint", "sha256:old"),
        ("missing reviewer", "reviewedLinks.0.reviewer", ""),
        ("missing human evidence", "reviewedLinks.0.reviewEvidenceRef", ""),
        ("unsupported rationale", "reviewedLinks.0.rationale", "too short"),
        ("future review", "reviewedLinks.0.reviewedAt", "2999-01-01"),
    )
    for label, slot, forged in mutations:
        bad = deepcopy(one)
        if slot == "approvedPublicLinks":
            bad[slot] = forged
        else:
            bad["reviewedLinks"][0][slot.split(".")[-1]] = forged
        must_reject(bad, label)

    bad = deepcopy(one)
    bad["reviewedLinks"].append(deepcopy(review))
    must_reject(bad, "duplicate lesson/chapter mapping")
    bad = deepcopy(one)
    bad["reviewedLinks"][0]["learnerCompletion"] = True
    must_reject(bad, "synthetic learner credit")
    bad = deepcopy(one)
    bad["reviewedLinks"] = [review] * 361
    must_reject(bad, "unbounded review records")

    # A Book prose, source-qualification, reader or SME source change can
    # preserve both manifest metadata and the publication version. It must
    # nevertheless invalidate any previously authored exact semantic review.
    changed_publication = deepcopy(publication)
    changed_publication["runtimeIntegrity"]["gitBlobSha1ByFile"][
        "book-authored-foundations-v1.json"
    ] = "b" * 40
    try:
        check(one, lessons, courses, chapters, links, changed_publication,
              "2026.10.09.6")
    except AssertionError as exc:
        need("Book authored payload or evidence changed" in str(exc),
             "published Book prose/source drift must invalidate exact links")
    else:
        raise AssertionError(
            "Stale exact Book mapping accepted after authored payload changed"
        )

    partial = deepcopy(one)
    try:
        check(partial, lessons[:-1], courses, chapters, links, publication,
              "2026.10.09.6")
    except AssertionError as exc:
        need("canonical registry membership incomplete" in str(exc),
             "incomplete canonical registry guard lost")
    else:
        raise AssertionError("Partial canonical lesson registry was accepted")
    print("New1 exact-link HOLD contract self-test passed: positive shape and adversarial rejection")


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
