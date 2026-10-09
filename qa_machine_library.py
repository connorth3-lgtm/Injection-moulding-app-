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
    "nissei-fnx80-iv": {
        "model": "FNX80Ⅳ", "clamp": 792, "units": {
            "9A": ([26,28,32,36], [59,69,90,114], [265,244,187,147]),
            "12A": ([28,32,36,40], [77,101,127,157], [265,226,179,145]),
        },
    },
    "nissei-fnx140-iv": {
        "model": "FNX140Ⅳ", "clamp": 1370, "units": {
            "25A": ([36,40,45,50], [163,201,254,314], [255,219,173,140]),
            "36A": ([45,50,56], [286,353,443], [207,168,134]),
        },
    },
    "nissei-fnx180-iv": {
        "model": "FNX180Ⅳ", "clamp": 1750, "units": {
            "25A": ([36,40,45,50], [163,201,254,314], [255,219,173,140]),
            "36A": ([45,50,56], [286,353,443], [207,168,134]),
        },
    },
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
    "nissei-fnx280-iv": {
        "model": "FNX280Ⅳ", "clamp": 2740, "units": {
            "71A": ([56, 63, 71], [554, 701, 891], [196, 155, 122]),
            "100A": ([63, 71, 80], [795, 1010, 1280], [205, 161, 127]),
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
    assert m["sources"][0]["checked"] == ("2026-10-09" if key in {"nissei-fnx80-iv", "nissei-fnx140-iv", "nissei-fnx180-iv", "nissei-fnx280-iv"} else "2026-10-08")
    found = {v["injection_unit_id"]: v for v in m["published_injection_variants"]}
    assert set(found) == set(contract["units"])
    for unit, (diam, capacity, pressure) in contract["units"].items():
        got = found[unit]
        assert got["screw_diameter_mm"] == diam
        assert got["injection_capacity_cm3"] == capacity
        assert got["maximum_injection_pressure_mpa"] == pressure
    assert all(w["status"] == "missing" for w in m["wanted_documents"])
    if key in {"nissei-fnx80-iv", "nissei-fnx140-iv", "nissei-fnx180-iv", "nissei-fnx280-iv"}:
        geometry = {
            "nissei-fnx80-iv": (470, 200, 670, "420 x 420", "580 x 580", 75, "9A"),
            "nissei-fnx140-iv": (600, 250, 850, "510 x 510", "730 x 730", 90, "25A"),
            "nissei-fnx180-iv": (700, 250, 950, "560 x 560", "800 x 800", 110, "36A"),
            "nissei-fnx280-iv": (830, 320, 1150, "660 x 660", "955 x 955", 130, "71A"),
        }[key]
        specs = m["common_verified_specs"]
        assert (
            specs["clamping_stroke_mm"], specs["min_mould_thickness_mm"],
            specs["max_daylight_opening_mm"], specs["tie_bar_clearance_h_x_v_mm"],
            specs["die_plate_h_x_v_mm"], specs["ejector_stroke_mm"]
        ) == geometry[:6], f"OEM geometry pairing drift for {key}"
        assert found[geometry[6]]["published_option"] == "standard"
        assert all(v["published_option"] == ("standard" if v["injection_unit_id"] == geometry[6] else "optional")
                   for v in found.values())
        assert m["sources"][0]["url"].endswith("model=FNX" + key.split("fnx", 1)[1].split("-iv", 1)[0] + "%E2%85%A3")


fanuc = models["fanuc-roboshot-alpha-s100ib"]
assert fanuc["model"] == "ROBOSHOT α-S100iB"
assert fanuc["series"] == "ROBOSHOT α-SiB"
assert fanuc["controller"]["confidence"] == "missing", "model-page controller does not prove installed controller"
assert not fanuc["manuals"] and not fanuc["published_injection_variants"], "do not invent serial-specific manuals/injection-unit identity"
assert fanuc["common_verified_specs"] == {
    "clamping_force_kn": 1000,
    "clamping_stroke_mm": 350,
    "tie_bar_clearance_h_x_v_mm": "460 x 410",
    "die_plate_h_x_v_mm": "660 x 610",
    "ejector_stroke_mm": 100,
}
assert fanuc["published_clamp_force_options_kn"] == [1000, 1250], "increased clamp must not silently replace base clamp"
assert fanuc["published_mould_height_variants"] == [
    {"platen_configuration":"single","standard_min_mm":220,"standard_max_mm":520,"increased_min_mm":220,"increased_max_mm":620},
    {"platen_configuration":"double","standard_min_mm":150,"standard_max_mm":450,"increased_min_mm":150,"increased_max_mm":550},
], "OEM single/double platen and increased height options drifted"
screw = fanuc["published_screw_data"]
assert screw["source_id"] == fanuc["sources"][0]["id"]
assert "200 mm/s" in screw["mode"] and "not high-duty" in screw["mode"]
assert screw["actual_fitted_injection_unit_id"] is None
assert screw["screw_diameter_mm"] == [22, 26, 28, 32, 36, 40]
assert screw["maximum_injection_volume_cm3"] == [29, 50, 58, 103, 147, 181]
assert screw["maximum_injection_and_hold_pressure_1_mpa"] == [290, 290, 270, 250, 190, 160]
assert screw["maximum_injection_and_hold_pressure_2_mpa"] == [260, 260, 240, 220, 190, 160]
assert fanuc["sources"][0]["url"] == "https://www.fanuc.eu/eu-en/product/roboshot/fanuc-roboshot-a-s100ib"
assert fanuc["sources"][0]["checked"] == "2026-10-09"
assert "screwData(m)" in page and "mouldHeightOptions(m)" in page, "the operator must see non-interchangeable source variants"
assert all(w["status"] == "missing" for w in fanuc["wanted_documents"])


hmd = models["hwamda-hmd400m6"]
assert "M6-S" in hmd["generation_note"] and "Do not substitute" in hmd["generation_note"]
assert any(w["status"] == "missing" for w in hmd["wanted_documents"])
assert "published_injection_variants" in page and "injectionUnits(m)" in page
assert "machine serial and rated/usable processing capability" in page
assert "./machine-library-v1.json" in page
print(f"Machine library OEM model/variant regression QA passed ({len(models)} researched models)")
