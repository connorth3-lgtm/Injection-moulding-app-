from __future__ import annotations

from collections import Counter
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
REPORT = ROOT / "assessment-curriculum-coverage-report.json"

LEVELS = ("Beginner", "Intermediate", "Advanced")
TARGET_MIN = 3
TARGET_MAX = 5
DIMENSIONS = (
    "mechanism",
    "diagnosticDecision",
    "measurement",
    "practicalAction",
    "misconceptionFailure",
    "evidence",
    "outcome",
)


def text(name: str) -> str:
    path = ROOT / name
    if not path.exists():
        raise AssertionError(f"coverage audit dependency missing: {name}")
    return path.read_text(encoding="utf-8")


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


def clean(value) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def flatten(values) -> list[str]:
    out: list[str] = []
    for value in values:
        if isinstance(value, list):
            out.extend(clean(x) for x in value if clean(x))
        elif clean(value):
            out.append(clean(value))
    return out


def outcome_values(row: dict, keys: tuple[str, ...]) -> list[str]:
    values: list[str] = []
    for key in keys:
        raw = row.get(key)
        if isinstance(raw, list):
            values.extend(clean(value) for value in raw if clean(value))
        elif clean(raw):
            values.append(clean(raw))
    return sorted(set(values))


def lines_for_dimension(lesson: dict, dimension: str) -> list[str]:
    objectives = flatten([lesson.get("objectives", [])])
    points = flatten([lesson.get("keypoints", [])])
    summary = flatten([lesson.get("summary"), lesson.get("intro")])
    exercise = flatten([lesson.get("exercise")])
    all_lines = summary + objectives + points + exercise

    patterns = {
        "measurement": re.compile(
            r"\b(measur|actual|evidence|verify|pressure|time|temperature|position|mass|dimension|"
            r"cycle|repeat|capab|sample|sensor|data|flow|velocity|speed|viscos|moisture|shrink)",
            re.I,
        ),
        "practicalAction": re.compile(
            r"\b(change|record|confirm|run|apply|set|check|compare|use|calculate|inspect|document|"
            r"control|adjust|capture|observe|test|verify|identify|write)\b",
            re.I,
        ),
        "misconceptionFailure": re.compile(
            r"\b(risk|mistake|avoid|failure|unsafe|bypass|random|trial|limit|wrong|trap|do not|not)\b",
            re.I,
        ),
        "evidence": re.compile(
            r"\b(evidence|measur|actual|verify|compare|record|sample|data|repeat|observe|check|test)\b",
            re.I,
        ),
    }

    if dimension == "mechanism":
        return summary + points[:2]
    if dimension == "diagnosticDecision":
        return exercise + objectives[:1]
    if dimension == "outcome":
        return objectives + exercise[:1]
    if dimension in patterns:
        return [line for line in all_lines if patterns[dimension].search(line)]
    raise AssertionError(f"unknown curriculum dimension: {dimension}")


def normalized_shape(lesson: dict, lines: list[str]) -> str:
    joined = " | ".join(lines).lower()
    for phrase in (lesson.get("title"), lesson.get("courseName"), lesson.get("level")):
        value = clean(phrase).lower()
        if value:
            joined = joined.replace(value, " <topic> ")
    joined = re.sub(r"\b\d+(?:\.\d+)?\b", " <n> ", joined)
    joined = re.sub(r"[^a-z<>|]+", " ", joined)
    return re.sub(r"\s+", " ", joined).strip()


