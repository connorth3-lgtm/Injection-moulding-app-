#!/usr/bin/env python3
"""Fail-closed OEM machine-library evidence and injection-unit pairing checks."""
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
data = json.loads((ROOT / "machine-library-v1.json").read_text(encoding="utf-8"))
page = (ROOT / "machine-library.html").read_text(encoding="utf-8")
assert data["schema_version"] == 1
assert len(data["manufacturers"]) >= 11

ids = set()
models = {}
for maker in data["manufacturers"]:
    assert maker["id"] and maker["name"]
    for row in maker.get("models", []):
        assert row["id"] not in ids, f"duplicate machine identity {row['id']}"
        ids.add(row["id"])
        models[row["id"]] = row
        assert row["model"] and row["research_status"] == "active"
        assert row.get("generation_note"), f"missing generation boundary for {row['id']}"
        evidence = {s["id"]: s for s in row.get("sources", [])}
        assert evidence, f"machine lacks provenance: {row['id']}"
        for src in evidence.values():
            assert urlparse(src["url"]).scheme == "https"
            assert src.get("checked") and src.get("publisher")
        for manual in row.get("manuals", []):
            assert manual.get("status") and manual.get("url")
            if manual.get("exact_model"):
                assert manual["status"] == "verified", "exact-model manual must be verified"
        for wanted in row.get("wanted_documents", []):
            assert wanted["status"] == "missing", "do not claim unverified OEM documents"
        for option in row.get("published_injection_variants", []):
            assert option["source_id"] in evidence, "injection unit variant lacks exact source"
            assert option["injection_unit_id"], "injection unit identity missing"
            diam = option["screw_diameter_mm"]
            capacity = option["injection_capacity_cm3"]
            pressure = option["maximum_injection_pressure_mpa"]
            assert len(diam) == len(capacity) == len(pressure) and len(diam) >= 2
            assert len(set(diam)) == len(diam)
            assert all(type(n) in (int, float) and 0 < n < 10000 for seq in (diam, capacity, pressure) for n in seq)
            assert option["published_option"] in ("standard", "optional")
            assert "machine" in row["generation_note"].lower()

expected = {
    "nissei-fnx110-iv": {
        "model": "FNX110Ⅳ", "clamp": 1100, "units": {
            "12A": ([28, 32, 36, 40], [77, 101, 127, 157], [265, 226, 179, 145]),
            "18A": ([32, 36, 40, 45], [117, 147, 182, 231], [265, 222, 180, 142]),
        },
    },
    "nissei-fnx220-iv": {
        "model": "FNX220Ⅳ", "clamp": 2110, "units": {
            "50A": ([50, 56, 63], [402, 505, 639], [198, 158, 125]),
            "71A": ([56, 63, 71], [554, 701, 891], [196, 155, 122]),
        },
    },
}
for key, contract in expected.items():
    m = models[key]
    assert m["model"] == contract["model"]
    assert m["common_verified_specs"]["clamping_force_kn"] == contract["clamp"]
    assert "Ⅳ" in m["series"] and m["manufacture_year"]["status"] == "unknown"
    assert m["controller"]["confidence"] == "missing"
    assert not m["manuals"], "cannot invent a verified machine manual"
    assert m["sources"][0]["url"].startswith("https://www.nisseiplastic.com/en/products/fnx-4/spec.php?model=")
    assert m["sources"][0]["checked"] == "2026-10-08"
    found = {v["injection_unit_id"]: v for v in m["published_injection_variants"]}
    assert set(found) == set(contract["units"])
    for unit, (diam, capacity, pressure) in contract["units"].items():
        got = found[unit]
        assert got["screw_diameter_mm"] == diam
        assert got["injection_capacity_cm3"] == capacity
        assert got["maximum_injection_pressure_mpa"] == pressure
    assert all(w["status"] == "missing" for w in m["wanted_documents"])

hmd = models["hwamda-hmd400m6"]
assert "M6-S" in hmd["generation_note"] and "Do not substitute" in hmd["generation_note"]
assert any(w["status"] == "missing" for w in hmd["wanted_documents"])
assert "published_injection_variants" in page and "injectionUnits(m)" in page
assert "machine serial and rated/usable processing capability" in page
assert "./machine-library-v1.json" in page
print(f"Machine library OEM model/variant regression QA passed ({len(models)} researched models)")
