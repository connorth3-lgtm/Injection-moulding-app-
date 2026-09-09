#!/usr/bin/env python3
"""Move learning analytics off canonical Runtime V2 wrapper chains.

Also normalises a malformed HTML quote entity found in classic-script escape maps and
rebuilds deterministic runtime packs when a packed source is touched.
"""

from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_section(path: Path, start: str, end: str, replacement: str) -> None:
    text = path.read_text(encoding="utf-8")
    if replacement in text:
        return
    a = text.find(start)
    b = text.find(end)
    if a < 0 or b < 0 or b <= a:
        raise SystemExit(f"Could not locate runtime-ownership section in {path.relative_to(ROOT)}")
    path.write_text(text[:a] + replacement.rstrip() + "\n\n" + text[b:], encoding="utf-8")


def harden_learning_analytics_runtime_ownership() -> None:
    path = ROOT / "learning-analytics.js"
    text = path.read_text(encoding="utf-8")
    text = text.replace(
        "/* MouldMaster privacy-preserving learning analytics — 2026.09.05.2 */",
        "/* MouldMaster privacy-preserving learning analytics — 2026.09.10.1 */",
        1,
    )
    text = text.replace("const VERSION='2026.09.05.2';", "const VERSION='2026.09.10.1';", 1)
    path.write_text(text, encoding="utf-8")

    replacement = r"""let runtimeCoreHooksInstalled=false;
function installCoreHooks(){
  const runtime=window.MM_RUNTIME_V2;
  if(runtime&&!runtimeCoreHooksInstalled){
    runtime.after('renderLesson',()=>{try{if(typeof currentView==='undefined'||currentView==='lesson')startLessonSession()}catch(_){}});
    runtime.before('switchView',id=>{if(id!=='lesson')closeLessonSession('view-change')});
    runtime.after('switchView',(_out,id)=>{if(id==='lesson')startLessonSession()});
    runtime.rebind('renderLesson');runtime.rebind('switchView');
    runtimeCoreHooksInstalled=true;
  }
  try{
    if(typeof goLesson==='function'&&!goLesson.__mmAnalytics){
      const base=goLesson;const wrapped=function(id){closeLessonSession('lesson-change');const r=base.apply(this,arguments);startLessonSession();return r};wrapped.__mmAnalytics=true;goLesson=wrapped;window.goLesson=wrapped;
    }
  }catch(_){}
  try{
    if(typeof window.mmCompleteAndContinue==='function'&&!window.mmCompleteAndContinue.__mmAnalytics){
      const base=window.mmCompleteAndContinue;const wrapped=function(id){let was=false;try{was=Array.isArray(user?.completed)&&user.completed.includes(id)}catch(_){}closeLessonSession('complete');if(!was)record('lesson_complete',{module:'lesson',id:String(id)});const r=base.apply(this,arguments);try{if(typeof currentView==='undefined'||currentView==='lesson')startLessonSession()}catch(_){}return r};wrapped.__mmAnalytics=true;window.mmCompleteAndContinue=wrapped;
    }
  }catch(_){}
  try{
    if(typeof completeLesson==='function'&&!completeLesson.__mmAnalytics){
      const base=completeLesson;const wrapped=function(id){let was=false;try{was=Array.isArray(user?.completed)&&user.completed.includes(id)}catch(_){}closeLessonSession('complete');const r=base.apply(this,arguments);if(!was)record('lesson_complete',{module:'lesson',id:String(id)});startLessonSession();return r};wrapped.__mmAnalytics=true;completeLesson=wrapped;window.completeLesson=wrapped;
    }
  }catch(_){}
}"""
    replace_section(path, "function installCoreHooks(){", "function handlePracticeClick(e){", replacement)


def fix_html_quote_escape_maps() -> list[Path]:
    changed: list[Path] = []
    bad = "'\"':'&quot'"
    good = "'\"':'&quot;'"
    excluded = {ROOT / "src" / "domains" / "runtime-packs" / "evidence-runtime-pack.js", ROOT / "src" / "domains" / "runtime-packs" / "process-data-runtime-pack.js"}
    for path in sorted(ROOT.rglob("*.js")):
        if path in excluded or ".git" in path.parts or "node_modules" in path.parts:
            continue
        text = path.read_text(encoding="utf-8")
        if bad not in text:
            continue
        path.write_text(text.replace(bad, good), encoding="utf-8")
        changed.append(path)
    return changed


def run(*args: str) -> None:
    subprocess.run(args, cwd=ROOT, check=True)


def verify() -> None:
    run("python", "tools/build_runtime_packs.py")
    run("python", "tools/build_runtime_packs.py", "--check")
    analytics = (ROOT / "learning-analytics.js").read_text(encoding="utf-8")
    if "renderLesson=wrapped;window.renderLesson=wrapped" in analytics:
        raise SystemExit("learning analytics still overwrites Runtime V2 renderLesson")
    if "switchView=wrapped;window.switchView=wrapped" in analytics:
        raise SystemExit("learning analytics still overwrites Runtime V2 switchView")
    for marker in ("runtime.after('renderLesson'", "runtime.before('switchView'", "runtime.after('switchView'", "runtime.rebind('renderLesson')"):
        if marker not in analytics:
            raise SystemExit(f"missing Runtime V2 analytics hook: {marker}")
    remaining=[]
    for path in ROOT.rglob("*.js"):
        if ".git" in path.parts or "node_modules" in path.parts:
            continue
        if "'\"':'&quot'" in path.read_text(encoding="utf-8"):
            remaining.append(str(path.relative_to(ROOT)))
    if remaining:
        raise SystemExit("Malformed HTML quote entities remain: " + ", ".join(remaining))
    changed = subprocess.check_output(["git", "diff", "--name-only"], cwd=ROOT, text=True).splitlines()
    for name in changed:
        if name.endswith(".js"):
            run("node", "--check", name)


if __name__ == "__main__":
    harden_learning_analytics_runtime_ownership()
    fixed = fix_html_quote_escape_maps()
    verify()
    print(f"Runtime/analytics hardening complete; normalised quote escaping in {len(fixed)} source files.")
