from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
STAGING = ROOT / "data" / "materials" / "staging"
CATALOG = ROOT / "material-catalog-v1.json"


def load_json(path: Path) -> Any:
    def no_dupes(pairs):
        out = {}
        for key, value in pairs:
            if key in out:
                raise ValueError(f"duplicate JSON key {key!r} in {path}")
            out[key] = value
        return out

    return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=no_dupes)


def need(ok: bool, message: str, errors: list[str]) -> None:
    if not ok:
        errors.append(message)


def is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def normalize_property(name: str) -> str:
    return "_".join(str(name or "").strip().lower().replace("/", " ").replace("-", " ").split())


def clean_text(value: Any) -> str:
    return " ".join(str(value or "").strip().lower().split())


def identity_payload(grade: dict[str, Any]) -> dict[str, Any]:
    identity = grade.get("identity") or {}
    production = grade.get("production") or {}
    lifecycle = grade.get("lifecycle") or {}
    composition = grade.get("composition") or {}
    source_revisions = sorted(
        {
            clean_text(source.get("revision") or source.get("documentDate"))
            for source in grade.get("sources") or []
            if source.get("kind") in {"manufacturer-datasheet", "manufacturer-processing-guide"}
            and clean_text(source.get("revision") or source.get("documentDate"))
        }
    )
    return {
        "variantId": clean_text(identity.get("variantId")),
        "regionalVariant": clean_text(identity.get("regionalVariant")),
        "formulationRevision": clean_text(identity.get("formulationRevision")),
        "productionCountry": clean_text(production.get("country")),
        "productionPlant": clean_text(production.get("plant")),
        "productionRegion": clean_text(production.get("region")),
        "regions": sorted(clean_text(x) for x in lifecycle.get("regions") or [] if clean_text(x)),
        "composition": composition,
        "sourceRevisions": source_revisions,
    }


