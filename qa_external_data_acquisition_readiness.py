from pathlib import Path
import csv

ROOT=Path(__file__).resolve().parent
TEMPLATES={
    "data/black-speck-intervention-recovery-template.csv":{
        "record_id","shot_index","relative_time_s","machine_alias","mould_alias","cavity_alias","material_alias","lot_alias",
        "inspection_method","defect_observed","defect_count","defect_area_mm2","intervention_event_id","intervention_type",
        "relative_shot_from_intervention","recovery_window_id","verification_state","source_record_alias"
    },
    "data/hot-runner-synchronised-trace-template.csv":{
        "cycle_id","relative_time_ms","machine_alias","mould_alias","gate_alias","cavity_alias","command_state","target_stroke_mm",
        "actual_pin_position_mm","actuator_current_a","actuator_torque_nm","cavity_pressure_mpa","quality_record_id",
        "quality_metric_name","quality_metric_value","quality_metric_unit","sensor_location_alias","calibration_record_id","source_channel_alias"
    },
    "data/mould-maintenance-recovery-template.csv":{
        "record_id","asset_alias","mould_alias","cavity_alias","maintenance_event_id","phase","relative_sequence","exposure_shots",
        "condition_metric_name","condition_metric_value","condition_metric_unit","condition_method","part_quality_metric_name",
        "part_quality_metric_value","part_quality_metric_unit","quality_method","maintenance_action_alias","source_record_alias","verification_state"
    },
}
FORBIDDEN={"name","email","phone","employer","customer","site","operator_name","learner_name"}

def need(ok,msg):
    if not ok: raise AssertionError(msg)

def main():
    for rel,required in TEMPLATES.items():
        p=ROOT/rel
        need(p.is_file(),f"missing acquisition template: {rel}")
        rows=list(csv.reader(p.read_text(encoding="utf-8").splitlines()))
        need(len(rows)==1,f"{rel} must remain header-only in the public repository")
        header=rows[0]
        need(len(header)==len(set(header)),f"{rel} has duplicate columns")
        need(required.issubset(set(header)),f"{rel} missing required linkage fields: {sorted(required-set(header))}")
        need(not (FORBIDDEN & set(header)),f"{rel} contains direct-identifying/publicly unsafe columns")
    contract=(ROOT/"sources/REAL_PROCESS_DATA_CAPTURE_CONTRACT.md").read_text(encoding="utf-8")
    for issue,template in [
        ("#334","black-speck-intervention-recovery-template.csv"),
        ("#335","hot-runner-synchronised-trace-template.csv"),
        ("#336","mould-maintenance-recovery-template.csv"),
    ]:
        need(issue in contract,f"capture contract missing current acquisition issue {issue}")
        need(template in contract,f"capture contract missing dedicated template {template}")
    need("Raw proprietary rows remain outside the public repository" in contract,"raw proprietary-data boundary weakened")
    queue=(ROOT/"sources/MECHANISM_VALIDATION_QUEUE.md").read_text(encoding="utf-8")
    for issue in ("#334","#335","#336"):
        need(issue in queue,f"mechanism validation queue missing current acquisition issue {issue}")
    print("MouldMaster external data-acquisition readiness QA passed: 3 header-only, privacy-safe, linkage-complete intake schemas for issues #334-#336.")

if __name__=="__main__":
    main()
