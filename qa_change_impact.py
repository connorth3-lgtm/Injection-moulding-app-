#!/usr/bin/env python3
"""Regression contract for centralized change-impact classification."""
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent/"tools"))
from change_impact import classify
from dependency_graph import impact as graph_impact

def need(cond,msg):
    if not cond:
        raise AssertionError(msg)

cases=[
    ({"src/domains/shell/app-shell-finalize.js"},
     {"runtime","browser","shell","pages","candidate_binding","measured_learning"}),
    ({"data/release-external-validation-v1.json"},
     {"release_metadata","candidate_binding","metadata_only"}),
    ({"tools/mouldmaster_doctor.py"},
     {"tooling","tooling_only"}),
    ({"qa/feature-reachability.spec.js"},
     {"browser","tooling"}),
    ({"src/domains/assessment/assessment-final-hardening.js"},
     {"runtime","browser","assessment","question_quality","candidate_binding"}),
    ({"data/measured-learning/promoted-v1.json"},
     {"measured_learning"}),
    ({"src/domains/process/process-data-integrity.js"},
     {"runtime","browser","process_data","residual_integrity","candidate_binding"}),
    ({".github/workflows/question-quality-50-pass.yml"},
     {"question_quality","workflow","tooling"}),
]
for files,expected in cases:
    impact=classify(files)
    for key in expected:
        need(impact.get(key) is True,f"{sorted(files)} must classify {key}=true")
    if "tooling_only" in expected:
        need(not impact["runtime"],"tooling-only changes must not classify as learner runtime")
        need(not impact["browser"],"tooling-only changes must not launch browser matrix")
    if "metadata_only" in expected:
        need(not impact["runtime"],"release metadata must not mutate learner runtime classification")


graph_cases=[
    ({"src/domains/shell/app-shell-finalize.js"},"shell",{"assessment","process-data","book","preview-release"}),
    ({"data/release-external-validation-v1.json"},"release-evidence",set()),
    ({"src/domains/process/process-data-integrity.js"},"process-data",{"measured-learning"}),
]
for files,direct,downstream in graph_cases:
    graph=graph_impact(files)
    need(direct in graph["directAreas"],f"{sorted(files)} must have direct graph owner {direct}")
    for area in downstream:
        need(area in graph["affectedAreas"],f"{sorted(files)} must affect downstream graph area {area}")

metadata_graph=graph_impact({"data/release-external-validation-v1.json"})
need("shell" not in metadata_graph["directAreas"],"release metadata must not be directly owned by shell")
need(classify({"data/release-external-validation-v1.json"})["runtime"] is False,"release metadata must remain non-runtime after graph expansion")

need(classify(set())["runtime"] is False,"empty diff must not classify runtime")
need(classify(set())["candidate_binding"] is False,"empty diff must not classify candidate binding")
print("Change impact classification QA passed")