def material_identity_key(manufacturer_id: str, grade: dict[str, Any]) -> tuple[str, str, str, str]:
    variant = json.dumps(identity_payload(grade), sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return (
        clean_text(manufacturer_id),
        clean_text(grade.get("brand")),
        clean_text(grade.get("grade")),
        variant,
    )


def validate_grade(grade: dict[str, Any], context: str = "grade") -> list[str]:
    errors: list[str] = []
    need(grade.get("schemaVersion") == 1, f"{context}: schemaVersion must be 1", errors)
    need(str(grade.get("id", "")).startswith("mat-"), f"{context}: id must start mat-", errors)
    manufacturer = grade.get("manufacturer") or {}
    need(str(manufacturer.get("id", "")).startswith("mfr-"), f"{context}: manufacturer.id must start mfr-", errors)
    need(bool(str(manufacturer.get("name", "")).strip()), f"{context}: manufacturer.name required", errors)
    need(bool(str(grade.get("grade", "")).strip()), f"{context}: exact commercial grade required", errors)
    need(bool(str((grade.get("polymer") or {}).get("family", "")).strip()), f"{context}: polymer.family required", errors)

    identity = grade.get("identity") or {}
    for field in ("variantId", "regionalVariant", "formulationRevision"):
        value = identity.get(field)
        need(value is None or isinstance(value, str), f"{context}: identity.{field} must be string/null", errors)
    production = grade.get("production") or {}
    for field in ("country", "plant", "region"):
        value = production.get(field)
        need(value is None or isinstance(value, str), f"{context}: production.{field} must be string/null", errors)

    sources = grade.get("sources") or []
    need(bool(sources), f"{context}: at least one source document required", errors)
    source_ids: set[str] = set()
    for i, source in enumerate(sources):
        sid = str(source.get("id", ""))
        need(sid.startswith("src-"), f"{context}: source[{i}] id must start src-", errors)
        need(sid not in source_ids, f"{context}: duplicate source id {sid}", errors)
        source_ids.add(sid)
        need(bool(str(source.get("publisher", "")).strip()), f"{context}: source {sid} publisher required", errors)
        need(bool(str(source.get("title", "")).strip()), f"{context}: source {sid} title required", errors)
        need(str(source.get("url", "")).startswith(("https://", "http://")), f"{context}: source {sid} URL required", errors)
        need(bool(str(source.get("retrievedAt", "")).strip()), f"{context}: source {sid} retrievedAt required", errors)

    observation_ids: set[str] = set()
    for i, obs in enumerate(grade.get("properties") or []):
        oid = str(obs.get("id", ""))
        prop = normalize_property(obs.get("property", ""))
        need(oid.startswith("obs-"), f"{context}: property[{i}] id must start obs-", errors)
        need(oid not in observation_ids, f"{context}: duplicate observation id {oid}", errors)
        observation_ids.add(oid)
        need(bool(prop), f"{context}: property {oid} name required", errors)
        need("value" in obs, f"{context}: property {oid} value required", errors)
        need(bool(str(obs.get("unit", "")).strip()), f"{context}: property {oid} unit required", errors)
        need(str(obs.get("sourceId", "")) in source_ids, f"{context}: property {oid} references unknown sourceId", errors)
        need(isinstance(obs.get("comparisonReady"), bool), f"{context}: property {oid} comparisonReady must be boolean", errors)

        if prop in {"mfr", "mfi", "melt_flow_index", "melt_flow_rate", "melt_mass_flow_rate", "melt_volume_flow_rate", "mvr"}:
            complete = bool(obs.get("testMethod")) and is_number(obs.get("temperatureC")) and is_number(obs.get("loadKg"))
            if obs.get("comparisonReady") is True:
                need(complete, f"{context}: {oid} melt-flow observation marked comparisonReady without method + temperatureC + loadKg", errors)

        if "shrink" in prop and obs.get("comparisonReady") is True:
            need(obs.get("direction") in {"flow", "transverse", "isotropic", "not-applicable"}, f"{context}: {oid} shrinkage requires resolved direction", errors)

    processing_ids: set[str] = set()
    for i, obs in enumerate(grade.get("processing") or []):
        oid = str(obs.get("id", ""))
        need(oid.startswith("proc-"), f"{context}: processing[{i}] id must start proc-", errors)
        need(oid not in processing_ids, f"{context}: duplicate processing id {oid}", errors)
        processing_ids.add(oid)
        need(bool(str(obs.get("parameter", "")).strip()), f"{context}: processing {oid} parameter required", errors)
        need(str(obs.get("sourceId", "")) in source_ids, f"{context}: processing {oid} references unknown sourceId", errors)
        need(obs.get("productionRecipe") is False, f"{context}: processing {oid} must explicitly remain non-recipe", errors)
        has_value = obs.get("value") is not None or obs.get("min") is not None or obs.get("max") is not None
        need(has_value, f"{context}: processing {oid} has no value/range", errors)
        if any(is_number(obs.get(k)) for k in ("value", "min", "max")):
            need(bool(str(obs.get("unit") or "").strip()), f"{context}: numeric processing {oid} requires unit", errors)

    for sid in [str(a.get("sourceId", "")) for a in grade.get("approvals") or []]:
        need(sid in source_ids, f"{context}: approval references unknown sourceId {sid}", errors)

    stage = (grade.get("provenance") or {}).get("stage", "staging")
    if stage == "published":
        need(bool(sources), f"{context}: published grade must remain sourced", errors)
        for obs in grade.get("properties") or []:
            need(obs.get("comparisonReady") is not None, f"{context}: published property missing comparisonReady", errors)

    return errors


def validate_staging() -> list[str]:
    errors: list[str] = []
    grade_lineage: dict[str, tuple[str, str, str]] = {}
    runtime_occurrences: dict[str, int] = {}
    for path in sorted(STAGING.glob("*.json")):
        payload = load_json(path)
        for mi, manufacturer in enumerate(payload.get("manufacturers") or []):
            mid = str(manufacturer.get("id", ""))
            need(mid.startswith("mfr-"), f"{path.name}: manufacturer[{mi}] id must start mfr-", errors)
            need(bool(str(manufacturer.get("name", "")).strip()), f"{path.name}: manufacturer[{mi}] name required", errors)
            for gi, grade in enumerate(manufacturer.get("gradeRecords") or []):
                context = f"{path.name}:{mid}:grade[{gi}]"
                errors.extend(validate_grade(grade, context))
                gid = clean_text(grade.get("id"))
                if not gid:
                    continue
                lineage = (
                    clean_text((grade.get("manufacturer") or {}).get("id")),
                    clean_text(grade.get("brand")),
                    clean_text(grade.get("grade")),
                )
                prior = grade_lineage.get(gid)
                if prior is None:
                    grade_lineage[gid] = lineage
                else:
                    need(
                        prior == lineage,
                        f"{context}: grade id {gid} was reused for a different commercial identity; prior={prior}, current={lineage}",
                        errors,
                    )
                stage = clean_text((grade.get("provenance") or {}).get("stage")) or "staging"
                if stage in {"validated", "published"}:
                    runtime_occurrences[gid] = runtime_occurrences.get(gid, 0) + 1
                    need(
                        runtime_occurrences[gid] <= 1,
                        f"{context}: grade id {gid} has more than one validated/published staging occurrence",
                        errors,
                    )
    return errors



def acquisition_status() -> dict[str, Any]:
    """Summarize the complete staging pipeline without promoting staged-only records."""
    grade_stages: dict[str, set[str]] = {}
    manufacturers: set[str] = set()
    countries: set[str] = set()
    families: set[str] = set()
    records = 0
    for path in sorted(STAGING.glob("*.json")):
        payload = load_json(path)
        for manufacturer in payload.get("manufacturers") or []:
            mid = clean_text(manufacturer.get("id"))
            if mid:
                manufacturers.add(mid)
            country = clean_text(manufacturer.get("country"))
            if country:
                countries.add(country)
            for grade in manufacturer.get("gradeRecords") or []:
                records += 1
                gid = clean_text(grade.get("id"))
                if not gid:
                    continue
                stage = clean_text((grade.get("provenance") or {}).get("stage")) or "staging"
                grade_stages.setdefault(gid, set()).add(stage)
                family = clean_text((grade.get("polymer") or {}).get("family"))
                if family:
                    families.add(family)
    validated_ids = {
        gid for gid, stages in grade_stages.items()
        if stages & {"validated", "published"}
    }
    staging_only_ids = {
        gid for gid, stages in grade_stages.items()
        if not (stages & {"validated", "published"})
    }
    promoted_ids = {
        gid for gid, stages in grade_stages.items()
        if "staging" in stages and stages & {"validated", "published"}
    }
    return {
        "stagingRecords": records,
        "uniqueExactGradeIds": len(grade_stages),
        "validatedOrPublishedIds": len(validated_ids),
        "stagingOnlyIds": len(staging_only_ids),
        "promotionLineageIds": len(promoted_ids),
        "manufacturersAcrossPipeline": len(manufacturers),
        "countriesAcrossPipeline": len(countries),
        "polymerFamiliesAcrossPipeline": len(families),
    }


def promotion_readiness() -> dict[str, Any]:
    """Report staged-only exact grades that have enough evidence for review without auto-promoting them."""
    rows: list[dict[str, Any]] = []
    runtime_ids: set[str] = set()
    staged: dict[str, dict[str, Any]] = {}

    for path in sorted(STAGING.glob("*.json")):
        payload = load_json(path)
        for manufacturer in payload.get("manufacturers") or []:
            for grade in manufacturer.get("gradeRecords") or []:
                gid = clean_text(grade.get("id"))
                if not gid:
                    continue
                stage = clean_text((grade.get("provenance") or {}).get("stage")) or "staging"
                if stage in {"validated", "published"}:
                    runtime_ids.add(gid)
                elif gid not in staged:
                    staged[gid] = {"grade": grade, "dataset": path.name}

    for gid, item in staged.items():
        if gid in runtime_ids:
            continue
        grade = item["grade"]
        sources = grade.get("sources") or []
        primary_sources = [
            source for source in sources
            if clean_text(source.get("kind")).startswith("manufacturer-")
            or clean_text(source.get("publisher")) == clean_text((grade.get("manufacturer") or {}).get("name"))
        ]
        properties = grade.get("properties") or []
        processing = grade.get("processing") or []
        blockers: list[str] = []
        if not primary_sources:
            blockers.append("no manufacturer-class primary source")
        if not properties and not processing:
            blockers.append("no normalized property or processing observations")
        for obs in properties:
            if not clean_text(obs.get("sourceId")):
                blockers.append("property observation missing sourceId")
                break
            if not clean_text(obs.get("unit")):
                blockers.append("property observation missing unit")
                break
            if not clean_text(obs.get("testMethod")):
                blockers.append("property observation missing test method")
                break
        for obs in processing:
            if not clean_text(obs.get("sourceId")):
                blockers.append("processing observation missing sourceId")
                break
            if not clean_text(obs.get("condition")):
                blockers.append("processing observation missing applicability condition")
                break
        rows.append({
            "id": gid,
            "manufacturer": clean_text((grade.get("manufacturer") or {}).get("name")),
            "brand": clean_text(grade.get("brand")),
            "grade": clean_text(grade.get("grade")),
            "family": clean_text((grade.get("polymer") or {}).get("family")),
            "dataset": item["dataset"],
            "primarySourceCount": len(primary_sources),
            "propertyObservations": len(properties),
            "processingObservations": len(processing),
            "evidenceReviewCandidate": not blockers,
            "blockers": blockers,
        })

    candidates = [row for row in rows if row["evidenceReviewCandidate"]]
    blocked = [row for row in rows if not row["evidenceReviewCandidate"]]
    return {
        "boundary": "This is a review queue, not an automatic publication gate. A candidate still requires semantic review and an explicit provenance-stage change before it can enter runtime.",
        "stagingOnlyGrades": len(rows),
        "evidenceReviewCandidates": len(candidates),
        "blockedGrades": len(blocked),
        "candidates": sorted(candidates, key=lambda row: (row["manufacturer"], row["brand"], row["grade"])),
        "blockerCounts": {
            blocker: sum(blocker in row["blockers"] for row in blocked)
            for blocker in sorted({b for row in blocked for b in row["blockers"]})
        },
    }


def compile_catalog(output: Path = CATALOG) -> dict[str, Any]:
    errors = validate_staging()
    if errors:
        raise SystemExit("\n".join(errors))

    manufacturers: dict[str, dict[str, Any]] = {}
    grades: list[dict[str, Any]] = []
    seen_grade_ids: set[str] = set()
    seen_identity: set[tuple[str, str, str, str]] = set()

    for path in sorted(STAGING.glob("*.json")):
        payload = load_json(path)
        for manufacturer in payload.get("manufacturers") or []:
            mid = manufacturer["id"]
            manufacturer_grades = []
            for grade in manufacturer.get("gradeRecords") or []:
                if (grade.get("provenance") or {}).get("stage") not in {"validated", "published"}:
                    continue
                gid = grade["id"]
                if gid in seen_grade_ids:
                    raise SystemExit(f"duplicate material grade id: {gid}")
                seen_grade_ids.add(gid)
                identity = material_identity_key(mid, grade)
                if identity in seen_identity:
                    raise SystemExit(
                        "duplicate exact-grade variant identity: "
                        f"{identity[:3]}; add identity.variantId, production/region, composition or source revision metadata"
                    )
                seen_identity.add(identity)
                grades.append(grade)
                manufacturer_grades.append(grade)
            if manufacturer_grades:
                manufacturers[mid] = {"id": mid, "name": manufacturer["name"], "country": manufacturer.get("country")}

    sorted_grades = sorted(
        grades,
        key=lambda x: (
            x["manufacturer"]["name"].lower(),
            str(x.get("brand") or "").lower(),
            x["grade"].lower(),
            str((x.get("identity") or {}).get("variantId") or "").lower(),
        ),
    )
    sorted_manufacturers = sorted(manufacturers.values(), key=lambda x: x["name"].lower())
    countries = sorted({str(m.get("country") or "").strip() for m in sorted_manufacturers if str(m.get("country") or "").strip()})
    families = sorted({str((g.get("polymer") or {}).get("family") or "").strip() for g in sorted_grades if str((g.get("polymer") or {}).get("family") or "").strip()})
    property_observations = [obs for g in sorted_grades for obs in g.get("properties") or []]
    processing_observations = [obs for g in sorted_grades for obs in g.get("processing") or []]
    comparison_ready = [obs for obs in property_observations if obs.get("comparisonReady") is True]
    primary_source_grades = [
        g for g in sorted_grades
        if any(str(s.get("kind") or "").startswith("manufacturer-") for s in g.get("sources") or [])
    ]

    catalog = {
        "schemaVersion": 1,
        "catalogVersion": "generated",
        "generated": True,
        "status": "validated",
        "boundary": "Compiled only from staged exact-grade records whose provenance stage is validated/published and which pass semantic QA. Internal staging/schema files are not part of the public runtime artifact. Commercial grade names may legitimately coexist when variant/revision/production identity differs.",
        "statistics": {
            "exactGrades": len(sorted_grades),
            "manufacturers": len(sorted_manufacturers),
            "countries": len(countries),
            "polymerFamilies": len(families),
            "propertyObservations": len(property_observations),
            "comparisonReadyObservations": len(comparison_ready),
            "processingObservations": len(processing_observations),
            "primarySourceGrades": len(primary_source_grades),
        },
        "manufacturers": sorted_manufacturers,
        "grades": sorted_grades,
    }
    output.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return catalog


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate/compile MouldMaster exact-grade material staging data")
    parser.add_argument("command", choices=["validate", "compile", "status", "promotion-status"])
    parser.add_argument("--output", type=Path, default=CATALOG)
    args = parser.parse_args()

    if args.command == "validate":
        errors = validate_staging()
        if errors:
            raise SystemExit("\n".join(errors))
        print("Material staging semantic QA passed")
    elif args.command == "status":
        errors = validate_staging()
        if errors:
            raise SystemExit("\n".join(errors))
        print(json.dumps(acquisition_status(), indent=2, ensure_ascii=False))
    elif args.command == "promotion-status":
        errors = validate_staging()
        if errors:
            raise SystemExit("\n".join(errors))
        print(json.dumps(promotion_readiness(), indent=2, ensure_ascii=False))
    else:
        catalog = compile_catalog(args.output)
        print(f"Compiled {len(catalog['grades'])} validated exact grades from {len(catalog['manufacturers'])} manufacturers")


if __name__ == "__main__":
    main()
