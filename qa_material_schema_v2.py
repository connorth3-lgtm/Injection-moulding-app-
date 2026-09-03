from __future__ import annotations

import copy
import json
from pathlib import Path

from tools.material_schema_v2 import validate_grade_v2

ROOT = Path(__file__).resolve().parent
SCHEMA = ROOT / "data/materials/material-grade-v2.schema.json"

schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
assert schema.get("$schema", "").endswith("2020-12/schema"), "material v2 schema must use JSON Schema 2020-12"
assert schema.get("properties", {}).get("schemaVersion", {}).get("const") == 2, "material v2 schemaVersion contract drift"
assert "quantity" in schema.get("$defs", {}), "material v2 must define structured scalar/range quantities"

BASE = {
    "schemaVersion": 2,
    "id": "mat-example-grade",
    "manufacturer": {"id": "mfr-example", "name": "Example Polymer Co"},
    "grade": "EX-100",
    "polymer": {"family": "POM"},
    "lifecycle": {"status": "active"},
    "sources": [{
        "id": "src-example-tds",
        "publisher": "Example Polymer Co",
        "title": "EX-100 technical data sheet",
        "url": "https://example.invalid/ex-100.pdf",
        "kind": "manufacturer-datasheet",
        "retrievedAt": "2026-09-03",
        "revision": "rev-2026-08",
        "fingerprint": "sha256:" + "a" * 64,
    }],
    "properties": [{
        "id": "obs-example-mfr",
        "propertyKey": "melt_flow_rate",
        "label": "Melt Flow Rate",
        "quantity": {"kind": "scalar", "value": 9.0, "unit": "g/10min"},
        "test": {"method": "ISO 1133", "temperatureC": 190, "loadKg": 2.16},
        "sourceId": "src-example-tds",
        "semanticStatus": "complete",
    }],
    "processing": [{
        "id": "proc-example-melt",
        "parameterKey": "melt_temperature",
        "label": "Melt temperature",
        "quantity": {"kind": "range", "min": 190, "max": 210, "unit": "°C"},
        "claimType": "supplier-guidance",
        "sourceId": "src-example-tds",
        "productionRecipe": False,
    }],
    "provenance": {"stage": "validated"},
}

assert not validate_grade_v2(BASE), "complete v2 example should validate"

missing_fingerprint = copy.deepcopy(BASE)
missing_fingerprint["sources"][0].pop("fingerprint")
assert any("fingerprint" in x for x in validate_grade_v2(missing_fingerprint)), "validated evidence must require a fingerprint"

missing_revision = copy.deepcopy(BASE)
missing_revision["sources"][0].pop("revision")
assert any("revision" in x for x in validate_grade_v2(missing_revision)), "validated evidence must require a revision"

incomplete_mfr = copy.deepcopy(BASE)
incomplete_mfr["properties"][0]["test"].pop("loadKg")
assert any("loadKg" in x for x in validate_grade_v2(incomplete_mfr)), "complete MFR must retain load"

context_only_mfr = copy.deepcopy(incomplete_mfr)
context_only_mfr["properties"][0]["semanticStatus"] = "context-only"
assert not validate_grade_v2(context_only_mfr), "incomplete MFR may be retained only as context-only evidence"

bad_range = copy.deepcopy(BASE)
bad_range["processing"][0]["quantity"] = {"kind": "range", "min": 220, "max": 190, "unit": "°C"}
assert any("min must be <= max" in x for x in validate_grade_v2(bad_range)), "structured ranges must be ordered"

shrink = copy.deepcopy(BASE)
shrink["properties"] = [{
    "id": "obs-example-shrink",
    "propertyKey": "mould_shrinkage",
    "label": "Mould Shrinkage",
    "quantity": {"kind": "range", "min": 1.5, "max": 2.1, "unit": "%"},
    "test": {"method": "ISO 294-4", "direction": "unknown"},
    "sourceId": "src-example-tds",
    "semanticStatus": "complete",
}]
assert any("resolved direction" in x for x in validate_grade_v2(shrink)), "complete shrinkage requires direction"

print("Material schema v2 semantic QA passed: structured ranges, property-specific completeness, and evidence revision/fingerprint gates are enforced.")
