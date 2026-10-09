#!/usr/bin/env python3
"""Fail closed on unresolved OEM platen-source conflicts entering machine fit.

The source record is research evidence, NOT a verified installed configuration.
Changing this guard to allow promotion requires a separately reviewed, source-
revision-bound engineering decision, not simply editing a status bit.
"""
from __future__ import annotations

import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
CONFLICT_PATH = "machine-research/oem-source-conflicts-v1.json"
MACHINE_LIBRARY = "machine-library-v1.json"
RESEARCH_NOTE = "machine-research/FANUC-ROBOSHOT-ALPHA-S30IB-OEM-CONFLICT.md"
SOURCE_INDEX = "machine-research/MANUFACTURER-SOURCES.md"

# Exact original manufacturer observations. Never silently reinterpret a
# published size as fitted geometry or substitute one regional source for another.
OBSERVATIONS = {
    "fanuc-europe-model": (
        "FANUC Europe", "EU",
        "https://www.fanuc.eu/eu-en/product/roboshot/fanuc-roboshot-a-s30ib",
        "live manufacturer model page; revision not established", (440, 420)),
    "fanuc-america-model": (
        "FANUC America", "US",
        "https://www.fanucamerica.com/products/roboshot/roboshot-a-s30ib",
        "live manufacturer model page; revision not established", (440, 240)),
    "fanuc-europe-mds-04995-en-2024": (
        "FANUC Europe", "EU",
        "https://d16ohktstcjvly.cloudfront.net/asset/513891251684/document_juqs5kiecp567ad5pq7p4up070",
        "MDS-04995-EN © 2024; manufacturer-linked mechanical specifications",
        (440, 420)),
}
OBS_KEYS = {
    "sourceId", "publisher", "region", "url", "revision",
    "checked", "hMm", "vMm",
}
CONFLICT_KEYS = {
    "id", "modelId", "model", "field", "units", "disposition",
    "acceptedMachinePlatenSize", "machineSuitability",
    "controllerAndSerial", "researchNote", "resolutionEvidence",
    "observations", "requiredToResolve",
}


def need(valid: bool, reason: str) -> None:
    if not valid:
        raise AssertionError("OEM source conflict HOLD: " + reason)


def machine_identity(value: object) -> str:
    return re.sub("[^a-z0-9]", "", str(value or "").casefold())


def verify(registry: dict, library: dict, note: str, source_index: str) -> None:
    need(type(registry) is dict, "missing conflict registry")
    need(type(registry.get("schemaVersion")) is int
         and registry["schemaVersion"] == 1, "schema drift")
    need(registry.get("status") == "unresolved-oem-source-conflict",
         "source conflict improperly marked resolved")
    scope = registry.get("scope")
    need(type(scope) is str and "not approved installed-machine" in scope,
         "missing non-production applicability boundary")
    conflicts = registry.get("conflicts")
    need(type(conflicts) is list and len(conflicts) == 1,
         "missing or duplicated source conflict")
    conflict = conflicts[0]
    need(type(conflict) is dict and set(conflict) == CONFLICT_KEYS,
         "missing or invented conflict fields")
    fixed = {
        "id": "fanuc-roboshot-alpha-s30ib-platen-h-v",
        "modelId": "fanuc-roboshot-alpha-s30ib",
        "model": "FANUC ROBOSHOT α-S30iB",
        "field": "platen_size_h_x_v",
        "units": "mm",
        "disposition": "quarantined",
        "acceptedMachinePlatenSize": None,
        "machineSuitability": "unknown",
        "controllerAndSerial": "unverified",
        "researchNote": RESEARCH_NOTE,
        "resolutionEvidence": None,
    }
    for key, expected in fixed.items():
        need(type(conflict.get(key)) is type(expected)
             and conflict.get(key) == expected,
             "unsafe promotion or altered evidence: " + key)
    required = conflict.get("requiredToResolve")
    need(type(required) is str and
         all(word in required.lower() for word in (
             "fanuc", "revision", "variant", "serial", "suitable",
         )), "no OEM revision and fitted-machine resolution procedure")
    observations = conflict.get("observations")
    need(type(observations) is list and len(observations) == 3,
         "source claims incomplete")
    got = {}
    for row in observations:
        need(type(row) is dict and set(row) == OBS_KEYS,
             "malformed source claim or fabricated approval field")
        src = row.get("sourceId")
        need(type(src) is str and src in OBSERVATIONS and src not in got,
             "duplicate or invented regional source")
        for dim in ("hMm", "vMm"):
            need(type(row.get(dim)) is int and 0 < row[dim] < 10000,
                 "unsafe/coerced published platen geometry")
        source = OBSERVATIONS[src]
        need((row["publisher"], row["region"], row["url"],
              row["revision"], (row["hMm"], row["vMm"])) == source,
             "manufacturer source specification overwritten: " + src)
        need(row["checked"] == "2026-10-10",
             "unverified source check date altered")
        need(row["url"] in note, "primary manufacturer reference lost")
        got[src] = row
    need(set(got) == set(OBSERVATIONS), "missing conflicting source")
    need(got["fanuc-europe-model"]["vMm"] !=
         got["fanuc-america-model"]["vMm"],
         "region-specific vertical dimension conflict suppressed")
    need("UNRESOLVED" in note and "UNKNOWN" in note
         and "440 × 420" in note and "440 × 240" in note,
         "source discrepancy or quarantine boundary missing from research")
    need(RESEARCH_NOTE.split("/")[-1] in source_index
         and "440×420" in source_index and "440×240" in source_index,
         "conflicting OEM sources not discoverable in index")
    need(type(library) is dict and type(library.get("manufacturers")) is list,
         "machine library has invalid shape")
    for maker in library["manufacturers"]:
        need(type(maker) is dict and type(maker.get("models", [])) is list,
             "invalid machine registry manufacturer")
        for model in maker.get("models", []):
            need(type(model) is dict, "malformed machine record")
            fields = [model.get("id"), model.get("model"),
                      model.get("model_code")]
            aliases = model.get("aliases", [])
            need(type(aliases) is list, "machine aliases must be an array")
            fields += aliases
            need(not any("s30ib" in machine_identity(x) for x in fields),
                 "unresolved α-S30iB geometry promoted to machine library")
    # Other models are unchanged; no pressure/mould-fit setting inferred.


def main() -> None:
    registry = json.loads((ROOT / CONFLICT_PATH).read_text(encoding="utf-8"))
    library = json.loads((ROOT / MACHINE_LIBRARY).read_text(encoding="utf-8"))
    note = (ROOT / RESEARCH_NOTE).read_text(encoding="utf-8")
    index = (ROOT / SOURCE_INDEX).read_text(encoding="utf-8")
    verify(registry, library, note, index)
    print("OEM α-S30iB source-conflict HOLD passed: 3 source claims retained; "
          "US/EU platen size unresolved; no machine-library promotion")


if __name__ == "__main__":
    main()
