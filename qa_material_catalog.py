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
need({g.get("grade") for g in kolon_grades} == {"K300", "K700", "K100HS", "GF702"}, "KOLON ENP source-reviewed exact-grade set drift")
kolon_grade_ids = {g.get("id") for g in kolon_grades}
need(set(kolon_target.get("sourceReviewedGradeIds") or []) == kolon_grade_ids, "KOLON ENP umbrella grade IDs do not match reviewed staging dataset")
need(kolon_target.get("sourceReviewedGradeCount") == len(kolon_grade_ids) == 4, "KOLON ENP source-reviewed grade count drift")
for grade in kolon_grades:
    gid = grade.get("id")
    need((grade.get("provenance") or {}).get("stage") == "staging", f"KOLON ENP reviewed grade must remain non-validated staging: {gid}")
    need(not (grade.get("properties") or []), f"KOLON ENP numeric properties must remain withheld pending complete test context: {gid}")
    need(all(str(source.get("url", "")).startswith("https://www.kolonplastics.com/") for source in grade.get("sources") or []), f"KOLON ENP reviewed grade has a non-primary source: {gid}")

progress = pilot.get("progress") or {}
need(progress.get("targetManufacturers") == 4, "Korean pilot target-manufacturer count drift")
need(progress.get("sourceReviewedManufacturers") == 4, "Korean pilot source-reviewed manufacturer count must include KOLON ENP")
need(progress.get("validatedManufacturers") == 3, "Korean pilot validated-manufacturer count must reflect LOTTE + LG Chem + KEPITAL only")
need(progress.get("sourceReviewedExactGrades") == 15, "Korean pilot source-reviewed exact-grade count must include four KOLON staging identities")
need(progress.get("publishedExactGrades") == 11, "Korean pilot published exact-grade count must remain LOTTE + LG Chem + KEPITAL only")

errors = validate_staging()
need(not errors, "material staging semantic QA failed:\n" + "\n".join(errors))

promotion = promotion_readiness()
need(promotion.get("stagingOnlyGrades", 0) > 0, "promotion readiness must report the staged-only queue")
need(promotion.get("stagingOnlyGrades") == promotion.get("evidenceReviewCandidates", 0) + promotion.get("blockedGrades", 0), "promotion readiness queue counts do not reconcile")
need("not an automatic publication gate" in promotion.get("boundary", ""), "promotion readiness must preserve explicit human/semantic review boundary")
need(all(row.get("evidenceReviewCandidate") is True and not row.get("blockers") for row in promotion.get("candidates") or []), "promotion candidates must be blocker-free review candidates")

# Runtime catalog is a generated/validated public snapshot at repository root;
# source schemas and staging remain under data/ and outside the Pages allowlist.
need(CATALOG == ROOT / "material-catalog-v1.json", "runtime catalog must remain outside private data/ staging tree")
catalog = load_json(CATALOG)
registry_runtime = (ROOT / "src/domains/materials/material-registry.js").read_text(encoding="utf-8")
for marker in ("decisionComparison", "matchedComparisonRows", "materialChangeReport", "evidenceDelta", "verificationActions", "evidenceCoverage", "changeFlags", "validationGates", "data-mm-run-material-compare", "data-mm-run-material-change", "Material Change Assistant", "Material-change evidence checklist", "not a material ranking or production recipe", "does not prescribe purge/changeover settings", "Do not copy a drying recipe from another grade"):
    need(marker in registry_runtime, f"material decision-support marker missing: {marker}")
need("comparableSignature(ob)!==sig" in registry_runtime, "material decision support must fail closed when test-condition signatures differ")
need("coupon shrinkage and morphology as evidence inputs, not a part-warpage prediction" in registry_runtime, "material warpage reasoning boundary missing")
need("missing-one-side" in registry_runtime and "not-directly-comparable" in registry_runtime, "material change assistant must distinguish evidence gaps from incompatible comparisons")
need("Close important evidence gaps" in registry_runtime, "material change assistant must make missing evidence actionable without assuming equivalence")
need(catalog.get("schemaVersion") == 1, "material catalog schema version drift")
need(catalog.get("catalogVersion") == "generated", "material catalog must use the compiler-owned generated version marker")
stats = catalog.get("statistics") or {}
need(stats.get("exactGrades") == len(catalog.get("grades") or []) == 260, "catalog exact-grade statistics drift")
need(stats.get("manufacturers") == len(catalog.get("manufacturers") or []) == 28, "catalog manufacturer statistics drift")
catalog_countries = {m.get("country") for m in catalog.get("manufacturers") or [] if m.get("country")}
catalog_families = {(g.get("polymer") or {}).get("family") for g in catalog.get("grades") or [] if (g.get("polymer") or {}).get("family")}
catalog_properties = [obs for g in catalog.get("grades") or [] for obs in g.get("properties") or []]
catalog_processing = [obs for g in catalog.get("grades") or [] for obs in g.get("processing") or []]
need(stats.get("countries") == len(catalog_countries) == 13, "catalog country statistics drift")
need(stats.get("polymerFamilies") == len(catalog_families) == 32, "catalog family statistics drift")
need(stats.get("propertyObservations") == len(catalog_properties) == 536, "catalog property-observation statistics drift")
need(stats.get("comparisonReadyObservations") == sum(1 for obs in catalog_properties if obs.get("comparisonReady") is True) == 201, "catalog comparison-ready statistics drift")
need(stats.get("processingObservations") == len(catalog_processing) == 225, "catalog processing-observation statistics drift")
need(stats.get("primarySourceGrades") == sum(1 for g in catalog.get("grades") or [] if any(str(s.get("kind") or "").startswith("manufacturer-") for s in g.get("sources") or [])) == 256, "catalog primary-source statistics drift")
need("variant/revision/production identity differs" in str(catalog.get("boundary") or ""), "material catalog boundary does not describe variant-safe identity")
catalog_manufacturer_ids = {m.get("id") for m in catalog.get("manufacturers") or []}
runtime_manufacturer_ids = {(g.get("manufacturer") or {}).get("id") for g in catalog.get("grades") or []}
need(catalog_manufacturer_ids == runtime_manufacturer_ids, f"runtime manufacturer index/grade drift: index={sorted(catalog_manufacturer_ids)} grades={sorted(runtime_manufacturer_ids)}")
need(len(catalog_manufacturer_ids) == 28, "runtime manufacturer count drift")
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
need(len(runtime_grade_ids) == 260, "runtime exact-grade count must include the original Korean pilot, waves through wave22, the 70-grade Vietnam PP / Korea EPS mega wave, and two conditioned Polyplastics POM grades")
pipeline_status = acquisition_status()
need(pipeline_status.get("validatedOrPublishedIds") == len(runtime_grade_ids), "acquisition pipeline validated/runtime reconciliation drift")
need(pipeline_status.get("stagingOnlyIds", 0) >= 370, "mega expansion staged-only acquisition unexpectedly shrank")
need(pipeline_status.get("uniqueExactGradeIds", 0) >= len(runtime_grade_ids) + 370, "mega expansion unique exact-grade acquisition unexpectedly shrank")
need(pipeline_status.get("promotionLineageIds", 0) >= 4, "material promotion-lineage accounting unexpectedly disappeared")
need(kolon_grade_ids.isdisjoint(runtime_grade_ids), "source-reviewed KOLON staging identities must not leak into the validated runtime catalog")

