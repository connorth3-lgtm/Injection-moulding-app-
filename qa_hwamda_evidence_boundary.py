#!/usr/bin/env python3
"""HMD400M6 exact-OEM documentation and injection-unit evidence HOLD.

The archived original-M6 *model-level* specification is not proof of fitted
machine hardware or suitable process setpoints. No serial-specific service
manual, controller host or installed injection variant has been authenticated.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LEDGER = "machine-research/hwamda/HMD400M6-EVIDENCE-BOUNDARY-v1.json"
TECH_PACK_URL = "https://kiaunoriumedis.lt/wp-content/uploads/2022/02/injection_machine.pdf"
EXPECTED_MISSING = frozenset({
    "original-M6 operation/maintenance manual",
    "machine/serial-specific electrical schematic",
    "machine/serial-specific hydraulic schematic",
    "Hwamda OEM controller I/O assignment",
    "lubrication diagram",
    "exact injection-unit revision and installed screw documentation",
    "serial-applicable parts book",
})
SOURCE_VARIANTS = {
    "hmd-m6-tech-pack": (
        "documented-exact-model-distributor-archive", TECH_PACK_URL,
        (70, 80, 90), (1385, 1809, 2289), (206, 158, 125)),
    "unattributed-alternative-ledger": (
        "unverified-provenance-research-only", None,
        (70, 80, 90), (1385, 1590, 2042), (199, 152, 120)),
}
LEDGER_KEYS = {
    "schemaVersion", "modelId", "modelLabel", "generation", "scope",
    "disposition", "installedControllerHost", "installedInjectionUnit",
    "installedScrewDiameterMm", "verifiedInstalledPressureMpa",
    "machineSuitability", "independentlyVerifiedOemManuals",
    "sourceVariantConflict", "publishedInjectionVariants",
    "missingOemDocuments", "requiredResolution", "confidentialEvidenceHandling",
}
SOURCE_KEYS = {
    "id", "status", "url", "sourceNote",
    "screwDiameterMm", "shotVolumeCm3", "injectionPressureMpa",
}


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise AssertionError("HMD400M6 OEM evidence HOLD: " + reason)


def exact_list_numbers(value: object, expected: tuple[int, ...]) -> bool:
    return (type(value) is list and len(value) == len(expected)
            and all(type(x) is int and x == e
                    for x, e in zip(value, expected)))


def verify(ledger: dict, machine_library: dict, research: str) -> None:
    need(type(ledger) is dict and set(ledger) == LEDGER_KEYS,
         "missing or invented evidence-boundary fields")
    expected = {
        "schemaVersion": 1,
        "modelId": "hwamda-hmd400m6",
        "modelLabel": "Hwamda HMD400M6",
        "generation": "original-M6",
        "disposition": "hold-oem-as-built-validation",
        "installedControllerHost": "unknown",
        "installedInjectionUnit": None,
        "installedScrewDiameterMm": None,
        "verifiedInstalledPressureMpa": None,
        "machineSuitability": "unknown",
        "sourceVariantConflict": "unresolved",
    }
    for field, value in expected.items():
        need(type(ledger[field]) is type(value) and ledger[field] == value,
             "unverified as-built promotion: " + field)
    need(type(ledger["independentlyVerifiedOemManuals"]) is list
         and not ledger["independentlyVerifiedOemManuals"],
         "synthetic OEM document approval")
    missing = ledger["missingOemDocuments"]
    need(type(missing) is list and len(missing) == len(EXPECTED_MISSING)
         and all(type(x) is str for x in missing)
         and set(missing) == EXPECTED_MISSING,
         "missing OEM manual/schematic requirements changed")
    need(all(type(ledger[field]) is str and
             len(ledger[field].strip()) >= 75 for field in (
                 "scope", "requiredResolution", "confidentialEvidenceHandling"
             )), "source, independent verification or confidentiality limitations lost")
    resolution = ledger["requiredResolution"].lower()
    need(all(x in resolution for x in (
        "serial", "original m6", "controller", "injection unit",
        "revision", "techmation", "m6-s", "physical",
    )), "OEM/source revision or physical acceptance guard missing")
    need("not serial-verified" in ledger["scope"],
         "published model specs are not installed ratings")

    variants = ledger["publishedInjectionVariants"]
    need(type(variants) is list and len(variants) == 2,
         "unresolved source variants silently joined or removed")
    seen = set()
    for row in variants:
        need(type(row) is dict and set(row) == SOURCE_KEYS,
             "incomplete published source variant or injected approval fields")
        name = row.get("id")
        need(type(name) is str and name in SOURCE_VARIANTS and name not in seen,
             "invented/duplicate injection-unit revision")
        status, url, screws, volumes, pressures = SOURCE_VARIANTS[name]
        need(row["status"] == status and row["url"] == url
             and type(row["sourceNote"]) is str
             and len(row["sourceNote"]) >= 35,
             "source grade, provenance or caveat altered: " + name)
        for field, expected_values in (
            ("screwDiameterMm", screws),
            ("shotVolumeCm3", volumes),
            ("injectionPressureMpa", pressures),
        ):
            need(exact_list_numbers(row.get(field), expected_values),
                 "source-specific screw/shot/pressure pairing altered: " + name)
        seen.add(name)
    need(seen == set(SOURCE_VARIANTS), "variant/source set missing")
    need(type(machine_library) is dict
         and type(machine_library.get("manufacturers")) is list,
         "machine library shape changed")
    found = [
        (m, model)
        for m in machine_library["manufacturers"]
        if type(m) is dict and type(m.get("models")) is list
        for model in m["models"]
        if type(model) is dict and (
            model.get("id") == "hwamda-hmd400m6"
            or model.get("model") == "HMD400M6"
        )
    ]
    need(len(found) == 1, "missing/duplicated original M6 exact-model record")
    maker, model = found[0]
    need(maker.get("name") == "Ningbo Hwamda Machinery Manufacturing Co., Ltd."
         and model.get("id") == "hwamda-hmd400m6"
         and model.get("model") == "HMD400M6"
         and model.get("series") == "M6"
         and model.get("research_status") == "active",
         "original machine identity/series promoted or relabelled")
    note = model.get("generation_note")
    need(type(note) is str and "HMD400M6-S" in note
         and "Do not substitute" in note, "M6-S generation guard lost")
    manufacture = model.get("manufacture_year")
    need(type(manufacture) is dict and manufacture.get("value") is None
         and manufacture.get("status") == "unknown",
         "unknown manufacturing year fabricated")
    controller = model.get("controller")
    need(type(controller) is dict
         and controller.get("host_controller") == "unknown"
         and controller.get("confidence") == "strong_match"
         and "not prove" in controller.get("host_note", ""),
         "HMI-family resemblance promoted to verified controller host")
    chosen = model.get("published_injection_variant")
    need(type(chosen) is dict
         and chosen.get("status") == "verified_source_variant"
         and chosen.get("source_id") == "hmd-m6-tech-pack"
         and exact_list_numbers(chosen.get("screw_diameter_mm"), (70, 80, 90))
         and exact_list_numbers(chosen.get("shot_volume_cm3"), (1385, 1809, 2289))
         and exact_list_numbers(chosen.get("injection_pressure_mpa"), (206, 158, 125)),
         "market variant promoted to as-built rating or OEM columns mixed")
    manuals = model.get("manuals")
    need(type(manuals) is list and bool(manuals), "OEM docs inventory missing")
    exact = [x for x in manuals
             if type(x) is dict and x.get("exact_model") is True]
    need(len(exact) == 1 and exact[0].get("type") == "technical_data"
         and exact[0].get("id") == "hmd-m6-tech-pack"
         and exact[0].get("url") == TECH_PACK_URL,
         "generic Techmation or other manual promoted to exact OEM service book")
    need(all(type(x) is dict and x.get("exact_model") is False
             and x.get("status") in ("reference_only", "strong_match")
             for x in manuals if x not in exact),
         "controller-family paperwork promoted to exact machine manual")
    wanted = model.get("wanted_documents")
    need(type(wanted) is list and len(wanted) >= 6
         and all(type(x) is dict and x.get("status") == "missing"
                 for x in wanted),
         "missing original OEM schematics falsely marked received")
    need(all(str(value) in research for value in (
        "1385", "1809", "2289", "1590", "2042", "206", "158", "125", "199", "152", "120"
    )) and "Conflicting published injection-unit data" in research,
         "historical conflicting source values removed from research record")
    # Published specifications are reference values only; no process pressure,
    # wiring, hydraulic-service or machine-control permission is granted.


def main() -> None:
    ledger = json.loads((ROOT / LEDGER).read_text(encoding="utf-8"))
    library = json.loads((ROOT / "machine-library-v1.json").read_text(encoding="utf-8"))
    research = (ROOT / "research/hwamda-hmd400m6/README.md").read_text(encoding="utf-8")
    verify(ledger, library, research)
    print("HMD400M6 OEM HOLD passed: source A/B separate; fitted controller, "
          "injection unit and original M6 service manuals remain unverified")


if __name__ == "__main__":
    main()
