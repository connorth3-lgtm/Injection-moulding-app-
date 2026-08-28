from pathlib import Path
import json
import re

TARGET_FILE = Path("data/deep-dive-v2-targets.json")
PROGRAMME_FILE = Path("sources/DEEP_DIVE_V2_PROGRAMME.md")
SEED_FILE = Path("sources/DEEP_DIVE_V2_SEED_RESEARCH.md")
WAVE_FILES = [Path("data/deep-dive-v2-100-pass.json"), Path("data/deep-dive-v2-wave2-100-pass.json"), Path("data/deep-dive-v2-wave3-100-pass.json"), Path("data/deep-dive-v2-wave4-100-pass.json"), Path("data/deep-dive-v2-wave5-100-pass.json"), Path("data/deep-dive-v2-wave6-100-pass.json")]
WAVE6_DOC = Path("sources/DEEP_DIVE_V2_WAVE6_EXECUTION.md")
REPORT_FILE = Path("deep-dive-v2-report.json")

MIN_TARGETS = {"peer_reviewed_papers":2000,"primary_measured_studies":1000,"systematic_or_review_papers":250,"public_reusable_dataset_candidates":100,"verified_usable_measured_datasets":50,"real_dataset_adapters":40,"independent_dataset_benchmark_reports":30,"material_behaviour_profiles":300,"resin_families":50,"filled_reinforced_recycled_variants":150,"defect_mechanism_entries":400,"competing_cause_diagnostic_trees":600,"advanced_process_modules":50,"new_diagnostic_cases":1000,"tooling_cooling_cases":250,"machine_health_cases":200,"material_condition_cases":250,"quality_statistics_cases":250,"sensor_process_monitoring_cases":200,"maintenance_cases":150,"energy_sustainability_cases":100,"multi_cavity_cases":150,"labelled_waveform_examples":2000,"assessment_scenario_questions_total":1500,"expert_level_scenarios":300,"licensed_defect_images_eventual":10000,"lessons_and_modules_total":250,"research_evidence_domains":600}

for path in [TARGET_FILE, PROGRAMME_FILE, SEED_FILE, WAVE6_DOC, *WAVE_FILES]:
    assert path.exists(), f"Deep Dive v2 file missing: {path}"

data = json.loads(TARGET_FILE.read_text(encoding="utf-8"))
assert data.get("programme") == "MouldMaster Deep Dive v2"
targets = data.get("targets", {})
for key, minimum in MIN_TARGETS.items():
    actual = targets.get(key)
    assert isinstance(actual, int) and actual >= minimum, f"Target regressed: {key}={actual}"

execution = data.get("execution_state", {})
assert execution.get("wave1_passes_preserved") == 100
for wave in range(2,7): assert execution.get(f"wave{wave}_passes_added") == 100
assert execution.get("cumulative_passes") == 600
assert execution.get("wave6_primary_seeded") == 92 and execution.get("wave6_explicit_gaps") == 8
assert list(data.get("evidence_levels", {})) == ["E0","E1","E2","E3","E4","E5","E6"]

programme = PROGRAMME_FILE.read_text(encoding="utf-8")
for marker in ["2,000","1,000","600 cumulative research/evidence passes","Wave 6 IDs 501–600","Real-data-first rule","Evidence maturity","prediction","model accuracy","causality","Do not relabel synthetic data as measured"]:
    assert marker in programme, f"Programme marker missing: {marker}"

seed = SEED_FILE.read_text(encoding="utf-8")
assert len(re.findall(r"^\| .*?\| https?://", seed, flags=re.M)) >= 6
for marker in ["10.5281/zenodo.20744054","fkk68-zyf30","10.17632/gtnb4j7bfx.1"]: assert marker in seed

minimum_seeded=[78,59,93,69,95,92]
all_titles=[]; wave_counts={}
for index,path in enumerate(WAVE_FILES,1):
    obj=json.loads(path.read_text(encoding="utf-8")); start=1 if index==1 else (index-1)*100+1; end=index*100
    assert obj.get("pass_count")==100
    if index>1:
        assert obj.get("id_range")==[start,end] and obj.get("cumulative_pass_count")==end
    raw=obj.get("passes",[]); assert len(raw)==100
    if obj.get("columns"):
        assert obj["columns"]==["id","title","theme","status","evidence_anchors"]
        rows=[{"id":r[0],"title":r[1],"theme":r[2],"status":r[3],"evidence_anchors":r[4]} for r in raw]
    else: rows=raw
    assert [r.get("id") for r in rows]==list(range(start,end+1))
    titles=[r.get("title") for r in rows]; assert len(set(titles))==100 and all(titles); all_titles+=titles
    for r in rows:
        assert r.get("theme") and r.get("status") in {"seeded_with_primary","gap_seeded"}
        assert r.get("evidence_anchors") and all(isinstance(a,str) and a.strip() for a in r["evidence_anchors"])
    seeded=sum(r["status"]=="seeded_with_primary" for r in rows); gaps=100-seeded
    assert seeded>=minimum_seeded[index-1]
    summary=obj.get("summary",{}).get("by_status",{}); assert summary.get("seeded_with_primary")==seeded and summary.get("gap_seeded")==gaps
    wave_counts[f"wave{index}"]={"seeded":seeded,"gaps":gaps}

assert len(set(all_titles))==600
assert wave_counts["wave6"]=={"seeded":92,"gaps":8}
wave6=WAVE_FILES[-1].read_text(encoding="utf-8")
for marker in ["10.1515/polyeng-2023-0201","10.18494/SAM.2019.2357","10.2478/ama-2024-0067","10.1016/j.jmapro.2024.02.021","10.1002/pls2.70012","10.1177/0731684407086627","10.1109/TIM.2024.3522402","10.3390/polym18010032","10.3389/FRAI.2020.578152"]: assert marker in wave6
wave6_doc=WAVE6_DOC.read_text(encoding="utf-8")
for marker in ["IDs **501–600**","primary/experimental-seeded passes: **92**","explicit evidence gaps retained: **8**","cumulative passes: **600**"]: assert marker in wave6_doc

report={"programme":data["programme"],"status_date":data["status_date"],"targets":targets,"execution_passes":600,"wave_counts":wave_counts,"evidence_levels":list(data["evidence_levels"]),"status":"pass"}
REPORT_FILE.write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
print("MouldMaster Deep Dive v2 QA passed — 600 cumulative passes protected")
