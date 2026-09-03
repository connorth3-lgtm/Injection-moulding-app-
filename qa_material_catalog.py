from __future__ import annotations

from pathlib import Path
import re

from tools.material_catalog import ROOT, CATALOG, STAGING, load_json, validate_staging, validate_grade


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

for pending_id in ("mfr-kep", "mfr-kolon-enp"):
    need(pilot_by_id[pending_id].get("stage") == "discovery-pending", f"unsourced Korean pilot target must remain discovery-pending: {pending_id}")
progress = pilot.get("progress") or {}
need(progress.get("targetManufacturers") == 4, "Korean pilot target-manufacturer count drift")
need(progress.get("validatedManufacturers") == 2, "Korean pilot validated-manufacturer count must reflect LOTTE + LG Chem")
need(progress.get("publishedExactGrades") == 7, "Korean pilot published exact-grade count must reflect LOTTE + LG Chem pilots")

errors = validate_staging()
need(not errors, "material staging semantic QA failed:\n" + "\n".join(errors))

# Runtime catalog is a generated/validated public snapshot at repository root;
# source schemas and staging remain under data/ and outside the Pages allowlist.
need(CATALOG == ROOT / "material-catalog-v1.json", "runtime catalog must remain outside private data/ staging tree")
catalog = load_json(CATALOG)
need(catalog.get("schemaVersion") == 1, "material catalog schema version drift")
need(catalog.get("catalogVersion") == "generated", "material catalog must use the compiler-owned generated version marker")
need("variant/revision/production identity differs" in str(catalog.get("boundary") or ""), "material catalog boundary does not describe variant-safe identity")
need({m.get("id") for m in catalog.get("manufacturers") or []} == {"mfr-lg-chem", "mfr-lotte-chemical"}, "runtime manufacturer set drift")
need(isinstance(catalog.get("grades"), list), "material catalog grades must be a list")
for idx, grade in enumerate(catalog["grades"]):
    grade_errors = validate_grade(grade, f"catalog grade[{idx}]")
    need(not grade_errors, "published material catalog failed semantic QA:\n" + "\n".join(grade_errors))
    need((grade.get("provenance") or {}).get("stage") in {"validated", "published"}, "runtime catalog contains non-validated grade")

# Publication drift gate: every validated/published staging record must appear
# exactly once in the public runtime snapshot, and no extra runtime grade may
# bypass staging. This turns the compile boundary into an auditable invariant.
staged_grade_ids = set()
for staging_path in sorted(STAGING.glob("*.json")):
    staging_payload = load_json(staging_path)
    for manufacturer in staging_payload.get("manufacturers") or []:
        for grade in manufacturer.get("gradeRecords") or []:
            if (grade.get("provenance") or {}).get("stage") in {"validated", "published"}:
                gid = grade.get("id")
                need(gid not in staged_grade_ids, f"duplicate validated staging grade id: {gid}")
                staged_grade_ids.add(gid)
runtime_grade_ids = {grade.get("id") for grade in catalog.get("grades") or []}
need(staged_grade_ids == runtime_grade_ids, f"runtime/staging material drift: staged={sorted(staged_grade_ids)} runtime={sorted(runtime_grade_ids)}")
need(len(runtime_grade_ids) == 7, "runtime exact-grade count must remain seven for the two-manufacturer Korean pilot")

