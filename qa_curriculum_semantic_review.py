from __future__ import annotations

from collections import Counter
from copy import deepcopy
from datetime import date
from hashlib import sha256
from pathlib import Path
import argparse
import json
import re

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "qa" / "curriculum-semantic-review.json"
REPORT = ROOT / "curriculum-semantic-review-report.json"

DIMENSIONS = (
    "mechanism",
    "diagnosticDecision",
    "measurement",
    "practicalAction",
    "misconceptionFailure",
    "evidence",
    "outcome",
)
FINGERPRINT_RE = re.compile(r"^sha256:[0-9a-f]{64}$")


def clean(value) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def text(path: Path) -> str:
    if not path.exists():
        raise AssertionError(f"curriculum semantic-review dependency missing: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> dict:
    try:
        value = json.loads(text(path))
    except json.JSONDecodeError as exc:
        raise AssertionError(f"invalid JSON in {path.relative_to(ROOT)}: {exc}") from exc
    if not isinstance(value, dict):
        raise AssertionError(f"{path.relative_to(ROOT)} must contain a JSON object")
    return value


def json_assignment(source: str, marker: str):
    try:
        start = source.index(marker) + len(marker)
    except ValueError as exc:
        raise AssertionError(f"JSON assignment marker missing: {marker}") from exc
    tail = source[start:].lstrip()
    try:
        value, _end = json.JSONDecoder().raw_decode(tail)
    except json.JSONDecodeError as exc:
        raise AssertionError(f"could not decode JSON after {marker}: {exc}") from exc
    return value


def valid_iso_date(value) -> bool:
    raw = clean(value)
    if not raw:
        return False
    try:
        date.fromisoformat(raw)
    except ValueError:
        return False
    return True


def canonical_lessons() -> list[dict]:
    source = text(ROOT / "MouldMaster_Core_App.html")
    data = json_assignment(source, "window.MM_DATA = ")
    lessons = data.get("lessons") if isinstance(data, dict) else None
    if not isinstance(lessons, list) or not lessons:
        raise AssertionError("canonical MM_DATA lessons must be a non-empty list")
    lesson_ids = []
    for row in lessons:
        if not isinstance(row, dict):
            raise AssertionError("every canonical lesson must be an object")
        lesson_id = row.get("id")
        if type(lesson_id) is not int or lesson_id < 1:
            raise AssertionError(f"canonical lesson has invalid integer id: {lesson_id!r}")
        lesson_ids.append(lesson_id)
    duplicates = sorted(value for value, count in Counter(lesson_ids).items() if count > 1)
    if duplicates:
        raise AssertionError(f"duplicate canonical lesson ids: {duplicates}")
    return sorted(lessons, key=lambda row: row["id"])


def lesson_fingerprint(lesson: dict) -> str:
    canonical = json.dumps(
        lesson,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")
    return "sha256:" + sha256(canonical).hexdigest()


def validate_contract(contract: dict, lessons: list[dict]) -> dict:
    if type(contract.get("schemaVersion")) is not int or contract.get("schemaVersion") != 1:
        raise AssertionError("curriculum semantic-review schemaVersion must be integer 1")

    required_dimensions = contract.get("requiredDimensions")
    if not isinstance(required_dimensions, list) or required_dimensions != list(DIMENSIONS):
        raise AssertionError(
            "requiredDimensions must exactly match the governed seven-dimension order: "
            + ", ".join(DIMENSIONS)
        )

    expected_ids = [row["id"] for row in lessons]
    lesson_ids = contract.get("lessonIds")
    if not isinstance(lesson_ids, list):
        raise AssertionError("curriculum semantic-review lessonIds must be a list")
    if any(type(value) is not int or value < 1 for value in lesson_ids):
        raise AssertionError("curriculum semantic-review lessonIds must contain positive JSON integers only")
    duplicates = sorted(value for value, count in Counter(lesson_ids).items() if count > 1)
    if duplicates:
        raise AssertionError(f"duplicate curriculum semantic-review lessonIds: {duplicates}")
    if lesson_ids != expected_ids:
        missing = sorted(set(expected_ids) - set(lesson_ids))
        unknown = sorted(set(lesson_ids) - set(expected_ids))
        raise AssertionError(
            f"curriculum semantic-review lessonIds must exactly match canonical ordered IDs; "
            f"missing={missing} unknown={unknown}"
        )

    reviews = contract.get("reviews")
    if not isinstance(reviews, list):
        raise AssertionError("curriculum semantic-review reviews must be a list")

    lesson_by_id = {row["id"]: row for row in lessons}
    review_ids = []
    approved_dimension_counts = Counter({dimension: 0 for dimension in DIMENSIONS})
    completed_lessons = []
    partial_lessons = []
    review_summaries = []

    for index, review in enumerate(reviews):
        if not isinstance(review, dict):
            raise AssertionError(f"reviews[{index}] must be an object")
        lesson_id = review.get("lessonId")
        if type(lesson_id) is not int or lesson_id not in lesson_by_id:
            raise AssertionError(f"reviews[{index}].lessonId is not a canonical positive integer id")
        review_ids.append(lesson_id)

    duplicate_reviews = sorted(value for value, count in Counter(review_ids).items() if count > 1)
    if duplicate_reviews:
        raise AssertionError(f"duplicate curriculum semantic review records: {duplicate_reviews}")

    for review in reviews:
        lesson_id = review["lessonId"]
        current_fingerprint = lesson_fingerprint(lesson_by_id[lesson_id])
        recorded_fingerprint = clean(review.get("reviewedLessonFingerprint"))
        dimension_reviews = review.get("dimensionReviews")
        if not isinstance(dimension_reviews, dict):
            raise AssertionError(f"lesson {lesson_id}: dimensionReviews must be an object")
        unknown_dimensions = sorted(set(dimension_reviews) - set(DIMENSIONS))
        if unknown_dimensions:
            raise AssertionError(f"lesson {lesson_id}: unknown semantic dimensions {unknown_dimensions}")

        if not dimension_reviews:
            raise AssertionError(
                f"lesson {lesson_id}: empty review records are not allowed; omit the lesson from reviews until a dimension is approved"
            )
        if not FINGERPRINT_RE.fullmatch(recorded_fingerprint):
            raise AssertionError(f"lesson {lesson_id}: reviewedLessonFingerprint must be sha256:<64 lowercase hex>")
        if recorded_fingerprint != current_fingerprint:
            raise AssertionError(
                f"lesson {lesson_id}: canonical lesson changed since SME review; "
                f"recorded={recorded_fingerprint} current={current_fingerprint}. Re-review all recorded dimensions."
            )

        for dimension, dimension_review in dimension_reviews.items():
            if not isinstance(dimension_review, dict):
                raise AssertionError(f"lesson {lesson_id} {dimension}: review must be an object")
            if clean(dimension_review.get("reviewStatus")) != "approved":
                raise AssertionError(f"lesson {lesson_id} {dimension}: recorded reviewStatus must be approved")
            if not clean(dimension_review.get("reviewedBy")):
                raise AssertionError(f"lesson {lesson_id} {dimension}: reviewedBy is required")
            if not valid_iso_date(dimension_review.get("reviewedAt")):
                raise AssertionError(f"lesson {lesson_id} {dimension}: reviewedAt must be an ISO date")
            if not clean(dimension_review.get("reviewNote")):
                raise AssertionError(f"lesson {lesson_id} {dimension}: reviewNote is required")
            approved_dimension_counts[dimension] += 1

        approved_dimensions = sorted(dimension_reviews, key=DIMENSIONS.index)
        missing_dimensions = [dimension for dimension in DIMENSIONS if dimension not in dimension_reviews]
        if not missing_dimensions:
            completed_lessons.append(lesson_id)
            state = "approved-all-seven"
        else:
            partial_lessons.append(lesson_id)
            state = "partial-human-review"

        review_summaries.append(
            {
                "lessonId": lesson_id,
                "title": clean(lesson_by_id[lesson_id].get("title")),
                "reviewStatus": state,
                "approvedDimensions": approved_dimensions,
                "dimensionsPending": missing_dimensions,
                "reviewedLessonFingerprint": recorded_fingerprint,
            }
        )

    reviewed_ids = set(review_ids)
    untouched_pending = [lesson_id for lesson_id in expected_ids if lesson_id not in reviewed_ids]
    pending_dimension_total = sum(
        len(DIMENSIONS) - len(review.get("dimensionReviews", {}))
        for review in reviews
    ) + len(untouched_pending) * len(DIMENSIONS)

    status = (
        "HUMAN_SME_SEMANTIC_REVIEW_COMPLETE"
        if len(completed_lessons) == len(expected_ids)
        else "HOLD_HUMAN_SME_SEMANTIC_REVIEW"
    )

    return {
        "status": status,
        "totalLessons": len(expected_ids),
        "reviewRecords": len(reviews),
        "lessonsApprovedAllSeven": len(completed_lessons),
        "lessonsPartiallyReviewed": len(partial_lessons),
        "lessonsWithNoHumanReviewRecord": len(untouched_pending),
        "approvedDimensionCounts": {
            dimension: int(approved_dimension_counts[dimension]) for dimension in DIMENSIONS
        },
        "pendingDimensionReviewCount": pending_dimension_total,
        "completedLessonIds": sorted(completed_lessons),
        "partialLessonIds": sorted(partial_lessons),
        "unreviewedLessonIds": untouched_pending,
        "reviewSummaries": sorted(review_summaries, key=lambda row: row["lessonId"]),
        "fingerprintPolicy": (
            "SHA-256 over the entire canonical lesson JSON object with sorted keys and compact separators. "
            "Any canonical field change invalidates recorded dimension approvals for that lesson."
        ),
        "governanceNote": (
            "Only explicit human dimension approvals bound to the current whole-lesson fingerprint are counted. "
            "Automated source-specificity signals, generated depth, and omitted review records do not count as SME approval. "
            "Completing this ledger is not accreditation, psychometric validation, physical accessibility validation, "
            "or production-machine authority."
        ),
    }


def approved_dimension(reviewed_by: str = "test-reviewer") -> dict:
    return {
        "reviewStatus": "approved",
        "reviewedBy": reviewed_by,
        "reviewedAt": "2026-09-10",
        "reviewNote": "Self-test confirms this semantic dimension was independently reviewed.",
    }


def expect_failure(label: str, fn) -> None:
    try:
        fn()
    except AssertionError:
        return
    raise AssertionError(f"curriculum semantic-review self-test expected failure: {label}")


def self_test() -> None:
    lessons = [
        {"id": 1, "title": "One", "objectives": ["A"], "summary": "Alpha"},
        {"id": 2, "title": "Two", "objectives": ["B"], "summary": "Beta"},
    ]
    baseline = {
        "schemaVersion": 1,
        "requiredDimensions": list(DIMENSIONS),
        "lessonIds": [1, 2],
        "reviews": [],
    }
    summary = validate_contract(deepcopy(baseline), lessons)
    if summary["status"] != "HOLD_HUMAN_SME_SEMANTIC_REVIEW":
        raise AssertionError("empty human-review ledger must remain HOLD")
    if summary["pendingDimensionReviewCount"] != 14:
        raise AssertionError("two unreviewed lessons must expose fourteen pending dimension reviews")

    partial = deepcopy(baseline)
    partial["reviews"] = [{
        "lessonId": 1,
        "reviewedLessonFingerprint": lesson_fingerprint(lessons[0]),
        "dimensionReviews": {"mechanism": approved_dimension()},
    }]
    summary = validate_contract(deepcopy(partial), lessons)
    if summary["lessonsPartiallyReviewed"] != 1 or summary["approvedDimensionCounts"]["mechanism"] != 1:
        raise AssertionError("partial dimension approval must be counted but keep the curriculum HOLD")

    complete = deepcopy(baseline)
    complete["reviews"] = [
        {
            "lessonId": lesson["id"],
            "reviewedLessonFingerprint": lesson_fingerprint(lesson),
            "dimensionReviews": {dimension: approved_dimension() for dimension in DIMENSIONS},
        }
        for lesson in lessons
    ]
    summary = validate_contract(deepcopy(complete), lessons)
    if summary["status"] != "HUMAN_SME_SEMANTIC_REVIEW_COMPLETE":
        raise AssertionError("all seven approved dimensions for every lesson should complete the review ledger")

    stale_lessons = deepcopy(lessons)
    stale_lessons[0]["summary"] = "Changed after review"
    expect_failure("stale whole-lesson fingerprint", lambda: validate_contract(complete, stale_lessons))

    unknown = deepcopy(partial)
    unknown["reviews"][0]["lessonId"] = 99
    expect_failure("unknown lesson id", lambda: validate_contract(unknown, lessons))

    duplicate = deepcopy(partial)
    duplicate["reviews"].append(deepcopy(duplicate["reviews"][0]))
    expect_failure("duplicate lesson review", lambda: validate_contract(duplicate, lessons))

    unknown_dimension = deepcopy(partial)
    unknown_dimension["reviews"][0]["dimensionReviews"]["genericDepth"] = approved_dimension()
    expect_failure("unknown semantic dimension", lambda: validate_contract(unknown_dimension, lessons))

    missing_note = deepcopy(partial)
    missing_note["reviews"][0]["dimensionReviews"]["mechanism"]["reviewNote"] = None
    expect_failure("missing human review note", lambda: validate_contract(missing_note, lessons))

    fake_pending_record = deepcopy(baseline)
    fake_pending_record["reviews"] = [{
        "lessonId": 1,
        "reviewedLessonFingerprint": lesson_fingerprint(lessons[0]),
        "dimensionReviews": {},
    }]
    expect_failure("empty review record", lambda: validate_contract(fake_pending_record, lessons))

    boolean_id = deepcopy(baseline)
    boolean_id["lessonIds"][0] = True
    expect_failure("boolean lesson id", lambda: validate_contract(boolean_id, lessons))

    print(
        "Curriculum semantic-review self-test passed: untouched lessons remain HOLD; partial and complete human "
        "dimension approvals are counted only at the current whole-lesson fingerprint; stale/unknown/malformed "
        "review records fail closed."
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate human SME semantic review of canonical lessons")
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Exercise fail-closed semantic-review behavior without changing repository review state.",
    )
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return

    lessons = canonical_lessons()
    contract = load_json(CONTRACT)
    summary = validate_contract(contract, lessons)
    result = {
        "schemaVersion": 1,
        "audit": "curriculum-semantic-review",
        **summary,
    }
    REPORT.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(
        "Curriculum SME semantic review:",
        f"{result['lessonsApprovedAllSeven']}/{result['totalLessons']} lessons approved across all seven dimensions;",
        f"{result['pendingDimensionReviewCount']} dimension reviews pending;",
        f"status={result['status']}",
    )
    print(f"Curriculum semantic review report written: {REPORT.name}")


if __name__ == "__main__":
    main()
