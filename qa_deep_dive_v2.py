from pathlib import Path
import json
import re

TARGET_FILE = Path("data/deep-dive-v2-targets.json")
PROGRAMME_FILE = Path("sources/DEEP_DIVE_V2_PROGRAMME.md")
SEED_FILE = Path("sources/DEEP_DIVE_V2_SEED_RESEARCH.md")
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
    "research_evidence_domains": 100,
}

for path in (TARGET_FILE, PROGRAMME_FILE, SEED_FILE):
    assert path.exists(), f"Deep Dive v2 file missing: {path}"

data = json.loads(TARGET_FILE.read_text(encoding="utf-8"))
assert data.get("programme") == "MouldMaster Deep Dive v2"
assert data.get("status_date") == "2026-08-28"
targets = data.get("targets", {})
for key, minimum in MIN_TARGETS.items():
    actual = targets.get(key)
    assert isinstance(actual, int), f"Deep Dive v2 target missing or non-integer: {key}"
    assert actual >= minimum, f"Deep Dive v2 target reduced: {key}={actual}, minimum={minimum}"

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
    "2,000", "1,000", "300", "400", "600", "10,000",
    "Real-data-first rule", "Evidence maturity", "prediction", "causality",
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

report = {
    "programme": data["programme"],
    "status_date": data["status_date"],
    "target_count": len(MIN_TARGETS),
    "targets": targets,
    "seed_dataset_candidates": dataset_rows,
    "seed_research_sources": max(numbered_sources),
    "evidence_levels": list(levels),
    "status": "pass",
}
REPORT_FILE.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print("MouldMaster Deep Dive v2 QA passed")
