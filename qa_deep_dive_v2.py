from pathlib import Path
import json
import re

TARGET_FILE = Path("data/deep-dive-v2-targets.json")
PROGRAMME_FILE = Path("sources/DEEP_DIVE_V2_PROGRAMME.md")
SEED_FILE = Path("sources/DEEP_DIVE_V2_SEED_RESEARCH.md")
WAVE_FILES = [
    Path("data/deep-dive-v2-100-pass.json"),
    Path("data/deep-dive-v2-wave2-100-pass.json"),
    Path("data/deep-dive-v2-wave3-100-pass.json"),
    Path("data/deep-dive-v2-wave4-100-pass.json"),
    Path("data/deep-dive-v2-wave5-100-pass.json"),
    Path("data/deep-dive-v2-wave6-100-pass.json"),
]
WAVE1_DOC = Path("sources/DEEP_DIVE_V2_100_PASS_EXECUTION.md")
EXPANSION_FILE = Path("sources/DEEP_DIVE_V2_100_PASS_EXPANSION.md")
WAVE6_DOC = Path("sources/DEEP_DIVE_V2_WAVE6_EXECUTION.md")
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
    "research_evidence_domains": 600,
}

for path in [TARGET_FILE, PROGRAMME_FILE, SEED_FILE, WAVE1_DOC, EXPANSION_FILE, WAVE6_DOC, *WAVE_FILES]:
    assert path.exists(), f"Deep Dive v2 file missing: {path}"

data = json.loads(TARGET_FILE.read_text(encoding="utf-8"))
assert data.get("programme") == "MouldMaster Deep Dive v2"
assert data.get("status_date") == "2026-08-28"
targets = data.get("targets", {})
for key, minimum in MIN_TARGETS.items():
    actual = targets.get(key)
    assert isinstance(actual, int), f"Deep Dive v2 target missing/non-integer: {key}"
    assert actual >= minimum, f"Deep Dive v2 target reduced: {key}={actual}, minimum={minimum}"

execution = data.get("execution_state", {})
assert execution.get("wave1_passes_preserved") == 100
for wave in range(2, 7):
    assert execution.get(f"wave{wave}_passes_added") == 100, f"Wave {wave} execution count regressed"
assert execution.get("cumulative_passes") == 600, "Cumulative execution must remain 600"
assert execution.get("wave6_primary_seeded") == 92
assert execution.get("wave6_explicit_gaps") == 8

levels = data.get("evidence_levels", {})
assert list(levels) == ["E0", "E1", "E2", "E3", "E4", "E5", "E6"], "E0-E6 evidence maturity must remain explicit"
required_intake = {
    "source_identity", "source_version", "licence", "redistribution_rights", "raw_file_sha256",
    "schema", "units", "row_cycle_count", "sampling_frequency", "machine_context", "material_context",
    "mould_and_cavity_context", "sensor_location", "missingness", "signal_synchronisation",
    "quality_outcome", "intervention_or_doe_structure", "permitted_claims", "prohibited_inferences"
}
assert required_intake.issubset(set(data.get("dataset_intake_required_fields", []))), "Dataset provenance fields regressed"

programme = PROGRAMME_FILE.read_text(encoding="utf-8")
for marker in [
    "2,000", "1,000", "300", "400", "600", "10,000",
    "600 cumulative research/evidence passes", "Wave 6 IDs 501–600",
    "Real-data-first rule", "Evidence maturity", "prediction", "model accuracy", "causality",
    "Do not relabel synthetic data as measured"
]:
    assert marker in programme, f"Programme marker missing: {marker}"

seed = SEED_FILE.read_text(encoding="utf-8")
dataset_rows = len(re.findall(r"^\| .*?\| https?://", seed, flags=re.M))
numbered_sources = [int(x) for x in re.findall(r"^(\d+)\. ", seed, flags=re.M)]
assert dataset_rows >= 6, f"Measured-data candidate seed regressed: {dataset_rows}"
assert numbered_sources and max(numbered_sources) >= 34, "Research seed regressed"
for marker in ["10.5281/zenodo.20744054", "fkk68-zyf30", "10.17632/gtnb4j7bfx.1"]:
    assert marker in seed, f"Required measured-data seed missing: {marker}"

