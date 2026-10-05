#!/usr/bin/env python3
"""Fast, repair-oriented diagnostics for MouldMaster developers."""
from __future__ import annotations
import argparse, json, os, shlex, subprocess, sys, time
from dataclasses import dataclass, asdict
from pathlib import Path
from change_impact import classify

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"qa-artifacts"
PY=sys.executable

@dataclass(frozen=True)
class Check:
    id:str; category:str; cmd:tuple[str,...]; why:str
    owners:tuple[str,...]; repair:str|None=None; safe_fix:tuple[str,...]|None=None

def capture(cmd):
    t=time.monotonic()
    p=subprocess.run(list(cmd),cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,errors="replace")
    return p.returncode,p.stdout or "",time.monotonic()-t

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

def changed(base,head):
    try:s=git("diff","--name-only","--diff-filter=ACMR",f"{base}...{head}")
    except subprocess.CalledProcessError:s=git("diff","--name-only","--diff-filter=ACMR",base,head)
    return {x.strip() for x in s.splitlines() if x.strip()}

def add(items,cond,item):
    if cond and all(x.id!=item.id for x in items):items.append(item)

def plan(files,deep):
    impact=classify(files)
    c=[]
    add(c,impact["runtime"] or impact["generated"] or deep,Check(
      "runtime-packs","generated-runtime",(PY,"tools/build_runtime_packs.py","--check"),
      "Generated runtime packs must exactly match reviewed source scripts.",
      ("tools/build_runtime_packs.py","src/domains/runtime-packs/"),
      "Run python tools/build_runtime_packs.py",(PY,"tools/build_runtime_packs.py")))
    add(c,impact["runtime"] or impact["generated"] or deep,Check(
      "runtime-manifest","generated-runtime",(PY,"tools/generate_runtime_manifest.py","--check"),
      "The domain manifest must match the current domain tree and ownership rules.",
      ("tools/generate_runtime_manifest.py","runtime-domain-manifest.json","src/domains/"),
      "Run python tools/generate_runtime_manifest.py",(PY,"tools/generate_runtime_manifest.py")))
    add(c,impact["runtime"] or impact["shell"] or deep,Check(
      "style-csp","security-shell",("node","tools/generate_style_csp.cjs","--check"),
      "Runtime-created styles must remain covered by deterministic CSP hashes.",
      ("tools/generate_style_csp.cjs","index.html","src/domains/"),
      "Run node tools/generate_style_csp.cjs",("node","tools/generate_style_csp.cjs")))
    for p in sorted(files):
        if p.endswith((".js",".cjs",".mjs")) and (ROOT/p).exists():
            c.append(Check("syntax:"+p,"syntax",("node","--check",p),
              "Changed JavaScript must parse before deeper QA is useful.",(p,)))
        if p.endswith(".py") and (ROOT/p).exists():
            c.append(Check("syntax:"+p,"syntax",(PY,"-m","py_compile",p),
              "Changed Python must compile before deeper QA is useful.",(p,)))

    impact_logic=any(p in {"tools/change_impact.py","tools/ci_impact.py","qa_change_impact.py"} or p.startswith(".github/workflows/") for p in files)
    add(c,impact_logic or deep,Check("change-impact-contract","ci-routing",(PY,"qa_change_impact.py"),
      "Shared CI impact routing changed and must remain conservative.",
      ("tools/change_impact.py","tools/ci_impact.py","qa_change_impact.py",".github/workflows/"),
      "Fix the central classifier or its regression contract; do not special-case individual workflows around it."))

    toolchain=any(p in {"package.json","package-lock.json","qa_browser_dependency_lock.py"} or p.startswith(".github/workflows/") for p in files)
    add(c,toolchain or deep,Check("browser-toolchain","toolchain",(PY,"qa_browser_dependency_lock.py"),
      "Browser QA dependencies or CI workflow contracts changed.",
      ("package.json","package-lock.json","qa_browser_dependency_lock.py"),
      "Keep browser QA dependencies exactly pinned and regenerate the lock only through the approved toolchain."))
    workflows=any(p.startswith(".github/workflows/") for p in files)
    add(c,workflows or deep,Check("actions-versions","ci-governance",(PY,"qa_critical_actions_versions.py"),
      "GitHub Actions workflow code changed.",
      (".github/workflows/","qa_critical_actions_versions.py"),
      "Use the repository-approved immutable action revisions; do not loosen the version guard."))

    pages=impact["pages"]
    add(c,pages or deep,Check("pages-governance","preview-release",(PY,"qa_pages_single_publisher.py"),
      "Preview publication/provenance contracts changed.",
      (".github/workflows/pages.yml",".github/workflows/preview-pages.yml","tools/build_pages_hold.py","tools/verify_pages_hold.py"),
      "Fix the builder/verifier contract; do not weaken the provenance guard."))

    shell=impact["shell"] or any(p.startswith("qa/feature-reachability") for p in files)
    add(c,shell or deep,Check("app-shell","navigation-shell",(PY,"qa_app_shell_registry.py"),
      "Shell/navigation/runtime ownership changed.",
      ("src/domains/shell/","index.html","service-worker.js","qa_app_shell_registry.py"),
      "Fix the owning shell route/runtime first, then rerun browser reachability."))

    storage=any("assessment-storage" in p or "learner-scope" in p or "training-qa-fix" in p for p in files)
    add(c,storage or deep,Check("assessment-storage","learner-data",(PY,"qa_assessment_storage_scope.py"),
      "Learner-scoped assessment storage or migration changed.",
      ("assessment-storage-scope.js","src/domains/shared/learner-scope.js","qa_assessment_storage_scope.py"),
      "Trace every historical token/migration path before changing cleanup behavior."))

    obs=any("production-health" in p or p in {"support.html","privacy.html"} for p in files)
    add(c,obs or deep,Check("production-observability","observability",(PY,"qa_production_observability.py"),
      "Diagnostics/support/privacy behavior changed.",
      ("src/domains/governance/production-health.js","support.html","privacy.html"),
      "Keep diagnostics local-only and reproduce with the safe snapshot."))

    release=impact["runtime"] or impact["release_metadata"] or any(p in {"support.html","privacy.html"} for p in files)
    add(c,release or deep,Check("release-identity","release-integrity",(PY,"qa_release_docs.py"),
      "Release identity/cache/docs/validation binding changed.",
      ("version.json","index.html","service-worker.js","qa_release_docs.py"),
      "Synchronize release/cache identity; never rewrite evidence to hide candidate drift."))

    candidate_binding=impact["candidate_binding"]
    add(c,candidate_binding or deep,Check("exact-candidate-binding","release-integrity",
      (PY,"tools/verify_release_external_validation.py"),
      "Learner runtime or external HOLD metadata changed, so the retained candidate identity may be stale.",
      ("data/release-external-validation-v1.json","data/pwa-physical-device-validation-v1.json",
       "data/accessibility-real-at-validation-v1.json","data/nzqa-external-validation-v1.json",
       "tools/verify_release_external_validation.py"),
      "Retain the exact current runtime candidate first, then rebind HOLD metadata to its real source SHA, runtime fingerprint and artifact provenance. Do not alter external validation status."))

    if deep:
        c.extend([
          Check("app-wide-audit","cross-domain",(PY,"qa_app_wide_audit.py"),
            "Deep mode checks cross-domain runtime/data assumptions.",("qa_app_wide_audit.py","src/domains/","data/"),
            "Fix the owning domain invariant, not a compatibility symptom."),
          Check("release-core","release-integrity",(PY,"qa_release.py"),
            "Deep mode validates the core release contract.",("qa_release.py","index.html","service-worker.js","version.json"),
            "Fix source/generated artifacts; update QA only for an intentional architecture change.")
        ])
    return c

