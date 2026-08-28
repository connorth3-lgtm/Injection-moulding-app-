from pathlib import Path
import json
import re

TARGET_FILE = Path("data/deep-dive-v2-targets.json")
PROGRAMME_FILE = Path("sources/DEEP_DIVE_V2_PROGRAMME.md")
SEED_FILE = Path("sources/DEEP_DIVE_V2_SEED_RESEARCH.md")
PASS_FILE = Path("data/deep-dive-v2-100-pass.json")
PASS_DOC = Path("sources/DEEP_DIVE_V2_100_PASS_EXECUTION.md")
EXPANSION_FILE = Path("sources/DEEP_DIVE_V2_100_PASS_EXPANSION.md")
WAVE2_FILE = Path("data/deep-dive-v2-wave2-100-pass.json")
REPORT_FILE = Path("deep-dive-v2-report.json")

MIN_TARGETS = {
    "peer_reviewed_papers": 2000,
    "primary_measured_studies": 1000,
    "systematic_or_review_papers": 250,
    "public_reusable_dataset_candidates": 100,
    "verified_usable_measured_datasets": 50,
    "real_dataset_adapters": 40,
    "independent_dataset_benchmark_reports": 30,
    "material_behaviour_profiles": 300,
    "resin_families": 50,
    "filled_reinforced_recycled_variants": 150,
    "defect_mechanism_entries": 400,
    "competing_cause_diagnostic_trees": 600,
    "advanced_process_modules": 50,
    "new_diagnostic_cases": 1000,
    "tooling_cooling_cases": 250,
    "machine_health_cases": 200,
    "material_condition_cases": 250,
    "quality_statistics_cases": 250,
    "sensor_process_monitoring_cases": 200,
    "maintenance_cases": 150,
    "energy_sustainability_cases": 100,
    "multi_cavity_cases": 150,
    "labelled_waveform_examples": 2000,
    "assessment_scenario_questions_total": 1500,
    "expert_level_scenarios": 300,
    "licensed_defect_images_eventual": 10000,
    "lessons_and_modules_total": 250,
    "research_evidence_domains": 200,
}

for path in (TARGET_FILE, PROGRAMME_FILE, SEED_FILE, PASS_FILE, PASS_DOC, EXPANSION_FILE, WAVE2_FILE):
    assert path.exists(), f"Deep Dive v2 file missing: {path}"

data = json.loads(TARGET_FILE.read_text(encoding="utf-8"))
assert data.get("programme") == "MouldMaster Deep Dive v2"
assert data.get("status_date") == "2026-08-28"
targets = data.get("targets", {})
for key, minimum in MIN_TARGETS.items():
    actual = targets.get(key)
    assert isinstance(actual, int), f"Deep Dive v2 target missing or non-integer: {key}"
    assert actual >= minimum, f"Deep Dive v2 target reduced: {key}={actual}, minimum={minimum}"

execution = data.get("execution_state", {})
assert execution.get("wave1_passes_preserved") == 100, "Wave-1 preservation state missing"
assert execution.get("wave2_passes_added") == 100, "Wave-2 execution state missing"
assert execution.get("cumulative_passes") == 200, "Cumulative execution state must remain 200"
assert execution.get("wave2_primary_seeded", 0) >= 59, "Wave-2 primary-seeded execution state regressed"
assert execution.get("wave2_explicit_gaps") == 100 - execution.get("wave2_primary_seeded", 0), "Wave-2 execution-state accounting is incoherent"

levels = data.get("evidence_levels", {})
assert list(levels) == ["E0", "E1", "E2", "E3", "E4", "E5", "E6"], "Evidence maturity E0-E6 must remain explicit"

required_intake = {
    "source_identity", "source_version", "licence", "redistribution_rights",
    "raw_file_sha256", "schema", "units", "row_cycle_count", "sampling_frequency",
    "machine_context", "material_context", "mould_and_cavity_context", "sensor_location",
    "missingness", "signal_synchronisation", "quality_outcome",
    "intervention_or_doe_structure", "permitted_claims", "prohibited_inferences"
}
assert required_intake.issubset(set(data.get("dataset_intake_required_fields", []))), "Dataset intake gate lost required provenance fields"

