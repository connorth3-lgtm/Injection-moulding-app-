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

def resolve_base()->str:
    event_path=os.environ.get("GITHUB_EVENT_PATH","")
    if event_path and Path(event_path).is_file():
        try:
            event=json.loads(Path(event_path).read_text(encoding="utf-8"))
        except Exception:
            event={}
        before=str(event.get("before") or "").strip()
        if valid_commit(before):
            return before
    base_ref=os.environ.get("GITHUB_BASE_REF","").strip()
    if base_ref:
        for candidate in (f"origin/{base_ref}",base_ref):
            if valid_commit(candidate):
                return git("merge-base",candidate,"HEAD")
    try:
        return git("rev-parse","HEAD^")
    except subprocess.CalledProcessError:
        return git("rev-parse","HEAD")

def main()->int:
    ap=argparse.ArgumentParser()
    ap.add_argument("--base")
    ap.add_argument("--head",default="HEAD")
    ap.add_argument("--github-output",default=os.environ.get("GITHUB_OUTPUT",""))
    ap.add_argument("--summary",default=os.environ.get("GITHUB_STEP_SUMMARY",""))
    a=ap.parse_args()
    base=a.base if a.base and valid_commit(a.base) else resolve_base()
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
