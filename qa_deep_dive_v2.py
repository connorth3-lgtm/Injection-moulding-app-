from pathlib import Path
import json
import re

TARGET_FILE = Path("data/deep-dive-v2-targets.json")
PROGRAMME_FILE = Path("sources/DEEP_DIVE_V2_PROGRAMME.md")
SEED_FILE = Path("sources/DEEP_DIVE_V2_SEED_RESEARCH.md")
WAVE1_FILE = Path("data/deep-dive-v2-100-pass.json")
WAVE1_DOC = Path("sources/DEEP_DIVE_V2_100_PASS_EXECUTION.md")
EXPANSION_FILE = Path("sources/DEEP_DIVE_V2_100_PASS_EXPANSION.md")
WAVE2_FILE = Path("data/deep-dive-v2-wave2-100-pass.json")
WAVE3_FILE = Path("data/deep-dive-v2-wave3-100-pass.json")
WAVE4_FILE = Path("data/deep-dive-v2-wave4-100-pass.json")
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
    "research_evidence_domains": 400,
}

for path in (TARGET_FILE, PROGRAMME_FILE, SEED_FILE, WAVE1_FILE, WAVE1_DOC,
             EXPANSION_FILE, WAVE2_FILE, WAVE3_FILE, WAVE4_FILE):
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
for wave in range(1, 5):
    key = "wave1_passes_preserved" if wave == 1 else f"wave{wave}_passes_added"
    assert execution.get(key) == 100, f"Wave-{wave} execution state must remain 100"
assert execution.get("cumulative_passes") == 400, "Cumulative execution state must remain 400"

levels = data.get("evidence_levels", {})
assert list(levels) == ["E0", "E1", "E2", "E3", "E4", "E5", "E6"], "Evidence maturity E0-E6 must remain explicit"
required_intake = {
    "source_identity", "source_version", "licence", "redistribution_rights",
    "raw_file_sha256", "schema", "units", "row_cycle_count", "sampling_frequency",
    "machine_context", "material_context", "mould_and_cavity_context", "sensor_location",
    "missingness", "signal_synchronisation", "quality_outcome",
    "intervention_or_doe_structure", "permitted_claims", "prohibited_inferences"
}
assert required_intake.issubset(set(data.get("dataset_intake_required_fields", []))), "Dataset intake provenance fields regressed"

programme = PROGRAMME_FILE.read_text(encoding="utf-8")
for phrase in [
    "2,000", "1,000", "300", "400", "600", "10,000",
    "400 cumulative research/evidence passes", "Real-data-first rule", "Evidence maturity",
    "model accuracy", "causality", "Do not relabel synthetic data as measured"
]:
    assert phrase in programme, f"Deep Dive v2 programme marker missing: {phrase}"

seed = SEED_FILE.read_text(encoding="utf-8")
dataset_rows = len(re.findall(r"^\| .*?\| https?://", seed, flags=re.M))
numbered_sources = [int(x) for x in re.findall(r"^(\d+)\. ", seed, flags=re.M)]
assert dataset_rows >= 6, f"Deep Dive v2 seed must retain at least 6 dataset candidates, found {dataset_rows}"
assert numbered_sources and max(numbered_sources) >= 34, "Deep Dive v2 research seed regressed"
for marker in ["10.5281/zenodo.20744054", "fkk68-zyf30", "10.17632/gtnb4j7bfx.1"]:
    assert marker in seed, f"Required measured-data seed missing: {marker}"

allowed_statuses = {"seeded_with_primary", "gap_seeded"}

def load_wave(path, start, end, cumulative, minimum_seeded):
    text = path.read_text(encoding="utf-8")
    obj = json.loads(text)
    assert obj.get("pass_count") == 100, f"{path} must contain 100 passes"
    if start == 1:
        ids_expected = list(range(1, 101))
    else:
        assert obj.get("id_range") == [start, end], f"{path} ID range regressed"
        assert obj.get("cumulative_pass_count") == cumulative, f"{path} cumulative count regressed"
        ids_expected = list(range(start, end + 1))
    passes = obj.get("passes", [])
    assert len(passes) == 100, f"{path} has {len(passes)} passes"
    ids = [p.get("id") for p in passes]
    assert ids == ids_expected, f"{path} IDs are not ordered/contiguous"
    titles = [p.get("title") for p in passes]
    assert len(set(titles)) == 100 and all(titles), f"{path} titles must be non-empty and unique"
    assert {p.get("status") for p in passes}.issubset(allowed_statuses), f"{path} has unknown statuses"
    for p in passes:
        assert p.get("theme"), f"Pass {p.get('id')} missing theme"
        anchors = p.get("evidence_anchors", [])
        assert anchors and all(isinstance(x, str) and x.strip() for x in anchors), f"Pass {p.get('id')} missing evidence anchors"
    seeded = sum(p["status"] == "seeded_with_primary" for p in passes)
    gaps = sum(p["status"] == "gap_seeded" for p in passes)
    assert seeded >= minimum_seeded, f"{path} primary-seeded count regressed: {seeded}"
    assert gaps == 100 - seeded, f"{path} seeded/gap accounting incoherent"
    summary = obj.get("summary", {}).get("by_status", {})
    assert summary.get("seeded_with_primary") == seeded, f"{path} seeded summary disagrees"
    assert summary.get("gap_seeded") == gaps, f"{path} gap summary disagrees"
    return text, passes, titles, seeded, gaps

