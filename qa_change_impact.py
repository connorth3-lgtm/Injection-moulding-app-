#!/usr/bin/env python3
"""Regression contract for centralized change-impact classification."""
from pathlib import Path
import json
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent/"tools"))
from change_impact import classify
from dependency_graph import impact as graph_impact, load_graph

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
     {"runtime","browser","process_data","residual_integrity","candidate_binding","measured_learning"}),
    ({"src/domains/governance/production-health.js"},
     {"runtime","browser","candidate_binding"}),
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

graph_contract=load_graph()
need(graph_contract.get("schema")==1,"dependency graph schema must remain 1")
areas=graph_contract.get("areas") or {}
need(areas,"dependency graph must declare owned areas")
prefixes=[]
for area,spec in areas.items():
    prefix=spec.get("failureIdPrefix")
    need(isinstance(prefix,str) and prefix.strip(),f"dependency area {area} missing failureIdPrefix")
    prefixes.append(prefix)
    need(isinstance(spec.get("sources"),list) and spec["sources"],f"dependency area {area} missing source ownership")
    need(isinstance(spec.get("checks"),list),f"dependency area {area} checks must be a list")
    for dep in spec.get("dependsOn") or []:
        need(dep in areas,f"dependency area {area} references unknown dependency {dep}")
need(len(prefixes)==len(set(prefixes)),"dependency failure-ID prefixes must be unique")

metadata_graph=graph_impact({"data/release-external-validation-v1.json"})
need("shell" not in metadata_graph["directAreas"],"release metadata must not be directly owned by shell")
need(classify({"data/release-external-validation-v1.json"})["runtime"] is False,"release metadata must remain non-runtime after graph expansion")
need(classify({"src/domains/process/process-data-integrity.js"})["measured_learning"] is True,
     "downstream measured-learning risk must inherit process-data changes from the dependency graph")
need(classify({"src/domains/shell/pwa-shell.js"})["measured_learning"] is True,
     "downstream measured-learning risk must inherit shell changes from the dependency graph")

root=Path(__file__).resolve().parent
for tool in (
    "tools/change_impact.py","tools/ci_impact.py","tools/dependency_graph.py",
    "tools/mouldmaster_doctor.py","tools/mouldmaster_verify.py",
    "tools/rebind_external_hold_candidate.py","tools/github_workflow_baseline.py",
):
    source=(root/tool).read_text(encoding="utf-8")
    compile(source,tool,"exec")
package=json.loads((root/"package.json").read_text(encoding="utf-8"))
scripts=package.get("scripts") or {}
need(scripts.get("verify")=="python tools/mouldmaster_verify.py","package verify command must use canonical verifier")
need(scripts.get("verify:deep")=="python tools/mouldmaster_verify.py --deep","package deep verify command must use canonical verifier")

mobile_workflow=(Path(__file__).resolve().parent/".github/workflows/mobile-browser-qa.yml").read_text(encoding="utf-8")
need("tools/github_workflow_baseline.py --workflow mobile-browser-qa.yml" in mobile_workflow,
     "Mobile Browser QA must route impact from the last successful browser proof")
need("tools/ci_impact.py --base \"$BASE\" --head \"$TARGET\"" in mobile_workflow,
     "Mobile Browser QA must classify the exact range from successful proof to current PR head")
need("cancel-in-progress: true" in mobile_workflow,
     "Mobile Browser QA may cancel superseded runs only because its next run inherits the last successful proof baseline")
baseline_source=(Path(__file__).resolve().parent/"tools/github_workflow_baseline.py").read_text(encoding="utf-8")
need('"status":"success"' in baseline_source and "governed_candidate()" in baseline_source,
     "browser proof resolver must select successful runs and retain a conservative governed-candidate fallback")

# Regress the new-PR CI baseline bug: after a squash-merged candidate is not in
# local ancestry, a first browser run must compare the complete PR merge base,
# not HEAD^ (which could contain only the last documentation/test commit).
need(classify({"qa/cross-browser-smoke.spec.js"})["browser"] is True,
     "a changed cross-browser test must request actual browser execution")
need("pull_request_baseline(target)" in baseline_source and "oldest_ancestor(target)" in baseline_source,
     "browser baseline must fail conservatively if the retained candidate is unreachable")

import os
import tempfile
from unittest import mock
import github_workflow_baseline as proof_baseline

# A green aggregate with skipped browser jobs is not a reusable test proof.
complete_jobs=[{"name":name,"status":"completed","conclusion":"success"}
               for name in proof_baseline.REQUIRED_BROWSER_JOBS]
need(proof_baseline.full_browser_proof(complete_jobs),
     "full Chromium/WebKit/cross-browser/reliability jobs must establish reusable proof")
need(not proof_baseline.full_browser_proof(complete_jobs[:-1]),
     "missing one reliability shard must invalidate browser proof")
need(not proof_baseline.full_browser_proof([
    {"name":"mobile-browser","status":"completed","conclusion":"success"},
    {"name":"browser-cross","status":"completed","conclusion":"skipped"},
]),
     "a green skip-only aggregator cannot stand in for real browser execution")

