#!/usr/bin/env python3
"""An UNSUBMITTED and all-blank NEW1 lesson/Book human review worksheet.

It reads repository content only. All decisions require actual independent
content-owner and source review; no learner runtime or review record is edited.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from qa_book_curriculum_crosswalk import canonical_curriculum
from qa_new1_semantic_link_review import digest, load, need
from tools.new1_authoring_review_queue import current_queue
from tools.new1_book_source_alignment import build_alignment
from tools.new1_passage_inspection import authored_chapter_index, render_passages
from tools.new1_review_packet import markdown_text

PENDING = "**[HUMAN INPUT REQUIRED — NOT REVIEWED]**"
UNDECIDED = "**UNDECIDED — NO HUMAN REVIEW RECORDED**"
REVIEW_STATES = (
    "exact instructional fit", "partial with important gaps",
    "unsuitable", "requires new authored material",
)


def render_worksheet(
    queue: dict, lesson_id: int, chapter_id: str, *,
    lessons: list[dict], manifest_chapters: list[dict],
    publication: dict, root: Path = ROOT,
) -> str:
    """Combine exact byte-pinned prose and an explicitly empty human checklist."""
    need(type(chapter_id) is str and bool(chapter_id),
         "a canonical Book module ID is required")
    inspected = render_passages(
        queue, lesson_id, chapter_id,
        lessons=lessons, manifest_chapters=manifest_chapters,
        publication=publication, root=root,
    )
    audit = build_alignment(queue, publication, root=root)
    matches = [row for row in audit["chapters"] if row["chapterId"] == chapter_id]
    need(len(matches) == 1, "worksheet requires exactly one canonical Book chapter")
    source_row = matches[0]
    indexed = authored_chapter_index(publication, manifest_chapters, root)
    filename, chapter = indexed[chapter_id]
    need("data/" + filename == source_row["authoredSourceFile"]
         and source_row["authoredSourceIds"] == chapter["sourceIds"],
         "Book worksheet source declarations changed between checks")
    need(type(lesson_id) is int and 1 <= lesson_id <= 120,
         "worksheet requires a canonical integer lesson ID")
    entry = next(row for row in queue["lessons"] if row["lessonId"] == lesson_id)
    candidates = [c for c in entry["possibleBookModules"]
                  if c["chapterId"] == chapter_id]
    need(len(candidates) == 1, "worksheet candidate membership ambiguous")
    sections = chapter["sections"]
    need(2 <= len(sections) <= 200, "unsafe worksheet section count")

    lines = [
        f"# NEW1 — UNSUBMITTED human review worksheet: lesson {lesson_id} / {markdown_text(chapter_id)}",
        "",
        "**AUTHORING AID ONLY — ALL DECISIONS BLANK — NOT SME REVIEWED.**",
        "",
        "This template is NOT an assessment, approval, machine-safety instruction,",
        "competency certificate, or public learner lesson↔Book mapping. No reviewer",
        "identity/evidence has been added; no review file is modified.",
        "",
        f"- Academy lesson: {markdown_text(entry['lessonTitle'])}",
        f"- Whole-lesson SHA-256: {markdown_text(entry['wholeLessonFingerprint'])}",
        f"- Book chapter manifest SHA-256: {markdown_text(candidates[0]['chapterManifestFingerprint'])}",
        f"- Published Book release: {markdown_text(queue['bookPublicationRelease'])}",
        f"- Published Book inventory SHA-256: {markdown_text(queue['bookRuntimeFingerprint'])}",
        f"- Authored source: {markdown_text(source_row['authoredSourceFile'])}",
        "- Human decisions: " + UNDECIDED,
        "",
        "## 1. Source declaration reconciliation — NOT REVIEWED",
        "",
        f"- Manifest vs authored: {markdown_text(source_row['alignment'])}",
        f"- Manifest source IDs: {', '.join(markdown_text(s) for s in source_row['manifestSourceIds']) or '(none declared)'}",
        f"- Authored source IDs: {', '.join(markdown_text(s) for s in source_row['authoredSourceIds']) or '(none declared)'}",
        f"- Authored-only source IDs: {', '.join(markdown_text(s) for s in source_row['authoredOnlySourceIds']) or '(none)'}",
        f"- Manifest-only source IDs: {', '.join(markdown_text(s) for s in source_row['manifestOnlySourceIds']) or '(none)'}",
        f"- Shared source IDs: {', '.join(markdown_text(s) for s in source_row['sharedSourceIds']) or '(none)'}",
        "",
        "Previously declared sources (NOT rechecked by this tool):",
        "",
    ]
    if not source_row["sourceDeclarations"]:
        lines.extend(("- **NONE DECLARED — no citation invented.**", ""))
    else:
        for ref in source_row["sourceDeclarations"]:
            lines.extend((
                f"- {markdown_text(ref['sourceId'])} — {markdown_text(ref['issuer'])}: "
                f"{markdown_text(ref['title'])}",
                f"  - Declared URL: {markdown_text(ref['url'])}",
                f"  - Declared scope: {markdown_text(ref['scope'])}",
                f"  - Declared check: {markdown_text(ref['checked'])}; "
                f"state: {markdown_text(ref['declaredState'])}",
                f"  - Registry: {markdown_text(ref['registryPath'])}",
            ))
        lines.append("")
    lines.extend((
        "- Source/version checked independently: " + PENDING,
        "- Actual supporting claims, passages and limitations: " + PENDING,
        "- Copyright/reuse and machine/site safety boundaries: " + PENDING,
        "- Manifest-vs-authored declaration resolution: " + UNDECIDED,
        "- Missing or contradictory evidence to escalate: " + PENDING,
        "",
        "## 2. Per-section instructional review — ALL UNDECIDED",
        "",
        "The following section hashes identify prose only. Compare actual Book",
        "sections to the whole canonical lesson in Appendix A; do not infer a fit",
        "from a course name. Possible human conclusions NOT chosen by the tool:",
        "; ".join(markdown_text(s) for s in REVIEW_STATES) + ".",
        "",
    ))
    for index, section in enumerate(sections, start=1):
        lines.extend((
            f"### Section {index}: {markdown_text(section['title'])}",
            "",
            f"- Section SHA-256: {digest(section)}",
            "- Exact canonical lesson passage(s) compared: " + PENDING,
            "- Instructional fit decision: " + UNDECIDED,
            "- Reasons, omissions and contradictions: " + PENDING,
            "- Supporting source passages and applicability checked: " + PENDING,
            "- Grade/machine/mould/safety limits checked: " + PENDING,
            "- Needed corrections or new authored material: " + PENDING,
            "",
        ))
    lines.extend((
        "## 3. Separate downstream reviews — NOT COMPLETED",
        "",
        "- Canonical competency ID and independent fit reasoning: " + PENDING,
        "- Canonical practical activity ID and assessor evidence: " + PENDING,
        "- Independent qualified content/Book SME review record: " + PENDING,
        "- On-device, iPad and assistive-technology evidence: " + PENDING,
        "- Offline/deep links and cross-learner isolation acceptance: " + PENDING,
        "- Provider/NZQA and governed production release clearance: " + PENDING,
        "",
        "## 4. Local draft only — publication BLOCKED",
        "",
        "No reviewedLinks record, public-link flag, independent signoff, learner",
        "credit, credentials, machine control or release permission is created.",
        "Only independently reviewed decisions can enter a separately governed",
        "review process, and source changes require re-review.",
        "Do not commit completed worksheets or private reviewer/source evidence",
        "to the public repository. All public and production gates HOLD.",
        "",
        "---",
        "",
        "## Appendix A. Actual unreviewed lesson and Book source prose",
        "",
        inspected,
    ))
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lesson-id", type=int, required=True)
    parser.add_argument("--chapter-id", required=True)
    args = parser.parse_args()
    lessons, _ = canonical_curriculum()
    manifest = load("data/book-manifest-v1.json")
    print(render_worksheet(
        current_queue(), args.lesson_id, args.chapter_id,
        lessons=lessons,
        manifest_chapters=[c for part in manifest["parts"]
                           for c in part["chapters"]],
        publication=load("data/book-publication-authorization-v1.json"),
    ), end="")


if __name__ == "__main__":
    main()
