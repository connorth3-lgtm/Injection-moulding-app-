#!/usr/bin/env python3
"""Generate hardened runtime copies of the frozen core's inline script blocks.

`MouldMaster_Core_App.html` is also the immutable legacy Windows recovery payload,
so its bytes are intentionally not rewritten. This generator creates a non-executable,
build-prepared core shell whose inline scripts are replaced with same-origin generated
assets and whose static handler/style attributes are retired before publication.

Generated script transforms remove the recovery core's historical certificate-print
`document.write` call and rewrite generated inline event-handler markup to inert
`data-mm-on*` attributes. A strict delegated bridge is concatenated into the final
generated core slot. The browser therefore only installs the prepared shell and
replays governed scripts in order; it no longer repeats static hardening on startup.
"""

from __future__ import annotations

import argparse
import difflib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / "MouldMaster_Core_App.html"
INDEX = ROOT / "index.html"
OUT_DIR = ROOT / "src/core-runtime"
ASSEMBLY_PAYLOAD = OUT_DIR / "core-source.txt"
SERVICE_WORKER = ROOT / "service-worker.js"
DESKTOP_PACKAGE = ROOT / "desktop/electron/package.json"
DESKTOP_INTEGRITY = ROOT / "desktop/electron/scripts/generate-integrity.cjs"
HANDLER_BRIDGE_PATH = OUT_DIR / "inline-handler-bridge.js"
STYLE_BRIDGE_PATH = OUT_DIR / "inline-style-bridge.js"

INLINE_SCRIPT_RE = re.compile(r"<script(?P<attrs>[^>]*)>(?P<body>.*?)</script\b[^>]*>", re.I | re.S)
SRC_ATTR_RE = re.compile(r"\bsrc\s*=", re.I)
PAYLOAD_RUNTIME_REF_RE = re.compile(r'src=["\']\./src/core-runtime/(core-inline-\d{3}\.js)["\']')
TAG_RE = re.compile(r"<[^>]+>", re.S)
HANDLER_ATTR_RE = re.compile(r"(?P<prefix>[\s<])on(?P<event>click|change|input|keydown)\s*=", re.I)
STYLE_ATTR_RE = re.compile(r"(?P<prefix>\s)style\s*=", re.I)
PRINT_CERTIFICATE_RE = re.compile(
    r"function printCertificate\(level,region\)\{.*?\n\}\n\n/\* Instructor dashboard understands regional score keys\. \*/",
    re.S,
)

HARDENED_PRINT_CERTIFICATE = r'''function printCertificate(level,region){
  const key=level+"-"+region,date=certificateDateText(key);
  const w=window.open("","_blank","width=900,height=650"); if(!w){toast("Allow pop-ups to print a single certificate");return}
  w.opener=null;
  const d=w.document;
  d.title="MouldMaster Certificate";
  const meta=d.createElement("meta");meta.setAttribute("charset","utf-8");d.head.appendChild(meta);
  const style=d.createElement("style");style.textContent="body{font-family:system-ui;padding:45px;text-align:center}.box{border:10px double #24364d;padding:50px;max-width:760px;margin:auto}.seal{font-size:48px}.muted{color:#555}";d.head.appendChild(style);
  const box=d.createElement("div");box.className="box";
  box.innerHTML=`<div class="seal">MM</div><h1>${esc(level)} ${region==="US"?"Injection Molding":"Injection Moulding"}</h1><p>This records that <b>${esc(user.name)}</b> passed the MouldMaster Academy ${esc(level)} assessment in <b>${esc(regionName(region))}</b> standards mode.</p><p class="muted">Local learning record · Not an accredited compliance qualification<br>${esc(date)}</p>`;
  d.body.appendChild(box);
  setTimeout(()=>{w.focus();w.print()},0);
}

/* Instructor dashboard understands regional score keys. */'''

LEGACY_SIM_ACCESSIBILITY = r'''/* ---------- Accessibility: explicit names for simulator controls ---------- */
safeSlider=function(label,key,min,max,val,help){
  const units={speed:"%",transfer:"%",hold:"%",holdTime:"s",melt:"",mould:"",cooling:"s",clamp:"%",vent:"%",moisture:"%"};
  return `<label>${esc(label)}
    <div class="range-row">
      <input aria-label="${esc(label)}" type="range" min="${min}" max="${max}" value="${val}" oninput="simChange('${key}',this.value)">
      <input aria-label="${esc(label)} current display" id="sim_${key}" value="${val}${units[key]||""}" readonly>
    </div>
    ${help?`<small class="muted">${esc(help)}</small>`:""}
  </label>`;
};'''

HARDENED_SIM_ACCESSIBILITY = r'''/* ---------- Accessibility: explicit names and semantic values for simulator controls ---------- */
function pvSafeSimDisplay(key,value){
  if(typeof safeSimLabel==="function"){
    try{return String(safeSimLabel(key,+value));}catch(_e){}
  }
  return String(value);
}
if(typeof simChange==="function"){
  const PV_simChange_accessibility_base=simChange;
  simChange=function(k,v){
    PV_simChange_accessibility_base(k,v);
    const control=document.getElementById(`sim_range_${k}`);
    if(control)control.setAttribute("aria-valuetext",pvSafeSimDisplay(k,v));
  };
}
safeSlider=function(label,key,min,max,val,help){
  const display=pvSafeSimDisplay(key,val);
  return `<label>${esc(label)}
    <div class="range-row">
      <input id="sim_range_${esc(key)}" aria-label="${esc(label)}" aria-valuetext="${esc(display)}" type="range" min="${min}" max="${max}" value="${val}" oninput="simChange('${key}',this.value)">
      <input aria-label="${esc(label)} current display" aria-live="polite" id="sim_${key}" value="${esc(display)}" readonly>
    </div>
    ${help?`<small class="muted">${esc(help)}</small>`:""}
  </label>`;
};'''


SIMULATOR_SEMANTIC_REPLACEMENTS = {
    "Move process variables and see how relative defect risk changes.": "Move process variables and see how synthetic training signals respond.",
    "Move the controls. The model predicts relative defect risk for learning only; it is not a replacement for material/machine/tooling data.": "Move the controls to explore a synthetic sensitivity exercise. Fixed teaching weights are not probabilities, physical defect predictors, material or machine limits, process windows, or production settings.",
    ">Robust preset<": ">Lower-signal example<",
    ">Trouble preset<": ">Higher-signal example<",
    "<span class=\"eyebrow\">Predicted response</span><h2>Relative defect risk</h2>": "<span class=\"eyebrow\">Synthetic training response</span><h2>Relative teaching signals</h2>",
    "The simulated process is in a relatively low-risk region. Now challenge one variable at a time to see which responses are most sensitive.": "The synthetic teaching signals are relatively low in this exercise. Change one variable at a time to see which labelled responses are most sensitive.",
    "Highest predicted risk: <b>${top[0]}</b>. Use the Defect Lab to inspect likely mechanisms, then make a controlled test rather than changing several settings.": "Highest teaching signal: <b>${top[0]}</b>. This is not a defect probability or physical prediction. Use the Defect Lab to inspect plausible mechanisms, then make a controlled test rather than changing several settings.",
    "When additional hold time no longer increases mass, the gate is effectively sealed for that condition.": "When added hold time no longer produces a repeatable mass increase, that plateau is evidence consistent with diminishing additional material transfer for the tested condition; confirm repeatability and, where available, cavity-pressure or dimensional evidence rather than treating it as universal proof of the exact gate-freeze instant.",
}


