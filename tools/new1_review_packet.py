#!/usr/bin/env python3
"""Print a read-only, single-lesson NEW1 Book review preparation packet.

A packet is a *discovery aid* for a qualified human reviewer, not a review
record or an accepted mapping. It cannot modify authoritative content or
activate learner navigation, progress, competency or professional advice.
"""
from __future__ import annotations

import argparse
import html
import re

from qa_new1_semantic_link_review import need
from tools.new1_authoring_review_queue import DISCOVERY, HOLD, current_queue

SOURCE_STATUS = "DECLARED SOURCE ONLY — NOT independently rechecked"
SOURCE_DISCLOSURE = "DECLARED ONLY — SME source/applicability review outstanding"
CANDIDATE_FIELDS = frozenset((
    "chapterId", "chapterTitle", "manifestSourceState",
    "declaredBookSourceIds", "declaredBookSourceDetails",
    "declaredBookSourceReferences", "declaredBookClaimClasses",
    "courseOverlapThemes", "sourceDisclosureStatus",
    "chapterManifestFingerprint", "bookPublicationRelease",
    "bookRuntimeFingerprint", "discoveryBasis", "reviewStatus",
))
SOURCE_DETAILS_FIELDS = frozenset((
    "sourceId", "sourceType", "issuer", "title", "url", "scope", "checked",
    "declaredState", "reviewStatus",
))


def markdown_text(value: str) -> str:
    """Treat source titles and descriptions as one line of inert Markdown text."""
    need(type(value) is str and len(value) <= 4096,
         "invalid reviewer packet display value")
    flat = " ".join(value.split())
    need(bool(flat), "empty reviewer packet display value")
    # HTML escape first; protect headings, links, emphasis and list injection.
    escaped = html.escape(flat, quote=True).replace("\\", "\\\\")
    for char in "*_[]()!#|" + chr(96):
        escaped = escaped.replace(char, "\\" + char)
    return escaped


