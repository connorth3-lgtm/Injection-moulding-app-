#!/usr/bin/env python3
"""One-command local verification for MouldMaster changes."""
from __future__ import annotations
import argparse, json, os, subprocess, sys, time
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"qa-artifacts"
PY=sys.executable
sys.path.insert(0,str(ROOT/"tools"))
from change_impact import changed_files, classify
from dependency_graph import impact as graph_impact

def git(*args):
    return subprocess.check_output(["git",*args],cwd=ROOT,text=True).strip()

def auto_base():
    ref=os.environ.get("GITHUB_BASE_REF","").strip()
    if ref:
        for cand in (f"origin/{ref}",ref):
            try:return git("merge-base",cand,"HEAD")
            except subprocess.CalledProcessError:pass
    try:return git("rev-parse","HEAD^")
    except subprocess.CalledProcessError:return git("rev-parse","HEAD")

def run(stage_id,cmd):
    started=time.monotonic()
    p=subprocess.run(cmd,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,errors="replace")
    return {
        "failureId":stage_id,
        "command":" ".join(cmd),
        "status":"pass" if p.returncode==0 else "fail",
        "returnCode":p.returncode,
        "seconds":round(time.monotonic()-started,3),
        "output":(p.stdout or "")[-8000:],
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--base")
    ap.add_argument("--head",default="HEAD")
    ap.add_argument("--deep",action="store_true")
    ap.add_argument("--no-browser",action="store_true")
    a=ap.parse_args()
    base=a.base or auto_base()
    files=changed_files(base,a.head)
    impact=classify(files)
    graph=graph_impact(files)
    stages=[]

    doctor=[PY,"tools/mouldmaster_doctor.py","--base",base,"--head",a.head,"--fix-safe"]
    if a.deep:doctor.append("--deep")
    stages.append(run("VERIFY.DOCTOR.001",doctor))
    if stages[-1]["status"]=="pass":
        stages.append(run("VERIFY.FOCUSED.001",[PY,"qa_fast_feedback.py","--base",base,"--head",a.head]))
    if stages[-1]["status"]=="pass" and impact["browser"] and not a.no_browser:
        stages.append(run("VERIFY.BROWSER.001",["npx","playwright","test","--config=playwright.reachability.config.cjs"]))

    OUT.mkdir(parents=True,exist_ok=True)
    payload={
        "schema":1,
        "tool":"mouldmaster-verify",
        "base":base,
        "head":a.head,
        "changedFiles":sorted(files),
        "impact":impact,
        "dependencyGraph":graph,
        "stages":stages,
        "status":"pass" if all(x["status"]=="pass" for x in stages) else "fail",
        "boundary":"Local verification aid only; governed Release QA and external validation remain authoritative."
    }
    (OUT/"verify-report.json").write_text(json.dumps(payload,indent=2)+"\n",encoding="utf-8")
    lines=["# MouldMaster Verify","",f"Status: **{payload['status'].upper()}**",f"Base: {base}",f"Head: {a.head}",f"Impacted areas: {', '.join(graph['areas']) or 'none'}",""]
    for stage in stages:
        lines += [f"## {stage['failureId']} — {stage['status'].upper()}","",f"Command: {stage['command']}",f"Duration: {stage['seconds']}s","",stage["output"],""]
    lines += ["---","Verify is not release authority.",""]
    (OUT/"verify-report.md").write_text("\n".join(lines),encoding="utf-8")
    print("\n".join(lines[:7]))
    print("Reports: qa-artifacts/verify-report.md and qa-artifacts/verify-report.json")
    return 0 if payload["status"]=="pass" else 1

if __name__=="__main__":
    raise SystemExit(main())