LEGACY_WEIGHTED_SIMULATOR = r'''function clamp01(x){return Math.max(0,Math.min(100,x))}
function simRisks(){
 const s=simulatorState;
 return {
  "Short shot":clamp01((95-s.transfer)*9 + (45-s.speed)*.8 + (220-s.melt)*.22 + (50-s.hold)*.18),
  "Flash":clamp01((s.transfer-97)*12 + (s.hold-65)*.55 + (60-s.clamp)*1.1 + (s.melt-255)*.12),
  "Sink":clamp01((55-s.hold)*.8 + (5-s.holdTime)*8 + (12-s.cooling)*1.7),
  "Burn":clamp01((s.speed-70)*.8 + (55-s.vent)*1.1 + (s.melt-270)*.16),
  "Splay":clamp01(s.moisture*.75 + (s.melt-285)*.15 + (s.speed-85)*.3),
  "Warpage":clamp01((13-s.cooling)*3 + Math.abs(s.mould-60)*.28 + (s.hold-80)*.18)
 }
}
function updateSimulator(){
 const r=simRisks();
 $("#riskList").innerHTML=Object.entries(r).map(([k,v])=>\`<div class="risk"><span>\${k}</span><div class="riskbar"><span style="width:\${v}%"></span></div><b>\${Math.round(v)}</b></div>\`).join("");
 const top=Object.entries(r).sort((a,b)=>b[1]-a[1])[0];
 let advice=top[1]<30?"The synthetic teaching signals are relatively low in this exercise. Change one variable at a time to see which labelled responses are most sensitive.":\`Highest teaching signal: <b>\${top[0]}</b>. This is not a defect probability or physical prediction. Use the Defect Lab to inspect plausible mechanisms, then make a controlled test rather than changing several settings.\`;
 $("#simAdvice").innerHTML=advice;
 const ov=$("#simOverlay");let html="";
 if(r["Burn"]>55)html+=\`<div style="position:absolute;width:28px;height:28px;border-radius:50%;background:#54200f;right:34%;top:32%;box-shadow:0 0 18px #ff7b00"></div>\`;
 if(r["Flash"]>55)html+=\`<div style="position:absolute;width:180px;height:8px;background:#55d6be;left:calc(50% - 90px);top:calc(50% + 56px);border-radius:50%"></div>\`;
 if(r["Short shot"]>55)html+=\`<div style="position:absolute;width:75px;height:125px;background:#0c182a;right:calc(50% - 80px);top:calc(50% - 62px);transform:rotate(12deg)"></div>\`;
 if(r["Splay"]>55)html+=\`<div style="position:absolute;width:95px;height:3px;background:#eef8ff;left:calc(50% - 45px);top:44%;transform:rotate(25deg);box-shadow:0 12px #eef8ff,0 24px #eef8ff"></div>\`;
 ov.innerHTML=html;
}'''

QUALITATIVE_SIMULATOR_BOOTSTRAP = r'''function simPromptRows(){return []}
function updateSimulator(){
 const rows=simPromptRows();
 const host=$("#riskList");
 if(host)host.innerHTML=rows.map(row=>`<div class="risk" data-sim-cues="${row.cues.length}"><span>${esc(row.name)}</span><b>${row.cues.length?"Check evidence":"No directional cue"}</b>${row.cues.length?`<small class="muted">${row.cues.map(esc).join(" · ")}</small>`:""}</div>`).join("");
 const active=rows.filter(row=>row.cues.length);
 const advice=$("#simAdvice");
 if(advice)advice.textContent=active.length?"Baseline changes create mechanism prompts only. They are not ranked predictions. Verify the relevant machine, mould, material and part evidence before making another controlled change.":"No directional mechanism prompts are active at the current training baseline. This does not prove the real process is defect-free.";
 const ov=$("#simOverlay");if(ov)ov.replaceChildren();
}'''

LEGACY_RESCUE_LOGIC = r'''function startRescueChallenge(){
  rescueActive=true;simPreset("trouble");toast("Rescue started: get every simulated risk below 45");
}
function checkRescueChallenge(){
  if(!rescueActive){toast("Start a rescue challenge first");return}
  const r=simRisks(),max=Math.max(...Object.values(r));
  if(max<45){
    rescueActive=false;awardXP(60,"rescue-"+funToday(),"Process rescue",{celebrate:true});
    toast("Process rescued in the learning simulator");
  }else{
    const worst=Object.entries(r).sort((a,b)=>b[1]-a[1])[0];
    toast(\`Still unstable: highest simulated risk is \${worst[0]} (\${Math.round(worst[1])})\`);
  }
}'''

BASELINE_RECOVERY_LOGIC = r'''function startRescueChallenge(){
  rescueActive=true;simPreset("trouble");toast("Baseline recovery started: return every training control to its displayed reference");
}
function checkRescueChallenge(){
  if(!rescueActive){toast("Start a baseline recovery challenge first");return}
  const baseline=window.MM_SIMULATOR_TRAINING_BASELINE||{};
  const restored=Object.keys(baseline).length>0&&Object.keys(baseline).every(key=>Number(simulatorState[key])===Number(baseline[key]));
  if(restored){
    rescueActive=false;awardXP(60,"rescue-"+funToday(),"Baseline recovery",{celebrate:true});
    toast("Training baseline restored");
  }else{
    const active=simPromptRows().filter(row=>row.cues.length).map(row=>row.name);
    toast(active.length?`Baseline not restored. Evidence prompts remain for: ${active.join(", ")}`:"Baseline not restored yet. Match every displayed reference control.");
  }
}'''

LEGACY_RELATIVE_SIMULATOR = r'''simRisks=function(){
  const s=simulatorState;
  const short=clamp01(8+(45-s.fillAgg)*.7+(47-s.transfer)*1.7+Math.max(0,-s.meltOffset)*1.5+(45-s.pack)*.35);
  const flash=clamp01(6+(s.transfer-55)*1.8+(s.pack-62)*.8+(15-s.clampMargin)*2+Math.max(0,s.meltOffset)*.7);
  const sink=clamp01(8+(48-s.pack)*1.2+(45-s.hold)*1.1+(42-s.cooling)*.5);
  const burn=clamp01(5+(s.fillAgg-70)*1.1+(55-s.vent)*1.25+Math.max(0,s.meltOffset-8)*1.2);
  const splay=clamp01(5+(60-s.moistureConfidence)*1.15+(s.fillAgg-82)*.35+Math.max(0,s.meltOffset-12)*.8);
  const warp=clamp01(7+(42-s.cooling)*.9+Math.abs(s.mouldOffset)*1.15+Math.abs(s.pack-55)*.22);
  return {"Short shot":short,"Flash":flash,"Sink":sink,"Burn":burn,"Splay":splay,"Warpage":warp};
};'''

