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


def validate_grade(grade: dict[str, Any], context: str = "grade") -> list[str]:
    errors: list[str] = []
    need(grade.get("schemaVersion") == 1, f"{context}: schemaVersion must be 1", errors)
    need(str(grade.get("id", "")).startswith("mat-"), f"{context}: id must start mat-", errors)
    manufacturer = grade.get("manufacturer") or {}
    need(str(manufacturer.get("id", "")).startswith("mfr-"), f"{context}: manufacturer.id must start mfr-", errors)
    need(bool(str(manufacturer.get("name", "")).strip()), f"{context}: manufacturer.name required", errors)
    need(bool(str(grade.get("grade", "")).strip()), f"{context}: exact commercial grade required", errors)
    need(bool(str((grade.get("polymer") or {}).get("family", "")).strip()), f"{context}: polymer.family required", errors)

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

        if prop in {"mfr", "mfi", "melt_flow_rate", "melt_mass_flow_rate", "melt_volume_flow_rate", "mvr"}:
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

    approval_source_ids = [str(a.get("sourceId", "")) for a in grade.get("approvals") or []]
    for sid in approval_source_ids:
        need(sid in source_ids, f"{context}: approval references unknown sourceId {sid}", errors)

    stage = (grade.get("provenance") or {}).get("stage", "staging")
    if stage == "published":
        need(bool(sources), f"{context}: published grade must remain sourced", errors)
        for obs in grade.get("properties") or []:
            need(obs.get("comparisonReady") is not None, f"{context}: published property missing comparisonReady", errors)

    return errors


def validate_staging() -> list[str]:
    errors: list[str] = []
    for path in sorted(STAGING.glob("*.json")):
        payload = load_json(path)
        for mi, manufacturer in enumerate(payload.get("manufacturers") or []):
            mid = str(manufacturer.get("id", ""))
            need(mid.startswith("mfr-"), f"{path.name}: manufacturer[{mi}] id must start mfr-", errors)
            need(bool(str(manufacturer.get("name", "")).strip()), f"{path.name}: manufacturer[{mi}] name required", errors)
            for gi, grade in enumerate(manufacturer.get("gradeRecords") or []):
                errors.extend(validate_grade(grade, f"{path.name}:{mid}:grade[{gi}]"))
    return errors


def compile_catalog(output: Path = CATALOG) -> dict[str, Any]:
    errors = validate_staging()
    if errors:
        raise SystemExit("\n".join(errors))

    manufacturers: dict[str, dict[str, Any]] = {}
    grades: list[dict[str, Any]] = []
    seen_grade_ids: set[str] = set()
    seen_identity: set[tuple[str, str, str]] = set()

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
                identity = (mid.lower(), str(grade.get("brand") or "").strip().lower(), str(grade["grade"]).strip().lower())
                if identity in seen_identity:
                    raise SystemExit(f"duplicate exact-grade identity: {identity}")
                seen_identity.add(identity)
                grades.append(grade)
                manufacturer_grades.append(grade)
            if manufacturer_grades:
                manufacturers[mid] = {"id": mid, "name": manufacturer["name"], "country": manufacturer.get("country")}

    catalog = {
        "schemaVersion": 1,
        "catalogVersion": "generated",
        "generated": True,
        "status": "validated",
        "boundary": "Compiled only from staged exact-grade records whose provenance stage is validated/published and which pass semantic QA. Internal staging/schema files are not part of the public runtime artifact.",
        "manufacturers": sorted(manufacturers.values(), key=lambda x: x["name"].lower()),
        "grades": sorted(grades, key=lambda x: (x["manufacturer"]["name"].lower(), str(x.get("brand") or "").lower(), x["grade"].lower())),
    }
    output.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return catalog


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate/compile MouldMaster exact-grade material staging data")
    parser.add_argument("command", choices=["validate", "compile"])
    parser.add_argument("--output", type=Path, default=CATALOG)
    args = parser.parse_args()

    if args.command == "validate":
        errors = validate_staging()
        if errors:
            raise SystemExit("\n".join(errors))
        print("Material staging semantic QA passed")
    else:
        catalog = compile_catalog(args.output)
        print(f"Compiled {len(catalog['grades'])} validated exact grades from {len(catalog['manufacturers'])} manufacturers")


if __name__ == "__main__":
    main()