def output_tail(text,n=5000):
    s=text.strip()
    return s if len(s)<=n else s[-n:]

def reports(files,base,head,results,fixed):
    OUT.mkdir(parents=True,exist_ok=True)
    summary={"checks":len(results),"passed":sum(r["status"]=="pass" for r in results),
             "failed":sum(r["status"]=="fail" for r in results)}
    data={"schema":1,"tool":"mouldmaster-doctor","base":base,"head":head,"changedFiles":sorted(files),
          "safeFixesApplied":fixed,"summary":summary,"results":results,
          "boundary":"Developer triage aid only; governed Release QA and external validation remain authoritative."}
    (OUT/"doctor-report.json").write_text(json.dumps(data,indent=2)+"\n",encoding="utf-8")
    lines=["# MouldMaster Doctor","",f"Base: {base}",f"Head: {head}",
           f"Changed files: {len(files)}",f"Checks: {summary['checks']} | Pass: {summary['passed']} | Fail: {summary['failed']}",""]
    if fixed:
        lines+=["## Safe fixes applied",""]+["- "+x for x in fixed]+[""]
    failed=[r for r in results if r["status"]=="fail"]
    if not failed:lines+=["## Result","","No focused defects detected by Doctor.",""]
    for r in failed:
        lines += ["## "+r["id"]+" ["+r["category"]+"]","",
                  "Why: "+r["why"],"Command: "+r["command"],
                  "Likely owners: "+", ".join(r["owners"]),
                  "Repair: "+(r["repair"] or "Inspect the failing invariant and owning source."),
                  "","Output tail:","",r["output_tail"],""]
    lines+=["---","Doctor is an iteration aid, not release authority.",""]
    (OUT/"doctor-report.md").write_text("\n".join(lines),encoding="utf-8")

