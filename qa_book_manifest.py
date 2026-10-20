from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "data" / "book-manifest-v1.json"
POLICY = ROOT / "sources" / "MOULDMASTER_BOOK_ACCURACY_POLICY.md"

ALLOWED_STATES = {"planned", "source-review", "technical-review", "verified", "hold"}
ALLOWED_CLASSES = {
    "fundamental",
    "standard-defined",
    "manufacturer-specific",
    "grade-specific",
    "machine-specific",
    "mould-specific",
    "measured-experimental",
    "diagnostic-hypothesis",
}
PRIMARY_SOURCE_TYPES = {"standard", "manufacturer-processing-guide", "manufacturer-datasheet", "manufacturer-manual"}


def need(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> None:
    need(MANIFEST.exists(), "Book manifest is missing")
    need(POLICY.exists(), "Book accuracy policy is missing")
    payload = json.loads(MANIFEST.read_text(encoding="utf-8"))

    need(payload.get("schema") == 1, "Book manifest schema must remain explicit")
    need(payload.get("bookId") == "mouldmaster-book", "Book identity changed unexpectedly")
    need(payload.get("principles", {}).get("canonicalLessonsAreAutomaticallyVerified") is False,
         "Canonical lessons must never become verified Book evidence automatically")
    need(payload.get("principles", {}).get("unsupportedNumericClaimsFailClosed") is True,
         "Unsupported numeric claims must fail closed")
    need(payload.get("releaseRules", {}).get("gradeSpecificSettingRequiresGradeSpecificSource") is True,
         "Grade-specific settings must require grade-specific evidence")
    need(payload.get("releaseRules", {}).get("conflictingSourcesRequireResolutionOrHold") is True,
         "Conflicting evidence must be resolved or held")

    sources = payload.get("sourceSeeds")
    need(isinstance(sources, list) and sources, "Book source seed registry is empty")
    source_by_id = {}
    for source in sources:
        sid = str(source.get("id") or "").strip()
        need(sid and sid not in source_by_id, f"Invalid or duplicate source id: {sid!r}")
        need(source.get("type") in PRIMARY_SOURCE_TYPES or source.get("type"), f"Source {sid} has no type")
        need(str(source.get("issuer") or "").strip(), f"Source {sid} has no issuer")
        need(str(source.get("title") or "").strip(), f"Source {sid} has no title")
        url = str(source.get("url") or "").strip()
        parsed = urlparse(url)
        need(parsed.scheme == "https" and parsed.netloc, f"Source {sid} must use a traceable HTTPS URL")
        need(str(source.get("scope") or "").strip(), f"Source {sid} has no applicability scope")
        need(str(source.get("checked") or "").strip(), f"Source {sid} has no checked date")
        need(str(source.get("currentState") or "").strip(), f"Source {sid} has no currency state")
        source_by_id[sid] = source

    parts = payload.get("parts")
    need(isinstance(parts, list) and len(parts) == 8, "Book must preserve the eight-part progression")
    chapter_ids = set()
    chapter_count = 0
    verified_count = 0
    for part in parts:
        pid = str(part.get("id") or "").strip()
        need(pid, "Book part is missing an id")
        need(str(part.get("title") or "").strip(), f"Book part {pid} is missing a title")
        chapters = part.get("chapters")
        need(isinstance(chapters, list) and chapters, f"Book part {pid} has no chapters")
        for chapter in chapters:
            chapter_count += 1
            cid = str(chapter.get("id") or "").strip()
            need(cid and cid not in chapter_ids, f"Invalid or duplicate chapter id: {cid!r}")
            chapter_ids.add(cid)
            need(str(chapter.get("title") or "").strip(), f"Chapter {cid} has no title")
            state = chapter.get("state")
            need(state in ALLOWED_STATES, f"Chapter {cid} has invalid evidence state {state!r}")
            classes = chapter.get("claimClasses")
            need(isinstance(classes, list) and classes, f"Chapter {cid} has no claim classification")
            need(set(classes) <= ALLOWED_CLASSES, f"Chapter {cid} has unknown claim classes: {set(classes) - ALLOWED_CLASSES}")
            refs = chapter.get("sourceIds")
            need(isinstance(refs, list), f"Chapter {cid} sourceIds must be an array")
            for ref in refs:
                need(ref in source_by_id, f"Chapter {cid} references missing source {ref}")

            if state == "verified":
                verified_count += 1
                need(refs, f"Verified chapter {cid} has no sources")
                need(any(source_by_id[ref].get("type") in PRIMARY_SOURCE_TYPES for ref in refs),
                     f"Verified chapter {cid} lacks a primary source")
                need(str(chapter.get("applicability") or "").strip(),
                     f"Verified chapter {cid} lacks an applicability statement")
                review = chapter.get("technicalReview")
                need(isinstance(review, dict), f"Verified chapter {cid} lacks a technical review record")
                need(str(review.get("reviewedOn") or "").strip(), f"Verified chapter {cid} lacks review date")
                need(str(review.get("basis") or "").strip(), f"Verified chapter {cid} lacks review basis")

    need(chapter_count >= 40, f"Book foundation unexpectedly small: {chapter_count} chapters")
    need(verified_count == 0,
         "Foundation milestone must not claim verified chapters before claim-level technical review is implemented")

    canonical = payload.get("canonicalLessonImport") or {}
    need(canonical.get("currentCountExpected") == 120, "Canonical lesson count contract changed")
    need(canonical.get("automaticBookEvidenceState") == "unverified",
         "Existing lessons must enter the Book review pipeline as unverified")

    policy = POLICY.read_text(encoding="utf-8")
    for marker in (
        "Accuracy has priority",
        "symptom -> plausible mechanism -> evidence to check -> controlled test",
        "Unsupported numbers fail closed",
        "The spoken Book and readable Book must use the same governed chapter content",
        "If the evidence cannot support the wording safely, the Book says less.",
    ):
        need(marker in policy, f"Book accuracy policy lost required guardrail: {marker}")

    print(
        f"MouldMaster Book foundation QA passed: {len(parts)} parts, {chapter_count} governed chapters, "
        f"{len(sources)} primary-source anchors, and zero prematurely verified chapters."
    )


if __name__ == "__main__":
    main()
