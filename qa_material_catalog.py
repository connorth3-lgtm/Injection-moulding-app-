from __future__ import annotations

from pathlib import Path
import json
import re

from tools.material_catalog import ROOT, CATALOG, STAGING, load_json, validate_staging, validate_grade


def need(ok, message):
    if not ok:
        raise AssertionError(message)


# 1) Architecture freeze: new domain code belongs under src/domains rather than
# extending the historical root-level patch pattern.
contract = (ROOT / "docs/DOMAIN_ARCHITECTURE_V1.md").read_text(encoding="utf-8")
need("New product capabilities must not be added as new root-level" in contract, "domain architecture freeze contract missing")

# 2-4) Exact-grade schema + staging pipeline + Korean pilot targets.
schema = load_json(ROOT / "data/materials/material-grade.schema.json")
need(schema.get("$schema", "").endswith("2020-12/schema"), "material schema must use JSON Schema 2020-12")
need("propertyObservation" in schema.get("$defs", {}), "material schema lacks property observations")
need("processingObservation" in schema.get("$defs", {}), "material schema lacks processing observations")

pilot = load_json(STAGING / "korea-pilot-v1.json")
expected = {"mfr-lotte-chemical", "mfr-lg-chem", "mfr-kep", "mfr-kolon-enp"}
actual = {x.get("id") for x in pilot.get("manufacturers", [])}
need(expected == actual, f"Korean pilot manufacturer set drift: {actual}")
need(pilot.get("publicationGate", {}).get("allowsDirectStagingToRuntime") is False, "staging must not publish directly to runtime")

errors = validate_staging()
need(not errors, "material staging semantic QA failed:\n" + "\n".join(errors))

catalog = load_json(CATALOG)
need(catalog.get("schemaVersion") == 1, "material catalog schema version drift")
need(isinstance(catalog.get("grades"), list), "material catalog grades must be a list")
for idx, grade in enumerate(catalog["grades"]):
    grade_errors = validate_grade(grade, f"catalog grade[{idx}]")
    need(not grade_errors, "published material catalog failed semantic QA:\n" + "\n".join(grade_errors))
    need((grade.get("provenance") or {}).get("stage") in {"validated", "published"}, "runtime catalog contains non-validated grade")

# 5-6) Cross-domain material links and IndexedDB engineering store.
store = (ROOT / "src/domains/engineering/engineering-store.js").read_text(encoding="utf-8")
need("materialGradeId" in store, "engineering store does not model exact-grade links")
need("indexedDB.open" in store, "engineering store must use IndexedDB")
need("migrateLegacyMouldMasterCases" in store, "engineering store lacks additive legacy case migration")

registry = (ROOT / "src/domains/materials/material-registry.js").read_text(encoding="utf-8")
need("catalog-v1.json" in registry, "material registry is not backed by canonical catalog")
need("comparisonReady" in registry, "material registry must expose semantic comparison readiness")

# 8) Migration rule: domain foundation itself must not add new root-level
# fix/hardening/finalize/extension scripts.
foundation_domain_files = list((ROOT / "src/domains").rglob("*.js"))
need(len(foundation_domain_files) >= 3, "domain modularisation foundation unexpectedly small")
for path in foundation_domain_files:
    need(path.is_file(), f"missing domain module {path}")

# 9) Runtime domain manifest must enumerate the new modules without hand-copying
# the giant legacy BODY_SCRIPTS list.
manifest = load_json(ROOT / "data/runtime-domain-manifest.json")
assets = manifest.get("assets", [])
for required in [
    "./src/domains/engineering/engineering-store.js",
    "./src/domains/materials/material-registry.js",
    "./src/domains/shell/product-areas.js",
]:
    need(required in assets, f"runtime domain manifest missing {required}")

# 10) Five canonical product areas.
areas = (ROOT / "src/domains/shell/product-areas.js").read_text(encoding="utf-8")
for name in ["Learn", "Materials", "Diagnose", "Analyse", "Evidence"]:
    need(re.search(rf"['\"]{name}['\"]", areas) is not None, f"canonical product area missing: {name}")

print(
    "MouldMaster domain/material foundation QA passed: "
    f"{len(pilot['manufacturers'])} Korean pilot manufacturers; "
    f"{len(catalog['grades'])} published exact grades; "
    f"{len(foundation_domain_files)} domain modules"
)