def assessment_report() -> dict:
    source = text("assessment-quality-suite.js")
    identities = json_assignment(source, "const LOCKED_IDENTITIES=")
    if not isinstance(identities, list) or not identities:
        raise AssertionError("assessment identity lock is empty or invalid")

    technical = [row for row in identities if row.get("kind") == "technical"]
    regional = [row for row in identities if row.get("kind") == "regional"]
    if not technical:
        raise AssertionError("no locked technical assessment identities found")

    stable_ids = [clean(row.get("stableId")) for row in technical]
    if any(not stable_id for stable_id in stable_ids):
        raise AssertionError("technical assessment identity missing stableId")
    if len(set(stable_ids)) != len(stable_ids):
        raise AssertionError("technical assessment stableIds are not unique")

    by_level: dict[str, list[dict]] = {level: [] for level in LEVELS}
    for row in technical:
        level = row.get("level")
        if level in by_level:
            by_level[level].append(row)

    outcome_keys = ("outcome", "outcomes", "learningOutcome", "learningOutcomes")
    tagged = [row for row in technical if outcome_values(row, outcome_keys)]
    concept_counts = Counter(clean(row.get("concept")) or "<missing>" for row in technical)
    competency_counts = Counter()
    for row in technical:
        for competency in row.get("competencies") or [row.get("competency")]:
            if clean(competency):
                competency_counts[clean(competency)] += 1

    levels = {}
    for level, rows in by_level.items():
        concepts = Counter(clean(row.get("concept")) or "<missing>" for row in rows)
        levels[level] = {
            "technicalItems": len(rows),
            "uniqueConceptLabels": len(concepts),
            "conceptLabelsWithOneItem": sum(1 for count in concepts.values() if count == 1),
            "conceptLabelsWithTwoItems": sum(1 for count in concepts.values() if count == 2),
            "conceptLabelsWithThreeToFiveItems": sum(TARGET_MIN <= count <= TARGET_MAX for count in concepts.values()),
            "conceptLabelsOverFiveItems": sum(count > TARGET_MAX for count in concepts.values()),
            "conceptCounts": dict(sorted(concepts.items())),
        }

    proxy_sparse = {name: count for name, count in sorted(concept_counts.items()) if count < TARGET_MIN}
    proxy_target = {name: count for name, count in sorted(concept_counts.items()) if TARGET_MIN <= count <= TARGET_MAX}

    outcome_ready = len(tagged) == len(technical)
    status = "MEASURABLE" if outcome_ready else "HOLD_OUTCOME_MAP_REQUIRED"
    if outcome_ready:
        outcome_counts = Counter()
        for row in technical:
            for value in outcome_values(row, outcome_keys):
                outcome_counts[value] += 1
        if any(count < TARGET_MIN for count in outcome_counts.values()):
            status = "HOLD_BREADTH_BELOW_TARGET"
    else:
        outcome_counts = Counter()

    level_order = {level: index for index, level in enumerate(LEVELS)}
    mapping_queue = []
    for row in sorted(technical, key=lambda item: (level_order.get(item.get("level"), 99), clean(item.get("stableId")))):
        outcomes = outcome_values(row, outcome_keys)
        competencies = sorted(
            {clean(value) for value in (row.get("competencies") or [row.get("competency")]) if clean(value)}
        )
        mapping_queue.append(
            {
                "stableId": clean(row.get("stableId")),
                "level": clean(row.get("level")),
                "difficulty": clean(row.get("difficulty")),
                "conceptProxy": clean(row.get("concept")) or "<missing>",
                "competencies": competencies,
                "reviewedRevision": row.get("reviewedRevision"),
                "currentOutcomeIds": outcomes,
                "mappingStatus": "mapped-pending-sme-review" if outcomes else "pending-sme-mapping",
            }
        )

    return {
        "status": status,
        "governanceNote": (
            "The 3–5 independent-item target applies to important learning outcomes. Concept labels are reported only as a proxy; "
            "they must not be treated as outcome coverage until explicit outcome metadata exists and has been reviewed."
        ),
        "targetIndependentItemsPerImportantOutcome": {"minimum": TARGET_MIN, "maximum": TARGET_MAX},
        "lockedIdentityCount": len(identities),
        "technicalItemCount": len(technical),
        "regionalSafetyItemCount": len(regional),
        "technicalItemsWithExplicitOutcomeMetadata": len(tagged),
        "technicalItemsMissingExplicitOutcomeMetadata": len(technical) - len(tagged),
        "levels": levels,
        "competencyMembershipCounts": dict(sorted(competency_counts.items())),
        "conceptProxy": {
            "uniqueConceptLabels": len(concept_counts),
            "labelsBelowThreeItems": proxy_sparse,
            "labelsAtThreeToFiveItems": proxy_target,
        },
        "explicitOutcomeCounts": dict(sorted(outcome_counts.items())),
        "outcomeMappingQueuePendingCount": sum(row["mappingStatus"] == "pending-sme-mapping" for row in mapping_queue),
        "outcomeMappingQueue": mapping_queue,
    }


