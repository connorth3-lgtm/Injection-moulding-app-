from __future__ import annotations

from collections import Counter, defaultdict
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent


def load(path: str) -> dict:
    value = json.loads((ROOT / path).read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise AssertionError(f"{path} must contain a JSON object")
    return value


def json_assignment(source: str, marker: str):
    try:
        tail = source[source.index(marker) + len(marker):].lstrip()
    except ValueError as exc:
        raise AssertionError(f"JSON assignment marker missing: {marker}") from exc
    try:
        value, _ = json.JSONDecoder().raw_decode(tail)
    except json.JSONDecodeError as exc:
        raise AssertionError(f"could not decode canonical curriculum JSON: {exc}") from exc
    return value


def canonical_curriculum() -> tuple[list[dict], dict[int, str]]:
    source = (ROOT / "MouldMaster_Core_App.html").read_text(encoding="utf-8")
    data = json_assignment(source, "window.MM_DATA = ")
    lessons = data.get("lessons") if isinstance(data, dict) else None
    courses = data.get("courses") if isinstance(data, dict) else None
    if not isinstance(lessons, list) or len(lessons) != 120:
        raise AssertionError("canonical curriculum must contain exactly 120 lessons")
    if not isinstance(courses, list) or not courses:
        raise AssertionError("canonical curriculum course registry is missing")
    course_names: dict[int, str] = {}
    for course in courses:
        cid = course.get("id")
        name = str(course.get("name") or "").strip()
        if type(cid) is not int or not name:
            raise AssertionError(f"invalid canonical course record: {course!r}")
        course_names[cid] = name
    return lessons, course_names


def lesson_course_name(lesson: dict, courses: dict[int, str]) -> str:
    direct = str(lesson.get("courseName") or "").strip()
    if direct:
        return direct
    cid = lesson.get("course")
    if type(cid) is int and cid in courses:
        return courses[cid]
    raise AssertionError(f"lesson {lesson.get('id')} has no resolvable canonical course")


def main() -> None:
    manifest = load("data/book-manifest-v1.json")
    crosswalk = load("data/book-curriculum-crosswalk-v1.json")
    lessons, course_registry = canonical_curriculum()

    chapter_ids = [
        chapter["id"]
        for part in manifest.get("parts", [])
        for chapter in part.get("chapters", [])
    ]
    assert len(chapter_ids) == 46, f"expected 46 Book chapters, found {len(chapter_ids)}"
    assert len(set(chapter_ids)) == len(chapter_ids), "Book manifest contains duplicate chapter IDs"

    declared_courses = crosswalk.get("courseNames")
    if not isinstance(declared_courses, list) or not declared_courses:
        raise AssertionError("crosswalk courseNames must be a non-empty list")
    if len(set(declared_courses)) != len(declared_courses):
        raise AssertionError("crosswalk courseNames contains duplicates")

    canonical_courses = set(course_registry.values())
    assert set(declared_courses) == canonical_courses, (
        "crosswalk course registry must exactly match canonical Academy courses; "
        f"crosswalk={sorted(declared_courses)!r} canonical={sorted(canonical_courses)!r}"
    )

    mappings = crosswalk.get("chapterMappings")
    if not isinstance(mappings, list):
        raise AssertionError("crosswalk chapterMappings must be a list")
    ids = [row.get("chapterId") for row in mappings if isinstance(row, dict)]
    duplicates = sorted(k for k, n in Counter(ids).items() if n > 1)
    if duplicates:
        raise AssertionError(f"duplicate Book crosswalk chapter mappings: {duplicates}")
    assert ids == chapter_ids, "crosswalk chapter order and membership must exactly match the Book manifest"

    chapters_by_course: dict[str, list[str]] = defaultdict(list)
    for row in mappings:
        courses = row.get("courseNames")
        themes = row.get("themes")
        if not isinstance(courses, list) or not courses:
            raise AssertionError(f"{row.get('chapterId')}: courseNames must be non-empty")
        if not isinstance(themes, list) or not themes or any(not str(x).strip() for x in themes):
            raise AssertionError(f"{row.get('chapterId')}: themes must be non-empty explanatory labels")
        unknown = sorted(set(courses) - canonical_courses)
        if unknown:
            raise AssertionError(f"{row.get('chapterId')}: unknown Academy course(s): {unknown}")
        for name in courses:
            chapters_by_course[name].append(row["chapterId"])

    uncovered_courses = sorted(name for name in canonical_courses if not chapters_by_course[name])
    assert not uncovered_courses, f"Academy courses without any Book reinforcement: {uncovered_courses}"

    lesson_counts = Counter()
    uncovered_lessons = []
    for lesson in lessons:
        name = lesson_course_name(lesson, course_registry)
        lesson_counts[name] += 1
        if not chapters_by_course.get(name):
            uncovered_lessons.append(lesson.get("id"))
    assert not uncovered_lessons, f"canonical lessons without Book course-level reinforcement: {uncovered_lessons}"
    assert sum(lesson_counts.values()) == 120

    boundary = str(crosswalk.get("boundary") or "")
    for phrase in ("not human SME approval", "does not make Book validation equivalent to curriculum validation"):
        assert phrase.lower() in boundary.lower(), f"crosswalk boundary missing: {phrase}"

    print(
        "MouldMaster Book↔Academy crosswalk QA passed "
        f"(46 chapters, {len(canonical_courses)} courses, 120 lessons covered at declared course level)"
    )


if __name__ == "__main__":
    main()
