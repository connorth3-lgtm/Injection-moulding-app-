#!/usr/bin/env python3
"""Aggregate explicit PRIVATE NEW1 review drafts without reading out their prose.

This is an author-only format and provenance triage report, not verification
that a reviewer exists, a lesson↔Book link fits, any source is applicable, or
anything is authorized for learner navigation or production release.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from qa_book_curriculum_crosswalk import canonical_curriculum
from qa_new1_semantic_link_review import load, need
from tools.new1_authoring_review_queue import current_queue, DISCOVERY, HOLD
from tools.new1_book_source_alignment import build_alignment
from tools.new1_review_draft import (
    BOUNDARY, check_draft, make_template, parse_private_json,
)

MAX_DRAFTS = 120
STATUS = "UNSUBMITTED — LOCAL FORMAT TRIAGE ONLY"
WARNING = (
    "Local private drafts, not approved reviews. Counts indicate entered "
    "format-valid human-input fields only, NOT authentic reviewer identity, "
    "qualified SME decisions, correct sources, validated exact lesson matches, "
    "training credit or publication. Course-level candidates are discovery "
    "pointers, NOT an obligation to create exact links."
)


def batch_summary(
    queue: dict, publication: dict, draft_documents: list[dict], *,
    lessons: list[dict], manifest_chapters: list[dict],
    root: Path = ROOT,
) -> dict:
    """Check every draft against freshly rendered published source identity.

    No private prose, evidence, file paths, names, or draft JSON is returned.
    """
    need(type(draft_documents) is list and len(draft_documents) <= MAX_DRAFTS,
         "batch size exceeds explicit local-draft limit")
    # This validates all 120 canonical discovery entries and every published
    # Book source declaration, even for an empty (baseline) batch.
    audit = build_alignment(queue, publication, root=root)
    need(queue.get("approvedPublicLinks") is False
         and queue.get("reviewStatus") == HOLD and queue.get("basis") == DISCOVERY
         and queue.get("exactLessonMatchesVerified") == 0,
         "local triage cannot run against activated review mappings")
    candidate_pairs = {
        (entry["lessonId"], c["chapterId"])
        for entry in queue["lessons"]
        for c in entry["possibleBookModules"]
    }
    need(len(candidate_pairs) == sum(
        len(entry["possibleBookModules"]) for entry in queue["lessons"]),
        "duplicate course-level discovery candidate")
    chapters_by_id = {row["chapterId"]: row for row in audit["chapters"]}
    need(len(chapters_by_id) == 46, "incomplete source-pinned Book module index")

    # Normalize the batch by canonical Book/lesson IDs rather than caller-
    # chosen file order, avoiding filename hints or private text in the report.
    summary_rows = []
    seen: set[tuple[int, str]] = set()
    total_sections = 0
    total_entered = 0
    for doc in draft_documents:
        need(type(doc) is dict,
             "local draft must be parsed JSON object, not a string/array")
        lesson_id, chapter_id = doc.get("lessonId"), doc.get("chapterId")
        need(type(lesson_id) is int and type(chapter_id) is str
             and (lesson_id, chapter_id) in candidate_pairs,
             "draft references a noncanonical/noncandidate lesson-Book pair")
        pair = (lesson_id, chapter_id)
        need(pair not in seen, "two local drafts claim the same lesson-Book pair")
        seen.add(pair)
        template = make_template(
            queue, lesson_id, chapter_id,
            lessons=lessons, manifest_chapters=manifest_chapters,
            publication=publication, root=root,
        )
        # The individual linter checks strict key equality, source pins,
        # section order/hashes, author-only statuses and bounded human fields.
        checked = check_draft(template, doc)
        reconciled = chapters_by_id[chapter_id]
        count, entered = checked["sectionSlots"], checked["humanDecisionsEntered"]
        need(type(count) is int and type(entered) is int
             and 0 <= entered <= count,
             "invalid local section counters")
        total_sections += count
        total_entered += entered
        summary_rows.append({
            "lessonId": lesson_id,
            "chapterId": chapter_id,
            "courseLevelDiscoveryOnly": True,
            "sourceDeclarationDifference": bool(
                reconciled["authoredOnlySourceIds"] or
                reconciled["manifestOnlySourceIds"]
            ),
            "sectionSlots": count,
            "formatValidManualDecisionsEntered": entered,
            "stillUndecided": checked["sectionsStillUndecided"],
            "localDraftStatus": STATUS,
            "humanSMEApprovalVerified": False,
            "exactLessonEquivalenceVerified": False,
        })
    summary_rows.sort(key=lambda x: (x["lessonId"], x["chapterId"]))

    distinct_lessons = len({row["lessonId"] for row in summary_rows})
    distinct_chapters = len({row["chapterId"] for row in summary_rows})
    return {
        "schemaVersion": 1,
        "status": STATUS,
        "warning": WARNING,
        "boundaries": BOUNDARY,
        "bookPublicationRelease": audit["bookPublicationRelease"],
        "bookRuntimeFingerprint": audit["bookRuntimeFingerprint"],
        "canonicalLessonCount": len(queue["lessons"]),
        "canonicalBookModuleCount": len(audit["chapters"]),
        "courseLevelCandidatePairs": len(candidate_pairs),
        "bookModulesWithSourceDeclarationDifferences":
            audit["modulesWithDeclarationDifferences"],
        "localDraftsFormatChecked": len(summary_rows),
        "distinctLessonsWithLocalDrafts": distinct_lessons,
        "distinctBookModulesWithLocalDrafts": distinct_chapters,
        "sectionSlotsInProvidedDrafts": total_sections,
        "formatValidManualDecisionsEntered": total_entered,
        "stillUndecidedInProvidedDrafts": total_sections - total_entered,
        # The only verified counters are structural. Even after a human enters
        # fields, no authority ever becomes true through this code path.
        "exactLessonMatchesVerified": 0,
        "realHumanReviewsVerified": 0,
        "approvedPublicLinks": False,
        "humanSMEApprovalVerified": False,
        "learnerCreditAuthorized": False,
        "submissionAccepted": False,
        "rows": summary_rows,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--draft", action="append", default=[], metavar="LOCAL_JSON",
                        help="Explicitly include a private local review JSON draft; repeat to combine")
    args = parser.parse_args()
    need(len(args.draft) <= MAX_DRAFTS,
         "too many local draft paths")
    lessons, _ = canonical_curriculum()
    manifest = load("data/book-manifest-v1.json")
    # Explicit local files only: no scanning home directories, uploads,
    # network lookups, or public write paths.
    docs = [parse_private_json(Path(path)) for path in args.draft]
    result = batch_summary(
        current_queue(), load("data/book-publication-authorization-v1.json"),
        docs, lessons=lessons,
        manifest_chapters=[c for p in manifest["parts"] for c in p["chapters"]],
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
