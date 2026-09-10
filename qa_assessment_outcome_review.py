from __future__ import annotations

from collections import Counter
from copy import deepcopy
from datetime import date
from pathlib import Path
import argparse
import json
import re

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "qa" / "assessment-outcome-review.json"
REPORT = ROOT / "assessment-outcome-review-report.json"

TARGET_MIN = 3
TARGET_MAX = 5
ALLOWED_REVIEW_STATES = {"pending", "approved"}
OUTCOME_ID_RE = re.compile(r"^[a-z0-9][a-z0-9._-]{1,63}$")


def clean(value) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def text(path: Path) -> str:
    if not path.exists():
        raise AssertionError(f"assessment outcome-review dependency missing: {path.relative_to(ROOT)}")
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


def technical_identities() -> list[dict]:
    source = text(ROOT / "assessment-quality-suite.js")
    identities = json_assignment(source, "const LOCKED_IDENTITIES=")
    if not isinstance(identities, list):
        raise AssertionError("assessment identity lock must be a list")
    technical = [row for row in identities if row.get("kind") == "technical"]
    if not technical:
        raise AssertionError("no technical assessment identities found")
    stable_ids = [clean(row.get("stableId")) for row in technical]
    if any(not stable_id for stable_id in stable_ids):
        raise AssertionError("technical assessment identity missing stableId")
    if len(stable_ids) != len(set(stable_ids)):
        raise AssertionError("technical assessment stableIds are not unique")
    for row in technical:
        revision = row.get("reviewedRevision")
        if not isinstance(revision, int) or revision < 1:
            raise AssertionError(f"{clean(row.get('stableId'))}: invalid reviewedRevision")
    return sorted(technical, key=lambda row: clean(row.get("stableId")))


def require_unique_strings(label: str, values) -> list[str]:
    if not isinstance(values, list):
        raise AssertionError(f"{label} must be a list")
    cleaned = [clean(value) for value in values]
    if any(not value for value in cleaned):
        raise AssertionError(f"{label} contains an empty value")
    if len(cleaned) != len(set(cleaned)):
        raise AssertionError(f"{label} contains duplicates")
    return cleaned