allowed = {"seeded_with_primary", "gap_seeded"}
minimum_seeded = [78, 59, 93, 69, 95, 92]
all_titles = []
wave_counts = {}

for index, path in enumerate(WAVE_FILES, start=1):
    obj = json.loads(path.read_text(encoding="utf-8"))
    start = 1 if index == 1 else (index - 1) * 100 + 1
    end = index * 100
    assert obj.get("pass_count") == 100, f"{path} pass count regressed"
    if index > 1:
        assert obj.get("id_range") == [start, end], f"{path} ID range regressed"
        assert obj.get("cumulative_pass_count") == end, f"{path} cumulative count regressed"
    raw_passes = obj.get("passes", [])
    assert len(raw_passes) == 100, f"{path} does not contain 100 passes"

    normalized = []
    columns = obj.get("columns")
    if columns:
        assert columns == ["id", "title", "theme", "status", "evidence_anchors"], f"Unexpected compact schema in {path}"
        for row in raw_passes:
            assert isinstance(row, list) and len(row) == 5, f"Malformed compact pass in {path}"
            normalized.append({"id": row[0], "title": row[1], "theme": row[2], "status": row[3], "evidence_anchors": row[4]})
    else:
        normalized = raw_passes

    ids = [p.get("id") for p in normalized]
    assert ids == list(range(start, end + 1)), f"{path} IDs must be ordered and contiguous"
    titles = [p.get("title") for p in normalized]
    assert len(set(titles)) == 100 and all(titles), f"{path} titles must be unique/non-empty"
    all_titles.extend(titles)
    for p in normalized:
        assert p.get("theme"), f"Pass {p.get('id')} missing theme"
        assert p.get("status") in allowed, f"Pass {p.get('id')} has unknown status"
        anchors = p.get("evidence_anchors", [])
        assert anchors and all(isinstance(x, str) and x.strip() for x in anchors), f"Pass {p.get('id')} missing anchors"
    seeded = sum(p["status"] == "seeded_with_primary" for p in normalized)
    gaps = 100 - seeded
    assert seeded >= minimum_seeded[index - 1], f"Wave {index} primary-seeded count regressed: {seeded}"
    summary = obj.get("summary", {}).get("by_status", {})
    assert summary.get("seeded_with_primary") == seeded, f"Wave {index} seeded summary disagrees"
    assert summary.get("gap_seeded") == gaps, f"Wave {index} gap summary disagrees"
    wave_counts[f"wave{index}"] = {"seeded": seeded, "gaps": gaps}

assert len(set(all_titles)) == 600, "Pass titles must remain distinct across all six waves"
assert wave_counts["wave6"] == {"seeded": 92, "gaps": 8}

wave6_text = WAVE_FILES[-1].read_text(encoding="utf-8")
for marker in [
    "10.1515/polyeng-2023-0201", "10.18494/SAM.2019.2357", "10.2478/ama-2024-0067",
    "10.1016/j.jmapro.2024.02.021", "10.1002/pls2.70012", "10.1177/0731684407086627",
    "10.1109/TIM.2024.3522402", "10.3390/polym18010032", "10.3389/FRAI.2020.578152"
]:
    assert marker in wave6_text, f"Wave 6 evidence marker missing: {marker}"

wave6_doc = WAVE6_DOC.read_text(encoding="utf-8")
for marker in ["IDs **501–600**", "primary/experimental-seeded passes: **92**", "explicit evidence gaps retained: **8**", "cumulative passes: **600**"]:
    assert marker in wave6_doc, f"Wave 6 execution document marker missing: {marker}"

report = {
    "programme": data["programme"],
    "status_date": data["status_date"],
    "target_count": len(MIN_TARGETS),
    "targets": targets,
    "seed_dataset_candidates": dataset_rows,
    "seed_research_sources": max(numbered_sources),
    "execution_passes": 600,
    "wave_counts": wave_counts,
    "evidence_levels": list(levels),
    "status": "pass",
}
REPORT_FILE.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print("MouldMaster Deep Dive v2 QA passed — 600 cumulative passes protected")
