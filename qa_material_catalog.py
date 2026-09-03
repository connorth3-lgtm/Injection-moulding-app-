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
need(pilot.get("publicationGate", {}).get("allowsDirectStagingToRuntime") is False, "staging must not publish directly to runtime")
need(all(not x.get("gradeRecords") for x in pilot["manufacturers"]), "discovery target manifest must not contain source-free grade records")

errors = validate_staging()
need(not errors, "material staging semantic QA failed:\n" + "\n".join(errors))

# Runtime catalog is a generated/validated public snapshot at repository root;
# source schemas and staging remain under data/ and outside the Pages allowlist.
need(CATALOG == ROOT / "material-catalog-v1.json", "runtime catalog must remain outside private data/ staging tree")
catalog = load_json(CATALOG)
need(catalog.get("schemaVersion") == 1, "material catalog schema version drift")
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

# Pilot proof: exact-grade rollout has begun with current primary-source LOTTE
# records without changing the source-free discovery target manifest.
lotte_pilot = load_json(STAGING / "lotte-exact-grade-pilot-v1.json")
lotte_grades = [g for m in lotte_pilot.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need({g.get("grade") for g in lotte_grades} == {"NH-1033", "NH-1034R", "AE-3060 H", "XP-2140C"}, "LOTTE exact-grade pilot set drift")
for grade in lotte_grades:
    need((grade.get("provenance") or {}).get("stage") == "validated", f"LOTTE pilot grade is not validated: {grade.get('id')}")
    need(all(str(source.get("url", "")).startswith("https://product.lottechem.com/") for source in grade.get("sources") or []), f"LOTTE pilot grade has a non-primary source: {grade.get('id')}")

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
    f"{len(catalog['grades'])} published exact grades; "
    f"{len(foundation_domain_files)} domain modules"
)