global_wave = load_json(STAGING / "global-material-expansion-20260929-v1.json")
need(global_wave.get("status") == "validated-expansion-with-source-reviewed-queue", "global material expansion status drift")
need((global_wave.get("summary") or {}).get("validatedGrades") == 25, "global material expansion validated-grade count drift")
need((global_wave.get("summary") or {}).get("sourceReviewedStagingGrades") == 8, "global material expansion ABS staging count drift")
global_grades = [g for m in global_wave.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
global_validated = [g for g in global_grades if (g.get("provenance") or {}).get("stage") in {"validated", "published"}]
global_staging = [g for g in global_grades if (g.get("provenance") or {}).get("stage") == "staging"]
need(len(global_validated) == 25 and all(g.get("id") in runtime_grade_ids for g in global_validated), "global validated material records are not fully published")
need(len(global_staging) == 8 and all(g.get("id") not in runtime_grade_ids for g in global_staging), "source-reviewed ABS staging identities leaked into runtime")
need({(g.get("polymer") or {}).get("family") for g in global_validated} == {"PP", "PA6", "PBT", "PEEK"}, "global validated family coverage drift")
need(all((obs.get("productionRecipe") is False) for g in global_validated for obs in g.get("processing") or []), "global expansion supplier guidance became a production recipe")

global_wave2 = load_json(STAGING / "global-material-expansion-20260929-v2.json")
need((global_wave2.get("summary") or {}).get("validatedGrades") == 9, "global material expansion wave2 validated-grade count drift")
need((global_wave2.get("summary") or {}).get("sourceReviewedStagingGrades") == 6, "global material expansion wave2 staging count drift")
global2 = [g for m in global_wave2.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
global2_validated = [g for g in global2 if (g.get("provenance") or {}).get("stage") in {"validated", "published"}]
global2_staging = [g for g in global2 if (g.get("provenance") or {}).get("stage") == "staging"]
need(len(global2_validated) == 9 and all(g.get("id") in runtime_grade_ids for g in global2_validated), "wave2 validated grades are not fully published")
need(len(global2_staging) == 6 and all(g.get("id") not in runtime_grade_ids for g in global2_staging), "wave2 staging identities leaked into runtime")
need({(g.get("polymer") or {}).get("family") for g in global2_validated} == {"PA66", "PBT", "PC", "PA11"}, "wave2 validated family coverage drift")
need(all((obs.get("productionRecipe") is False) for g in global2_validated for obs in g.get("processing") or []), "wave2 supplier guidance became a production recipe")

global_wave3 = load_json(STAGING / "global-material-expansion-20260929-v3.json")
need((global_wave3.get("summary") or {}).get("validatedGrades") == 17, "global material expansion wave3 validated-grade count drift")
need((global_wave3.get("summary") or {}).get("sourceReviewedStagingGrades") == 6, "global material expansion wave3 staging count drift")
global3 = [g for m in global_wave3.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
global3_validated = [g for g in global3 if (g.get("provenance") or {}).get("stage") in {"validated", "published"}]
global3_staging = [g for g in global3 if (g.get("provenance") or {}).get("stage") == "staging"]
need(len(global3_validated) == 17 and all(g.get("id") in runtime_grade_ids for g in global3_validated), "wave3 validated grades are not fully published")
need(len(global3_staging) == 6 and all(g.get("id") not in runtime_grade_ids for g in global3_staging), "wave3 staging identities leaked into runtime")
need({(g.get("polymer") or {}).get("family") for g in global3_validated} == {"PC/ABS", "PBT", "PET"}, "wave3 validated family coverage drift")

global_wave4 = load_json(STAGING / "global-material-expansion-20260929-v4.json")
need((global_wave4.get("summary") or {}).get("validatedGrades") == 4, "global material expansion wave4 validated-grade count drift")
need((global_wave4.get("summary") or {}).get("sourceReviewedStagingGrades") == 40, "global material expansion wave4 staging count drift")
global4 = [g for m in global_wave4.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
global4_validated = [g for g in global4 if (g.get("provenance") or {}).get("stage") in {"validated", "published"}]
global4_staging = [g for g in global4 if (g.get("provenance") or {}).get("stage") == "staging"]
need(len(global4_validated) == 4 and all(g.get("id") in runtime_grade_ids for g in global4_validated), "wave4 validated grades are not fully published")
need(len(global4_staging) == 40, "wave4 staging identity count drift")
global_wave8 = load_json(STAGING / "global-material-expansion-20260929-v8.json")
global8 = [g for m in global_wave8.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
wave8_promoted_ids = {g.get("id") for g in global8 if (g.get("provenance") or {}).get("stage") in {"validated", "published"}}
wave4_staging_ids = {g.get("id") for g in global4_staging}
promoted_from_wave4 = wave4_staging_ids & wave8_promoted_ids
need(promoted_from_wave4 == {"mat-celanese-vectra-a115", "mat-celanese-vectra-a130", "mat-celanese-vectra-e130i", "mat-celanese-vectra-e150i"}, "wave4-to-wave8 explicit promotion set drift")
need(all(gid in runtime_grade_ids for gid in promoted_from_wave4), "wave8 promoted Vectra grades missing from runtime")
need(all(gid not in runtime_grade_ids for gid in wave4_staging_ids - promoted_from_wave4), "unpromoted wave4 staging identities leaked into runtime")
need({(g.get("polymer") or {}).get("family") for g in global4_validated} == {"PMMA", "TPU", "PPS"}, "wave4 validated family coverage drift")

global_wave5 = load_json(STAGING / "global-material-expansion-20260929-v5.json")
need((global_wave5.get("summary") or {}).get("validatedGrades") == 19, "global material expansion wave5 validated-grade count drift")
need((global_wave5.get("summary") or {}).get("sourceReviewedStagingGrades") == 4, "global material expansion wave5 staging count drift")
global5 = [g for m in global_wave5.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
global5_validated = [g for g in global5 if (g.get("provenance") or {}).get("stage") in {"validated", "published"}]
global5_staging = [g for g in global5 if (g.get("provenance") or {}).get("stage") == "staging"]
need(len(global5_validated) == 19 and all(g.get("id") in runtime_grade_ids for g in global5_validated), "wave5 validated grades are not fully published")
need(len(global5_staging) == 4 and all(g.get("id") not in runtime_grade_ids for g in global5_staging), "wave5 staging identities leaked into runtime")
need({(g.get("polymer") or {}).get("family") for g in global5_validated} == {"HDPE"}, "wave5 validated family coverage drift")
need(all(obs.get("comparisonReady") is False for g in global5_validated for obs in g.get("properties") or [] if obs.get("property") == "Melt Flow Rate"), "HDPE MFR must remain context-only until test temperature is explicitly sourced")

global_wave6 = load_json(STAGING / "global-material-expansion-20260929-v6.json")
need((global_wave6.get("summary") or {}).get("validatedGrades") == 7, "global material expansion wave6 validated-grade count drift")
need((global_wave6.get("summary") or {}).get("sourceReviewedStagingGrades") == 23, "global material expansion wave6 staging count drift")
global6 = [g for m in global_wave6.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
global6_validated = [g for g in global6 if (g.get("provenance") or {}).get("stage") in {"validated", "published"}]
global6_staging = [g for g in global6 if (g.get("provenance") or {}).get("stage") == "staging"]
need(len(global6_validated) == 7 and all(g.get("id") in runtime_grade_ids for g in global6_validated), "wave6 validated grades are not fully published")
need(len(global6_staging) == 23 and all(g.get("id") not in runtime_grade_ids for g in global6_staging), "wave6 staging identities leaked into runtime")
need({(g.get("polymer") or {}).get("family") for g in global6_validated} == {"ABS", "ASA", "SAN", "GPPS", "HIPS"}, "wave6 validated family coverage drift")

global_wave7 = load_json(STAGING / "global-material-expansion-20260929-v7.json")
need((global_wave7.get("summary") or {}).get("validatedGrades") == 9, "global material expansion wave7 validated-grade count drift")
global7 = [g for m in global_wave7.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need(len(global7) == 9 and all(g.get("id") in runtime_grade_ids for g in global7), "wave7 Asia-Pacific grades are not fully published")
need({(g.get("polymer") or {}).get("family") for g in global7} == {"PP", "PA9T", "PA6", "PBT"}, "wave7 validated family coverage drift")
need(all((obs.get("productionRecipe") is False) for g in global7 for obs in g.get("processing") or []), "wave7 supplier guidance became a production recipe")

global_wave8 = load_json(STAGING / "global-material-expansion-20260929-v8.json")
need((global_wave8.get("summary") or {}).get("validatedGrades") == 4, "global material expansion wave8 validated-grade count drift")
global8 = [g for m in global_wave8.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need(len(global8) == 4 and all(g.get("id") in runtime_grade_ids for g in global8), "wave8 LCP grades are not fully published")
need({(g.get("polymer") or {}).get("family") for g in global8} == {"LCP"}, "wave8 validated family coverage drift")
need(all(obs.get("comparisonReady") is False for g in global8 for obs in g.get("properties") or [] if obs.get("property") == "Mould Shrinkage"), "LCP shrinkage must remain context-only until specimen/conditioning semantics are fully resolved")

global_wave9 = load_json(STAGING / "global-material-expansion-20260929-v9.json")
need((global_wave9.get("summary") or {}).get("validatedGrades") == 7, "global material expansion wave9 validated-grade count drift")
need((global_wave9.get("summary") or {}).get("sourceReviewedStagingGrades") == 3, "global material expansion wave9 staging count drift")
global9 = [g for m in global_wave9.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
global9_validated = [g for g in global9 if (g.get("provenance") or {}).get("stage") in {"validated", "published"}]
global9_staging = [g for g in global9 if (g.get("provenance") or {}).get("stage") == "staging"]
need(len(global9_validated) == 7 and all(g.get("id") in runtime_grade_ids for g in global9_validated), "wave9 validated grades are not fully published")
need(len(global9_staging) == 3 and all(g.get("id") not in runtime_grade_ids for g in global9_staging), "wave9 staging identities leaked into runtime")
need({(g.get("polymer") or {}).get("family") for g in global9_validated} == {"PP", "HDPE"}, "wave9 validated family coverage drift")

global_wave10 = load_json(STAGING / "global-material-expansion-20260929-v10.json")
need((global_wave10.get("summary") or {}).get("validatedGrades") == 10, "global material expansion wave10 validated-grade count drift")
need((global_wave10.get("summary") or {}).get("sourceReviewedStagingGrades") == 1, "global material expansion wave10 staging count drift")
global10 = [g for m in global_wave10.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
global10_validated = [g for g in global10 if (g.get("provenance") or {}).get("stage") in {"validated", "published"}]
global10_staging = [g for g in global10 if (g.get("provenance") or {}).get("stage") == "staging"]
need(len(global10_validated) == 10 and all(g.get("id") in runtime_grade_ids for g in global10_validated), "wave10 LSR/TPV grades are not fully published")
need(len(global10_staging) == 1 and all(g.get("id") not in runtime_grade_ids for g in global10_staging), "wave10 TPV staging identity leaked into runtime")
need({(g.get("polymer") or {}).get("family") for g in global10_validated} == {"LSR", "TPV"}, "wave10 validated family coverage drift")
need(all((obs.get("productionRecipe") is False) for g in global10_validated for obs in g.get("processing") or []), "LSR supplier guidance became a production recipe")

global_wave11 = load_json(STAGING / "global-material-expansion-20260929-v11.json")
need((global_wave11.get("summary") or {}).get("validatedGrades") == 31, "Singapore TAFMER wave validated-grade count drift")
need((global_wave11.get("summary") or {}).get("countryFocus") == "Singapore", "Singapore TAFMER wave country focus drift")
global11 = [g for m in global_wave11.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need(len(global11) == 31 and all(g.get("id") in runtime_grade_ids for g in global11), "Singapore TAFMER grades are not fully published")
need({(g.get("polymer") or {}).get("family") for g in global11} == {"AOC elastomer"}, "Singapore TAFMER family coverage drift")
tafmer_mfr = [obs for g in global11 for obs in g.get("properties") or [] if obs.get("property") == "Melt Flow Rate"]
need(all((obs.get("testMethod") and obs.get("temperatureC") is not None and obs.get("loadKg") is not None) for obs in tafmer_mfr if obs.get("comparisonReady") is True), "comparison-ready Singapore TAFMER MFR is missing method/temperature/load")
need(all(obs.get("comparisonReady") is False for obs in tafmer_mfr if not (obs.get("testMethod") and obs.get("temperatureC") is not None and obs.get("loadKg") is not None)), "under-conditioned Singapore TAFMER MFR became comparison-ready")

singapore_evidence = load_json(ROOT / "data/materials/singapore-material-evidence-20260929-v1.json")
need(singapore_evidence.get("country") == "Singapore", "Singapore regional material evidence country drift")
need({x.get("organization") for x in singapore_evidence.get("facilities") or []} == {"Arkema", "Mitsui Elastomers Singapore", "ExxonMobil"}, "Singapore facility evidence set drift")
need((singapore_evidence.get("governance") or {}).get("regionalEvidenceDoesNotImplyExactGradeOrigin") is True, "Singapore evidence must not imply exact-grade plant origin")

global_wave12 = load_json(STAGING / "global-material-expansion-20260929-v12.json")
need((global_wave12.get("summary") or {}).get("validatedGrades") == 8, "Singapore-linked ExxonMobil PP wave validated-grade count drift")
global12 = [g for m in global_wave12.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need(len(global12) == 8 and all(g.get("id") in runtime_grade_ids for g in global12), "Singapore-linked ExxonMobil PP grades are not fully published")
need(all(any("Singapore" in str(s.get("title", "")) for s in g.get("sources") or []) for g in global12), "ExxonMobil PP records lost Singapore family-level provenance")
need(all("does not claim Singapore plant-of-origin" in str((g.get("provenance") or {}).get("notes", "")) for g in global12), "ExxonMobil exact-grade Singapore origin boundary missing")

global_wave13 = load_json(STAGING / "global-material-expansion-20260929-v13.json")
need((global_wave13.get("summary") or {}).get("validatedGrades") == 5, "Singapore high-heat wave validated-grade count drift")
global13 = [g for m in global_wave13.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need(len(global13) == 5 and all(g.get("id") in runtime_grade_ids for g in global13), "Singapore-linked PEI/TPI grades are not fully published")
need({(g.get("polymer") or {}).get("family") for g in global13} == {"PEI", "TPI"}, "Singapore high-heat family coverage drift")
need(all(obs.get("comparisonReady") is False for g in global13 for obs in g.get("properties") or [] if obs.get("property") == "Glass Transition Temperature"), "PEI/TPI Tg must remain context-only without formal test methods")

global_wave14 = load_json(STAGING / "global-material-expansion-20260929-v14.json")
need((global_wave14.get("summary") or {}).get("validatedGrades") == 7, "Singapore-linked Vistamaxx wave validated-grade count drift")
global14 = [g for m in global_wave14.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need(len(global14) == 7 and all(g.get("id") in runtime_grade_ids for g in global14), "Singapore-linked Vistamaxx grades are not fully published")
need({(g.get("polymer") or {}).get("family") for g in global14} == {"performance polyolefin elastomer"}, "Vistamaxx family coverage drift")
need(all(any("Singapore" in str(s.get("title", "")) for s in g.get("sources") or []) for g in global14), "Vistamaxx records lost Singapore family-level supply provenance")
need(all(any(obs.get("property") == "Melt Flow Rate" and obs.get("temperatureC") == 230 and obs.get("loadKg") == 2.16 and obs.get("comparisonReady") is True for obs in g.get("properties") or []) for g in global14), "Vistamaxx conditioned MFR comparison contract drift")


# Korea expansion wave: current LOTTE Chemical PP injection identities are
# source-reviewed staging only. The manufacturer index exposes exact grades,
# injection category and listed MI, but not the full MI temperature/load
# conditions needed for comparison-ready promotion.
global_wave15 = load_json(STAGING / "global-material-expansion-20260929-v15.json")
need((global_wave15.get("summary") or {}).get("validatedGrades") == 0, "Korea wave must not promote under-conditioned LOTTE PP data")
need((global_wave15.get("summary") or {}).get("sourceReviewedStagingGrades") == 24, "Korea LOTTE PP staging count drift")
need((global_wave15.get("summary") or {}).get("countryFocus") == "South Korea", "Korea wave country focus drift")
global15 = [g for m in global_wave15.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need(len(global15) == 24, "Korea LOTTE PP exact-grade staging set drift")
need(all((g.get("provenance") or {}).get("stage") == "staging" for g in global15), "Korea LOTTE PP identities must remain staging")
need(all(g.get("id") not in runtime_grade_ids for g in global15), "Korea LOTTE PP staging identities leaked into runtime")
need({(g.get("polymer") or {}).get("family") for g in global15} == {"PP"}, "Korea LOTTE staging family drift")
need(all((g.get("manufacturer") or {}).get("country") == "South Korea" for g in global15), "Korea LOTTE staging lost country identity")
need(all(obs.get("comparisonReady") is False for g in global15 for obs in g.get("properties") or []), "Under-conditioned LOTTE PP MI must remain context-only")
need((global_wave15.get("governance") or {}).get("runtimePromotionBlocked") is True, "Korea LOTTE PP promotion boundary drift")


# Korea KOLON continuation: expand current exact-grade POM identities while
# retaining the original four-grade pilot boundary and blocking numeric
# promotion until grade-level conditioning is resolved.
global_wave16 = load_json(STAGING / "global-material-expansion-20260929-v16.json")
need((global_wave16.get("summary") or {}).get("validatedGrades") == 0, "Korea KOLON wave must remain staging")
need((global_wave16.get("summary") or {}).get("sourceReviewedStagingGrades") == 16, "Korea KOLON staging count drift")
need((global_wave16.get("summary") or {}).get("countryFocus") == "South Korea", "Korea KOLON wave country focus drift")
global16 = [g for m in global_wave16.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need(len(global16) == 16, "Korea KOLON exact-grade expansion set drift")
need(all((g.get("provenance") or {}).get("stage") == "staging" for g in global16), "Korea KOLON expansion must remain staging")
need(all(g.get("id") not in runtime_grade_ids for g in global16), "Korea KOLON staging identities leaked into runtime")
need({(g.get("polymer") or {}).get("family") for g in global16} == {"POM"}, "Korea KOLON staging family drift")
need(all((g.get("manufacturer") or {}).get("country") == "South Korea" for g in global16), "Korea KOLON staging lost country identity")
need(all(len(g.get("properties") or []) == 0 for g in global16), "Korea KOLON wave must not invent unresolved numeric properties")
need((global_wave16.get("governance") or {}).get("runtimePromotionBlocked") is True, "Korea KOLON promotion boundary drift")
need(set((global_wave16.get("governance") or {}).get("duplicatePilotGradesExcluded") or []) == {"K300", "K700", "K100HS", "GF702"}, "Korea KOLON duplicate-pilot exclusion drift")


# Korea SK chemicals continuation: current SKYGREEN injection-grade identities
# are source-reviewed only until exact-grade numeric TDS conditions are captured.
global_wave17 = load_json(STAGING / "global-material-expansion-20260929-v17.json")
need((global_wave17.get("summary") or {}).get("validatedGrades") == 0, "Korea SKYGREEN wave must remain staging")
need((global_wave17.get("summary") or {}).get("sourceReviewedStagingGrades") == 9, "Korea SKYGREEN staging count drift")
need((global_wave17.get("summary") or {}).get("countryFocus") == "South Korea", "Korea SKYGREEN country focus drift")
global17 = [g for m in global_wave17.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need(len(global17) == 9, "Korea SKYGREEN exact-grade staging set drift")
need(all((g.get("provenance") or {}).get("stage") == "staging" for g in global17), "Korea SKYGREEN identities must remain staging")
need(all(g.get("id") not in runtime_grade_ids for g in global17), "Korea SKYGREEN staging identities leaked into runtime")
need({(g.get("polymer") or {}).get("family") for g in global17} == {"copolyester"}, "Korea SKYGREEN family drift")
need(all((g.get("manufacturer") or {}).get("country") == "South Korea" for g in global17), "Korea SKYGREEN staging lost country identity")
need(all(len(g.get("properties") or []) == 0 and len(g.get("processing") or []) == 0 for g in global17), "Korea SKYGREEN staging must not invent numeric engineering data")
need((global_wave17.get("governance") or {}).get("runtimePromotionBlocked") is True, "Korea SKYGREEN promotion boundary drift")


# Samyang Korea promotion: these four exact grades retain fully conditioned
# ASTM D1238 MFR plus manufacturer exact-grade processing guidance. Direction-
# unresolved ASTM D955 shrinkage remains context-only.
samyang_pilot = load_json(STAGING / "samyang-exact-grade-pilot-v1.json")
need(samyang_pilot.get("status") == "validated-pilot", "Samyang exact-grade dataset status drift")
samyang_grades = [g for m in samyang_pilot.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need({g.get("grade") for g in samyang_grades} == {"VB3025G10", "3025U", "210", "410"}, "Samyang exact-grade pilot set drift")
need(len(samyang_grades) == 4 and all(g.get("id") in runtime_grade_ids for g in samyang_grades), "Samyang validated grades are not fully published")
need(all((g.get("provenance") or {}).get("stage") == "validated" for g in samyang_grades), "Samyang pilot contains non-validated grade")
need(all((g.get("manufacturer") or {}).get("country") == "South Korea" for g in samyang_grades), "Samyang Korea provenance drift")
need(all(any(obs.get("property") == "Melt Flow Rate" and obs.get("temperatureC") is not None and obs.get("loadKg") is not None and obs.get("comparisonReady") is True for obs in g.get("properties") or []) for g in samyang_grades), "Samyang conditioned MFR contract drift")
need(all(obs.get("comparisonReady") is False for g in samyang_grades for obs in g.get("properties") or [] if obs.get("property") == "Mould Shrinkage"), "Samyang unresolved-direction shrinkage must remain context-only")
need(all(obs.get("productionRecipe") is False for g in samyang_grades for obs in g.get("processing") or []), "Samyang supplier guidance became a production recipe")


# Korea Samyang wave 18: four further TRIREX PC grades carry explicit
# ASTM D1238 300C/1.2 kg MFR conditioning and exact-grade processing guidance.
global_wave18 = load_json(STAGING / "global-material-expansion-20260929-v18.json")
need((global_wave18.get("summary") or {}).get("validatedGrades") == 4, "Korea Samyang wave18 validated-grade count drift")
need((global_wave18.get("summary") or {}).get("countryFocus") == "South Korea", "Korea Samyang wave18 country focus drift")
global18 = [g for m in global_wave18.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need({g.get("grade") for g in global18} == {"FB3025G10", "SO1-3025LD", "HV3022G30", "M3020PN"}, "Korea Samyang wave18 exact-grade set drift")
need(len(global18) == 4 and all(g.get("id") in runtime_grade_ids for g in global18), "Korea Samyang wave18 grades are not fully published")
need(all((g.get("provenance") or {}).get("stage") == "validated" for g in global18), "Korea Samyang wave18 contains non-validated grade")
need(all(any(obs.get("property") == "Melt Flow Rate" and obs.get("temperatureC") == 300 and obs.get("loadKg") == 1.2 and obs.get("comparisonReady") is True for obs in g.get("properties") or []) for g in global18), "Korea Samyang wave18 conditioned MFR contract drift")
need(all(obs.get("comparisonReady") is False for g in global18 for obs in g.get("properties") or [] if obs.get("property") == "Mould Shrinkage"), "Korea Samyang wave18 unresolved-direction shrinkage must remain context-only")
need(all(obs.get("productionRecipe") is False for g in global18 for obs in g.get("processing") or []), "Korea Samyang wave18 supplier guidance became a production recipe")


# Korea Hyosung continuation: current POKETONE and PP identities are staged
# conservatively. POKETONE portfolio MI remains context-only until full test
# temperature/load conditions are captured; HJ541CP has no promoted numeric data.
global_wave19 = load_json(STAGING / "global-material-expansion-20260929-v19.json")
need((global_wave19.get("summary") or {}).get("validatedGrades") == 0, "Korea Hyosung wave must remain staging")
need((global_wave19.get("summary") or {}).get("sourceReviewedStagingGrades") == 9, "Korea Hyosung staging count drift")
need((global_wave19.get("summary") or {}).get("countryFocus") == "South Korea", "Korea Hyosung country focus drift")
global19 = [g for m in global_wave19.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need(len(global19) == 9, "Korea Hyosung exact-grade staging set drift")
need(all((g.get("provenance") or {}).get("stage") == "staging" for g in global19), "Korea Hyosung identities must remain staging")
need(all(g.get("id") not in runtime_grade_ids for g in global19), "Korea Hyosung staging identities leaked into runtime")
need({(g.get("polymer") or {}).get("family") for g in global19} == {"polyketone", "PP"}, "Korea Hyosung family drift")
need(all((g.get("manufacturer") or {}).get("country") == "South Korea" for g in global19), "Korea Hyosung staging lost country identity")
need(all(obs.get("comparisonReady") is False for g in global19 for obs in g.get("properties") or []), "Under-conditioned Hyosung numeric data must remain context-only")
need((global_wave19.get("governance") or {}).get("runtimePromotionBlocked") is True, "Korea Hyosung promotion boundary drift")


# Korea Hanwha continuation: BI800 is current manufacturer-controlled exact
# PP injection-moulding evidence, but its surfaced ASTM D1238 value lacks the
# temperature/load pair required for conditioned rheology comparison.
global_wave20 = load_json(STAGING / "global-material-expansion-20260929-v20.json")
need((global_wave20.get("summary") or {}).get("validatedGrades") == 0, "Korea Hanwha wave must remain staging")
need((global_wave20.get("summary") or {}).get("sourceReviewedStagingGrades") == 1, "Korea Hanwha staging count drift")
need((global_wave20.get("summary") or {}).get("countryFocus") == "South Korea", "Korea Hanwha country focus drift")
global20 = [g for m in global_wave20.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need(len(global20) == 1 and global20[0].get("grade") == "BI800", "Korea Hanwha exact-grade set drift")
need(all((g.get("provenance") or {}).get("stage") == "staging" for g in global20), "Korea Hanwha identity must remain staging")
need(all(g.get("id") not in runtime_grade_ids for g in global20), "Korea Hanwha staging identity leaked into runtime")
need(all(obs.get("comparisonReady") is False for g in global20 for obs in g.get("properties") or []), "Under-conditioned Hanwha values must remain context-only")
need((global_wave20.get("governance") or {}).get("runtimePromotionBlocked") is True, "Korea Hanwha promotion boundary drift")


# Korea Hyosung wave21: three PP exact grades have exact-grade TDS evidence with
# fully conditioned ASTM D1238 230C/2.16 kg MI and supplier drying guidance.
global_wave21 = load_json(STAGING / "global-material-expansion-20260929-v21.json")
need((global_wave21.get("summary") or {}).get("validatedGrades") == 3, "Korea Hyosung wave21 validated-grade count drift")
need((global_wave21.get("summary") or {}).get("countryFocus") == "South Korea", "Korea Hyosung wave21 country focus drift")
global21 = [g for m in global_wave21.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need({g.get("grade") for g in global21} == {"HJ801RL", "HJ801R", "PB840-BA"}, "Korea Hyosung wave21 exact-grade set drift")
need(len(global21) == 3 and all(g.get("id") in runtime_grade_ids for g in global21), "Korea Hyosung wave21 grades are not fully published")
need(all((g.get("provenance") or {}).get("stage") == "validated" for g in global21), "Korea Hyosung wave21 contains non-validated grade")
need(all(any(obs.get("property") == "Melt Index" and obs.get("temperatureC") == 230 and obs.get("loadKg") == 2.16 and obs.get("comparisonReady") is True for obs in g.get("properties") or []) for g in global21), "Korea Hyosung wave21 conditioned MI contract drift")
need(all(obs.get("productionRecipe") is False for g in global21 for obs in g.get("processing") or []), "Korea Hyosung wave21 supplier guidance became a production recipe")


# Korea Samyang wave22: four more exact TRIREX grades retain fully conditioned
# ASTM D1238 rheology; unresolved D955 shrinkage direction remains context-only.
global_wave22 = load_json(STAGING / "global-material-expansion-20260929-v22.json")
need((global_wave22.get("summary") or {}).get("validatedGrades") == 4, "Korea Samyang wave22 validated-grade count drift")
need((global_wave22.get("summary") or {}).get("countryFocus") == "South Korea", "Korea Samyang wave22 country focus drift")
global22 = [g for m in global_wave22.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need({g.get("grade") for g in global22} == {"3020U", "3025G10", "SC4-3022PN1", "3025G20"}, "Korea Samyang wave22 exact-grade set drift")
need(len(global22) == 4 and all(g.get("id") in runtime_grade_ids for g in global22), "Korea Samyang wave22 grades are not fully published")
need(all((g.get("provenance") or {}).get("stage") == "validated" for g in global22), "Korea Samyang wave22 contains non-validated grade")
need(all(any(obs.get("property") == "Melt Flow Rate" and obs.get("temperatureC") is not None and obs.get("loadKg") is not None and obs.get("comparisonReady") is True for obs in g.get("properties") or []) for g in global22), "Korea Samyang wave22 conditioned MFR contract drift")
need(all(obs.get("comparisonReady") is False for g in global22 for obs in g.get("properties") or [] if obs.get("property") == "Mould Shrinkage"), "Korea Samyang wave22 unresolved-direction shrinkage must remain context-only")
need(all(obs.get("productionRecipe") is False for g in global22 for obs in g.get("processing") or []), "Korea Samyang wave22 supplier guidance became a production recipe")

# Mega wave23: full current Hyosung Vina Vietnam-Plant PP catalogue plus
# governed SH Energy ANYPOL SE-HF EPS identities. Hyosung melt index remains
# context-only because the catalogue table omits test temperature/load; EPS is
# explicitly expandable-bead/steam-moulding material, not conventional injection feedstock.
global_wave23 = load_json(STAGING / "global-material-mega-expansion-20260929-v23.json")
need((global_wave23.get("summary") or {}).get("validatedGrades") == 70, "mega wave23 validated-grade count drift")
need((global_wave23.get("summary") or {}).get("hyosungVinaGrades") == 66, "Hyosung Vina mega-wave grade count drift")
need((global_wave23.get("summary") or {}).get("shEnergyValidatedGrades") == 4, "SH Energy mega-wave grade count drift")
global23 = [g for m in global_wave23.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need(len(global23) == 70 and all(g.get("id") in runtime_grade_ids for g in global23), "mega wave23 grades are not fully published")
hyosung_vina = [g for g in global23 if (g.get("manufacturer") or {}).get("id") == "mfr-hyosung-vina"]
sh_energy = [g for g in global23 if (g.get("manufacturer") or {}).get("id") == "mfr-sh-energy-chemical"]
need(len(hyosung_vina) == 66, "Hyosung Vina validated exact-grade set drift")
need(all((g.get("production") or {}).get("country") == "Vietnam" for g in hyosung_vina), "Hyosung Vina country provenance drift")
need(all((g.get("production") or {}).get("plant") == "Hyosung Vina Chemicals Vietnam Plant" for g in hyosung_vina), "Hyosung Vina catalogue-level plant provenance drift")
need(all(obs.get("comparisonReady") is False for g in hyosung_vina for obs in g.get("properties") or [] if obs.get("property") == "Melt Index"), "Hyosung Vina under-conditioned melt index became comparison-ready")
need(all(any(s.get("publisher") == "Hyosung Vina Chemicals" and s.get("kind") == "manufacturer-datasheet" for s in g.get("sources") or []) for g in hyosung_vina), "Hyosung Vina primary catalogue source drift")
need({g.get("grade") for g in sh_energy} == {"SE-1600HF", "SE-2000HF", "SE-2500HF", "SE-3000HF"}, "SH Energy ANYPOL SE-HF exact-grade set drift")
need(all((g.get("polymer") or {}).get("family") == "EPS" for g in sh_energy), "SH Energy SE-HF family must remain EPS")
need(all("not conventional injection" in str((g.get("identity") or {}).get("notes") or "").lower() for g in sh_energy), "SH Energy EPS non-injection boundary missing")
need(all(not (g.get("processing") or []) for g in sh_energy), "SH Energy EPS processing recipe leaked into runtime")
need(all(any(s.get("kind") == "regulatory" and "ESR-1095" in str(s.get("title") or "") for s in g.get("sources") or []) for g in sh_energy), "SH Energy ICC-ES source trail drift")

# Mega wave24: large Asahi Kasei exact-identity acquisition remains staging-only.
global_wave24 = load_json(STAGING / "global-material-mega-expansion-20260929-v24.json")
need((global_wave24.get("summary") or {}).get("sourceReviewedStagingGrades") == 196, "mega wave24 Asahi Kasei staging count drift")
need((global_wave24.get("summary") or {}).get("brandCounts") == {"LEONA": 60, "TENAC": 74, "XYRON": 62}, "mega wave24 brand counts drift")
need((global_wave24.get("governance") or {}).get("runtimePromotionBlocked") is True, "mega wave24 runtime promotion boundary drift")
global24 = [g for m in global_wave24.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need(len(global24) == 196, "mega wave24 exact identity count drift")
need(all((g.get("provenance") or {}).get("stage") == "staging" for g in global24), "mega wave24 contains non-staging records")
need(all(g.get("id") not in runtime_grade_ids for g in global24), "mega wave24 staging identity leaked into validated runtime")
need(all(not (g.get("properties") or []) and not (g.get("processing") or []) for g in global24), "mega wave24 must not invent numeric property/process observations")
need({(g.get("manufacturer") or {}).get("id") for g in global24} == {"mfr-asahi-kasei"}, "mega wave24 manufacturer drift")
need({g.get("brand") for g in global24} == {"LEONA", "TENAC", "XYRON"}, "mega wave24 brand set drift")
need({(g.get("polymer") or {}).get("family") for g in global24} == {"PA", "POM", "mPPE alloy"}, "mega wave24 family staging set drift")

# Mega wave25: Polyplastics current LAPEROS identities remain staging-only while
# two DURACON POM grades are validated from exact pages with ISO 1133 190C/2.16kg.
global_wave25 = load_json(STAGING / "global-material-mega-expansion-20260929-v25.json")
need((global_wave25.get("summary") or {}).get("validatedGrades") == 2, "mega wave25 validated POM count drift")
need((global_wave25.get("summary") or {}).get("sourceReviewedStagingGrades") == 21, "mega wave25 LAPEROS staging count drift")
global25 = [g for m in global_wave25.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
global25_validated = [g for g in global25 if (g.get("provenance") or {}).get("stage") in {"validated", "published"}]
global25_staging = [g for g in global25 if (g.get("provenance") or {}).get("stage") == "staging"]
need({g.get("grade") for g in global25_validated} == {"M25LV", "GB-25R"}, "mega wave25 DURACON exact-grade set drift")
need(all(g.get("id") in runtime_grade_ids for g in global25_validated), "mega wave25 validated DURACON grades missing from runtime")
need(len(global25_staging) == 21 and all(g.get("id") not in runtime_grade_ids for g in global25_staging), "mega wave25 LAPEROS staging leak")
need(all(not (g.get("properties") or []) and not (g.get("processing") or []) for g in global25_staging), "mega wave25 LAPEROS numeric inference detected")
need(all(any(obs.get("testMethod") == "ISO 1133" and obs.get("temperatureC") == 190 and obs.get("loadKg") == 2.16 and obs.get("comparisonReady") is True for obs in g.get("properties") or []) for g in global25_validated), "mega wave25 DURACON rheology conditioning drift")

# Mega wave26: Sumitomo Chemical source-reviewed exact identities and explicit
# composition text remain staging-only until exact numeric observations are normalized.
global_wave26 = load_json(STAGING / "global-material-mega-expansion-20260929-v26.json")
need((global_wave26.get("summary") or {}).get("sourceReviewedStagingGrades") == 55, "mega wave26 Sumitomo staging count drift")
need((global_wave26.get("summary") or {}).get("brandCounts") == {"SUMIKASUPER": 38, "SUMIKAEXCEL": 8, "SUMIPLOY": 9}, "mega wave26 brand counts drift")
need((global_wave26.get("governance") or {}).get("runtimePromotionBlocked") is True, "mega wave26 runtime promotion boundary drift")
global26 = [g for m in global_wave26.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need(len(global26) == 55, "mega wave26 exact identity count drift")
need(all((g.get("provenance") or {}).get("stage") == "staging" for g in global26), "mega wave26 contains non-staging record")
need(all(g.get("id") not in runtime_grade_ids for g in global26), "mega wave26 staging identity leaked into runtime")
need(all(not (g.get("properties") or []) and not (g.get("processing") or []) for g in global26), "mega wave26 invented numeric property/process observation")
need({g.get("brand") for g in global26} == {"SUMIKASUPER", "SUMIKAEXCEL", "SUMIPLOY"}, "mega wave26 brand set drift")
need(all((g.get("manufacturer") or {}).get("id") == "mfr-sumitomo-chemical" for g in global26), "mega wave26 manufacturer drift")

# Scale-quality invariant: the runtime manufacturer index is derived from the
# actual validated grades rather than a manually frozen vendor whitelist.
need(len(runtime_manufacturer_ids) == len(catalog.get("manufacturers") or []), "runtime manufacturer index contains duplicate/missing vendors")

# Mega wave27: UBE current injection/tube-coating catalogue expansion remains
# source-reviewed staging; only explicit manufacturer generic-marking percentages
# may be retained as composition metadata.
global_wave27 = load_json(STAGING / "global-material-mega-expansion-20260929-v27.json")
need((global_wave27.get("summary") or {}).get("sourceReviewedStagingGrades") == 98, "mega wave27 UBE staging count drift")
need((global_wave27.get("governance") or {}).get("runtimePromotionBlocked") is True, "mega wave27 runtime promotion boundary drift")
global27 = [g for m in global_wave27.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need(len(global27) == 98, "mega wave27 UBE exact identity count drift")
need(all((g.get("provenance") or {}).get("stage") == "staging" for g in global27), "mega wave27 contains non-staging records")
need(all(g.get("id") not in runtime_grade_ids for g in global27), "mega wave27 UBE staging identity leaked into runtime")
need(all(not (g.get("properties") or []) and not (g.get("processing") or []) for g in global27), "mega wave27 invented numeric property/process observations")
need(all((g.get("manufacturer") or {}).get("id") == "mfr-ube" for g in global27), "mega wave27 manufacturer drift")
need((global_wave27.get("summary") or {}).get("familyCounts") == {"PA12": 29, "PA6": 40, "PA6+PP": 1, "PA510": 3, "PA56": 14, "PA66+PP": 1, "PA66+PE": 2, "PA66": 5, "PA6/66": 3}, "mega wave27 family-count drift")
need(all(g.get("grade") not in {"1013B", "1015GC6"} for g in global27), "mega wave27 duplicated already-validated UBE grade")

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

# KEPITAL pilot proof: the current KPAC brand-owner pages supply exact-grade
# shrinkage, composition and processing context. Melt-flow is deliberately not
# published because the reviewed sheets do not expose ISO 1133 temperature/load.
kep_pilot = load_json(STAGING / "kepital-exact-grade-pilot-v1.json")
need(kep_pilot.get("datasetId") == "kepital-exact-grade-pilot-v1", "KEPITAL exact-grade dataset id drift")
need(kep_pilot.get("status") == "validated-pilot", "KEPITAL exact-grade dataset status drift")
kep_grades = [g for m in kep_pilot.get("manufacturers") or [] for g in m.get("gradeRecords") or []]
need({g.get("grade") for g in kep_grades} == {"F20-03", "F30-03", "F10-03H", "FG2025"}, "KEPITAL exact-grade pilot set drift")
kep_grade_ids = {g.get("id") for g in kep_grades}
need(set(kep_target.get("validatedGradeIds") or []) == kep_grade_ids, "Korean pilot KEPITAL grade-ID progress does not match validated dataset")
need(kep_target.get("publishedGradeCount") == len(kep_grade_ids) == 4, "Korean pilot KEPITAL published-grade count drift")
need(kep_grade_ids.issubset(runtime_grade_ids), "Korean pilot KEPITAL validated grades are not all published in runtime catalog")

kep_by_grade = {g["grade"]: g for g in kep_grades}
expected_revisions = {
    "F20-03": ("8", "2020-04-03"),
    "F30-03": ("8", "2020-04-03"),
    "F10-03H": ("9", "2020-04-03"),
    "FG2025": ("6", "2020-07-21"),
}
for grade_name, grade in kep_by_grade.items():
    gid = grade.get("id")
    need((grade.get("provenance") or {}).get("stage") == "validated", f"KEPITAL pilot grade is not validated: {gid}")
    need((grade.get("lifecycle") or {}).get("status") == "unknown", f"KEPITAL lifecycle must remain conservative/unknown: {gid}")
    need((grade.get("manufacturer") or {}).get("name") == "Korea Polyacetal (KPAC)", f"KEPITAL current manufacturer/source-owner name drift: {gid}")
    sources = grade.get("sources") or []
    need(len(sources) == 2, f"KEPITAL pilot grade must retain property-sheet and processing sources: {gid}")
    need(all(s.get("publisher") == "Korea Polyacetal (KPAC)" for s in sources), f"KEPITAL source publisher drift: {gid}")
    need(all(str(s.get("url", "")).startswith(("https://gpac-kpac.com/", "https://www.gpac-kpac.com/")) for s in sources), f"KEPITAL pilot grade has a non-KPAC primary source: {gid}")
    datasheets = [s for s in sources if s.get("kind") == "manufacturer-datasheet"]
    need(len(datasheets) == 1, f"KEPITAL grade must retain exactly one exact-grade property sheet: {gid}")
    revision, document_date = expected_revisions[grade_name]
    need(datasheets[0].get("revision") == revision and datasheets[0].get("documentDate") == document_date, f"KEPITAL property-sheet revision/date drift: {gid}")
    need(datasheets[0].get("retrievedAt") == "2026-09-03", f"KEPITAL source retrieval date drift: {gid}")
    need(not any("melt flow" in str(obs.get("property", "")).lower() for obs in grade.get("properties") or []), f"KEPITAL under-conditioned melt-flow value was published: {gid}")
    need("required test temperature/load" in str((grade.get("provenance") or {}).get("notes") or ""), f"KEPITAL melt-flow omission rationale missing: {gid}")
    need(all(obs.get("productionRecipe") is False for obs in grade.get("processing") or []), f"KEPITAL processing guidance became a production recipe: {gid}")
    shrink = [obs for obs in grade.get("properties") or [] if obs.get("property") == "Mould Shrinkage"]
    need(len(shrink) == 1, f"KEPITAL grade must retain exactly one reviewed flow-shrinkage observation: {gid}")
    need(shrink[0].get("testMethod") == "ISO 294-4" and shrink[0].get("specimen") == "2.0 mm" and shrink[0].get("direction") == "flow", f"KEPITAL shrinkage method/specimen/direction drift: {gid}")
    need(shrink[0].get("comparisonReady") is True, f"KEPITAL conditioned flow shrinkage must remain comparison-ready: {gid}")
    need((processing(grade, f"proc-kepital-{gid.removeprefix('mat-kepital-')}-dry-temp").get("min"), processing(grade, f"proc-kepital-{gid.removeprefix('mat-kepital-')}-dry-temp").get("max")) == (80, 90), f"KEPITAL drying-temperature range drift: {gid}")
    need((processing(grade, f"proc-kepital-{gid.removeprefix('mat-kepital-')}-mould-temp").get("min"), processing(grade, f"proc-kepital-{gid.removeprefix('mat-kepital-')}-mould-temp").get("max")) == (60, 80), f"KEPITAL mould-temperature range drift: {gid}")
    need((processing(grade, f"proc-kepital-{gid.removeprefix('mat-kepital-')}-barrel-temp").get("min"), processing(grade, f"proc-kepital-{gid.removeprefix('mat-kepital-')}-barrel-temp").get("max")) == (170, 210), f"KEPITAL barrel-temperature range drift: {gid}")
    need(processing(grade, f"proc-kepital-{gid.removeprefix('mat-kepital-')}-max-moisture").get("value") == 0.1, f"KEPITAL maximum-moisture limit drift: {gid}")

need(observation(kep_by_grade["F20-03"], "obs-kepital-f2003-shrink-flow").get("value") == 2.0, "F20-03 flow shrinkage drift")
need(observation(kep_by_grade["F30-03"], "obs-kepital-f3003-shrink-flow").get("value") == 2.0, "F30-03 flow shrinkage drift")
need(observation(kep_by_grade["F10-03H"], "obs-kepital-f1003h-shrink-flow").get("value") == 2.0, "F10-03H flow shrinkage drift")
need(observation(kep_by_grade["FG2025"], "obs-kepital-fg2025-shrink-flow").get("value") == 0.7, "FG2025 flow shrinkage drift")
need((kep_by_grade["FG2025"].get("composition") or {}).get("glassFibrePct") == 25, "FG2025 exact GF25% composition drift")

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
need("safeRelativeAsset" in desktop_main and "Object.prototype.hasOwnProperty.call(expectedFiles, name)" in desktop_main, "desktop nested domain serving is not integrity-manifest allow-list constrained")
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
