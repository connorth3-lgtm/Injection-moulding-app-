#!/usr/bin/env python3
"""Resolve the current CI update range and publish shared change-impact outputs."""
from __future__ import annotations
import argparse, json, os, subprocess
from pathlib import Path
from change_impact import changed_files, classify

ROOT=Path(__file__).resolve().parents[1]

def git(*args:str)->str:
    return subprocess.check_output(["git",*args],cwd=ROOT,text=True,stderr=subprocess.DEVNULL).strip()

def valid_commit(ref:str)->bool:
    if not ref or set(ref)=={"0"}:
        return False
    return subprocess.run(
        ["git","cat-file","-e",f"{ref}^{{commit}}"],cwd=ROOT,
        stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,
    ).returncode==0

def event_payload()->dict:
    event_path=os.environ.get("GITHUB_EVENT_PATH","")
    if event_path and Path(event_path).is_file():
        try:
            payload=json.loads(Path(event_path).read_text(encoding="utf-8"))
            return payload if isinstance(payload,dict) else {}
        except Exception:
            return {}
    return {}

def pull_request_base_sha()->str:
    event=event_payload()
    value=str((((event.get("pull_request") or {}).get("base") or {}).get("sha") or "")).strip()
    return value if valid_commit(value) else ""

def oldest_ancestor()->str:
    rows=git("rev-list","--max-parents=0","HEAD").splitlines()
    return rows[0] if rows else git("rev-parse","HEAD")

def resolve_base()->str:
    event=event_payload()
    before=str(event.get("before") or "").strip()
    if valid_commit(before):
        return before
    pr_base=pull_request_base_sha()
    if pr_base:
        return pr_base
    base_ref=os.environ.get("GITHUB_BASE_REF","").strip()
    if base_ref:
        for candidate in (f"origin/{base_ref}",base_ref):
            if valid_commit(candidate):
                return git("merge-base",candidate,"HEAD")
    try:
        return git("rev-parse","HEAD^")
    except subprocess.CalledProcessError:
        return git("rev-parse","HEAD")

def governed_candidate_base()->str:
    path=ROOT/"data/release-external-validation-v1.json"
    if path.is_file():
        try:
            data=json.loads(path.read_text(encoding="utf-8"))
            ref=str((data.get("webCandidate") or {}).get("sourceSha") or "").strip()
            if ref:
                if valid_commit(ref):
                    return ref
                # A retained candidate can live on a prior PR branch that is not
                # present in this checkout after a squash merge. Never fall back
                # to HEAD^ in that case: doing so can misclassify a large runtime
                # change as a final QA-only change. The exact PR base is a
                # conservative local comparison point; if it is unavailable,
                # compare from the oldest reachable ancestor.
                pr_base=pull_request_base_sha()
                return pr_base if pr_base else oldest_ancestor()
        except Exception:
            pass
    return resolve_base()

def main()->int:
    ap=argparse.ArgumentParser()
    ap.add_argument("--base")
    ap.add_argument("--governed-candidate",action="store_true")
    ap.add_argument("--head",default="HEAD")
    ap.add_argument("--github-output",default=os.environ.get("GITHUB_OUTPUT",""))
    ap.add_argument("--summary",default=os.environ.get("GITHUB_STEP_SUMMARY",""))
    a=ap.parse_args()
    base=(governed_candidate_base() if a.governed_candidate else (a.base if a.base and valid_commit(a.base) else resolve_base()))
    files=changed_files(base,a.head)
    impact=classify(files)
    print(f"CI IMPACT: base={base} head={a.head} files={len(files)}")
    for key,val in impact.items():
        if isinstance(val,bool):
            print(f"{key}={'true' if val else 'false'}")
    if a.github_output:
        with open(a.github_output,"a",encoding="utf-8") as fh:
            fh.write(f"base={base}\n")
            for key,val in impact.items():
                if isinstance(val,bool):
                    fh.write(f"{key}={'true' if val else 'false'}\n")
    if a.summary:
        with open(a.summary,"a",encoding="utf-8") as fh:
            fh.write("### Change impact\n")
            fh.write(f"- comparison base: `{base}`\n")
            fh.write(f"- changed files: `{len(files)}`\n")
            active=[k for k,v in impact.items() if isinstance(v,bool) and v and not k.endswith("_only")]
            fh.write(f"- impacted areas: `{', '.join(active) if active else 'none'}`\n")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