def validate_contract(contract: dict, technical: list[dict]) -> dict:
    if contract.get("schemaVersion") != 1:
        raise AssertionError("assessment outcome-review contract schemaVersion must be 1")

    outcomes = contract.get("outcomes")
    mappings = contract.get("mappings")
    if not isinstance(outcomes, list):
        raise AssertionError("assessment outcome-review outcomes must be a list")
    if not isinstance(mappings, list):
        raise AssertionError("assessment outcome-review mappings must be a list")

    current_by_id = {clean(row.get("stableId")): row for row in technical}
    expected_ids = set(current_by_id)
    mapping_ids = [clean(row.get("stableId")) for row in mappings if isinstance(row, dict)]
    if len(mapping_ids) != len(mappings):
        raise AssertionError("every assessment outcome mapping must be an object with stableId")
    duplicates = sorted(stable_id for stable_id, count in Counter(mapping_ids).items() if count > 1)
    if duplicates:
        raise AssertionError(f"duplicate assessment outcome mappings: {duplicates}")
    actual_ids = set(mapping_ids)
    missing = sorted(expected_ids - actual_ids)
    unknown = sorted(actual_ids - expected_ids)
    if missing or unknown:
        raise AssertionError(f"outcome-review stableId set mismatch: missing={missing} unknown={unknown}")

    outcome_by_id: dict[str, dict] = {}
    approved_outcomes: dict[str, dict] = {}
    approved_important: dict[str, dict] = {}
    for index, row in enumerate(outcomes):
        if not isinstance(row, dict):
            raise AssertionError(f"outcomes[{index}] must be an object")
        outcome_id = clean(row.get("outcomeId"))
        if not OUTCOME_ID_RE.fullmatch(outcome_id):
            raise AssertionError(f"outcomes[{index}].outcomeId must match {OUTCOME_ID_RE.pattern}")
        if outcome_id in outcome_by_id:
            raise AssertionError(f"duplicate outcomeId: {outcome_id}")
        state = clean(row.get("reviewStatus"))
        if state not in ALLOWED_REVIEW_STATES:
            raise AssertionError(f"{outcome_id}: reviewStatus must be pending or approved")
        title = clean(row.get("title"))
        if not title:
            raise AssertionError(f"{outcome_id}: title is required")
        important = row.get("important")
        if important not in (True, False, None):
            raise AssertionError(f"{outcome_id}: important must be true, false or null")
        if state == "approved":
            if not isinstance(important, bool):
                raise AssertionError(f"{outcome_id}: approved outcome must declare important=true/false")
            if not clean(row.get("reviewedBy")):
                raise AssertionError(f"{outcome_id}: approved outcome requires reviewedBy")
            if not valid_iso_date(row.get("reviewedAt")):
                raise AssertionError(f"{outcome_id}: approved outcome requires ISO reviewedAt")
            approved_outcomes[outcome_id] = row
            if important:
                approved_important[outcome_id] = row
        outcome_by_id[outcome_id] = row

    approved_mappings: list[dict] = []
    pending_mappings: list[dict] = []
    for row in mappings:
        stable_id = clean(row.get("stableId"))
        state = clean(row.get("reviewStatus"))
        if state not in ALLOWED_REVIEW_STATES:
            raise AssertionError(f"{stable_id}: reviewStatus must be pending or approved")

        proposed_ids = require_unique_strings(f"{stable_id}.proposedOutcomeIds", row.get("proposedOutcomeIds", []))
        outcome_ids = require_unique_strings(f"{stable_id}.outcomeIds", row.get("outcomeIds", []))
        for proposed_id in proposed_ids:
            if proposed_id not in outcome_by_id:
                raise AssertionError(f"{stable_id}: proposed outcome {proposed_id} is not defined")

        if state == "pending":
            if outcome_ids:
                raise AssertionError(
                    f"{stable_id}: pending mapping cannot populate counted outcomeIds; use proposedOutcomeIds until approved"
                )
            if row.get("reviewedItemRevision") is not None:
                raise AssertionError(f"{stable_id}: pending mapping reviewedItemRevision must be null")
            if row.get("independenceReviewed") not in (False, None):
                raise AssertionError(f"{stable_id}: pending mapping cannot claim independence review")
            if clean(row.get("independenceRationale")):
                raise AssertionError(f"{stable_id}: pending mapping cannot claim an independence rationale")
            if clean(row.get("reviewedBy")) or clean(row.get("reviewedAt")):
                raise AssertionError(f"{stable_id}: pending mapping cannot claim reviewer approval metadata")
            pending_mappings.append(row)
            continue

        if proposed_ids:
            raise AssertionError(f"{stable_id}: approved mapping must clear proposedOutcomeIds")
        if not outcome_ids:
            raise AssertionError(f"{stable_id}: approved mapping requires at least one outcomeId")
        for outcome_id in outcome_ids:
            if outcome_id not in approved_outcomes:
                raise AssertionError(f"{stable_id}: approved mapping references unapproved outcome {outcome_id}")

        current_revision = current_by_id[stable_id]["reviewedRevision"]
        if row.get("reviewedItemRevision") != current_revision:
            raise AssertionError(
                f"{stable_id}: approved mapping reviewedItemRevision={row.get('reviewedItemRevision')} "
                f"does not match current reviewedRevision={current_revision}; SME re-review is required"
            )
        if row.get("independenceReviewed") is not True:
            raise AssertionError(f"{stable_id}: approved mapping requires independenceReviewed=true")
        if not clean(row.get("independenceRationale")):
            raise AssertionError(f"{stable_id}: approved mapping requires independenceRationale")
        if not clean(row.get("reviewedBy")):
            raise AssertionError(f"{stable_id}: approved mapping requires reviewedBy")
        if not valid_iso_date(row.get("reviewedAt")):
            raise AssertionError(f"{stable_id}: approved mapping requires ISO reviewedAt")
        approved_mappings.append(row)

    important_counts = Counter()
    important_items: dict[str, list[str]] = {outcome_id: [] for outcome_id in approved_important}
    for row in approved_mappings:
        stable_id = clean(row.get("stableId"))
        for outcome_id in require_unique_strings(f"{stable_id}.outcomeIds", row.get("outcomeIds", [])):
            if outcome_id in approved_important:
                important_counts[outcome_id] += 1
                important_items[outcome_id].append(stable_id)

    coverage = {}
    below_min = []
    within_target = []
    above_recommended = []
    for outcome_id in sorted(approved_important):
        count = int(important_counts[outcome_id])
        if count < TARGET_MIN:
            range_status = "below-minimum"
            below_min.append(outcome_id)
        elif count <= TARGET_MAX:
            range_status = "within-recommended-range"
            within_target.append(outcome_id)
        else:
            range_status = "above-recommended-maximum"
            above_recommended.append(outcome_id)
        coverage[outcome_id] = {
            "title": clean(approved_important[outcome_id].get("title")),
            "independenceReviewedItemCount": count,
            "stableIds": sorted(important_items[outcome_id]),
            "rangeStatus": range_status,
        }

    if not approved_important or pending_mappings:
        status = "HOLD_OUTCOME_MAP_REQUIRED"
    elif below_min:
        status = "HOLD_BREADTH_BELOW_TARGET"
    else:
        status = "MEASURABLE_HUMAN_REVIEWED_MINIMUM_MET"

    return {
        "status": status,
        "technicalItemCount": len(technical),
        "mappingContractCount": len(mappings),
        "approvedOutcomeDefinitionCount": len(approved_outcomes),
        "approvedImportantOutcomeDefinitionCount": len(approved_important),
        "approvedItemMappingCount": len(approved_mappings),
        "pendingItemMappingCount": len(pending_mappings),
        "importantOutcomeCoverage": coverage,
        "importantOutcomesBelowMinimum": below_min,
        "importantOutcomesWithinRecommendedRange": within_target,
        "importantOutcomesAboveRecommendedMaximum": above_recommended,
        "targetIndependentItemsPerImportantOutcome": {
            "minimum": TARGET_MIN,
            "recommendedMaximum": TARGET_MAX,
        },
        "governanceNote": (
            "Only human-approved mappings tied to the current locked question revision and accompanied by an explicit "
            "independence review are counted. Proposed or pending mappings never count. Meeting the numeric minimum is "
            "not psychometric validation, SME curriculum approval, accreditation, or production authority."
        ),
    }