QUALITATIVE_RELATIVE_SIMULATOR = r'''const SIM_TRAINING_BASELINE=Object.freeze({fillAgg:50,transfer:50,pack:50,hold:50,meltOffset:0,mouldOffset:0,cooling:50,clampMargin:25,vent:75,moistureConfidence:85});
window.MM_SIMULATOR_TRAINING_BASELINE=SIM_TRAINING_BASELINE;
simPromptRows=function(){
  const s=simulatorState,b=SIM_TRAINING_BASELINE;
  const cue=(condition,text)=>condition?text:null;
  const rows=[
    {name:"Short shot",cues:[
      cue(s.fillAgg<b.fillAgg,"fill direction is less aggressive than the baseline"),
      cue(s.transfer<b.transfer,"V/P transfer is earlier than the baseline"),
      cue(s.pack<b.pack,"packing input is below the baseline"),
      cue(s.meltOffset<0,"melt temperature is below the baseline")
    ]},
    {name:"Flash",cues:[
      cue(s.transfer>b.transfer,"V/P transfer is later than the baseline"),
      cue(s.pack>b.pack,"packing input is above the baseline"),
      cue(s.clampMargin<b.clampMargin,"entered clamp-margin training control is below the baseline"),
      cue(s.meltOffset>0,"melt temperature is above the baseline")
    ]},
    {name:"Sink",cues:[
      cue(s.pack<b.pack,"packing input is below the baseline"),
      cue(s.hold<b.hold,"hold duration is below the baseline"),
      cue(s.cooling<b.cooling,"cooling margin is below the baseline")
    ]},
    {name:"Burn",cues:[
      cue(s.fillAgg>b.fillAgg,"fill direction is more aggressive than the baseline"),
      cue(s.vent<b.vent,"venting-condition confidence is below the baseline"),
      cue(s.meltOffset>0,"melt temperature is above the baseline")
    ]},
    {name:"Splay",cues:[
      cue(s.moistureConfidence<b.moistureConfidence,"moisture-control confidence is below the baseline"),
      cue(s.fillAgg>b.fillAgg,"fill direction is more aggressive than the baseline"),
      cue(s.meltOffset>0,"melt temperature is above the baseline")
    ]},
    {name:"Warpage",cues:[
      cue(s.cooling<b.cooling,"cooling margin is below the baseline"),
      cue(s.mouldOffset!==b.mouldOffset,"mould temperature differs from the baseline"),
      cue(s.pack!==b.pack,"packing input differs from the baseline")
    ]}
  ];
  return rows.map(row=>({name:row.name,cues:row.cues.filter(Boolean)}));
};'''


def fail(message: str) -> None:
    raise SystemExit(message)


def inline_blocks(core: str) -> list[str]:
    return [
        match.group("body")
        for match in INLINE_SCRIPT_RE.finditer(core)
        if not SRC_ATTR_RE.search(match.group("attrs") or "")
    ]


def retire_handler_attrs(source: str) -> str:
    return HANDLER_ATTR_RE.sub(
        lambda match: f"{match.group('prefix')}data-mm-on{match.group('event').lower()}=",
        source,
    )


def retire_static_tag_attrs(tag: str) -> str:
    hardened = HANDLER_ATTR_RE.sub(
        lambda match: f"{match.group('prefix')}data-mm-on{match.group('event').lower()}=",
        tag,
    )
    return STYLE_ATTR_RE.sub(lambda match: f"{match.group('prefix')}data-mm-style=", hardened)


def prepared_assembly_payload(core: str, expected_names: list[str]) -> str:
    cursor = 0

    def externalize(match: re.Match[str]) -> str:
        nonlocal cursor
        attrs = match.group("attrs") or ""
        if SRC_ATTR_RE.search(attrs):
            return match.group(0)
        if cursor >= len(expected_names):
            fail("frozen core contains more inline scripts than generated runtime slots")
        name = expected_names[cursor]
        cursor += 1
        return f'<script{attrs} src="./src/core-runtime/{name}"></script>'

    prepared = INLINE_SCRIPT_RE.sub(externalize, core)
    if cursor != len(expected_names):
        fail(f"prepared core externalized {cursor} scripts; expected {len(expected_names)}")
    prepared = TAG_RE.sub(lambda match: retire_static_tag_attrs(match.group(0)), prepared)
    if re.search(r"<script\b(?![^>]*\bsrc\s*=)[^>]*>", prepared, flags=re.I):
        fail("prepared core payload still contains inline script tags")
    if HANDLER_ATTR_RE.search(prepared):
        fail("prepared core payload still contains executable handler attributes")
    if re.search(r"<[^>]*\sstyle\s*=", prepared, flags=re.I | re.S):
        fail("prepared core payload still contains inline style attributes")
    return prepared



# The immutable Windows recovery source cannot be changed. Its ten earlier
# shadowed classic-script functions may only be retired from the *generated*
# web/desktop learner runtime in the next governed web/cache release.
CORE_SHADOWED_RETIRE_NAMES = (
    "updateGlobalProgress", "renderDashboard", "renderPath", "renderLesson",
    "renderExams", "startExam", "gradeExam", "renderCertificates",
    "certificateCard", "renderProfile",
)
CORE_RETIRE_MIN_RELEASE = (2026, 10, 9, 6)
CORE_TOP_LEVEL_FUNCTION = re.compile(r"(?m)^function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(")


def core_shadowed_retirement_enabled() -> bool:
    version = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
    raw = str(version.get("web_release") or "")
    if not re.fullmatch(r"\d{4}\.\d{2}\.\d{2}\.\d+", raw):
        fail("cannot select generated core retirement with unknown release identity")
    return tuple(map(int, raw.split("."))) >= CORE_RETIRE_MIN_RELEASE


def retire_shadowed_core_declarations(source: str) -> str:
    """Remove only proven earlier declarations; leave later active bodies intact."""
    decls = list(CORE_TOP_LEVEL_FUNCTION.finditer(source))
    original = {}
    for match in decls:
        original.setdefault(match.group(1), []).append(match.start())
    duplicates = {name for name, offsets in original.items() if len(offsets) > 1}
    if duplicates != set(CORE_SHADOWED_RETIRE_NAMES):
        fail(f"core shadowed function inventory drifted: {sorted(duplicates)}")
    if any(len(original[name]) != 2 for name in CORE_SHADOWED_RETIRE_NAMES):
        fail("core earlier/active function pair count drifted")
    starts = sorted(m.start() for m in decls)
    ranges = []
    for name in CORE_SHADOWED_RETIRE_NAMES:
        start = original[name][0]
        next_start = next((pos for pos in starts if pos > start), None)
        if next_start is None:
            fail(f"bounded shadowed function end missing: {name}")
        dead_body = source[start:next_start]
        if (not dead_body.startswith(f"function {name}(")
                or not dead_body.rstrip().endswith("}")
                or "\nfunction " in dead_body
                or re.search(r"(?m)^(?:const|let|var|class|if|for|while|try|throw|return)\b", dead_body)):
                or len(dead_body) < 30):
            fail(f"unsafe earlier shadowed function boundary: {name}")
        ranges.append((start, next_start))
    retired = source
    for start, end in sorted(ranges, reverse=True):
        retired = retired[:start] + retired[end:]
    after = {}
    for match in CORE_TOP_LEVEL_FUNCTION.finditer(retired):
        after.setdefault(match.group(1), []).append(match.start())
    if any(len(after[name]) != 1 for name in CORE_SHADOWED_RETIRE_NAMES):
        fail("generated core still has duplicated or missing active declarations")
    if any(len(after.get(name, [])) != len(offsets)
           for name, offsets in original.items()
           if name not in CORE_SHADOWED_RETIRE_NAMES):
        fail("generated retirement touched an unrelated function")
    return retired



