from __future__ import annotations

from pathlib import Path
import re

from tools.material_catalog import ROOT, CATALOG, STAGING, load_json, validate_staging, validate_grade, acquisition_status, promotion_readiness


def need(ok, message):
    if not ok:
        raise AssertionError(message)


# 1) Architecture freeze: new domain code belongs under src/domains rather than
# extending the historical root-level patch pattern.
contract = (ROOT / "docs/DOMAIN_ARCHITECTURE_V1.md").read_text(encoding="utf-8")
need("New product capabilities must not be added as new root-level" in contract, "domain architecture freeze contract missing")
need("src/domains/<domain>/" in contract, "domain module destination missing from architecture contract")

# 2-4) Exact-grade schema + staging pipeline + Korean pilot targets.
schema = load_json(ROOT / "data/materials/material-grade.schema.json")
need(schema.get("$schema", "").endswith("2020-12/schema"), "material schema must use JSON Schema 2020-12")
need("propertyObservation" in schema.get("$defs", {}), "material schema lacks property observations")
need("processingObservation" in schema.get("$defs", {}), "material schema lacks processing observations")

pilot = load_json(STAGING / "korea-pilot-v1.json")
expected = {"mfr-lotte-chemical", "mfr-lg-chem", "mfr-kep", "mfr-kolon-enp"}
actual = {x.get("id") for x in pilot.get("manufacturers", [])}
need(expected == actual, f"Korean pilot manufacturer set drift: {actual}")
need(pilot.get("status") == "pilot-in-progress", "Korean pilot top-level progress state is stale")
need(pilot.get("publicationGate", {}).get("allowsDirectStagingToRuntime") is False, "staging must not publish directly to runtime")
need(all(not x.get("gradeRecords") for x in pilot["manufacturers"]), "umbrella Korean pilot manifest must not duplicate exact-grade records")

pilot_by_id = {x["id"]: x for x in pilot["manufacturers"]}
lotte_target = pilot_by_id["mfr-lotte-chemical"]
need(lotte_target.get("stage") == "validated-published-pilot", "LOTTE Korean-pilot progress must reflect the validated published pilot")
need(lotte_target.get("validatedDatasetId") == "lotte-exact-grade-pilot-v1", "LOTTE pilot dataset pointer drift")
need(lotte_target.get("publishedRuntimeCatalog") == "material-catalog-v1.json", "LOTTE runtime catalog pointer drift")

lg_target = pilot_by_id["mfr-lg-chem"]
need(lg_target.get("stage") == "validated-published-pilot", "LG Chem Korean-pilot progress must reflect the validated published pilot")
need(lg_target.get("validatedDatasetId") == "lg-chem-exact-grade-pilot-v1", "LG Chem pilot dataset pointer drift")
need(lg_target.get("publishedRuntimeCatalog") == "material-catalog-v1.json", "LG Chem runtime catalog pointer drift")

kep_target = pilot_by_id["mfr-kep"]
need(kep_target.get("stage") == "validated-published-pilot", "KEPITAL Korean-pilot progress must reflect the validated published pilot")
need(kep_target.get("validatedDatasetId") == "kepital-exact-grade-pilot-v1", "KEPITAL pilot dataset pointer drift")
need(kep_target.get("publishedRuntimeCatalog") == "material-catalog-v1.json", "KEPITAL runtime catalog pointer drift")
need(kep_target.get("name") == "Korea Polyacetal (KPAC)", "KEPITAL pilot must identify the current KPAC primary-source owner while retaining mfr-kep")

kolon_target = pilot_by_id["mfr-kolon-enp"]
need(kolon_target.get("stage") == "source-reviewed-staging", "KOLON ENP umbrella state must reflect completed primary-source review without implying validation")
need(kolon_target.get("stagingDatasetId") == "kolon-enp-exact-grade-pilot-v1", "KOLON ENP staging dataset pointer drift")
kolon_pilot = load_json(STAGING / "kolon-enp-exact-grade-pilot-v1.json")
need(kolon_pilot.get("status") == "source-reviewed-staging", "KOLON ENP exact-grade dataset status drift")
kolon_grades = [g for m in kolon_pilot.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need({g.get("grade") for g in kolon_grades} == {"K300", "K700", "K100HS", "GF702"}, "KOLON ENP sour