#!/usr/bin/env python3
"""Move analytics to canonical Runtime V2 hooks and authoritative practice events.

The migration also normalises malformed HTML quote entities and rebuilds deterministic
runtime packs whenever a packed practice source changes. It is idempotent and fails if
expected source anchors move.
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
        raise SystemExit(f"Could not locate hardening section in {path.relative_to(ROOT)}")
    path.write_text(text[:a] + replacement.rstrip() + "\n\n" + text[b:], encoding="utf-8")


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    if new in text:
        return
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Expected one anchor in {path.relative_to(ROOT)}; found {count}: {old[:72]}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


def harden_learning_analytics_runtime_ownership() -> None:
    path = ROOT / "learning-analytics.js"
    text = path.read_text(encoding="utf-8")
    text = text.replace("/* MouldMaster privacy-preserving learning analytics — 2026.09.05.2 */", "/* MouldMaster privacy-preserving learning analytics — 2026.09.10.2 */", 1)
    text = text.replace("/* MouldMaster privacy-preserving learning analytics — 2026.09.10.1 */", "/* MouldMaster privacy-preserving learning analytics — 2026.09.10.2 */", 1)
    text = text.replace("const VERSION='2026.09.05.2';", "const VERSION='2026.09.10.2';", 1)
    text = text.replace("const VERSION='2026.09.10.1';", "const VERSION='2026.09.10.2';", 1)
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


def add_authoritative_practice_events() -> None:
    diagnostic = ROOT / "diagnostic-learning-labs.js"
    text = diagnostic.read_text(encoding="utf-8")
    text = text.replace("const VERSION='2026.08.30.2';", "const VERSION='2026.09.10.1';", 1)
    diagnostic.write_text(text, encoding="utf-8")
    replace_once(
        diagnostic,
        "let activeLabId=null,answers=[],attemptHadError=false;",
        "let activeLabId=null,answers=[],attemptHadError=false;\nfunction emitPracticeEvent(type,payload={}){window.dispatchEvent(new CustomEvent('mm:practice-event',{detail:{schema:1,module:'diagnostic',type,...payload}}))}",
    )
    replace_once(
        diagnostic,
        "function openLab(id){const lab=LABS.find(x=>x.id===id);if(!lab)return;activeLabId=id;answers=new Array(lab.steps.length).fill(null);attemptHadError=false;const prior=labState(id);saveLab(id,{...prior,attempts:Number(prior.attempts||0)+1});renderLab(0)}",
        "function openLab(id){const lab=LABS.find(x=>x.id===id);if(!lab)return;activeLabId=id;answers=new Array(lab.steps.length).fill(null);attemptHadError=false;const prior=labState(id),attempt=Number(prior.attempts||0)+1;saveLab(id,{...prior,attempts:attempt});emitPracticeEvent('start',{id,attempt});renderLab(0)}",
    )
    replace_once(
        diagnostic,
        "saveLab(lab.id,{...prior,completed:true,bestScore:Math.max(Number(prior.bestScore||0),score),firstTry:Boolean(prior.firstTry||firstTry)});const host=ensureSection();",
        "saveLab(lab.id,{...prior,completed:true,bestScore:Math.max(Number(prior.bestScore||0),score),firstTry:Boolean(prior.firstTry||firstTry)});emitPracticeEvent('complete',{id:lab.id,score,correct,total:lab.steps.length});const host=ensureSection();",
    )
    replace_once(
        diagnostic,
        "if(target.dataset.dlChoice!==undefined){const i=Number(target.dataset.dlChoice);answers[stepIndex]=i;if(!lab.steps[stepIndex].choices[i]?.correct)attemptHadError=true;return renderLab(stepIndex)}",
        "if(target.dataset.dlChoice!==undefined){const i=Number(target.dataset.dlChoice),correct=!!lab.steps[stepIndex].choices[i]?.correct;answers[stepIndex]=i;if(!correct)attemptHadError=true;emitPracticeEvent('choice',{id:lab.id,step:stepIndex,correct});return renderLab(stepIndex)}",
    )

    process = ROOT / "process-data-diagnostics.js"
    text = process.read_text(encoding="utf-8")
    text = text.replace("/* MouldMaster guided process-data diagnostics — 2026.08.26.1 */", "/* MouldMaster guided process-data diagnostics — 2026.09.10.1 */", 1)
    text = text.replace("const VERSION='2026.08.26.1';", "const VERSION='2026.09.10.1';", 1)
    process.write_text(text, encoding="utf-8")
    replace_once(
        process,
        "let activeId=null,answers=[],hadError=false;",
        "let activeId=null,answers=[],hadError=false;\nfunction emitPracticeEvent(type,payload={}){window.dispatchEvent(new CustomEvent('mm:practice-event',{detail:{schema:1,module:'process-data',type,...payload}}))}",
    )
    replace_once(
        process,
        "function openCase(id){const ds=DATASETS.find(x=>x.id===id);if(!ds)return;activeId=id;answers=new Array(4).fill(null);hadError=false;const prior=caseState(id);saveCase(id,{...prior,attempts:Number(prior.attempts||0)+1});renderCase(0)}",
        "function openCase(id){const ds=DATASETS.find(x=>x.id===id);if(!ds)return;activeId=id;answers=new Array(4).fill(null);hadError=false;const prior=caseState(id),attempt=Number(prior.attempts||0)+1;saveCase(id,{...prior,attempts:attempt});emitPracticeEvent('start',{id,attempt});renderCase(0)}",
    )
    replace_once(
        process,
        "saveCase(ds.id,{...prior,completed:true,bestScore:Math.max(Number(prior.bestScore||0),score)});const host=ensureSection();",
        "saveCase(ds.id,{...prior,completed:true,bestScore:Math.max(Number(prior.bestScore||0),score)});emitPracticeEvent('complete',{id:ds.id,score,correct,total:steps.length});const host=ensureSection();",
    )
    replace_once(
        process,
        "if(t.dataset.pdChoice!==undefined){const i=Number(t.dataset.pdChoice);answers[stepIndex]=i;if(!choices[i]?.correct)hadError=true;return renderCase(stepIndex)}",
        "if(t.dataset.pdChoice!==undefined){const i=Number(t.dataset.pdChoice),correct=!!choices[i]?.correct;answers[stepIndex]=i;if(!correct)hadError=true;emitPracticeEvent('choice',{id:ds.id,step:stepIndex,correct});return renderCase(stepIndex)}",
    )


def make_learning_analytics_event_driven() -> None:
    path = ROOT / "learning-analytics.js"
    replacement = r"""function handlePracticeEvent(e){
  const d=e?.detail||{},module=d.module;
  if(Number(d.schema)!==1||!['diagnostic','process-data'].includes(module))return;
  const id=safeString(d.id,96);if(!id)return;
  if(d.type==='start'){
    if(module==='diagnostic')currentDiagnostic=id;else currentProcessData=id;
    startPractice(module,id);return;
  }
  if(d.type==='choice'){
    if(d.correct===false)record('practice_miss',{module,id,step:Number(d.step)||0,correct:false});
    return;
  }
  if(d.type==='complete'){
    finishPractice(module,id,Number(d.score)||0);
    if(module==='diagnostic')currentDiagnostic=null;else currentProcessData=null;
  }
}"""
    replace_section(path, "function handlePracticeClick(e){", "function ensureStyle(){", replacement)
    replace_once(
        path,
        "document.addEventListener('click',e=>{handlePracticeClick(e);const t=e.target.closest?.('[data-la-export],[data-la-clear]');",
        "window.addEventListener('mm:practice-event',handlePracticeEvent);\ndocument.addEventListener('click',e=>{const t=e.target.closest?.('[data-la-export],[data-la-clear]');",
    )


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
    diagnostic = (ROOT / "diagnostic-learning-labs.js").read_text(encoding="utf-8")
    process = (ROOT / "process-data-diagnostics.js").read_text(encoding="utf-8")
    if "renderLesson=wrapped;window.renderLesson=wrapped" in analytics or "switchView=wrapped;window.switchView=wrapped" in analytics:
        raise SystemExit("learning analytics still overwrites a Runtime V2 core dispatcher")
    for marker in ("runtime.after('renderLesson'", "runtime.before('switchView'", "runtime.after('switchView'", "runtime.rebind('renderLesson')", "runtime.rebind('switchView')"):
        if marker not in analytics:
            raise SystemExit(f"missing Runtime V2 analytics hook: {marker}")
    for forbidden in (".dl-choice.wrong", ".pd-choice.wrong", "#diagnosticLabs .dl-summary strong", "#processDataLabs .pd-summary strong", "handlePracticeClick"):
        if forbidden in analytics:
            raise SystemExit(f"learning analytics still scrapes presentation DOM: {forbidden}")
    for source, module in ((diagnostic, "module:'diagnostic'"), (process, "module:'process-data'")):
        for marker in ("'mm:practice-event'", module, "emitPracticeEvent('start'", "emitPracticeEvent('choice'", "emitPracticeEvent('complete'"):
            if marker not in source:
                raise SystemExit(f"authoritative practice event missing: {module} / {marker}")
    if "window.addEventListener('mm:practice-event',handlePracticeEvent)" not in analytics:
        raise SystemExit("learning analytics is not subscribed to authoritative practice events")
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
    add_authoritative_practice_events()
    make_learning_analytics_event_driven()
    fixed = fix_html_quote_escape_maps()
    verify()
    print(f"Runtime/analytics hardening complete; normalised quote escaping in {len(fixed)} source files.")
