#!/usr/bin/env python3
"""Resolve the newest successful CI proof SHA for an impact-aware workflow.

Read-only. If no trustworthy successful proof can be resolved, callers should
fall back to a conservative governed baseline and rerun the expensive checks.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def git(*args:str)->str:
    return subprocess.check_output(["git",*args],cwd=ROOT,text=True,stderr=subprocess.DEVNULL).strip()

def valid_commit(ref:str)->bool:
    if not ref:
        return False
    return subprocess.run(
        ["git","cat-file","-e",f"{ref}^{{commit}}"],cwd=ROOT,
        stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,
    ).returncode==0

def is_ancestor(base:str,head:str)->bool:
    if not valid_commit(base) or not valid_commit(head):
        return False
    return subprocess.run(
        ["git","merge-base","--is-ancestor",base,head],cwd=ROOT,
        stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,
    ).returncode==0

def governed_candidate()->str:
    path=ROOT/"data/release-external-validation-v1.json"
    try:
        data=json.loads(path.read_text(encoding="utf-8"))
        ref=str((data.get("webCandidate") or {}).get("sourceSha") or "").strip()
        if valid_commit(ref):
            return ref
    except Exception:
        pass
    return ""

def api_runs(repository:str,workflow:str,branch:str,token:str)->list[dict]:
    q={"event":"pull_request","status":"success","per_page":"100"}
    if branch:
        q["branch"]=branch
    url=f"https://api.github.com/repos/{repository}/actions/workflows/{urllib.parse.quote(workflow,safe='')}/runs?{urllib.parse.urlencode(q)}"
    req=urllib.request.Request(
        url,
        headers={
            "Accept":"application/vnd.github+json",
            "Authorization":f"Bearer {token}",
            "X-GitHub-Api-Version":"2022-11-28",
            "User-Agent":"mouldmaster-ci-baseline-resolver",
        },
    )
    with urllib.request.urlopen(req,timeout=20) as response:
        payload=json.load(response)
    rows=payload.get("workflow_runs")
    return rows if isinstance(rows,list) else []

def resolve(workflow:str,target:str)->str:
    repository=os.environ.get("GITHUB_REPOSITORY","").strip()
    token=os.environ.get("GITHUB_TOKEN","").strip()
    branch=os.environ.get("GITHUB_HEAD_REF","").strip()
    current_run=str(os.environ.get("GITHUB_RUN_ID","")).strip()
    if repository and token:
        try:
            for row in api_runs(repository,workflow,branch,token):
                if str(row.get("id") or "")==current_run:
                    continue
                sha=str(row.get("head_sha") or "").strip()
                if sha and is_ancestor(sha,target):
                    print(f"Resolved last successful {workflow} proof: {sha}",file=sys.stderr)
                    return sha
        except Exception as exc:
            print(f"Workflow proof lookup unavailable ({type(exc).__name__}); using conservative fallback.",file=sys.stderr)
    fallback=governed_candidate()
    if fallback and is_ancestor(fallback,target):
        print(f"Using governed retained-candidate fallback: {fallback}",file=sys.stderr)
        return fallback
    try:
        fallback=git("rev-parse",f"{target}^")
    except subprocess.CalledProcessError:
        fallback=target
    print(f"Using immediate-parent fallback: {fallback}",file=sys.stderr)
    return fallback

def main()->int:
    ap=argparse.ArgumentParser()
    ap.add_argument("--workflow",required=True)
    ap.add_argument("--target",default=os.environ.get("GITHUB_SHA","HEAD"))
    a=ap.parse_args()
    target=git("rev-parse",a.target)
    print(resolve(a.workflow,target))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