wave1_text, wave1, titles1, seeded1, gaps1 = load_wave(WAVE1_FILE, 1, 100, 100, 78)
wave2_text, wave2, titles2, seeded2, gaps2 = load_wave(WAVE2_FILE, 101, 200, 200, 59)
wave3_text, wave3, titles3, seeded3, gaps3 = load_wave(WAVE3_FILE, 201, 300, 300, 93)
wave4_text, wave4, titles4, seeded4, gaps4 = load_wave(WAVE4_FILE, 301, 400, 400, 69)
assert all(p.get("objective") for p in wave1), "Wave-1 objectives must remain present"
assert all(p.get("objective") for p in wave4), "Wave-4 objectives must remain present"
all_titles = titles1 + titles2 + titles3 + titles4
assert len(set(all_titles)) == 400, "Pass titles must remain distinct across all four waves"

assert execution.get("wave2_primary_seeded") == seeded2 and execution.get("wave2_explicit_gaps") == gaps2
assert execution.get("wave3_primary_seeded") == seeded3 and execution.get("wave3_explicit_gaps") == gaps3
assert execution.get("wave4_primary_seeded") == seeded4 and execution.get("wave4_explicit_gaps") == gaps4

wave1_doc = WAVE1_DOC.read_text(encoding="utf-8")
for marker in ["total passes: **100**", "seeded with primary/experimental evidence: **78**", "explicit targeted gaps: **22**", "| 100 | Causal inference"]:
    assert marker in wave1_doc, f"Wave-1 execution marker missing: {marker}"

expansion = EXPANSION_FILE.read_text(encoding="utf-8")
expansion_ids = [int(x) for x in re.findall(r"^\| (\d{1,3}) \|", expansion, flags=re.M)]
assert expansion_ids == list(range(1, 101)), "Wave-1 expansion ledger must retain passes 1-100"
expansion_persistent_ids = set(re.findall(r"`(10\.\d{4,9}/[^`]+)`", expansion))
assert len(expansion_persistent_ids) >= 50, f"Wave-1 evidence queue too small: {len(expansion_persistent_ids)}"
for marker in ["10.1016/j.jmapro.2024.03.019", "10.1002/pen.70028", "10.5281/zenodo.20322729", "31 December 2027"]:
    assert marker in expansion, f"Wave-1 expansion marker missing: {marker}"

for marker in ["10.1016/j.jmapro.2024.03.019", "10.1002/pen.70028", "10.1109/tim.2024.3522402"]:
    assert marker in wave2_text, f"Wave-2 evidence marker missing: {marker}"
for marker in ["10.1002/app.70411", "10.3390/POLYM13111843", "10.1080/0951192X.2020.1829062"]:
    assert marker in wave3_text, f"Wave-3 evidence marker missing: {marker}"
for marker in [
    "10.1002/PC.22149", "10.3390/recycling9050093", "10.3390/MI11040358",
    "10.3390/app12010196", "10.3390/jmmp7010031", "10.1002/app.55374",
    "10.5228/KSTP.2011.20.2.173", "10.3390/JMMP5040113", "10.1002/PEN.23677",
    "10.3139/217.2192", "10.1016/j.asoc.2023.111029", "10.5281/zenodo.20744054"
]:
    assert marker in wave4_text, f"Wave-4 evidence marker missing: {marker}"

report = {
    "programme": data["programme"],
    "status_date": data["status_date"],
    "target_count": len(MIN_TARGETS),
    "targets": targets,
    "seed_dataset_candidates": dataset_rows,
    "seed_research_sources": max(numbered_sources),
    "execution_passes": 400,
    "wave_primary_seeded": {"wave1": seeded1, "wave2": seeded2, "wave3": seeded3, "wave4": seeded4},
    "wave_explicit_gaps": {"wave1": gaps1, "wave2": gaps2, "wave3": gaps3, "wave4": gaps4},
    "evidence_levels": list(levels),
    "status": "pass",
}
REPORT_FILE.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print("MouldMaster Deep Dive v2 QA passed — 400 cumulative passes protected")
