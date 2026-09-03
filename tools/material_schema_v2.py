from __future__ import annotations

import re
from typing import Any

FINGERPRINT_RE = re.compile(r"^sha256:[a-f0-9]{64}$")

MECHANICAL_METHOD_REQUIRED = {
    "density",
    "tensile_strength",
    "tensile_modulus",
    "flexural_strength",
    "flexural_modulus",
    "notched_izod_impact",
}
TEMPERATURE_PARAMETERS = {"drying_temperature", "melt_temperature", "mould_temperature"}


def _text(value: Any) -> str:
    return str(value or "").strip()


def _number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _need(ok: bool, message: str, errors: list[str]) -> None:
    if not ok:
        errors.append(message)


def validate_quantity(quantity: Any, context: str) -> list[str]:
    errors: list[str] = []
    if not isinstance(quantity, dict):
        return [f"{context}: quantity must be an object"]
    kind = quantity.get("kind")
    unit = _text(quantity.get("unit"))
    _need(bool(unit), f"{context}: quantity.unit is required", errors)
    if kind == "scalar":
        _need(_number(quantity.get("value")), f"{context}: scalar quantity.value must be numeric", errors)
    elif kind == "range":
        minimum, maximum = quantity.get("min"), quantity.get("max")
        _need(_number(minimum) and _number(maximum), f"{context}: range min/max must be numeric", errors)
        if _number(minimum) and _number(maximum):
            _need(minimum <= maximum, f"{context}: range min must be <= max", errors)
        typical = quantity.get("typical")
        if typical is not None:
            _need(_number(typical), f"{context}: range typical must be numeric/null", errors)
            if _number(minimum) and _number(maximum) and _number(typical):
                _need(minimum <= typical <= maximum, f"{context}: range typical must lie inside min/max", errors)
    else:
        _need(False, f"{context}: quantity.kind must be scalar or range", errors)
    return errors


def validate_property(obs: dict[str, Any], source_ids: set[str], context: str) -> list[str]:
    errors = validate_quantity(obs.get("quantity"), context)
    key = _text(obs.get("propertyKey"))
    semantic_status = obs.get("semanticStatus")
    test = obs.get("test") or {}
    _need(_text(obs.get("sourceId")) in source_ids, f"{context}: sourceId must reference this grade", errors)
    _need(semantic_status in {"complete", "context-only"}, f"{context}: semanticStatus is invalid", errors)

    complete = semantic_status == "complete"
    if complete and key in MECHANICAL_METHOD_REQUIRED:
        _need(bool(_text(test.get("method"))), f"{context}: {key} requires test.method when semantically complete", errors)
    if complete and key == "melt_flow_rate":
        _need(bool(_text(test.get("method"))), f"{context}: melt_flow_rate requires test.method", errors)
        _need(_number(test.get("temperatureC")), f"{context}: melt_flow_rate requires test.temperatureC", errors)
        _need(_number(test.get("loadKg")), f"{context}: melt_flow_rate requires test.loadKg", errors)
    if complete and key == "mould_shrinkage":
        _need(bool(_text(test.get("method"))), f"{context}: mould_shrinkage requires test.method", errors)
        _need(test.get("direction") in {"flow", "transverse", "isotropic", "not-applicable"}, f"{context}: mould_shrinkage requires resolved direction", errors)
    return errors


def validate_processing(obs: dict[str, Any], source_ids: set[str], context: str) -> list[str]:
    errors = validate_quantity(obs.get("quantity"), context)
    key = _text(obs.get("parameterKey"))
    unit = _text((obs.get("quantity") or {}).get("unit"))
    _need(_text(obs.get("sourceId")) in source_ids, f"{context}: sourceId must reference this grade", errors)
    _need(obs.get("productionRecipe") is False, f"{context}: productionRecipe must be false", errors)
    if key in TEMPERATURE_PARAMETERS:
        _need(unit in {"°C", "C", "degC"}, f"{context}: {key} must use a Celsius unit", errors)
    if key == "drying_time":
        _need(unit in {"h", "hr", "hours"}, f"{context}: drying_time must use hours", errors)
    if key == "maximum_moisture":
        _need(unit in {"%", "ppm"}, f"{context}: maximum_moisture must use % or ppm", errors)
    return errors


def validate_grade_v2(grade: dict[str, Any], context: str = "grade") -> list[str]:
    errors: list[str] = []
    _need(grade.get("schemaVersion") == 2, f"{context}: schemaVersion must be 2", errors)
    _need(_text(grade.get("id")).startswith("mat-"), f"{context}: exact-grade id must start mat-", errors)
    _need(bool(_text(grade.get("grade"))), f"{context}: exact commercial grade is required", errors)
    _need(bool(_text((grade.get("manufacturer") or {}).get("id"))), f"{context}: manufacturer.id is required", errors)
    _need(bool(_text((grade.get("polymer") or {}).get("family"))), f"{context}: polymer.family is required", errors)

    sources = grade.get("sources") or []
    _need(bool(sources), f"{context}: at least one source is required", errors)
    source_ids: set[str] = set()
    stage = _text((grade.get("provenance") or {}).get("stage"))
    for index, source in enumerate(sources):
        source_context = f"{context}:source[{index}]"
        sid = _text(source.get("id"))
        _need(sid.startswith("src-"), f"{source_context}: id must start src-", errors)
        _need(sid not in source_ids, f"{source_context}: duplicate source id {sid}", errors)
        source_ids.add(sid)
        _need(bool(_text(source.get("retrievedAt"))), f"{source_context}: retrievedAt is required", errors)
        if stage in {"validated", "published"}:
            _need(bool(_text(source.get("revision"))), f"{source_context}: revision is required for {stage} evidence", errors)
            _need(bool(FINGERPRINT_RE.fullmatch(_text(source.get("fingerprint")))), f"{source_context}: sha256 fingerprint is required for {stage} evidence", errors)

    for index, obs in enumerate(grade.get("properties") or []):
        errors.extend(validate_property(obs, source_ids, f"{context}:property[{index}]"))
    for index, obs in enumerate(grade.get("processing") or []):
        errors.extend(validate_processing(obs, source_ids, f"{context}:processing[{index}]"))
    return errors