def runtime_transform(name: str, source: str, *, retire_shadowed: bool = False) -> str:
    transformed = source
    if name == "core-inline-001.js":
        old = '''    box.style.cssText =
      "position:fixed;inset:16px;z-index:999999;background:#20151a;color:#fff;" +
      "border:2px solid #ff7b86;border-radius:14px;padding:18px;overflow:auto;" +
      "font-family:system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5)";'''
        new = '''    box.style.position = "fixed";
    box.style.inset = "16px";
    box.style.zIndex = "999999";
    box.style.background = "#20151a";
    box.style.color = "#fff";
    box.style.border = "2px solid #ff7b86";
    box.style.borderRadius = "14px";
    box.style.padding = "18px";
    box.style.overflow = "auto";
    box.style.fontFamily = "system-ui,sans-serif";
    box.style.boxShadow = "0 20px 60px rgba(0,0,0,.5)";'''
        if transformed.count(old) != 1:
            fail("frozen startup failure cssText source drifted; review the runtime hardening transform")
        transformed = transformed.replace(old, new, 1)
    if name == "core-inline-004.js":
        if source.count("document.write(") != 1 or "function printCertificate(level,region)" not in source:
            fail("frozen certificate print source drifted; review the runtime hardening transform")
        transformed, count = PRINT_CERTIFICATE_RE.subn(HARDENED_PRINT_CERTIFICATE, source, count=1)
        if count != 1:
            fail("certificate print runtime transform did not match exactly once")
        if "document.write(" in transformed or "document.writeln(" in transformed:
            fail("certificate print runtime transform left document.write active")
        # Keep the active learner renderer immune to a clobbered legacy
        # window.currentLesson property. The compatibility global remains for
        # other legacy surfaces, but internal callers bind a stable lexical
        # resolver to the already-validated active learner and canonical lessons.
        legacy_lesson = 'function currentLesson(){ return D.lessons.find(l=>l.id===user.currentLesson)||D.lessons[0] }'
        safe_lesson = 'const mmCoreSafeLesson = () => D.lessons.find(l=>l.id===user.currentLesson)||D.lessons[0];'
        if transformed.count(legacy_lesson) != 1:
            fail("frozen currentLesson resolver source drifted; review startup transform")
        transformed = transformed.replace(legacy_lesson, legacy_lesson + "\n" + safe_lesson, 1)
        transformed, protected_lesson_calls = re.subn(
            r'(?<!function )currentLesson\(\)',
            'mmCoreSafeLesson()',
            transformed,
        )
        if protected_lesson_calls < 4:
            fail("frozen core learner call sites drifted; review protected startup resolver")
        if "function mmCoreSafeLesson()" in transformed:
            fail("currentLesson name transform unexpectedly rewrote a declaration")
        startup_award_validator = 'if(!mmStartupUniqueLessonIdsAreSafe(record.completed)||!mmStartupUniqueLessonIdsAreSafe(record.bookmarks)||!mmStartupCertificatesAreSafe(record.certificates))return false;'
        startup_award_validator_hardened = 'if(!mmStartupUniqueLessonIdsAreSafe(record.completed)||!mmStartupUniqueLessonIdsAreSafe(record.bookmarks)||(record.learningAwards!=null&&!mmStartupCertificatesAreSafe(record.learningAwards)))return false;'
        if transformed.count(startup_award_validator) != 1:
            fail("frozen learner-award startup validator drifted")
        transformed = transformed.replace(startup_award_validator, startup_award_validator_hardened, 1)
        legacy_badge_notice = '    persist();confetti(24);funTone("level");\n    setTimeout(()=>toast(`Achievement unlocked: ${newOnes[0].name}`),120);'
        quiet_badge_notice = '    // Keep awarded badges but retire the disruptive automatic gamification toast.\n    persist();'
        if transformed.count(legacy_badge_notice) != 1:
            fail('frozen achievement source drifted; review the noninterruptive UI transform')
        transformed = transformed.replace(legacy_badge_notice, quiet_badge_notice, 1)
        transformed = transformed.replace("user.certificates", "user.learningAwards")
        transformed = transformed.replace("u.certificates", "u.learningAwards")
        transformed = transformed.replace("u.certificateMeta", "u.learningAwardMeta")
        transformed = transformed.replace("user.certificateMeta", "user.learningAwardMeta")
        transformed = transformed.replace('"certificateMeta"', '"learningAwardMeta"')
        transformed = transformed.replace("certificateMeta:", "learningAwardMeta:")
        transformed = transformed.replace("certificates:[]", "learningAwards:[]")
        transformed = transformed.replace("certificates:Array.isArray(u.learningAwards)?", "learningAwards:Array.isArray(u.learningAwards)?")
        startup_hydration_anchor = '}catch(e){db=JSON.parse(JSON.stringify(PRISTINE_DB));mmStartupLearnerDataRejected=true}\nlet user = db.users[db.activeUser];'
        startup_hydration = '''}catch(e){db=JSON.parse(JSON.stringify(PRISTINE_DB));mmStartupLearnerDataRejected=true}
function mmDerivedLearningAwards(record){
  const awards=new Set(Array.isArray(record.learningAwards)?record.learningAwards.filter(mmStartupCertificateKeyIsSafe):[]);
  for(const [key,value] of Object.entries(record.examScores||{}))if(Number(value)>=80&&mmStartupCertificateKeyIsSafe(key))awards.add(key);
  for(const [key,value] of Object.entries(record.examPassStatus||{}))if(value===true&&mmStartupCertificateKeyIsSafe(key))awards.add(key);
  return [...awards].slice(0,15);
}
for(const record of Object.values(db.users||{})){
  record.learningAwards=mmDerivedLearningAwards(record);
  if(!record.learningAwardMeta||typeof record.learningAwardMeta!=="object"||Array.isArray(record.learningAwardMeta))record.learningAwardMeta={};
  delete record.certificates;
  delete record.certificateMeta;
}
let user = db.users[db.activeUser];'''
        if transformed.count(startup_hydration_anchor) != 1:
            fail("frozen learner-award hydration anchor drifted")
        transformed = transformed.replace(startup_hydration_anchor, startup_hydration, 1)
        if "user.certificates" in transformed or "u.certificates" in transformed or "certificateMeta:" in transformed:
            fail("active learner runtime still persists legacy certificate-named award fields")
        learner_id_expr = 'pvRequireLearnerId("learner-"+Date.now())'
        learner_id_count = transformed.count(learner_id_expr)
        if learner_id_count != 2:
            fail(f"frozen learner creation identity source drifted: expected 2 occurrences, got {learner_id_count}")
        learner_id_helper = r'''function pvNewLearnerId(){
  const users=db&&db.users&&typeof db.users==='object'?db.users:{};
  for(let attempt=0;attempt<8;attempt++){
    let entropy='';
    try{entropy=globalThis.crypto?.randomUUID?.()||''}catch(_){}
    if(!entropy)entropy=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}-${attempt}`;
    const id=pvRequireLearnerId(`learner-${entropy}`);
    if(!Object.prototype.hasOwnProperty.call(users,id))return id;
  }
  throw new Error('Unable to allocate a unique learner identifier');
}
'''
        create_marker = "function createLearner(){"
        if transformed.count(create_marker) < 1:
            fail("frozen learner creation function missing")
        transformed = transformed.replace(create_marker, learner_id_helper + create_marker, 1)
        transformed = transformed.replace(learner_id_expr, "pvNewLearnerId()")
        standards_marker = "function renderStandards(){"
        if transformed.count(standards_marker) != 1:
            fail("frozen standards renderer source drifted; expected one renderStandards function")
        standards_helper = r'''function pvSafeExternalUrl(raw){
  const url=String(raw||'').trim();
  return /^https:\/\/[^\s]+$/i.test(url)?url:'';
}
function pvSafeSourceLink(raw,label){
  const url=pvSafeExternalUrl(raw);
  return url?`<a class="standard-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`:'<span class="tiny muted">Official source URL unavailable</span>';
}
function pvStandardsLink(item,label){
  return pvSafeSourceLink(item?.url,label);
}
'''
        transformed = transformed.replace(standards_marker, standards_helper + standards_marker, 1)
        standards_links = {
            '<a class="standard-link" href="${item.url}" target="_blank" rel="noopener">Open official/reference source ↗</a>': "${pvStandardsLink(item,'Open official/reference source ↗')}",
            '<a class="standard-link" href="${item.url}" target="_blank" rel="noopener">Open source ↗</a>': "${pvStandardsLink(item,'Open source ↗')}",
        }
        for old, new in standards_links.items():
            if transformed.count(old) != 1:
                fail(f"frozen standards link source drifted for marker: {old}")
            transformed = transformed.replace(old, new, 1)
        assessment_source_link = '<a class="standard-link" href="${x.sourceUrl}" target="_blank" rel="noopener">${esc(x.reference)} ↗</a>'
        assessment_source_count = transformed.count(assessment_source_link)
        if assessment_source_count != 2:
            fail(f"frozen assessment source-link count drifted: expected 2, got {assessment_source_count}")
        transformed = transformed.replace(
            assessment_source_link,
            "${pvSafeSourceLink(x.sourceUrl,x.reference)}",
        )
        unsafe_defect_prompt = "closeModal();switchView('coach');setCoachPrompt('${esc(d.name).replace(/'/g,\"\\\\'\")}')"
        if transformed.count(unsafe_defect_prompt) != 1:
            fail("frozen defect-coach handler source drifted; review bounded handler transform")
        transformed = transformed.replace(unsafe_defect_prompt, "askCoachForDefect(${i})", 1)
        defect_helper_marker = "\n}\n\nfunction renderScenarios(){"
        if transformed.count(defect_helper_marker) != 1:
            fail("frozen defect renderer boundary drifted; expected one helper insertion point")
        transformed = transformed.replace(
            defect_helper_marker,
            """
}
function askCoachForDefect(i){
 const d=D.defects[i];
 if(!d)return;
 closeModal();
 switchView("coach");
 setCoachPrompt(String(d.name||""));
}

function renderScenarios(){""",
            1,
        )
        for old, new in SIMULATOR_SEMANTIC_REPLACEMENTS.items():
            if transformed.count(old) != 1:
                fail(f"frozen simulator semantic source drifted for marker: {old}")
            transformed = transformed.replace(old, new, 1)
        transformed, count = re.subn(
            r"function clamp01\(x\)\{.*?\nfunction updateSimulator\(\)\{.*?\n\}\n(?=function resetSimulator\(\))",
            QUALITATIVE_SIMULATOR_BOOTSTRAP + "\n",
            transformed,
            count=1,
            flags=re.S,
        )
        if count != 1:
            fail("frozen weighted simulator block drifted; expected one bounded clamp01/updateSimulator block")
        transformed, count = re.subn(
            r"function startRescueChallenge\(\)\{.*?\n\}\nfunction checkRescueChallenge\(\)\{.*?\n\}\n(?=\n/\* Wrap the final audited exam grader)",
            BASELINE_RECOVERY_LOGIC + "\n",
            transformed,
            count=1,
            flags=re.S,
        )
        if count != 1:
            fail("frozen simulator rescue block drifted; expected one bounded challenge block")
        transformed, count = re.subn(
            r"simRisks=function\(\)\{.*?\n\};\n(?=simChange=function)",
            QUALITATIVE_RELATIVE_SIMULATOR + "\n",
            transformed,
            count=1,
            flags=re.S,
        )
        if count != 1:
            fail("frozen relative weighted simulator block drifted; expected one bounded simRisks override")
        transformed = transformed.replace(
            "Move the controls to explore a synthetic sensitivity exercise. Fixed teaching weights are not probabilities, physical defect predictors, material or machine limits, process windows, or production settings.",
            "Move the controls to explore a synthetic baseline-direction exercise. The mechanism prompts are qualitative teaching cues, not probabilities, physical defect predictors, material or machine limits, process windows, or production settings.",
            1,
        )
        transformed = transformed.replace(
            "Start from a deliberately poor simulated condition. Bring every displayed relative defect-risk score below 45. This is a game using the educational model — not a production recipe.",
            "Start from a deliberately changed training condition. Return every control to its displayed known-good baseline/reference. Success means only that the exercise baseline was restored; it is not process optimisation or a production recipe.",
            1,
        )
        transformed = transformed.replace(
            "Start from a deliberately poor relative condition. Bring every displayed training-risk indicator below 45. The indicators are educational scores, not probabilities, specifications or safe production limits.",
            "Start from a deliberately changed relative condition and return every control to its displayed reference. The exercise has no defect probability, severity score, safe threshold or production-setting authority.",
            1,
        )
        challenge_heading = '<span class="eyebrow">Process Rescue</span><h3>Can you stabilise the simulated process?</h3>'
        if transformed.count(challenge_heading) < 1:
            fail("frozen simulator challenge heading drifted")
        transformed = transformed.replace(
            challenge_heading,
            '<span class="eyebrow">Baseline Recovery</span><h3>Can you restore the training baseline?</h3>',
        )
        challenge_buttons = '<button class="secondary" onclick="startRescueChallenge()">Start rescue</button> <button class="ghost" onclick="checkRescueChallenge()">Check my process</button>'
        if transformed.count(challenge_buttons) < 1:
            fail("frozen simulator challenge buttons drifted")
        transformed = transformed.replace(
            challenge_buttons,
            '<button class="secondary" onclick="startRescueChallenge()">Start baseline recovery</button> <button class="ghost" onclick="checkRescueChallenge()">Check baseline</button>',
        )
        transformed = transformed.replace(
            '<button class="secondary" onclick="startRescueChallenge()">Start rescue</button>',
            '<button class="secondary" onclick="startRescueChallenge()">Start baseline recovery</button>',
        )
        transformed = transformed.replace(
            '<button class="ghost" onclick="checkRescueChallenge()">Check my process</button>',
            '<button class="ghost" onclick="checkRescueChallenge()">Check baseline</button>',
        )
        transformed = transformed.replace(
            '<div class="card output-panel"><span class="eyebrow">Educational response</span><h2>Relative defect-risk indicators</h2>',
            '<div class="card output-panel"><span class="eyebrow">Educational response</span><h2>Mechanism prompts from baseline direction</h2>',
            1,
        )
        transformed = transformed.replace(
            "These scores show direction-of-effect in a simplified training model. They are not defect probabilities and must not be used to set a production process.",
            "These prompts only connect the direction of a training change to mechanisms worth checking. They are not ranked, scored, predictive, causal, or suitable for setting a production process.",
            1,
        )
    if name == "core-inline-007.js":
        if transformed.count(LEGACY_SIM_ACCESSIBILITY) != 1:
            fail("frozen simulator accessibility source drifted; review the runtime hardening transform")
        transformed = transformed.replace(LEGACY_SIM_ACCESSIBILITY, HARDENED_SIM_ACCESSIBILITY, 1)
        transformed = transformed.replace("clean.certificates", "clean.learningAwards")
        transformed = transformed.replace("clean.certificateMeta", "clean.learningAwardMeta")
        transformed = transformed.replace("u.certificates", "u.learningAwards")
        transformed = transformed.replace("u.certificateMeta", "u.learningAwardMeta")
        transformed = transformed.replace("certificates:Array.isArray(u.learningAwards)?", "learningAwards:Array.isArray(u.learningAwards)?")
        transformed = transformed.replace("certificateMeta:pvCleanCertificateMeta(u.learningAwardMeta)", "learningAwardMeta:pvCleanCertificateMeta(u.learningAwardMeta)")
        if "clean.certificates" in transformed or "u.certificates" in transformed or "certificateMeta:pvCleanCertificateMeta" in transformed:
            fail("active import runtime still persists legacy certificate-named award fields")
    if name == "core-inline-008.js":
        legacy = """setTimeout(function () {
  try {
    var dash = document.getElementById("dashboard");
    var navButtons = document.querySelectorAll("#nav button[data-view]");
    if (!dash || !dash.innerHTML.trim()) {
      window.__mmShowStartupFailure(
        "The application scripts loaded but the Home dashboard did not render."
      );
      return;
    }
    if (!navButtons.length) {
      window.__mmShowStartupFailure(
        "The application rendered but navigation controls were not found."
      );
    }
  } catch (e) {
    window.__mmShowStartupFailure("Startup self-check failed: " + e.message);
  }
}, 700);"""
        hardened = """(function mmStartupSelfCheck(){
  var started=Date.now();
  function check(){
    try {
      if (!window.MM_APP_SHELL_FINALIZED) {
        if (Date.now()-started < 10000) { setTimeout(check,250); return; }
        window.__mmShowStartupFailure("The application shell did not finish starting within 10 seconds.");
        return;
      }
      var dash = document.getElementById("dashboard");
      var navButtons = document.querySelectorAll("#nav button[data-view]");
      if (!dash || !dash.innerHTML.trim()) {
        window.__mmShowStartupFailure("The application scripts loaded but the Home dashboard did not render.");
        return;
      }
      if (!navButtons.length) {
        window.__mmShowStartupFailure("The application rendered but navigation controls were not found.");
      }
    } catch (e) {
      window.__mmShowStartupFailure("Startup self-check failed: " + e.message);
    }
  }
  setTimeout(check,250);
})();"""
        if transformed.count(legacy) != 1:
            fail("frozen startup self-check source drifted; review the runtime hardening transform")
        transformed = transformed.replace(legacy, hardened, 1)
    if name == "core-inline-010.js":
        legacy_update_card = "  function mmUpdateCard(){\n    const s=mmUpdateState(), copy=mmStatusText(s.status);\n    return `<div class=\"card form-card\" style=\"margin-top:14px\">\n      <span class=\"eyebrow\">Updates</span>\n      <h2 style=\"margin-bottom:6px\">${copy[0]}</h2>\n      <p class=\"muted\">${copy[1]}</p>\n      <div class=\"grid2\" style=\"margin-top:10px\">\n        <div class=\"stat\"><span>Installed version</span><b>${s.version}</b></div>\n        <div class=\"stat\"><span>Update mode</span><b>Automatic on launch</b></div>\n      </div>\n      <p class=\"tiny muted\" style=\"margin-top:10px\">Learner progress, notes, scores and certificates stay in your browser profile and are not replaced by app updates.</p>\n    </div>`;\n  }\n  function attachUpdateCard(){\n    try{\n      const profile=document.getElementById(\"profile\");\n      if(profile && !profile.querySelector(\"[data-mm-update-card]\")){\n        const wrap=document.createElement(\"div\");\n        wrap.setAttribute(\"data-mm-update-card\",\"1\");\n        wrap.innerHTML=mmUpdateCard();\n        profile.appendChild(wrap);\n      }\n    }catch(e){}\n  }"
        hardened_update_card = "  function mmUpdateCard(){\n    const s=mmUpdateState(), copy=mmStatusText(s.status);\n    const card=document.createElement(\"div\");card.className=\"card form-card\";card.style.marginTop=\"14px\";\n    const eyebrow=document.createElement(\"span\");eyebrow.className=\"eyebrow\";eyebrow.textContent=\"Updates\";\n    const title=document.createElement(\"h2\");title.style.marginBottom=\"6px\";title.textContent=copy[0];\n    const detail=document.createElement(\"p\");detail.className=\"muted\";detail.textContent=copy[1];\n    const grid=document.createElement(\"div\");grid.className=\"grid2\";grid.style.marginTop=\"10px\";\n    const versionStat=document.createElement(\"div\");versionStat.className=\"stat\";\n    const versionLabel=document.createElement(\"span\");versionLabel.textContent=\"Installed version\";\n    const versionValue=document.createElement(\"b\");versionValue.textContent=String(s.version||MM_APP_VERSION);\n    versionStat.append(versionLabel,versionValue);\n    const modeStat=document.createElement(\"div\");modeStat.className=\"stat\";\n    const modeLabel=document.createElement(\"span\");modeLabel.textContent=\"Update mode\";\n    const modeValue=document.createElement(\"b\");modeValue.textContent=\"Automatic on launch\";\n    modeStat.append(modeLabel,modeValue);grid.append(versionStat,modeStat);\n    const note=document.createElement(\"p\");note.className=\"tiny muted\";note.style.marginTop=\"10px\";\n    note.textContent=\"Learner progress, notes, scores and certificates stay in your browser profile and are not replaced by app updates.\";\n    card.append(eyebrow,title,detail,grid,note);\n    return card;\n  }\n  function attachUpdateCard(){\n    try{\n      const profile=document.getElementById(\"profile\");\n      if(profile && !profile.querySelector(\"[data-mm-update-card]\")){\n        const wrap=document.createElement(\"div\");\n        wrap.setAttribute(\"data-mm-update-card\",\"1\");\n        wrap.appendChild(mmUpdateCard());\n        profile.appendChild(wrap);\n      }\n    }catch(e){}\n  }"
        if transformed.count(legacy_update_card) != 1:
            fail("frozen update-card source drifted; review DOM-safe runtime transform")
        transformed = transformed.replace(legacy_update_card, hardened_update_card, 1)
    if name == "core-inline-004.js" and retire_shadowed:
        transformed = retire_shadowed_core_declarations(transformed)
    return retire_handler_attrs(transformed)