def main():
    ap=argparse.ArgumentParser(description="Find breakage quickly and show the shortest repair path.")
    ap.add_argument("--base");ap.add_argument("--head",default="HEAD")
    ap.add_argument("--deep",action="store_true")
    ap.add_argument("--fix-safe",action="store_true",help="regenerate deterministic artifacts, then recheck")
    ap.add_argument("--list",action="store_true")
    a=ap.parse_args()
    base=a.base or auto_base(); files=changed(base,a.head); checks=plan(files,a.deep)
    print(f"MOULDMASTER DOCTOR: {len(files)} changed file(s), {len(checks)} selected check(s)")
    for p in sorted(files):print("  changed:",p)
    if a.list:
        for x in checks:print(f"{x.id:28} [{x.category}] {' '.join(x.cmd)}")
        return 0
    results=[];fixed=[]
    for x in checks:
        command=" ".join(shlex.quote(v) for v in x.cmd)
        print(f"\n==> {x.id} [{x.category}]\n    {command}",flush=True)
        code,out,secs=capture(x.cmd)
        if code and a.fix_safe and x.safe_fix:
            fix=" ".join(shlex.quote(v) for v in x.safe_fix)
            print("    safe-fix:",fix,flush=True)
            fc,fo,_=capture(x.safe_fix)
            if fc==0:
                fixed.append(x.id+": "+fix)
                code,out2,more=capture(x.cmd);secs+=more;out=fo+"\n"+out2
            else:out+="\nSAFE FIX FAILED:\n"+fo
        status="pass" if code==0 else "fail"
        print(f"    {status.upper()} ({secs:.2f}s)")
        if code:
            print("    likely owners:",", ".join(x.owners))
            if x.repair:print("    repair:",x.repair)
        results.append({"id":x.id,"category":x.category,"status":status,"seconds":round(secs,3),
          "command":command,"why":x.why,"owners":list(x.owners),"repair":x.repair,"output_tail":output_tail(out)})
    reports(files,base,a.head,results,fixed)
    failed=sum(r["status"]=="fail" for r in results)
    print("\nDoctor report: qa-artifacts/doctor-report.md")
    print("Machine-readable report: qa-artifacts/doctor-report.json")
    print("MOULDMASTER DOCTOR:", "PASS" if not failed else f"FAIL ({failed} area(s))")
    return 1 if failed else 0

if __name__=="__main__":raise SystemExit(main())