programme = PROGRAMME_FILE.read_text(encoding="utf-8")
for phrase in [
    "2,000", "1,000", "300", "400", "600", "10,000", "200 cumulative research/evidence passes",
    "Real-data-first rule", "Evidence maturity", "model accuracy", "causality",
    "Do not relabel synthetic data as measured"
]:
    assert phrase in programme, f"Deep Dive v2 programme marker missing: {phrase}"

seed = SEED_FILE.read_text(encoding="utf-8")
dataset_rows = len(re.findall(r"^\| .*?\| https?://", seed, flags=re.M))
numbered_sources = [int(x) for x in re.findall(r"^(\d+)\. ", seed, flags=re.M)]
assert dataset_rows >= 6, f"Deep Dive v2 seed must contain at least 6 open dataset candidates, found {dataset_rows}"
assert numbered_sources and max(numbered_sources) >= 34, "Deep Dive v2 seed must contain at least 34 research-source entries"
assert "10.5281/zenodo.20744054" in seed, "FORinFPRO-HIMD seed missing"
assert "fkk68-zyf30" in seed, "SKZ time-series dataset seed missing"
assert "10.17632/gtnb4j7bfx.1" in seed, "Mendeley industrial dataset seed missing"

pass_data = json.loads(PASS_FILE.read_text(encoding="utf-8"))
assert pass_data.get("pass_count") == 100, "Deep Dive v2 must retain exactly 100 Wave-1 execution passes"
passes = pass_data.get("passes", [])
assert len(passes) == 100, f"Expected 100 Wave-1 pass records, found {len(passes)}"
ids = [p.get("id") for p in passes]
assert ids == list(range(1, 101)), "Wave-1 IDs must remain contiguous from 1 to 100"
titles = [p.get("title") for p in passes]
assert len(set(titles)) == 100 and all(titles), "Wave-1 titles must be non-empty and unique"
allowed_statuses = {"seeded_with_primary", "gap_seeded"}
assert {p.get("status") for p in passes}.issubset(allowed_statuses), "Unknown Wave-1 status"
for p in passes:
    assert p.get("theme"), f"Wave-1 pass {p.get('id')} missing theme"
    assert p.get("objective"), f"Wave-1 pass {p.get('id')} missing objective"
    anchors = p.get("evidence_anchors", [])
    assert anchors, f"Wave-1 pass {p.get('id')} missing evidence anchor"
    assert all(isinstance(x, str) and x.strip() for x in anchors), f"Wave-1 pass {p.get('id')} has invalid evidence anchor"

seeded = sum(p["status"] == "seeded_with_primary" for p in passes)
gaps = sum(p["status"] == "gap_seeded" for p in passes)
assert seeded >= 78, f"Wave-1 primary-seeded pass count regressed: {seeded}"
assert gaps == 100 - seeded, "Wave-1 seeded/gap accounting is incoherent"
assert pass_data.get("summary", {}).get("by_status", {}).get("seeded_with_primary") == seeded
assert pass_data.get("summary", {}).get("by_status", {}).get("gap_seeded") == gaps

pass_doc = PASS_DOC.read_text(encoding="utf-8")
for marker in ["total passes: **100**", "seeded with primary/experimental evidence: **78**", "explicit targeted gaps: **22**", "| 100 | Causal inference"]:
    assert marker in pass_doc, f"100-pass Wave-1 execution document marker missing: {marker}"

expansion = EXPANSION_FILE.read_text(encoding="utf-8")
expansion_ids = [int(x) for x in re.findall(r"^\| (\d{1,3}) \|", expansion, flags=re.M)]
assert expansion_ids == list(range(1, 101)), "Wave-1 expansion ledger must contain exactly numbered passes 1-100"
expansion_persistent_ids = set(re.findall(r"`(10\.\d{4,9}/[^`]+)`", expansion))
assert len(expansion_persistent_ids) >= 50, f"Wave-1 expansion evidence queue too small: {len(expansion_persistent_ids)} unique DOI/persistent IDs"
for marker in [
    "10.1016/j.jmapro.2024.03.019",
    "10.1016/S0141-6359(99)00039-2",
    "10.1002/pen.70028",
    "10.1016/j.jmapro.2026.05.017",
    "10.1016/j.jmapro.2026.04.072",
    "10.5281/zenodo.20322729",
    "31 December 2027",
    "research passes**, not 100 approved papers",
]:
    assert marker in expansion, f"Wave-1 expansion marker missing: {marker}"