def expected_assets(core: str) -> dict[str, str]:
    blocks = inline_blocks(core)
    if not blocks:
        fail("frozen core has no inline script blocks to externalize at build time")
    if not HANDLER_BRIDGE_PATH.is_file():
        fail("strict handler bridge source is missing")
    if not STYLE_BRIDGE_PATH.is_file():
        fail("strict style bridge source is missing")
    bridge = HANDLER_BRIDGE_PATH.read_text(encoding="utf-8").rstrip() + "\n"
    result: dict[str, str] = {}
    for index, source in enumerate(blocks, start=1):
        name = f"core-inline-{index:03d}.js"
        transformed = runtime_transform(name, source, retire_shadowed=core_shadowed_retirement_enabled())
        if index == len(blocks):
            transformed = transformed.rstrip() + "\n\n/* ===== strict delegated handler bridge ===== */\n" + bridge
        result[name] = transformed
    return result


def tighten_script_csp(index: str) -> str:
    old = "script-src 'self'; script-src-attr 'unsafe-inline';"
    new = "script-src 'self'; script-src-attr 'none';"
    if old in index:
        return index.replace(old, new, 1)
    if new in index:
        return index
    fail("index.html script CSP shape was not recognised")


def bump_cache(index: str, worker: str) -> tuple[str, str]:
    old_revision = "maturity-hardening-v2-r5-20260903"
    new_revision = "maturity-hardening-v2-r6-20260904"
    old_cache = "mouldmaster-static-2026.09.03.1-maturity-hardening-v2-r5-20260903"
    new_cache = "mouldmaster-static-2026.09.03.1-maturity-hardening-v2-r6-20260904"
    if old_revision in worker:
        worker = worker.replace(old_revision, new_revision, 1)
    elif new_revision not in worker:
        fail("service-worker cache revision was not recognised")
    if old_cache in index:
        index = index.replace(old_cache, new_cache, 1)
    elif new_cache not in index:
        fail("index expected static cache was not recognised")
    return index, worker