# Pilot proof: current primary-source LOTTE records remain unchanged while the
# umbrella manifest records progress without copying exact-grade claims.
lotte_pilot = load_json(STAGING / "lotte-exact-grade-pilot-v1.json")
lotte_grades = [g for m in lotte_pilot.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need({g.get("grade") for g in lotte_grades} == {"NH-1033", "NH-1034R", "AE-3060 H", "XP-2140C"}, "LOTTE exact-grade pilot set drift")
lotte_grade_ids = {g.get("id") for g in lotte_grades}
need(set(lotte_target.get("validatedGradeIds") or []) == lotte_grade_ids, "Korean pilot LOTTE grade-ID progress does not match validated dataset")
need(lotte_target.get("publishedGradeCount") == len(lotte_grade_ids) == 4, "Korean pilot LOTTE published-grade count drift")
need(lotte_grade_ids.issubset(runtime_grade_ids), "Korean pilot LOTTE validated grades are not all published in runtime catalog")
for grade in lotte_grades:
    need((grade.get("provenance") or {}).get("stage") == "validated", f"LOTTE pilot grade is not validated: {grade.get('id')}")
    need(all(str(source.get("url", "")).startswith("https://product.lottechem.com/") for source in grade.get("sources") or []), f"LOTTE pilot grade has a non-primary source: {grade.get('id')}")

# LG Chem pilot proof: three exact LUPOY grades come only from current LG Chem
# / LG Chem On primary TDS records. Numeric comparison values are pinned here so
# source/staging/runtime drift cannot silently alter their engineering meaning.
lg_pilot = load_json(STAGING / "lg-chem-exact-grade-pilot-v1.json")
need(lg_pilot.get("datasetId") == "lg-chem-exact-grade-pilot-v1", "LG Chem exact-grade dataset id drift")
need(lg_pilot.get("status") == "validated-pilot", "LG Chem exact-grade dataset status drift")
lg_grades = [g for m in lg_pilot.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need({g.get("grade") for g in lg_grades} == {"GP1000L", "GP1000ML", "GP5206F"}, "LG Chem exact-grade pilot set drift")
lg_grade_ids = {g.get("id") for g in lg_grades}
need(set(lg_target.get("validatedGradeIds") or []) == lg_grade_ids, "Korean pilot LG Chem grade-ID progress does not match validated dataset")
need(lg_target.get("publishedGradeCount") == len(lg_grade_ids) == 3, "Korean pilot LG Chem published-grade count drift")
need(lg_grade_ids.issubset(runtime_grade_ids), "Korean pilot LG Chem validated grades are not all published in runtime catalog")

lg_by_grade = {g["grade"]: g for g in lg_grades}
for grade in lg_grades:
    gid = grade.get("id")
    need((grade.get("provenance") or {}).get("stage") == "validated", f"LG Chem pilot grade is not validated: {gid}")
    need((grade.get("lifecycle") or {}).get("status") == "unknown", f"LG Chem lifecycle must remain conservative/unknown: {gid}")
    sources = grade.get("sources") or []
    need(len(sources) == 1, f"LG Chem pilot grade must retain exactly one reviewed exact-grade TDS: {gid}")
    source = sources[0]
    need(source.get("publisher") == "LG Chem", f"LG Chem source publisher drift: {gid}")
    need(source.get("kind") == "manufacturer-datasheet", f"LG Chem source kind drift: {gid}")
    need(str(source.get("url", "")).startswith("https://www.lgchemon.com/"), f"LG Chem pilot grade has a non-primary source: {gid}")
    need(bool(source.get("documentDate")), f"LG Chem exact-grade source must retain documentDate: {gid}")
    need(source.get("retrievedAt") == "2026-09-03", f"LG Chem source retrieval date drift: {gid}")
    need(all(obs.get("productionRecipe") is False for obs in grade.get("processing") or []), f"LG Chem processing guidance became a production recipe: {gid}")


def observation(grade, oid):
    matches = [x for x in grade.get("properties") or [] if x.get("id") == oid]
    need(len(matches) == 1, f"expected exactly one property observation {oid}")
    return matches[0]


def processing(grade, oid):
    matches = [x for x in grade.get("processing") or [] if x.get("id") == oid]
    need(len(matches) == 1, f"expected exactly one processing observation {oid}")
    return matches[0]


def assert_mfr(grade, oid, value, temp, load):
    obs = observation(grade, oid)
    need(obs.get("property") == "Melt Flow Rate", f"LG Chem MFR property name drift: {oid}")
    need(obs.get("value") == value and obs.get("unit") == "g/10min", f"LG Chem MFR value/unit drift: {oid}")
    need(obs.get("testMethod") == "ISO 1133", f"LG Chem MFR method drift: {oid}")
    need(obs.get("temperatureC") == temp and obs.get("loadKg") == load, f"LG Chem MFR test condition drift: {oid}")
    need(obs.get("comparisonReady") is True, f"LG Chem MFR must remain comparison-ready: {oid}")


def assert_shrinkage_pair(grade, stem, value):
    flow = observation(grade, f"{stem}-flow")
    transverse = observation(grade, f"{stem}-transverse")
    for obs, direction in ((flow, "flow"), (transverse, "transverse")):
        need(obs.get("property") == "Mould Shrinkage", f"LG Chem shrinkage property name drift: {obs.get('id')}")
        need(obs.get("value") == value and obs.get("unit") == "%", f"LG Chem shrinkage value/unit drift: {obs.get('id')}")
        need(obs.get("testMethod") == "ISO 294-4" and obs.get("specimen") == "2.0 mm", f"LG Chem shrinkage method/specimen drift: {obs.get('id')}")
        need(obs.get("direction") == direction and obs.get("comparisonReady") is True, f"LG Chem shrinkage direction/readiness drift: {obs.get('id')}")


gp1000l = lg_by_grade["GP1000L"]
assert_mfr(gp1000l, "obs-lgchem-gp1000l-mfr", 23.4, 300, 1.2)
assert_shrinkage_pair(gp1000l, "obs-lgchem-gp1000l-shrink", "0.6-0.8")
need((gp1000l.get("sources") or [])[0].get("documentDate") == "2025-12-02", "GP1000L TDS document date drift")
need("intermittently redirects" in str((gp1000l.get("provenance") or {}).get("notes") or ""), "GP1000L endpoint limitation note missing")

gp1000ml = lg_by_grade["GP1000ML"]
assert_mfr(gp1000ml, "obs-lgchem-gp1000ml-mfr", 15.0, 300, 1.2)
assert_shrinkage_pair(gp1000ml, "obs-lgchem-gp1000ml-shrink", "0.6-0.8")
need((gp1000ml.get("sources") or [])[0].get("documentDate") == "2025-02-10", "GP1000ML TDS document date drift")
need((processing(gp1000ml, "proc-lgchem-gp1000ml-dry-temp").get("min"), processing(gp1000ml, "proc-lgchem-gp1000ml-dry-temp").get("max")) == (100, 120), "GP1000ML drying-temperature range drift")
need((processing(gp1000ml, "proc-lgchem-gp1000ml-melt-temp").get("min"), processing(gp1000ml, "proc-lgchem-gp1000ml-melt-temp").get("max")) == (300, 320), "GP1000ML melt-temperature range drift")
need((processing(gp1000ml, "proc-lgchem-gp1000ml-mould-temp").get("min"), processing(gp1000ml, "proc-lgchem-gp1000ml-mould-temp").get("max")) == (80, 120), "GP1000ML mould-temperature range drift")
need(processing(gp1000ml, "proc-lgchem-gp1000ml-max-moisture").get("value") == 0.02, "GP1000ML maximum-moisture limit drift")

gp5206f = lg_by_grade["GP5206F"]
assert_mfr(gp5206f, "obs-lgchem-gp5206f-mfr", 3.0, 250, 2.16)
assert_shrinkage_pair(gp5206f, "obs-lgchem-gp5206f-shrink", "0.2-0.4")
need((gp5206f.get("sources") or [])[0].get("documentDate") == "2025-02-10", "GP5206F TDS document date drift")
need((gp5206f.get("composition") or {}).get("glassFibrePct") == 20, "GP5206F exact GF20% composition drift")
need((gp5206f.get("composition") or {}).get("flameRetardant") is True, "GP5206F flame-retardant claim drift")
need((processing(gp5206f, "proc-lgchem-gp5206f-dry-temp").get("min"), processing(gp5206f, "proc-lgchem-gp5206f-dry-temp").get("max")) == (75, 85), "GP5206F drying-temperature range drift")
need((processing(gp5206f, "proc-lgchem-gp5206f-melt-temp").get("min"), processing(gp5206f, "proc-lgchem-gp5206f-melt-temp").get("max")) == (235, 265), "GP5206F melt-temperature range drift")
need((processing(gp5206f, "proc-lgchem-gp5206f-mould-temp").get("min"), processing(gp5206f, "proc-lgchem-gp5206f-mould-temp").get("max")) == (50, 80), "GP5206F mould-temperature range drift")
need(processing(gp5206f, "proc-lgchem-gp5206f-max-moisture").get("value") == 0.02, "GP5206F maximum-moisture limit drift")

# 5-6) Cross-domain material links and IndexedDB engineering store.
store = (ROOT / "src/domains/engineering/engineering-store.js").read_text(encoding="utf-8")
need("materialGradeId" in store, "engineering store does not model exact-grade links")
need("indexedDB.open" in store, "engineering store must use IndexedDB")
need("migrateLegacyMouldMasterCases" in store, "engineering store lacks additive legacy case migration")
need("destructive:false" in store, "legacy migration must remain explicitly non-destructive")

registry = (ROOT / "src/domains/materials/material-registry.js").read_text(encoding="utf-8")
need("./material-catalog-v1.json" in registry, "material registry is not backed by validated public catalog")
need("comparisonReady" in registry, "material registry must expose semantic comparison readiness")
need("startMouldMasterCase" in registry and "materialGradeId" in registry, "exact-grade Materials -> Mould Master bridge missing")
need("mmExactMaterialCatalog" in registry, "exact-grade material catalogue is not visible in Materials UI")

# 8) Migration rule: foundation modules are grouped under src/domains and the
# shell only adds one manifest-driven bootstrap entry.
foundation_domain_files = list((ROOT / "src/domains").rglob("*.js"))
need(len(foundation_domain_files) >= 4, "domain modularisation foundation unexpectedly small")
for path in foundation_domain_files:
    need(path.is_file(), f"missing domain module {path}")
index = (ROOT / "index.html").read_text(encoding="utf-8")
need(index.count("./src/domains/domain-bootstrap.js") == 2, "shell must contain exactly one bootstrap source pair")
need("./src/domains/engineering/engineering-store.js" not in index, "shell must not hand-list individual domain modules")

# 9) Runtime domain manifest enumerates new modules without hand-copying the
# giant legacy BODY_SCRIPTS list. It and the validated catalog are public root
# snapshots; internal data/ schemas and staging are not served.
manifest_path = ROOT / "runtime-domain-manifest.json"
manifest = load_json(manifest_path)
assets = manifest.get("assets", [])
for required in [
    "./src/domains/engineering/engineering-store.js",
    "./src/domains/materials/material-registry.js",
    "./src/domains/shell/product-areas.js",
]:
    need(required in assets, f"runtime domain manifest missing {required}")
need(manifest.get("dataAssets") == ["./material-catalog-v1.json"], "runtime manifest must expose only validated material catalog")
service_worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
for required in ["./src/domains/domain-bootstrap.js", "./runtime-domain-manifest.json", *assets, "./material-catalog-v1.json"]:
    need(required in service_worker, f"offline core missing domain asset {required}")
need("./data/materials/" not in service_worker and "./data/runtime-domain-manifest.json" not in service_worker, "service worker must not publish material staging/schema tree")

# Desktop remains integrity-verified while allowing only explicitly allow-listed
# safe relative nested paths.
desktop_main = (ROOT / "desktop/electron/src/main.cjs").read_text(encoding="utf-8")
need("safeRelativeAsset" in desktop_main and "allowedFiles.has(name)" in desktop_main, "desktop nested domain serving is not allow-list constrained")
integrity_generator = (ROOT / "desktop/electron/scripts/generate-integrity.cjs").read_text(encoding="utf-8")
for required in ["src/domains/domain-bootstrap.js", "runtime-domain-manifest.json", "src/domains/engineering/engineering-store.js", "src/domains/materials/material-registry.js", "src/domains/shell/product-areas.js", "material-catalog-v1.json"]:
    need(required in integrity_generator, f"desktop integrity generation missing {required}")
package = load_json(ROOT / "desktop/electron/package.json")
extra_from = {x.get("from") for x in package["build"]["extraResources"] if isinstance(x, dict)}
for required in ["../../src/domains", "../../runtime-domain-manifest.json", "../../material-catalog-v1.json"]:
    need(required in extra_from, f"desktop package missing domain resource {required}")

# Public Pages builder intentionally excludes data/. New runtime assets must be
# compatible with that established boundary rather than weakening it.
pages_builder = (ROOT / "tools/build_pages_artifact.py").read_text(encoding="utf-8")
need('"data/",' in pages_builder, "Pages private-data boundary unexpectedly removed")
need("./data/" not in registry, "runtime material registry must not fetch private data/ assets")

# 10) Five canonical product areas.
areas = (ROOT / "src/domains/shell/product-areas.js").read_text(encoding="utf-8")
for name in ["Learn", "Materials", "Diagnose", "Analyse", "Evidence"]:
    need(re.search(rf"['\"]{name}['\"]", areas) is not None, f"canonical product area missing: {name}")
need("What do you need to do?" in areas, "task-first product-area UI missing")

print(
    "MouldMaster domain/material foundation QA passed: "
    f"{len(pilot['manufacturers'])} Korean pilot manufacturers; "
    f"{progress['validatedManufacturers']} validated manufacturers; "
    f"{len(catalog['grades'])} published exact grades; "
    f"{len(foundation_domain_files)} domain modules"
)