def curriculum_report() -> dict:
    core = text("MouldMaster_Core_App.html")
    data = json_assignment(core, "window.MM_DATA = ")
    lessons = data.get("lessons") if isinstance(data, dict) else None
    if not isinstance(lessons, list) or len(lessons) != 120:
        raise AssertionError(f"expected 120 canonical lessons, found {len(lessons or [])}")

    source_rows: dict[str, dict[int, dict]] = {dimension: {} for dimension in DIMENSIONS}
    shape_counts: dict[str, Counter] = {dimension: Counter() for dimension in DIMENSIONS}
    for lesson in lessons:
        lesson_id = int(lesson["id"])
        for dimension in DIMENSIONS:
            lines = lines_for_dimension(lesson, dimension)
            shape = normalized_shape(lesson, lines)
            source_rows[dimension][lesson_id] = {"lines": lines, "shape": shape}
            if shape:
                shape_counts[dimension][shape] += 1

    dimension_summary = {}
    per_lesson = []
    for lesson in lessons:
        lesson_id = int(lesson["id"])
        row = {
            "id": lesson_id,
            "course": lesson.get("courseName"),
            "title": lesson.get("title"),
            "dimensions": {},
        }
        for dimension in DIMENSIONS:
            record = source_rows[dimension][lesson_id]
            shape = record["shape"]
            token_count = len(re.findall(r"[a-z]+", shape))
            cluster = shape_counts[dimension].get(shape, 0) if shape else 0
            if not shape:
                signal = "missing"
            elif token_count < 8 or cluster > 3:
                signal = "generic-or-reused"
            else:
                signal = "lesson-specific-signal"
            row["dimensions"][dimension] = {
                "signal": signal,
                "templateClusterSize": cluster,
                "sourceLineCount": len(record["lines"]),
            }
        per_lesson.append(row)

    for dimension in DIMENSIONS:
        counts = Counter(row["dimensions"][dimension]["signal"] for row in per_lesson)
        clusters = sorted(shape_counts[dimension].values(), reverse=True)
        generic_ids = [
            row["id"] for row in per_lesson
            if row["dimensions"][dimension]["signal"] != "lesson-specific-signal"
        ]
        dimension_summary[dimension] = {
            "lessonSpecificSignal": counts.get("lesson-specific-signal", 0),
            "genericOrReused": counts.get("generic-or-reused", 0),
            "missing": counts.get("missing", 0),
            "largestNormalizedTemplateCluster": clusters[0] if clusters else 0,
            "sampleLessonsNeedingReview": generic_ids[:12],
        }

    fully_specific = [
        row["id"] for row in per_lesson
        if all(row["dimensions"][dimension]["signal"] == "lesson-specific-signal" for dimension in DIMENSIONS)
    ]
    specificity_counts = Counter(
        sum(row["dimensions"][dimension]["signal"] == "lesson-specific-signal" for dimension in DIMENSIONS)
        for row in per_lesson
    )

    review_queue = []
    for row in per_lesson:
        dimensions_needing_review = [
            dimension for dimension in DIMENSIONS
            if row["dimensions"][dimension]["signal"] != "lesson-specific-signal"
        ]
        specific_count = len(DIMENSIONS) - len(dimensions_needing_review)
        review_queue.append(
            {
                "id": row["id"],
                "course": row["course"],
                "title": row["title"],
                "lessonSpecificDimensionCount": specific_count,
                "dimensionsNeedingReview": dimensions_needing_review,
                "reviewStatus": "pending-sme-semantic-review",
            }
        )
    review_queue.sort(key=lambda row: (row["lessonSpecificDimensionCount"], row["id"]))

    derived = text("lesson-deep-authoring-v2.js")
    derived_layer_present = all(
        marker in derived
        for marker in ("mechanism", "evidence", "decision", "misconception", "teachBack")
    )

    return {
        "status": "HOLD_HUMAN_SME_SEMANTIC_REVIEW",
        "totalLessons": len(lessons),
        "requiredSemanticDimensions": list(DIMENSIONS),
        "dimensionSummary": dimension_summary,
        "lessonsWithAllSevenLessonSpecificSignals": len(fully_specific),
        "fullySpecificLessonIds": fully_specific,
        "specificDimensionCountDistribution": {
            str(key): value for key, value in sorted(specificity_counts.items())
        },
        "derivedRuntimeDepthLayerPresent": derived_layer_present,
        "governanceNote": (
            "This is an automated source-specificity heuristic, not an SME judgement. The runtime deep-authoring layer can derive "
            "mechanism/evidence/decision/misconception/teach-back records, but derived uniqueness is not counted as independent SME semantic sign-off."
        ),
        "lessonReviewQueuePendingCount": len(review_queue),
        "lessonReviewQueue": review_queue,
        "lessonSignals": per_lesson,
    }


def main() -> None:
    assessment = assessment_report()
    curriculum = curriculum_report()
    report = {
        "schemaVersion": 1,
        "audit": "assessment-curriculum-coverage",
        "assessment": assessment,
        "curriculum": curriculum,
        "humanValidation": {
            "assessmentOutcomeMapping": "HOLD",
            "curriculumSmeSemanticReview": "HOLD",
            "note": "Automated evidence must not be promoted to human SME approval.",
        },
    }
    REPORT.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print(
        "Assessment breadth:",
        f"{assessment['technicalItemCount']} technical items;",
        f"{assessment['technicalItemsWithExplicitOutcomeMetadata']} with explicit outcome metadata;",
        f"{assessment['outcomeMappingQueuePendingCount']} pending SME mapping;",
        f"status={assessment['status']}",
    )
    print(
        "Curriculum semantic source-specificity:",
        f"{curriculum['lessonsWithAllSevenLessonSpecificSignals']}/120 lessons signal all seven dimensions;",
        f"{curriculum['lessonReviewQueuePendingCount']} pending SME review;",
        f"status={curriculum['status']}",
    )
    for dimension in DIMENSIONS:
        row = curriculum["dimensionSummary"][dimension]
        print(
            f"  {dimension}: specific={row['lessonSpecificSignal']} "
            f"generic/reused={row['genericOrReused']} missing={row['missing']} "
            f"largest-template-cluster={row['largestNormalizedTemplateCluster']}"
        )
    print(f"Coverage report written: {REPORT.name}")


if __name__ == "__main__":
    main()
