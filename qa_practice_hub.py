#!/usr/bin/env python3
"""Static regression checks for the learner-guided Practice hub.

These checks deliberately cover wiring and usability contracts only. They do not
claim human accessibility validation or instructional/SME validation.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
hub = (ROOT / "primary-learning-practice-hubs.js").read_text(encoding="utf-8")
css = (ROOT / "mobile-lesson-fix.css").read_text(encoding="utf-8")

required_hub = {
    "learner model recommendations": "MM_LEARNER_MODEL",
    "recommendation API": "recommendations(3)",
    "learner summary API": "model.summary()",
    "recommended practice region": 'aria-label="Recommended practice"',
    "task-led chooser": "Choose by the job you want to practise",
    "assessment separation": "Practice is for learning; assessments stay separate.",
    "scenario rotation": "nextScenarioIndex",
    "process-data practice": 'data-mm-hub-action="process-data"',
    "combined moulding problem practice": 'data-mm-hub-action="problem-practice"',
    "labs practice": 'data-mm-hub-action="labs"',
    "personalisation refresh": "mm:domains-ready",
    "recommender activity routing": "suggestedActivity",
    "discriminating scenario route": "discriminating-scenario-practice",
    "retrieval practice route": "retrieval-practice",
    "recency refresh route": "timestamped-practice-or-assessment",
    "transfer scenario route": "different-context-scenario",
    "guided feedback route": "guided-retrieval-and-feedback",
    "different-format route": "different-practice-format",
    "discriminating scenario CTA": "Start discriminating scenario →",
    "retrieval practice CTA": "Start retrieval practice →",
}
learn_launcher = 'data-mm-hub-action="question-centre"'
if learn_launcher not in hub:
    failures.append("Learn hub Question Centre entry missing")
if 'id="mmLearnQuestions"' in hub:
    failures.append("Interactive lesson must not contain a second Question Centre")

practice_markup = hub[hub.index("function practiceHubMarkup()"):hub.index("function renderLearnHub()")]
if 'data-mm-hub-action="question-centre"' in practice_markup or "169 governed prompts" in practice_markup:
    failures.append("Practice must not expose a duplicate Question Centre or question-bank count")
if "3 tools shown" in practice_markup:
    failures.append("Practice hub must not show a stale tool count")
if "Three clear practice areas" not in practice_markup:
    failures.append("Practice hub must explain its three focused practice areas")
problem_start = hub.index("function openProblemPractice()")
problem_end = hub.index("function openGuidedPractice()", problem_start)
problem_markup = hub[problem_start:problem_end]
for route in ['data-mm-hub-action="diagnose-cause"', 'data-mm-hub-action="shop-floor-case"']:
    if route not in problem_markup:
        failures.append(f"Combined problem practice must keep both routes available: {route}")
if "<details class=\"mm-practice-more-tools\">" not in problem_markup or "More diagnosis and case tools" not in problem_markup:
    failures.append("Specialist diagnosis tools must remain available behind a clear optional disclosure")

required_css = {
    "mobile practice scope": ".mm-practice-hub",
    "mobile explanation visible": ".mm-practice-hub .mm-hub-tile small",
    "mobile CTA visible": ".mm-practice-hub .mm-hub-tile-action",
    "single-column phone layout": ".mm-practice-hub .mm-hub-grid{grid-template-columns:1fr!important}",
    "reduced motion": "@media(prefers-reduced-motion:reduce)",
}

failures = []
for label, needle in required_hub.items():
    if needle not in hub:
        failures.append(f"Practice hub missing: {label}")
for label, needle in required_css.items():
    if needle not in css:
        failures.append(f"Practice CSS missing: {label}")

# A repeated-miss recommendation explicitly asks for a discriminating scenario.
# Keep that recommendation on the scenario lane rather than silently substituting
# a diagnostic lab whose interaction contract is different.
if "['discriminating-scenario-practice','retrieval-practice','timestamped-practice-or-assessment','different-context-scenario'].includes(suggested))return 'scenario-detail';" not in hub:
    failures.append("Practice hub no longer maps scenario-oriented learner-model recommendations to scenario-detail")
if "suggested==='guided-retrieval-and-feedback'||rec?.actionType==='stabilize-regression'" not in hub:
    failures.append("Practice hub no longer maps guided feedback/regression recommendations to diagnostic labs")
if "suggested==='different-practice-format'||rec?.actionType==='evidence-confirmation'" not in hub:
    failures.append("Practice hub no longer maps evidence-confirmation recommendations to varied labs")

# The canonical shell is the sole dashboard composition owner. Practice may rewrite
# legacy action routing, but it must never hide/remove registry slots.
if "mm-dashboard-slot" in hub or "mmDashboardRegistryBefore" in hub or "mmDashboardRegistryAfter" in hub:
    failures.append("Practice hub must not inspect, hide or delete canonical dashboard registry slots")
if "normalizeHomeActions" not in hub:
    failures.append("Practice hub non-destructive Home action normalizer missing")

# Practice rotation is learner-scoped. If Runtime V2 is unavailable, leave the
# preference transient rather than sharing one browser-global key across learners.
if "localStorage.getItem(PRACTICE_ROTATION_KEY)" in hub or "localStorage.setItem(PRACTICE_ROTATION_KEY" in hub:
    failures.append("Practice rotation must not use unscoped localStorage fallback")
if "window.MM_RUNTIME_V2?.storage" not in hub:
    failures.append("Practice rotation learner-scoped Runtime V2 storage contract missing")

# Exercise the scoped rotation store contract, including fail-closed transient behavior.
import subprocess
node=r'''
const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('primary-learning-practice-hubs.js','utf8');
const start=source.indexOf('function practiceStore()');
const end=source.indexOf('function bind(root)',start);
if(start<0||end<0)throw new Error('practice rotation helpers missing');
const cut="const PRACTICE_ROTATION_KEY='mm_practice_scenario_rotation_v1';\n"+source.slice(start,end);
function run(storage){const sandbox={window:{MM_RUNTIME_V2:storage?{storage}:undefined},D:{scenarios:[1,2,3,4]},Date:{now:()=>86400000*10},Number,Array,Math};vm.createContext(sandbox);vm.runInContext(cut+';this.out={readPracticeRotation,writePracticeRotation,nextScenarioIndex};',sandbox);return sandbox.out}
const none=run(null);if(!Number.isNaN(none.readPracticeRotation())||none.writePracticeRotation(2)!==false)throw new Error('missing Runtime V2 storage must stay transient');
const rows=new Map(),store={get:(k,d)=>rows.has(k)?rows.get(k):d,set:(k,v)=>{rows.set(k,v);return true}};const scoped=run(store);const first=scoped.nextScenarioIndex(),second=scoped.nextScenarioIndex();if(first===second||rows.size!==1)throw new Error('scoped practice rotation did not persist exactly once per learner store');
'''
p=subprocess.run(['node','-e',node],capture_output=True,text=True,cwd=ROOT)
if p.returncode!=0: failures.append('Practice rotation runtime storage contract failed: '+(p.stderr or p.stdout).strip())

# Guard against accidentally turning Practice into an authority or assessment lane.
for banned in ("validated production recipe", "automatic machine setting", "machine-control authority"):
    if banned.lower() in hub.lower():
        failures.append(f"Practice hub contains authority wording that needs review: {banned}")


# Unified Defect Finder / Troubleshooting Coach is one source-owned workbench.
for required in (
    "MM_DIAGNOSTIC_WORKBENCH",
    "Defect Finder + Troubleshooting Coach",
    "dxOpen",
    "rootCauseVerified:false",
    "productionSetpointsAuthorized:false",
    "No cause confirmed.",
    "Evidence gaps to resolve",
    "data-mm-dx-hypothesis",
    "case 'troubleshooting': return source==='learn'?dxOpen():openProblemPractice();",
    "case 'diagnostic-workbench': return dxOpen();",
    "renderDefects=renderUnifiedDefects",
    "renderCoach=renderUnifiedCoach",
):
    if required.lower() not in hub.lower():
        failures.append(f"Unified diagnostic contract missing: {required}")
if 'data-mm-hub-action="defects"' in hub or 'data-mm-hub-action="coach"' in hub:
    failures.append("Separate legacy diagnostic picker options must be retired")

if failures:
    print("PRACTICE HUB QA: FAIL")
    for failure in failures:
        print(f" - {failure}")
    raise SystemExit(1)

print("PRACTICE HUB QA: PASS")
print(" - learner-guided recommendation wiring present")
print(" - recommender activity type and CTA stay aligned")
print(" - task/time-oriented Practice choices present")
print(" - mobile explanations and CTAs remain visible")
print(" - assessments remain a separate scoring lane inside the consolidated Question Centre")
print("NOTE: this is automated regression evidence, not human accessibility or SME instructional validation.")
