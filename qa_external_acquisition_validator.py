#!/usr/bin/env python3
"""Synthetic negative/positive unit checks only; never evidentiary approval."""
from __future__ import annotations

import csv
import io
from pathlib import Path
from tools.validate_external_acquisitions import validate, EvidenceStructureError, SCHEMAS, TEMPLATE_DIR


def header(issue):
    return next(csv.reader([(TEMPLATE_DIR / SCHEMAS[issue]).read_text(encoding="utf-8").splitlines()[0]]))


def make(issue, **kw):
    return dict.fromkeys(header(issue), "") | kw


def rejects(issue, rows, phrase):
    try:
        validate(issue,header(issue),rows)
    except EvidenceStructureError as exc:
        assert phrase.lower() in str(exc).lower(),(phrase,str(exc))
        return
    raise AssertionError("invalid private evidence falsely passed: " + phrase)


black=[]
for i,relative in enumerate((-2,-1,1,2),1):
    black.append(make("334",record_id=f"rec-{i}",shot_index=str(100+i),
       relative_time_s=str(i),machine_alias="M",mould_alias="T",cavity_alias="C1",
       material_alias="P",lot_alias="L",inspection_method="measured-vision",
       defect_observed="true" if relative<0 else "false",
       defect_count="1" if relative<0 else "0",
       defect_area_mm2="0.1" if relative<0 else "0",
       intervention_event_id="EV1",intervention_type="measured-cleaning",
       relative_shot_from_intervention=str(relative),
       recovery_window_id="R" if relative>0 else "",
       verification_state="verified" if relative==2 else "not-verified",
       source_record_alias=f"source-{i}"))
assert validate("334",header("334"),black)["external_evidence_acquired"] is False
bad=[dict(row) for row in black];bad[2]["recovery_window_id"]=""
rejects("334",bad,"recovery window")
bad=[dict(row) for row in black];bad[2]["defect_count"]="5"
rejects("334",bad,"disagrees")
bad=[dict(row) for row in black];bad[3]["verification_state"]="pending"
rejects("334",bad,"verification")
bad=[dict(row) for row in black];bad[1]["shot_index"]=bad[0]["shot_index"]
rejects("334",bad,"duplicate shot")
bad=[dict(row) for row in black];bad[2]["relative_time_s"]="0.5"
rejects("334",bad,"timestamps")

hot=[]
for i,(command,target,actual) in enumerate((("closed",0,0),("opening",2,0.8),("open",2,1.9))):
    hot.append(make("335",cycle_id="S001",relative_time_ms=str(10*i),
       machine_alias="M",mould_alias="T",gate_alias="G1",cavity_alias="C1",
       command_state=command,target_stroke_mm=str(target),
       actual_pin_position_mm=str(actual),actuator_current_a="2.5",
       cavity_pressure_mpa=str(40+i),quality_record_id="Q1",
       quality_metric_name="mass",quality_metric_value="3.6",
       quality_metric_unit="g",sensor_location_alias="near-gate",
       calibration_record_id="cal-A",source_channel_alias="sensor-001"))
assert validate("335",header("335"),hot)["structural_state"].startswith("candidate")
bad=[dict(row) for row in hot];[row.update(actual_pin_position_mm="0") for row in bad]
rejects("335",bad,"actual pin motion")
bad=[dict(row) for row in hot];bad[2]["quality_record_id"]="Q2"
rejects("335",bad,"quality measurement")
bad=[dict(row) for row in hot];bad[1]["calibration_record_id"]=""
rejects("335",bad,"calibration")
bad=[dict(row) for row in hot];bad[1]["relative_time_ms"]="0"
rejects("335",bad,"duplicate time")
bad=[dict(row) for row in hot];bad[2]["cavity_pressure_mpa"]="NaN"
rejects("335",bad,"NaN")

maintenance=[]
for i,phase in enumerate(("pre","pre","post","post"),1):
    maintenance.append(make("336",record_id=f"E-{i}",asset_alias="tool-A",
       mould_alias="mould-A",cavity_alias="C4",maintenance_event_id="maint-1",
       phase=phase,relative_sequence=str(i),exposure_shots=str(100+i),
       condition_metric_name="surface-roughness",condition_metric_value=str(4/i),
       condition_metric_unit="um",condition_method="calibrated-metrology",
       part_quality_metric_name="flash",part_quality_metric_value=str(5-i),
       part_quality_metric_unit="mm",quality_method="optical-inspection",
       maintenance_action_alias="inspection-and-cleaning",
       source_record_alias=f"record-{i}",
       verification_state="verified" if i==4 else "pending"))
assert validate("336",header("336"),maintenance)["external_evidence_acquired"] is False
bad=[dict(row) for row in maintenance];bad[2]["condition_metric_unit"]="inch"
rejects("336",bad,"metrics")
bad=[dict(row) for row in maintenance];bad[2]["relative_sequence"]="0"
rejects("336",bad,"chronology")
bad=[dict(row) for row in maintenance];bad[3]["verification_state"]="unverified"
rejects("336",bad,"verification")
rejects("336",maintenance[:2],"two comparable")
for issue in SCHEMAS:
    rejects(issue,[],"header-only")
print("Private acquisition structural checks passed: positive and negative synthetic fixtures for #334/#335/#336; no real evidence is claimed.")
