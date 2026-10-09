#!/usr/bin/env python3
"""Create and lint local UNSUBMITTED New1 lesson↔Book human-review drafts.

SHAPE / SOURCE IDENTITY ONLY. A successfully linted, manually filled JSON
file is NEVER a reviewed/approved public link, SME attestation, teaching
equivalence, competency assessment, provider certification, or release gate.
No repository file, learner state, publication or review registry is written.
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
from tools.new1_authoring_review_queue import current_queue
from tools.new1_book_source_alignment import build_alignment
from tools.new1_passage_inspection import authored_chapter_index, render_passages
from tools.new1_review_packet import markdown_text
from tools.new1_human_review_worksheet import REVIEW_STATES

UNDECIDED = "UNDECIDED"
STATUS = "LOCAL_UNSUBMITTED_DRAFT"
BOUNDARY = (
    "Local unsubmitted human-input draft. Format checks cannot verify real "
    "reviewers, evidence, sources, lesson equivalence, SME signoff, "
    "competencies, practical activities, learner progress or public navigation."
)
MAX_DRAFT_BYTES = 256_000
MAX_HUMAN_FIELD_CHARS = 6000

# Section source provenance is immutable; the only editable keys are the
# five deliberately blank review fields plus the draft decision.
FIXED_SECTION_FIELDS = ("sectionNumber", "sectionTitle", "sectionFingerprint")
HUMAN_TEXT_FIELDS = (
    "lessonPassageRef", "rationale", "sourceAssessment",
    "limitations", "reviewEvidenceRef",
)
HUMAN_SECTION_FIELDS = ("decision", *HUMAN_TEXT_FIELDS, "declaredSourcesExamined")


def make_template(
    queue: dict, lesson_id: int, chapter_id: str, *,
    lessons: list[dict], manifest_chapters: list[dict],
    publication: dict, root: Path = ROOT,
) -> dict:
    """Materialize the same pinned pair used by the Markdown reviewer worksheet."""
    need(type(lesson_id) is int and 1 <= lesson_id <= 120,
         "a canonical numeric lesson ID (1–120) is required")
    need(type(chapter_id) is str and bool(chapter_id),
         "an exact Book module ID is required")
    # Reuse complete source/lesson/course validation; never derive a match
    # from title similarity or a manually supplied chapter/lesson tuple.
    render_passages(
        queue, lesson_id, chapter_id,
        lessons=lessons, manifest_chapters=manifest_chapters,
        publication=publication, root=root,
    )
    audit = build_alignment(queue, publication, root=root)
    matches = [row for row in audit["chapters"] if row["chapterId"] == chapter_id]
    need(len(matches) == 1, "ambiguous Book source reconciliation")
    row = matches[0]
    indexed = authored_chapter_index(publication, manifest_chapters, root)
    authored_file, authored = indexed[chapter_id]
    need("data/" + authored_file == row["authoredSourceFile"]
         and authored["sourceIds"] == row["authoredSourceIds"],
         "source reconciliation drift in local draft")
    entry = next(x for x in queue["lessons"] if x["lessonId"] == lesson_id)
    candidates = [c for c in entry["possibleBookModules"]
                  if c["chapterId"] == chapter_id]
    need(len(candidates) == 1, "ambiguous course-level Book candidate")
    from qa_new1_semantic_link_review import digest
    sections = authored["sections"]
    need(2 <= len(sections) <= 200,
         "unexpected number of Book sections in local draft")
    return {
        "schemaVersion": 1,
        "status": STATUS,
        "boundary": BOUNDARY,
        "lessonId": lesson_id,
        "chapterId": chapter_id,
        "canonicalCourseName": entry["canonicalCourseName"],
        "lessonFingerprint": entry["wholeLessonFingerprint"],
        "chapterManifestFingerprint": candidates[0]["chapterManifestFingerprint"],
        "bookPublicationRelease": queue["bookPublicationRelease"],
        "bookRuntimeFingerprint": queue["bookRuntimeFingerprint"],
        "authoredSourceFile": row["authoredSourceFile"],
        "authoredGitBlobSha1":
            publication["runtimeIntegrity"]["gitBlobSha1ByFile"][authored_file],
        "manifestSourceIds": row["manifestSourceIds"][:],
        "authoredSourceIds": row["authoredSourceIds"][:],
        "sourceReconciliationNote": "",
        "sectionReviews": [
            {
                "sectionNumber": index,
                "sectionTitle": section["title"],
                "sectionFingerprint": digest(section),
                "decision": UNDECIDED,
                "lessonPassageRef": "",
                "rationale": "",
                "sourceAssessment": "",
                "limitations": "",
                "reviewEvidenceRef": "",
                "declaredSourcesExamined": [],
            }
            for index, section in enumerate(sections, start=1)
        ],
    }


def parse_private_json(path: Path) -> dict:
    """Fail closed on duplicate JSON keys and unbounded local input."""
    need(path.is_file(), "local draft file does not exist")
    raw = path.read_bytes()
    need(0 < len(raw) <= MAX_DRAFT_BYTES,
         "local draft is empty or exceeds the reviewer input size limit")

    def unique_keys(pairs: list[tuple[str, object]]) -> dict:
        result = {}
        for key, value in pairs:
            need(key not in result, "duplicate JSON key in local draft")
            result[key] = value
        return result

    def reject_constant(value: str):
        raise AssertionError("non-JSON numeric constant in local draft: " + value)

    try:
        parsed = json.loads(raw.decode("utf-8"), object_pairs_hook=unique_keys,
                            parse_constant=reject_constant)
    except (UnicodeError, ValueError) as exc:
        raise AssertionError("invalid local reviewer JSON") from exc
    need(type(parsed) is dict, "local reviewer JSON must be an object")
    return parsed


def check_draft(template: dict, draft: dict) -> dict:
    """Validate draft shape and source pins only; explicitly grant NO authority."""
    need(type(draft) is dict and set(draft) == set(template),
         "review draft contains missing or invented approval fields")
    for key, expected in template.items():
        if key in ("sourceReconciliationNote", "sectionReviews"):
            continue
        need(type(draft[key]) is type(expected) and draft[key] == expected,
             "review draft has stale or forged source identity: " + key)
    note = draft["sourceReconciliationNote"]
    need(type(note) is str and len(note) <= MAX_HUMAN_FIELD_CHARS
         and all(ord(c) >= 32 or c in "\n\t" for c in note),
         "invalid local-only source reconciliation note")
    need(type(draft["sectionReviews"]) is list
         and len(draft["sectionReviews"]) == len(template["sectionReviews"]),
         "review draft omits or duplicates section review slots")
    allowed_sources = set(template["manifestSourceIds"] +
                          template["authoredSourceIds"])
    filled = 0
    for expected, review in zip(template["sectionReviews"],
                                draft["sectionReviews"], strict=True):
        need(type(review) is dict
             and set(review) == set(expected),
             "review section contains missing or forged evidence/approval fields")
        for key in FIXED_SECTION_FIELDS:
            need(type(review[key]) is type(expected[key])
                 and review[key] == expected[key],
                 "review section is stale, reordered or has a forged source hash")
        decision = review["decision"]
        need(type(decision) is str
             and decision in (UNDECIDED, *REVIEW_STATES),
             "unknown section decision / invented approved review state")
        for key in HUMAN_TEXT_FIELDS:
            value = review[key]
            need(type(value) is str and len(value) <= MAX_HUMAN_FIELD_CHARS
                 and all(ord(c) >= 32 or c in "\n\t" for c in value),
                 "invalid human-only section text: " + key)
        refs = review["declaredSourcesExamined"]
        need(type(refs) is list and len(refs) <= len(allowed_sources)
             and all(type(s) is str and s in allowed_sources for s in refs)
             and len(set(refs)) == len(refs),
             "invented/duplicate cited source ID in human local draft")
        if decision == UNDECIDED:
            need(not refs and all(not review[k] for k in HUMAN_TEXT_FIELDS),
                 "undecided section must not carry purported review evidence")
        else:
            # This validates presence and shape, not the authenticity of an
            # author or the applicability/accuracy of any cited document.
            need(all(len(review[k].strip()) >=
                     (32 if k in ("rationale", "sourceAssessment") else 6)
                     for k in HUMAN_TEXT_FIELDS),
                 "entered decision lacks human-authored explanation / references")
            filled += 1

    return {
        "status": "UNSUBMITTED — FORMAT VALIDATED ONLY",
        "lessonId": template["lessonId"],
        "chapterId": template["chapterId"],
        "sectionSlots": len(template["sectionReviews"]),
        "humanDecisionsEntered": filled,
        "sectionsStillUndecided": len(template["sectionReviews"]) - filled,
        "semanticEquivalenceVerified": False,
        "humanSMEApprovalVerified": False,
        "approvedPublicLinks": False,
        "learnerCreditAuthorized": False,
        "submissionAccepted": False,
        "warning": BOUNDARY,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lesson-id", type=int, required=True)
    parser.add_argument("--chapter-id", required=True)
    operation = parser.add_mutually_exclusive_group()
    operation.add_argument("--template", action="store_true",
                           help="Print source-pinned local JSON with every decision blank")
    operation.add_argument("--check-local", metavar="PATH",
                           help="Lint an explicitly provided private local JSON draft")
    args = parser.parse_args()
    lessons, _ = canonical_curriculum()
    manifest = load("data/book-manifest-v1.json")
    template = make_template(
        current_queue(), args.lesson_id, args.chapter_id,
        lessons=lessons, manifest_chapters=[
            x for p in manifest["parts"] for x in p["chapters"]],
        publication=load("data/book-publication-authorization-v1.json"),
    )
    if args.check_local:
        result = check_draft(template, parse_private_json(Path(args.check_local)))
    else:
        result = template
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