def insert_worker_assets(worker: str, names: list[str]) -> str:
    marker = "  './src/core-runtime/core-source.txt',\n"
    if marker not in worker:
        fail("service-worker CORE insertion point missing")
    assets = [f"./src/core-runtime/{name}" for name in names]
    missing = [asset for asset in assets if f"'{asset}'" not in worker]
    if not missing:
        return worker
    block = "".join(f"  '{asset}',\n" for asset in missing)
    return worker.replace(marker, marker + block, 1)


def insert_desktop_resources(package: str) -> str:
    entry = '      {"from": "../../src/core-runtime", "to": "mouldmaster/src/core-runtime"},\n'
    if entry in package:
        return package
    marker = '      {"from": "../../src/domains", "to": "mouldmaster/src/domains"},\n'
    if marker not in package:
        fail("desktop core-runtime resource insertion point missing")
    return package.replace(marker, entry + marker, 1)


def enable_integrity_directory(integrity: str) -> str:
    if "STATIC_RUNTIME_DIRS" not in integrity:
        marker = "const REQUIRED_MANIFEST_FILES=[\n"
        if marker not in integrity:
            fail("desktop integrity constant insertion point missing")
        integrity = integrity.replace(marker, "const STATIC_RUNTIME_DIRS=['src/core-runtime'];\n" + marker, 1)
    if "const staticRuntimeFiles=" not in integrity:
        marker = "const manifestFiles=[...runtimeManifest.assets,...runtimeManifest.dataAssets].map(runtimeAssetPath);\n"
        addition = (
            marker
            + "const staticRuntimeFiles=STATIC_RUNTIME_DIRS.flatMap(rel=>fs.readdirSync(path.join(ROOT,rel),{withFileTypes:true})"
            + ".filter(x=>x.isFile()).map(x=>`${rel}/${x.name}`));\n"
        )
        if marker not in integrity:
            fail("desktop integrity manifest-files insertion point missing")
        integrity = integrity.replace(marker, addition, 1)
    old = "const FILES=[...new Set([...BASE_FILES,...manifestFiles])];"
    new = "const FILES=[...new Set([...BASE_FILES,...staticRuntimeFiles,...manifestFiles])];"
    if old in integrity:
        integrity = integrity.replace(old, new, 1)
    elif new not in integrity:
        fail("desktop integrity FILES expression was not recognised")
    return integrity