with tempfile.TemporaryDirectory() as tmp:
    event_path=Path(tmp)/"pr-event.json"
    event_path.write_text(json.dumps({"pull_request":{"base":{"sha":"base-candidate"}}}),encoding="utf-8")
    with mock.patch.dict(os.environ,{
        "GITHUB_EVENT_NAME":"pull_request","GITHUB_HEAD_REF":"first-pr-run",
        "GITHUB_BASE_REF":"preview","GITHUB_EVENT_PATH":str(event_path),
        "GITHUB_REPOSITORY":"","GITHUB_TOKEN":""
    }):
        with (
            mock.patch.object(proof_baseline,"governed_candidate",return_value="unreachable-squash-sha"),
            mock.patch.object(proof_baseline,"is_ancestor",return_value=False),
            mock.patch.object(proof_baseline,"valid_commit",return_value=True),
            mock.patch.object(proof_baseline,"git",return_value="whole-pr-base") as git_calls,
        ):
            need(proof_baseline.resolve("mobile-browser-qa.yml","pr-head")=="whole-pr-base",
                 "first PR run must use full merge base, not last commit")
            need(any(call.args[:2]==("merge-base","base-candidate") for call in git_calls.call_args_list),
                 "browser proof fallback must select the PR event base")

    # A successful but SKIPPED-only earlier workflow must not override the
    # full PR comparison. This was the actual first-run failure on tester QA.
    with mock.patch.dict(os.environ,{
        "GITHUB_EVENT_NAME":"pull_request","GITHUB_HEAD_REF":"first-pr-run",
        "GITHUB_BASE_REF":"preview","GITHUB_EVENT_PATH":str(event_path),
        "GITHUB_REPOSITORY":"org/repo","GITHUB_TOKEN":"fake-test-token",
        "GITHUB_RUN_ID":"current-run"
    }):
        with (
            mock.patch.object(proof_baseline,"api_runs",
                              return_value=[{"id":123,"head_sha":"skip-only-earlier-commit"}]),
            mock.patch.object(proof_baseline,"api_browser_proof",return_value=False) as proof_check,
            mock.patch.object(proof_baseline,"governed_candidate",return_value=""),
            mock.patch.object(proof_baseline,"is_ancestor",return_value=True),
            mock.patch.object(proof_baseline,"valid_commit",return_value=True),
            mock.patch.object(proof_baseline,"git",return_value="whole-pr-base"),
        ):
            need(proof_baseline.resolve("mobile-browser-qa.yml","pr-head")=="whole-pr-base",
                 "green but untested browser run must fall back to full PR merge base")
            proof_check.assert_called_once_with("org/repo",123,"fake-test-token")

    # When webhook/base refs are unavailable, the safest PR behavior is to
    # rerun against the oldest reachable ancestor, not silently trust HEAD^.
    with mock.patch.dict(os.environ,{
        "GITHUB_EVENT_NAME":"pull_request","GITHUB_HEAD_REF":"first-pr-run",
        "GITHUB_BASE_REF":"","GITHUB_EVENT_PATH":"/nonexistent/pr-event.json",
        "GITHUB_REPOSITORY":"","GITHUB_TOKEN":""
    }):
        with (
            mock.patch.object(proof_baseline,"governed_candidate",return_value=""),
            mock.patch.object(proof_baseline,"valid_commit",return_value=False),
            mock.patch.object(proof_baseline,"git",return_value="root-of-history") as git_calls,
        ):
            need(proof_baseline.resolve("mobile-browser-qa.yml","pr-head")=="root-of-history",
                 "unresolvable PR base must select a conservative full-history check")
            need(any(call.args[:2]==("rev-list","--max-parents=0") for call in git_calls.call_args_list),
                 "unresolvable PR baseline must not default to HEAD^")


candidate_workflow=(Path(__file__).resolve().parent/".github/workflows/premerge-public-candidate.yml").read_text(encoding="utf-8")
ci_impact_source=(Path(__file__).resolve().parent/"tools/ci_impact.py").read_text(encoding="utf-8")
need("tools/ci_impact.py --governed-candidate" in candidate_workflow,
     "candidate workflow must use the canonical governed-candidate impact mode")
need("data/release-external-validation-v1.json" in ci_impact_source and "webCandidate" in ci_impact_source,
     "governed-candidate impact mode must derive its baseline from the retained candidate ledger")
need("pull_request_base_sha()" in ci_impact_source and "oldest_ancestor()" in ci_impact_source,
     "governed-candidate impact must fail conservative when a retained source SHA is not locally reachable")
need("Never fall back" in ci_impact_source and "HEAD^" in ci_impact_source,
     "governed-candidate impact must document the squash-history fail-open it prevents")
reuse_source=(Path(__file__).resolve().parent/"tools/verify_retained_candidate_reuse.py").read_text(encoding="utf-8")
need('candidate_release != current_release' in reuse_source and 'version.json' in reuse_source,
     "retained candidate reuse must reject a producer bound to a different web release")

need(classify(set())["runtime"] is False,"empty diff must not classify runtime")
need(classify(set())["candidate_binding"] is False,"empty diff must not classify candidate binding")
print("Change impact classification QA passed")