def expect_failure(label: str, fn) -> None:
    try:
        fn()
    except AssertionError:
        return
    raise AssertionError(f"assessment outcome-review self-test expected failure: {label}")


def self_test() -> None:
    technical = [
        {"stableId": "tech:test:0", "reviewedRevision": 2},
        {"stableId": "tech:test:1", "reviewedRevision": 1},
        {"stableId": "tech:test:2", "reviewedRevision": 3},
    ]
    mapping_template = lambda stable_id: {
        "stableId": stable_id,
        "reviewStatus": "pending",
        "proposedOutcomeIds": [],
        "outcomeIds": [],
        "reviewedItemRevision": None,
        "independenceReviewed": False,
        "independenceRationale": None,
        "reviewedBy": None,
        "reviewedAt": None,
        "notes": None,
    }
    baseline = {
        "schemaVersion": 1,
        "outcomes": [],
        "mappings": [mapping_template(row["stableId"]) for row in technical],
    }
    summary = validate_contract(deepcopy(baseline), technical)
    if summary["status"] != "HOLD_OUTCOME_MAP_REQUIRED" or summary["pendingItemMappingCount"] != 3:
        raise AssertionError("pending review contract must remain HOLD with every item pending")

    approved = deepcopy(baseline)
    approved["outcomes"] = [{
        "outcomeId": "test-outcome",
        "title": "Test reviewed outcome",
        "important": True,
        "reviewStatus": "approved",
        "reviewedBy": "test-reviewer",
        "reviewedAt": "2026-09-10",
        "notes": "self-test only",
    }]
    revision_by_id = {row["stableId"]: row["reviewedRevision"] for row in technical}
    for row in approved["mappings"]:
        row.update({
            "reviewStatus": "approved",
            "outcomeIds": ["test-outcome"],
            "reviewedItemRevision": revision_by_id[row["stableId"]],
            "independenceReviewed": True,
            "independenceRationale": "Self-test asserts a separately reviewed item path.",
            "reviewedBy": "test-reviewer",
            "reviewedAt": "2026-09-10",
        })
    summary = validate_contract(deepcopy(approved), technical)
    if summary["status"] != "MEASURABLE_HUMAN_REVIEWED_MINIMUM_MET":
        raise AssertionError("three approved independent items for one important outcome should meet the minimum")

    unknown = deepcopy(baseline)
    unknown["mappings"][0]["stableId"] = "tech:unknown:0"
    expect_failure("unknown stableId", lambda: validate_contract(unknown, technical))

    stale = deepcopy(approved)
    stale["mappings"][0]["reviewedItemRevision"] = 999
    expect_failure("stale question revision", lambda: validate_contract(stale, technical))

    missing_rationale = deepcopy(approved)
    missing_rationale["mappings"][0]["independenceRationale"] = None
    expect_failure("missing independence rationale", lambda: validate_contract(missing_rationale, technical))

    unapproved_reference = deepcopy(approved)
    unapproved_reference["outcomes"][0]["reviewStatus"] = "pending"
    unapproved_reference["outcomes"][0]["reviewedBy"] = None
    unapproved_reference["outcomes"][0]["reviewedAt"] = None
    expect_failure(
        "approved mapping to unapproved outcome",
        lambda: validate_contract(unapproved_reference, technical),
    )

    counted_while_pending = deepcopy(baseline)
    counted_while_pending["outcomes"] = deepcopy(approved["outcomes"])
    counted_while_pending["mappings"][0]["outcomeIds"] = ["test-outcome"]
    expect_failure(
        "pending mapping populates counted outcomeIds",
        lambda: validate_contract(counted_while_pending, technical),
    )

    print(
        "Assessment outcome-review contract self-test passed: pending content stays HOLD; approved current-revision "
        "independent mappings can count; unknown IDs, stale revisions, unapproved outcomes and premature counting fail closed."
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate human-reviewed technical assessment outcome mappings")
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Exercise fail-closed review-contract behavior without changing repository review state.",
    )
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return

    technical = technical_identities()
    contract = load_json(CONTRACT)
    summary = validate_contract(contract, technical)
    result = {
        "schemaVersion": 1,
        "audit": "assessment-outcome-review",
        **summary,
    }
    REPORT.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(
        "Assessment outcome review:",
        f"{result['approvedItemMappingCount']}/{result['technicalItemCount']} approved current-revision mappings;",
        f"{result['approvedImportantOutcomeDefinitionCount']} approved important outcomes;",
        f"status={result['status']}",
    )
    print(f"Outcome review report written: {REPORT.name}")


if __name__ == "__main__":
    main()