def check_state() -> None:
    core = CORE.read_text(encoding="utf-8")
    index = INDEX.read_text(encoding="utf-8")
    if 'const CORE_URL="./src/core-runtime/core-source.txt";' not in index:
        fail("browser bootstrap must assemble from the non-executable prepared core-source.txt payload")
    expected = expected_assets(core)
    expected_names = list(expected)
    prepared = prepared_assembly_payload(core, expected_names)
    if not ASSEMBLY_PAYLOAD.is_file() or ASSEMBLY_PAYLOAD.read_text(encoding="utf-8") != prepared:
        fail("prepared non-executable core assembly payload is missing or stale")
    refs = list(dict.fromkeys(PAYLOAD_RUNTIME_REF_RE.findall(prepared)))
    if refs != expected_names:
        fail(f"prepared core runtime refs drifted: {refs} != {expected_names}")
    if "function versionPreparedCore(out)" not in index or "out=versionPreparedCore(out)" not in index:
        fail("browser bootstrap does not version prepared core runtime assets")
    if "function externalizeCoreScripts(out)" in index or "retireInlineHandlerAttrs" in index or "retireInlineStyleAttrs" in index:
        fail("browser bootstrap must not repeat build-time core externalization or static attribute hardening")
    if "./src/core-runtime/inline-style-bridge.js" not in index:
        fail("browser bootstrap strict style bridge is missing")
    body_scripts = re.findall(r"\['(\./[^']+\.js)'\s*,\s*'<script", index)
    if len(body_scripts) > 39:
        fail(f"handler bridge increased bootstrap debt: {len(body_scripts)} BODY_SCRIPTS > 39")
    for name, body in expected.items():
        path = OUT_DIR / name
        if not path.is_file():
            fail(f"missing generated core runtime asset: {name}")
        actual_body = path.read_text(encoding="utf-8")
        if actual_body != body:
            diff = list(difflib.unified_diff(
                actual_body.splitlines(),
                body.splitlines(),
                fromfile=f"committed/{name}",
                tofile=f"generated/{name}",
                lineterm="",
                n=3,
            ))
            print("\n".join(diff[:240]))
            fail(f"generated core runtime asset is stale: {name}")
        if HANDLER_ATTR_RE.search(body):
            fail(f"generated core runtime still emits inline handler attributes: {name}")
    extras = sorted(path.name for path in OUT_DIR.glob("core-inline-*.js") if path.name not in expected)
    if extras:
        fail("stale generated core runtime assets remain: " + ", ".join(extras))
    active_source = "\n".join(expected.values())
    if "document.write(" in active_source or "document.writeln(" in active_source:
        fail("active generated core runtime still contains document.write")
    hardened = expected.get("core-inline-004.js", "")
    for retired in SIMULATOR_SEMANTIC_REPLACEMENTS:
        if retired in hardened:
            fail(f"learner simulator still contains retired predictive wording: {retired}")
    for required in (
        "synthetic baseline-direction exercise",
        "mechanism prompts are qualitative teaching cues",
        "Mechanism prompts from baseline direction",
        "They are not ranked, scored, predictive, causal",
        "MM_SIMULATOR_TRAINING_BASELINE",
        "simPromptRows=function()",
        "universal proof of the exact gate-freeze instant",
    ):
        if required not in hardened:
            fail(f"learner simulator semantic hardening marker missing: {required}")
    for marker in ("w.opener=null", "d.createElement(\"style\")", "d.body.appendChild(box)", "w.print()"):
        if marker not in hardened:
            fail(f"certificate print runtime hardening marker missing: {marker}")
    for marker in ("function pvSafeExternalUrl(raw)", "function pvStandardsLink(item,label)", 'rel="noopener noreferrer"', "Official source URL unavailable"):
        if marker not in hardened:
            fail(f"standards-link hardening marker missing: {marker}")
    for marker in ("function pvNewLearnerId()", "crypto?.randomUUID", "Object.prototype.hasOwnProperty.call(users,id)", "Unable to allocate a unique learner identifier"):
        if marker not in hardened:
            fail(f"learner identity hardening marker missing: {marker}")
    if 'learner-"+Date.now()' in hardened:
        fail("active learner creation must not use timestamp-only profile IDs")
    if 'href="${item.url}"' in hardened:
        fail("active standards renderer must not interpolate raw governed URLs into href")
    if 'href="${x.sourceUrl}"' in hardened:
        fail("active assessment renderer must not interpolate raw source URLs into href")
    if "function pvSafeSourceLink(raw,label)" not in hardened:
        fail("active assessment/source link renderer is missing the HTTPS-safe link helper")
    final_slot = expected[expected_names[-1]]
    for marker in ("MM_INLINE_HANDLER_BRIDGE", "ALLOWED_CALLS", "executeHandler"):
        if marker not in final_slot:
            fail(f"strict handler bridge missing from final generated core slot: {marker}")
    if "script-src 'self'; script-src-attr 'none';" not in index:
        fail("script-src-attr has not been tightened to none")
    if "script-src-attr 'unsafe-inline'" in index or "script-src 'self' 'unsafe-inline'" in index:
        fail("runtime CSP still permits inline script execution")
    worker = SERVICE_WORKER.read_text(encoding="utf-8")
    if "'./src/core-runtime/core-source.txt'" not in worker:
        fail("service-worker CORE must cache the non-executable core assembly payload")
    core_array = re.search(r"const\s+CORE\s*=\s*\[(.*?)\]\s*;", worker, re.S)
    if not core_array or "'./MouldMaster_Core_App.html'" in core_array.group(1):
        fail("supported web cache must not publish the executable raw core HTML")
    for name in expected_names:
        if f"'./src/core-runtime/{name}'" not in worker:
            fail(f"service-worker CORE missing generated runtime asset: {name}")
    if "'./src/core-runtime/inline-style-bridge.js'" not in worker:
        fail("service-worker CORE missing strict style bridge")
    package = DESKTOP_PACKAGE.read_text(encoding="utf-8")
    if '"../../src/core-runtime"' not in package:
        fail("desktop package does not include src/core-runtime")
    if '"../../MouldMaster_Core_App.html"' in package:
        fail("desktop package must not expose the executable raw core HTML")
    integrity = DESKTOP_INTEGRITY.read_text(encoding="utf-8")
    if "'MouldMaster_Core_App.html'" in integrity:
        fail("desktop integrity base files must not publish the executable raw core HTML")
    if "STATIC_RUNTIME_DIRS" not in integrity or "'src/core-runtime'" not in integrity or "STATIC_RUNTIME_DIRS.flatMap(filesUnder)" not in integrity or "...staticRuntimeFiles" not in integrity:
        fail("desktop integrity does not derive generated core runtime files")
    print(
        f"Core CSP migration check passed: {len(expected_names)} deterministic core runtime slots; bridge folded into final slot; "
        "document.write and generated handler attributes transformed out; prepared core static attrs externalized at build time; script-src-attr none."
    )