def render_packet(queue: dict, lesson_id: int) -> str:
    """Use only a validated, unapproved discovery queue; never derive matches."""
    need(type(lesson_id) is int and 1 <= lesson_id <= 120,
         "a canonical integer lesson ID from 1 to 120 is required")
    need(type(queue) is dict and queue.get("schemaVersion") == 1
         and queue.get("purpose") == "NON-PUBLIC human author discovery queue"
         and queue.get("status") == "hold-exact-lesson-review"
         and queue.get("reviewStatus") == HOLD
         and queue.get("basis") == DISCOVERY
         and queue.get("approvedPublicLinks") is False
         and type(queue.get("exactLessonMatchesVerified")) is int
         and queue["exactLessonMatchesVerified"] == 0,
         "human review packet requires an unapproved, unreviewed discovery queue")
    lessons = queue.get("lessons")
    need(type(lessons) is list and len(lessons) == 120,
         "incomplete discovery queue")
    ids = [row.get("lessonId") for row in lessons if type(row) is dict]
    need(len(ids) == 120 and all(type(value) is int for value in ids)
         and len(set(ids)) == 120,
         "ambiguous canonical IDs in discovery queue")
    lesson = next(row for row in lessons if row["lessonId"] == lesson_id)
    candidates = lesson.get("possibleBookModules")
    need(type(candidates) is list and bool(candidates),
         "no Book source candidates for selected lesson")
    for key in ("webRelease", "bookPublicationRelease", "bookRuntimeFingerprint"):
        need(type(queue.get(key)) is str and bool(queue[key]),
             "missing current reviewer packet source identity")
    need(type(lesson.get("wholeLessonFingerprint")) is str
         and re.fullmatch(r"sha256:[0-9a-f]{64}", lesson["wholeLessonFingerprint"]),
         "missing canonical whole-lesson fingerprint")

    lines = [
        f"# NEW1 review preparation — lesson {lesson_id}",
        "",
        "**UNREVIEWED / HUMAN-ONLY / NO PUBLIC LINKS OR LEARNING CREDIT.**",
        "",
        "This is a course-overlap discovery packet, NOT evidence of an exact",
        "lesson↔Book semantic match or of current source applicability.",
        "",
        f"- Canonical lesson: {markdown_text(lesson['lessonTitle'])}",
        f"- Canonical course: {markdown_text(lesson['canonicalCourseName'])}",
        f"- Academy web release: {markdown_text(queue['webRelease'])}",
        f"- Whole-lesson fingerprint: {markdown_text(lesson['wholeLessonFingerprint'])}",
        f"- Published Book release: {markdown_text(queue['bookPublicationRelease'])}",
        f"- Published Book source-inventory fingerprint: {markdown_text(queue['bookRuntimeFingerprint'])}",
        "",
        "## Book candidates (original Book order; NONE reviewed)",
        "",
    ]
    seen = set()
    for index, candidate in enumerate(candidates, start=1):
        need(type(candidate) is dict and set(candidate) == CANDIDATE_FIELDS,
             "unexpected Book candidate fields or invented review evidence")
        chapter_id = candidate.get("chapterId")
        need(type(chapter_id) is str and bool(chapter_id)
             and chapter_id not in seen, "duplicate or invalid Book candidate")
        seen.add(chapter_id)
        need(candidate["reviewStatus"] == HOLD
             and candidate["discoveryBasis"] == DISCOVERY
             and candidate["sourceDisclosureStatus"] == SOURCE_DISCLOSURE
             and candidate["bookPublicationRelease"] == queue["bookPublicationRelease"]
             and candidate["bookRuntimeFingerprint"] == queue["bookRuntimeFingerprint"],
             "Book candidate falsely promotes or changes source authority")
        need(type(candidate["chapterManifestFingerprint"]) is str
             and re.fullmatch(r"sha256:[0-9a-f]{64}",
                              candidate["chapterManifestFingerprint"]),
             "missing Book metadata provenance")
        for field in ("declaredBookSourceIds", "declaredBookSourceDetails",
                      "declaredBookClaimClasses", "courseOverlapThemes"):
            need(type(candidate[field]) is list,
                 "malformed candidate source and thematic declarations")
        refs = candidate["declaredBookSourceDetails"]
        ids = candidate["declaredBookSourceIds"]
        need(len(refs) == len(ids) and all(type(x) is str for x in ids)
             and len(set(ids)) == len(ids),
             "Book declarations and source records differ")
        lines.extend((
            f"### Candidate {index}: {markdown_text(candidate['chapterTitle'])}",
            "",
            f"- Book module ID: {markdown_text(chapter_id)}",
            f"- Manifest state (not SME approval): {markdown_text(candidate['manifestSourceState'])}",
            f"- Chapter metadata fingerprint: {markdown_text(candidate['chapterManifestFingerprint'])}",
            "- Course-overlap themes (not an exact match): "
            + "; ".join(markdown_text(s) for s in candidate["courseOverlapThemes"]),
            "- Book-declared claim classes (unverified): "
            + "; ".join(markdown_text(s) for s in candidate["declaredBookClaimClasses"]),
        ))
        if not refs:
            lines.append("- Source citations: **NONE DECLARED — human verification required.**")
        else:
            lines.append("- Source declarations below are NOT independently checked:")
        for ref, source_id in zip(refs, ids, strict=True):
            need(type(ref) is dict and set(ref) == SOURCE_DETAILS_FIELDS
                 and ref.get("sourceId") == source_id
                 and ref.get("reviewStatus") == SOURCE_STATUS,
                 "forged or misaligned source disclosure")
            lines.extend((
                f"  - {markdown_text(ref['sourceId'])}: "
                f"{markdown_text(ref['issuer'])} — {markdown_text(ref['title'])}",
                f"    - URL (declared only): {markdown_text(ref['url'])}",
                f"    - Applicability scope (declared only): {markdown_text(ref['scope'])}",
                f"    - Last declared check: {markdown_text(ref['checked'])}; "
                f"state: {markdown_text(ref['declaredState'])}",
            ))
        lines.append("")

    lines.extend((
        "## Required independent human review (NOT completed by this packet)",
        "",
        "1. Open the canonical *whole lesson* and the actual *published Book passages*;",
        "   record exact section locations and identify gaps or contradictions.",
        "2. Re-check every applicable source, permitted reuse, safety limitations,",
        "   material/machine/mould scope and claim evidence; do not rely on declarations.",
        "3. Decide explicitly whether a particular passage is an exact instructional",
        "   fit, a partial fit, unsuitable, or requires newly authored content.",
        "4. Separately identify canonical competency and practice references;",
        "   course overlap alone never establishes either one.",
        "5. Have qualified independent content owners record review rationale and",
        "   evidence under the governed review contract after genuine verification.",
        "",
        "**No reviewer decisions, SME attestations, learner records, practice",
        "credit, credentials, machine-control authority or navigation links",
        "are created by this output. All release, device/AT and provider gates HOLD.**",
        "",
    ))
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lesson-id", type=int, required=True,
                        help="One canonical Academy lesson ID (1–120)")
    args = parser.parse_args()
    print(render_packet(current_queue(), args.lesson_id), end="")


if __name__ == "__main__":
    main()
