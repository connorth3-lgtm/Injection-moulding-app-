from __future__ import annotations

from collections import Counter
from copy import deepcopy
from pathlib import Path
import argparse
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
        raise AssertionError(f"coverage ratchet dependency missing: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def at_most(label: str, current: int, previous: int) -> None:
    if current > previous:
        raise AssertionError(f"coverage regression: {label} increased from {previous} to {current}")


def at_least(label: str, current: int, previous: int) -> None:
    if current < previous:
        raise AssertionError(f"coverage regression: {label} fell from {previous} to {current}")


def exactly(label: str, current: int, expected: int) -> None:
    if current != expected:
        raise AssertionError(
            f"coverage floor is stale or mismatched: {label} expected reviewed floor {expected}, found {current}. "
            "Update the floor deliberately when reviewed coverage changes."
        )


def global_concept_counts(assessment: dict) -> Counter:
    counts = Counter()
    for level in assessment.get("levels", {}).values():
        for concept, count in level.get("conceptCounts", {}).items():
            counts[concept] += int(count)
    return counts


def measured_snapshot(report: dict) -> dict:
    assessment = report["assessment"]
    curriculum = report["curriculum"]
    concept_counts = global_concept_counts(assessment)
    return {
        "assessment": {
            "lockedIdentityCount": int(assessment["lockedIdentityCount"]),
            "technicalItemCount": int(assessment["technicalItemCount"]),
            "regionalSafetyItemCount": int(assessment["regionalSafetyItemCount"]),
            "technicalItemsWithExplicitOutcomeMetadata": int(
                assessment["technicalItemsWithExplicitOutcomeMetadata"]
            ),
            "conceptLabelsBelowThreeItems": len(assessment["conceptProxy"]["labelsBelowThreeItems"]),
            "conceptLabelsAtLeastThreeItems": sum(count >= 3 for count in concept_counts.values()),
        },
        "curriculum": {
            "totalLessons": int(curriculum["totalLessons"]),
            "lessonsWithAllSevenLessonSpecificSignals": int(
                curriculum["lessonsWithAllSevenLessonSpecificSignals"]
            ),
            "dimensionLessonSpecificSignal": {
                dimension: int(curriculum["dimensionSummary"][dimension]["lessonSpecificSignal"])
                for dimension in DIMENSIONS
            },
            "lessonsWithZeroSpecificDimensions": int(
                curriculum["specificDimensionCountDistribution"].get("0", 0)
            ),
        },
    }


def require_floor_matches_measurement(snapshot: dict, floor: dict) -> None:
    measured_assessment = snapshot["assessment"]
    floor_assessment = floor["assessment"]
    for key in (
        "lockedIdentityCount",
        "technicalItemCount",
        "regionalSafetyItemCount",
        "technicalItemsWithExplicitOutcomeMetadata",
        "conceptLabelsBelowThreeItems",
        "conceptLabelsAtLeastThreeItems",
    ):
        exactly(f"assessment.{key}", measured_assessment[key], int(floor_assessment[key]))

    measured_curriculum = snapshot["curriculum"]
    floor_curriculum = floor["curriculum"]
    exactly("curriculum.totalLessons", measured_curriculum["totalLessons"], int(floor_curriculum["totalLessons"]))
    exactly(
        "curriculum.lessonsWithAllSevenLessonSpecificSignals",
        measured_curriculum["lessonsWithAllSevenLessonSpecificSignals"],
        int(floor_curriculum["lessonsWithAllSevenLessonSpecificSignals"]),
    )
    exactly(
        "curriculum.lessonsWithZeroSpecificDimensions",
        measured_curriculum["lessonsWithZeroSpecificDimensions"],
        int(floor_curriculum["lessonsWithZeroSpecificDimensions"]),
    )
    for dimension in DIMENSIONS:
        exactly(
            f"curriculum.dimensionLessonSpecificSignal.{dimension}",
            measured_curriculum["dimensionLessonSpecificSignal"][dimension],
            int(floor_curriculum["dimensionLessonSpecificSignal"][dimension]),
        )


def require_monotonic_floor(candidate: dict, previous: dict) -> None:
    current_assessment = candidate["assessment"]
    previous_assessment = previous["assessment"]
    for key in (
        "lockedIdentityCount",
        "technicalItemCount",
        "regionalSafetyItemCount",
        "technicalItemsWithExplicitOutcomeMetadata",
        "conceptLabelsAtLeastThreeItems",
    ):
        at_least(f"reviewed floor assessment.{key}", int(current_assessment[key]), int(previous_assessment[key]))
    at_most(
        "reviewed floor assessment.conceptLabelsBelowThreeItems",
        int(current_assessment["conceptLabelsBelowThreeItems"]),
        int(previous_assessment["conceptLabelsBelowThreeItems"]),
    )

    current_curriculum = candidate["curriculum"]
    previous_curriculum = previous["curriculum"]
    exactly(
        "reviewed floor curriculum.totalLessons",
        int(current_curriculum["totalLessons"]),
        int(previous_curriculum["totalLessons"]),
    )
    at_least(
        "reviewed floor curriculum.lessonsWithAllSevenLessonSpecificSignals",
        int(current_curriculum["lessonsWithAllSevenLessonSpecificSignals"]),
        int(previous_curriculum["lessonsWithAllSevenLessonSpecificSignals"]),
    )
    at_most(
        "reviewed floor curriculum.lessonsWithZeroSpecificDimensions",
        int(current_curriculum["lessonsWithZeroSpecificDimensions"]),
        int(previous_curriculum["lessonsWithZeroSpecificDimensions"]),
    )
    for dimension in DIMENSIONS:
        at_least(
            f"reviewed floor curriculum.dimensionLessonSpecificSignal.{dimension}",
            int(current_curriculum["dimensionLessonSpecificSignal"][dimension]),
            int(previous_curriculum["dimensionLessonSpecificSignal"][dimension]),
        )


def expect_failure(label: str, fn) -> None:
    try:
        fn()
    except AssertionError:
        return
    raise AssertionError(f"ratchet self-test expected failure: {label}")


def self_test() -> None:
    baseline = load(FLOOR)
    require_monotonic_floor(deepcopy(baseline), baseline)

    improved = deepcopy(baseline)
    improved["assessment"]["technicalItemsWithExplicitOutcomeMetadata"] += 1
    improved["assessment"]["conceptLabelsBelowThreeItems"] -= 1
    improved["assessment"]["conceptLabelsAtLeastThreeItems"] += 1
    improved["curriculum"]["lessonsWithAllSevenLessonSpecificSignals"] += 1
    improved["curriculum"]["lessonsWithZeroSpecificDimensions"] -= 1
    improved["curriculum"]["dimensionLessonSpecificSignal"]["diagnosticDecision"] += 1
    improved["curriculum"]["dimensionLessonSpecificSignal"]["outcome"] += 1
    require_monotonic_floor(improved, baseline)

    regressed = deepcopy(baseline)
    regressed["curriculum"]["dimensionLessonSpecificSignal"]["mechanism"] -= 1
    expect_failure("decreasing a semantic signal", lambda: require_monotonic_floor(regressed, baseline))

    sparse_regression = deepcopy(baseline)
    sparse_regression["assessment"]["conceptLabelsBelowThreeItems"] += 1
    expect_failure("increasing sparse concept labels", lambda: require_monotonic_floor(sparse_regression, baseline))

    stale_floor = deepcopy(baseline)
    stale_floor["assessment"]["technicalItemCount"] += 1
    expect_failure("stale measured-to-floor snapshot", lambda: require_floor_matches_measurement(baseline, stale_floor))

    print(
        "Assessment/curriculum ratchet self-test passed: equal and improved floors pass; "
        "semantic regression, sparse-concept regression, and stale floors fail closed."
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Enforce reviewed assessment/curriculum coverage debt ratchet")
    parser.add_argument(
        "--base-floor",
        type=Path,
        default=None,
        help="Optional previous reviewed floor from the pull request base branch.",
    )
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Exercise equal, improving, stale and regressing floor contracts without repository changes.",
    )
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return

    report = load(REPORT)
    floor = load(FLOOR)
    if not report["curriculum"].get("derivedRuntimeDepthLayerPresent"):
        raise AssertionError("coverage regression: derived runtime depth layer is no longer present")

    snapshot = measured_snapshot(report)
    require_floor_matches_measurement(snapshot, floor)

    if args.base_floor and args.base_floor.exists():
        previous = load(args.base_floor)
        require_monotonic_floor(floor, previous)
        comparison = " and candidate floor advances monotonically from the base branch"
    else:
        comparison = " (bootstrap floor; no base floor was available)"

    print(
        "Assessment/curriculum coverage ratchet passed: measured coverage matches the reviewed floor"
        f"{comparison}; human SME approval remains separate."
    )


if __name__ == "__main__":
    main()