def apply() -> None:
    core = CORE.read_text(encoding="utf-8")
    expected = expected_assets(core)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ASSEMBLY_PAYLOAD.write_text(prepared_assembly_payload(core, list(expected)), encoding="utf-8")
    for old in OUT_DIR.glob("core-inline-*.js"):
        if old.name not in expected:
            old.unlink()
    for name, body in expected.items():
        (OUT_DIR / name).write_text(body, encoding="utf-8")

    index = tighten_script_csp(INDEX.read_text(encoding="utf-8"))
    worker = SERVICE_WORKER.read_text(encoding="utf-8")
    index, worker = bump_cache(index, worker)
    worker = insert_worker_assets(worker, list(expected) + [STYLE_BRIDGE_PATH.name])
    INDEX.write_text(index, encoding="utf-8")
    SERVICE_WORKER.write_text(worker, encoding="utf-8")

    DESKTOP_PACKAGE.write_text(insert_desktop_resources(DESKTOP_PACKAGE.read_text(encoding="utf-8")), encoding="utf-8")
    DESKTOP_INTEGRITY.write_text(enable_integrity_directory(DESKTOP_INTEGRITY.read_text(encoding="utf-8")), encoding="utf-8")
    check_state()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.check:
        check_state()
    else:
        apply()


if __name__ == "__main__":
    main()