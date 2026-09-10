from __future__ import annotations

from collections import Counter
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
REPORT = ROOT / "assessment-curriculum-coverage-report.json"
FLOOR = ROOT / "qa" / "assessment-curriculum-coverage-floor.json"
DIMENSIONS = (
    "mechanism",
    "diagnosticDecision",
    "measurement",
    "practicalAction",
    "misconceptionFailure",
    "evidence",
    "outcome",
)


def load(path: Path) -> dict:
    if not path.exists():
        raise AssertionError(f"coverage ratchet dependency missing: {path.relative_to(ROOT)}")
    return json.loads(path.read_text(encoding="utf-8"))


def at_most(label: str, current: int, floor: int) -> None:
    if current > floor:
        raise AssertionError(f"coverage regression: {label} increased from floor {floor} to {current}")


def at_least(label: str, current: int, floor: int) -> None:
    if current < floor:
        raise AssertionError(f"coverage regression: {label} fell from floor {floor} to {current}")


def exactly(label: str, current: int, floor: int) -> None:
    if current != floor:
        raise AssertionError(f"coverage invariant: {label} expected {floor}, found {current}")


def global_concept_counts(assessment: dict) -> Counter:
    counts = Counter()
    for level in assessment.get("levels", {}).values():
        for concept, count in level.get("conceptCounts", {}).items():
            counts[concept] += int(count)
    return counts


def main() -> None:
    report = load(REPORT)
    floor = load(FLOOR)
    assessment = report["assessment"]
    curriculum = report["curriculum"]
    assessment_floor = floor["assessment"]
    curriculum_floor = floor["curriculum"]

    at_least("locked assessment identities", assessment["lockedIdentityCount"], assessment_floor["lockedIdentityCount"])
    at_least("technical assessment items", assessment["technicalItemCount"], assessment_floor["technicalItemCount"])
    at_least("regional safety items", assessment["regionalSafetyItemCount"], assessment_floor["regionalSafetyItemCount"])
    at_least(
        "technical items with explicit outcome metadata",
        assessment["technicalItemsWithExplicitOutcomeMetadata"],
        assessment_floor["technicalItemsWithExplicitOutcomeMetadata"],
    )
    at_most(
        "concept labels below three proxy items",
        len(assessment["conceptProxy"]["labelsBelowThreeItems"]),
        assessment_floor["conceptLabelsBelowThreeItems"],
    )
    concept_counts = global_concept_counts(assessment)
    labels_at_least_three = sum(count >= 3 for count in concept_counts.values())
    at_least(
        "concept labels with at least three proxy items",
        labels_at_least_three,
        assessment_floor["conceptLabelsAtLeastThreeItems"],
    )

    exactly("canonical lesson count", curriculum["totalLessons"], curriculum_floor["totalLessons"])
    if not curriculum.get("derivedRuntimeDepthLayerPresent"):
        raise AssertionError("coverage regression: derived runtime depth layer is no longer present")
    at_least(
        "lessons with all seven source-specific signals",
        curriculum["lessonsWithAllSevenLessonSpecificSignals"],
        curriculum_floor["lessonsWithAllSevenLessonSpecificSignals"],
    )
    zero_signal_lessons = int(curriculum["specificDimensionCountDistribution"].get("0", 0))
    at_most(
        "lessons with zero source-specific dimensions",
        zero_signal_lessons,
        curriculum_floor["lessonsWithZeroSpecificDimensions"],
    )
    for dimension in DIMENSIONS:
        at_least(
            f"{dimension} lesson-specific signals",
            curriculum["dimensionSummary"][dimension]["lessonSpecificSignal"],
            curriculum_floor["dimensionLessonSpecificSignal"][dimension],
        )

    print(
        "Assessment/curriculum coverage ratchet passed: existing quantified debt did not worsen; "
        "proxy breadth is monotonic at three-or-more items; human SME approval remains separate."
    )


if __name__ == "__main__":
    main()