wave2_text = WAVE2_FILE.read_text(encoding="utf-8")
wave2_data = json.loads(wave2_text)
assert wave2_data.get("pass_count") == 100, "Wave 2 must contain exactly 100 execution passes"
assert wave2_data.get("id_range") == [101, 200], "Wave-2 ID range must remain 101-200"
assert wave2_data.get("cumulative_pass_count") == 200, "Cumulative Deep Dive execution count must remain 200"
wave2 = wave2_data.get("passes", [])
assert len(wave2) == 100, f"Expected 100 Wave-2 pass records, found {len(wave2)}"
wave2_ids = [p.get("id") for p in wave2]
assert wave2_ids == list(range(101, 201)), "Wave-2 IDs must be unique, ordered and contiguous from 101 to 200"
wave2_titles = [p.get("title") for p in wave2]
assert len(set(wave2_titles)) == 100 and all(wave2_titles), "Wave-2 titles must be non-empty and unique"
assert not set(titles).intersection(wave2_titles), "Wave-2 titles must not duplicate Wave-1 titles"
assert {p.get("status") for p in wave2}.issubset(allowed_statuses), "Unknown Wave-2 status"
for p in wave2:
    assert p.get("theme"), f"Wave-2 pass {p.get('id')} missing theme"
    anchors = p.get("evidence_anchors", [])
    assert anchors, f"Wave-2 pass {p.get('id')} missing evidence anchor"
    assert all(isinstance(x, str) and x.strip() for x in anchors), f"Wave-2 pass {p.get('id')} has invalid evidence anchor"

wave2_seeded = sum(p["status"] == "seeded_with_primary" for p in wave2)
wave2_gaps = sum(p["status"] == "gap_seeded" for p in wave2)
assert wave2_seeded >= 59, f"Wave-2 primary-seeded pass count regressed: {wave2_seeded}"
assert wave2_gaps == 100 - wave2_seeded, "Wave-2 seeded/gap accounting is incoherent"
assert wave2_data.get("summary", {}).get("by_status", {}).get("seeded_with_primary") == wave2_seeded
assert wave2_data.get("summary", {}).get("by_status", {}).get("gap_seeded") == wave2_gaps
assert execution.get("wave2_primary_seeded") == wave2_seeded, "Target execution state disagrees with Wave-2 ledger"
assert execution.get("wave2_explicit_gaps") == wave2_gaps, "Target execution state gap count disagrees with Wave-2 ledger"
for marker in [
    "10.1016/j.jmapro.2024.03.019",
    "10.1002/pen.70028",
    "10.1039/d5su00242g",
    "10.1002/app.55374",
    "10.3390/pr12112333",
    "10.1109/tim.2024.3522402",
    "10.1109/access.2024.3425582",
]:
    assert marker in wave2_text, f"Wave-2 evidence marker missing: {marker}"

report = {
    "programme": data["programme"],
    "status_date": data["status_date"],
    "target_count": len(MIN_TARGETS),
    "targets": targets,
    "seed_dataset_candidates": dataset_rows,
    "seed_research_sources": max(numbered_sources),
    "wave1_execution_passes": len(passes),
    "wave1_execution_passes_primary_seeded": seeded,
    "wave1_execution_passes_gap_seeded": gaps,
    "wave1_retry_expansion_passes": len(expansion_ids),
    "wave1_retry_expansion_unique_persistent_ids": len(expansion_persistent_ids),
    "wave2_execution_passes": len(wave2),
    "wave2_execution_passes_primary_seeded": wave2_seeded,
    "wave2_execution_passes_gap_seeded": wave2_gaps,
    "cumulative_execution_passes": len(passes) + len(wave2),
    "evidence_levels": list(levels),
    "status": "pass",
}
REPORT_FILE.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print("MouldMaster Deep Dive v2 QA passed")
