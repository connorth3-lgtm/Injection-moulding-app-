from pathlib import Path
import hashlib
import json
import random
import re
import subprocess
import tempfile
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
REPORT = ROOT / "reference-question-500-pass-report.json"
PASSES = 500


def text(name):
    return (ROOT / name).read_text(encoding="utf-8")


def need(ok, message):
    if not ok:
        raise AssertionError(message)


# Build the same current question/scenario content used by the live assessment stack.
core = text("MouldMaster_Core_App.html")
marker = "window.MM_DATA = "
need(marker in core, "MM_DATA marker missing")
base, _ = json.JSONDecoder().raw_decode(core[core.index(marker) + len(marker):])
extra_titles = [
    "Fill time drifts but recipe does not",
    "One cavity becomes light",
    "Recovery time becomes erratic",
    "Dimension shifts after water-line work",
    "Part sticks after texture change",
    "Cpk drops after gauge change",
    "DOE result changes by run order",
    "Pressure sensor disagrees with machine",
]
base = json.loads(json.dumps(base))
for title in extra_titles:
    base["scenarios"].append({
        "title": title,
        "situation": "placeholder",
        "choices": ["a", "b", "c", "d"],
        "correct": 0,
        "why": "placeholder",
        "feedback": ["a", "b", "c", "d"],
    })

node = r'''
const fs=require('fs'),vm=require('vm');
const D=%s;
const store={};
const localStorage={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
const document={
 getElementById:()=>null,
 querySelectorAll:()=>[],
 querySelector:()=>null,
 createElement:()=>({set id(v){this._id=v},get id(){return this._id},textContent:'',appendChild(){},setAttribute(){},insertAdjacentHTML(){},addEventListener(){}}),
 head:{appendChild(){}},body:{appendChild(){}},documentElement:{},readyState:'complete'
};
const sandbox={window:{MM_DATA:D},document,localStorage,performance:{now:()=>1000},console,setTimeout:(fn)=>{if(typeof fn==='function')fn()},clearTimeout(){},Date,Math,JSON,Map,Set,Blob:function(){},URL:{createObjectURL:()=>'',revokeObjectURL(){}}};
sandbox.window.window=sandbox.window;sandbox.window.localStorage=localStorage;sandbox.window.document=document;sandbox.window.URL=sandbox.URL;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(%s,'utf8'),sandbox,{filename:'assessment-deep-dive.js'});
vm.runInContext(fs.readFileSync(%s,'utf8'),sandbox,{filename:'assessment-answer-cue-fix.js'});
vm.runInContext(fs.readFileSync(%s,'utf8'),sandbox,{filename:'assessment-quality-suite.js'});
process.stdout.write(JSON.stringify({exams:D.exams,regional:D.regionalQuestions,scenarios:D.scenarios,qa:D.assessmentQA}));
''' % (
    json.dumps(base),
    json.dumps(str(ROOT / "assessment-deep-dive.js")),
    json.dumps(str(ROOT / "assessment-answer-cue-fix.js")),
    json.dumps(str(ROOT / "assessment-quality-suite.js")),
)
with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as handle:
    handle.write(node)
    node_path = Path(handle.name)
try:
    p = subprocess.run(["node", str(node_path)], capture_output=True, text=True)
finally:
    node_path.unlink(missing_ok=True)
need(p.returncode == 0, f"live assessment extraction failed: {p.stderr or p.stdout}")
live = json.loads(p.stdout)

questions = []
for level in ["Beginner", "Intermediate", "Advanced"]:
    rows = live["exams"].get(level, [])
    need(len(rows) == 10, f"{level} technical bank must contain 10 items")
    for i, q in enumerate(rows):
        questions.append({"id": f"tech:{level}:{i}", "kind": "technical", "level": level, "row": q})
for region in ["UK", "US", "NZ"]:
    for level in ["Beginner", "Intermediate", "Advanced"]:
        rows = live["regional"].get(region, {}).get(level, [])
        need(len(rows) == 3, f"{region}/{level} regional bank must contain 3 items")
        for i, q in enumerate(rows):
            questions.append({"id": f"reg:{region}:{level}:{i}", "kind": "regional", "level": level, "region": region, "row": q})
need(len(questions) == 57, f"expected 57 current questions, got {len(questions)}")
scenarios = live["scenarios"]
need(len(scenarios) == 40, f"expected 40 current scenarios, got {len(scenarios)}")

reference_files = [
    "source-library.js",
    "reference-data.js",
    "reference-deep-dive.js",
    "reference-research-extension.js",
    "reference-20x-extension.js",
    "reference-2026-expansion.js",
    "reference-sources.js",
    "sources/AUTHORITATIVE_SOURCE_REGISTER.md",
    "sources/DEEP_DIVE_SOURCE_REGISTER.md",
]
for name in reference_files:
    need((ROOT / name).exists(), f"reference corpus file missing: {name}")
reference_texts = {name: text(name) for name in reference_files}
reference_corpus = "\n".join(reference_texts.values())
source_urls = set(re.findall(r"https://[^'\"\s<>)]+", reference_corpus))
need(len(source_urls) >= 70, f"reference/source URL corpus unexpectedly small: {len(source_urls)}")

STOP = {
    "about","after","again","against","also","because","been","before","being","between","both","could","current","during","each","from","have","into","more","most","other","over","same","should","than","that","their","there","these","they","this","through","under","using","when","where","which","while","with","would","your","moulding","molding","injection","process","question","answer","correct","best","strongest","statement","evidence","condition","conditions","relevant","actual","actuals","machine","material","part"
}


def tokens(value):
    out = []
    for word in re.findall(r"[A-Za-z][A-Za-z0-9/-]{2,}", str(value or "").lower()):
        word = word.strip("-/")
        if len(word) < 4 or word in STOP:
            continue
        out.append(word)
    return set(out)


ref_tokens = tokens(reference_corpus)
ref_units = []
for name, raw in reference_texts.items():
    for part in re.split(r"\n+|(?<=\}),\s*(?=\{)|(?<=\]),\s*(?=\[)", raw):
        if len(part.strip()) >= 28:
            ref_units.append((name, part, tokens(part)))

TOPICS = {
    "moisture-drying": re.compile(r"\b(moisture|drying|dryer|hygroscopic|dew point|hydrolysis)\b", re.I),
    "melt-thermal": re.compile(r"\b(melt temperature|barrel|thermal|residence|shear heating|degradation)\b", re.I),
    "gate-pack-hold": re.compile(r"\b(gate seal|gate freeze|pack|hold time|part mass|packing)\b", re.I),
    "fill-transfer-pressure": re.compile(r"\b(fill time|fill speed|v/p|transfer|injection pressure|pressure loss|short shot)\b", re.I),
    "shot-delivery": re.compile(r"\b(cushion|non-return|check ring|check-ring|shot delivery|screw recovery)\b", re.I),
    "cooling-warpage": re.compile(r"\b(cooling|mould temperature|mold temperature|warpage|shrinkage|ejection)\b", re.I),
    "tooling-venting": re.compile(r"\b(vent|venting|runner|gate design|parting line|tooling|mould seating|mold seating|flash)\b", re.I),
    "cavity-balance": re.compile(r"\b(cavity balance|multi-cavity|cavity-to-cavity|branch filling|pooled|cavity-specific)\b", re.I),
    "capability-measurement": re.compile(r"\b(cpk|\bcp\b|ppk|capability|measurement system|sampling|control chart|stability)\b", re.I),
    "doe-statistics": re.compile(r"\b(doe|designed experiment|randomisation|randomization|blocking|interaction|factorial|confirmation run)\b", re.I),
    "sensors-monitoring": re.compile(r"\b(cavity pressure|sensor|monitoring|pressure trace|in-cavity)\b", re.I),
    "machine-transfer": re.compile(r"\b(transfer between machines|receiving machine|machine transfer|process outputs|screw diameter|pressure definition)\b", re.I),
    "guarding-safety": re.compile(r"\b(guard|guarding|interlock|safeguard|danger zone|robot|integrated cell)\b", re.I),
    "energy-isolation": re.compile(r"\b(lockout|tagout|hazardous energy|isolation|stored energy|1910\.147|puwer regulation 19)\b", re.I),
    "hazard-communication": re.compile(r"\b(hazard communication|1910\.1200|safety data sheet|plastics-processing fume|coshh)\b", re.I),
    "uk-law": re.compile(r"\b(puwer|great britain|northern ireland|hse|bs en iso 20430)\b", re.I),
    "us-law": re.compile(r"\b(osha|state plan|1910\.|ansi/plastics|b151\.1)\b", re.I),
    "nz-law": re.compile(r"\b(hswa|pcbu|worksafe|as/nzs 4024|new zealand|reasonably practicable)\b", re.I),
}
reference_topic_hits = {name: bool(rx.search(reference_corpus)) for name, rx in TOPICS.items()}
need(all(reference_topic_hits.values()), "reference corpus is missing one or more required topic families")

REGIONAL_AUTHORITY_DOMAINS = {
    "legislation.gov.uk", "hse.gov.uk", "osha.gov", "worksafe.govt.nz", "legislation.govt.nz",
    "knowledge.bsigroup.com", "plasticsindustry.org"
}


def host(url):
    try:
        return (urlparse(url).hostname or "").lower()
    except Exception:
        return ""


def authority_ok(url):
    h = host(url)
    return any(h == d or h.endswith("." + d) for d in REGIONAL_AUTHORITY_DOMAINS)


def q_fields(row):
    return {
        "stem": str(row[0]) if len(row) > 0 else "",
        "options": row[1] if len(row) > 1 and isinstance(row[1], list) else [],
        "correct": row[2] if len(row) > 2 else None,
        "rationale": str(row[3]) if len(row) > 3 else "",
        "reference": str(row[4]) if len(row) > 4 else "",
        "url": row[5] if len(row) > 5 else None,
        "feedback": row[6] if len(row) > 6 and isinstance(row[6], list) else [],
        "critical": row[7] if len(row) > 7 else None,
    }


def evaluate_question(item):
    f = q_fields(item["row"])
    hard, warn = [], []
    ident = item["id"]
    if len(f["options"]) != 4 or not isinstance(f["correct"], int) or not (0 <= f["correct"] < 4):
        hard.append((ident, "answer-structure", "four options and a valid key are required"))
        return hard, warn, {"overlap": 0, "best_unit": 0, "exact_source": False}
    if len(f["feedback"]) != 4:
        hard.append((ident, "feedback-structure", "feedback must align to all four options"))
    correct_text = str(f["options"][f["correct"]])
    combined = " ".join([f["stem"], correct_text, f["rationale"], f["reference"]])
    qt = tokens(combined)
    overlap = len(qt & ref_tokens)
    best_unit = max((len(qt & unit_tokens) for _, _, unit_tokens in ref_units), default=0)
    if overlap < 3:
        hard.append((ident, "reference-topic-gap", f"only {overlap} meaningful tokens overlap the full reference corpus"))
    elif best_unit < 2:
        warn.append((ident, "weak-specific-reference-match", f"best individual reference/data entry overlap is {best_unit}"))
    matched_topics = [name for name, rx in TOPICS.items() if rx.search(combined)]
    if matched_topics and any(not reference_topic_hits[t] for t in matched_topics):
        hard.append((ident, "topic-family-missing", ", ".join(matched_topics)))
    exact_source = False
    if f["url"]:
        url = str(f["url"])
        if not url.startswith("https://"):
            hard.append((ident, "non-https-source", url))
        exact_source = url in source_urls
        if not exact_source:
            warn.append((ident, "source-not-in-general-reference-library", url))
        if item["kind"] == "regional" and not authority_ok(url):
            hard.append((ident, "regional-source-authority", host(url)))
    elif item["kind"] == "regional":
        hard.append((ident, "regional-source-missing", "regional safety/compliance item has no source URL"))
    if item["kind"] == "regional" and f["critical"] is not True:
        hard.append((ident, "regional-critical-flag", "regional item must remain safety-critical"))
    if item["kind"] == "technical" and f["critical"] is not False:
        hard.append((ident, "technical-critical-flag", "technical item critical flag changed"))
    if f["feedback"]:
        keyed = str(f["feedback"][f["correct"]]).strip().lower()
        rat = f["rationale"].strip().lower()
        if not keyed or (rat and rat not in keyed and keyed not in rat and "correct" not in keyed):
            warn.append((ident, "keyed-feedback-rationale-distance", "keyed feedback no longer closely tracks the rationale"))
    absolute = re.search(r"\b(always|guarantees?|automatically|proves?|never)\b", correct_text + " " + f["rationale"], re.I)
    negated = re.search(r"\b(not|does not|do not|cannot|can not|never treat|not automatically)\b", correct_text + " " + f["rationale"], re.I)
    if absolute and not negated and item["kind"] == "technical":
        warn.append((ident, "technical-absolute-language", absolute.group(0)))
    numeric_rule = re.search(r"\b\d+(?:\.\d+)?\s*(?:°?c|bar|psi|mpa|mm/s|%|seconds?|s)\b", correct_text + " " + f["rationale"], re.I)
    universal = re.search(r"\b(always|must be set|universal|for all resins|for every)\b", correct_text + " " + f["rationale"], re.I)
    if numeric_rule and universal and item["kind"] == "technical":
        hard.append((ident, "universal-numeric-setting", numeric_rule.group(0)))
    return hard, warn, {"overlap": overlap, "best_unit": best_unit, "exact_source": exact_source, "topics": matched_topics}


def evaluate_scenario(index, s):
    ident = f"scenario:{index}:{s.get('title','untitled')}"
    hard, warn = [], []
    choices = s.get("choices", [])
    correct = s.get("correct")
    feedback = s.get("feedback", [])
    if len(choices) != 4 or not isinstance(correct, int) or not (0 <= correct < 4):
        hard.append((ident, "scenario-answer-structure", "four choices and valid key required"))
        return hard, warn, {"overlap": 0, "best_unit": 0}
    if len(feedback) != 4:
        hard.append((ident, "scenario-feedback-structure", "feedback must align to four choices"))
    combined = " ".join([
        str(s.get("title", "")), str(s.get("situation", "")), str(choices[correct]),
        str(s.get("why", "")), str(s.get("reference", "")), str(s.get("category", ""))
    ])
    qt = tokens(combined)
    overlap = len(qt & ref_tokens)
    best_unit = max((len(qt & unit_tokens) for _, _, unit_tokens in ref_units), default=0)
    if overlap < 3:
        hard.append((ident, "scenario-reference-topic-gap", f"only {overlap} meaningful tokens overlap the reference corpus"))
    elif best_unit < 2:
        warn.append((ident, "scenario-weak-specific-reference-match", f"best entry overlap is {best_unit}"))
    url = s.get("sourceUrl")
    if url:
        if not str(url).startswith("https://"):
            hard.append((ident, "scenario-non-https-source", str(url)))
        elif str(url) not in source_urls:
            warn.append((ident, "scenario-source-not-in-general-reference-library", str(url)))
    return hard, warn, {"overlap": overlap, "best_unit": best_unit}


baseline_fingerprint = None
all_hard = set()
all_warn = set()
question_metrics = {}
scenario_metrics = {}
permutation_checks = 0

for pass_no in range(PASSES):
    rng = random.Random(20260824 + pass_no)
    q_order = list(range(len(questions)))
    s_order = list(range(len(scenarios)))
    rng.shuffle(q_order)
    rng.shuffle(s_order)
    pass_hard, pass_warn = [], []
    pass_metrics = {}

    for qi in q_order:
        item = questions[qi]
        f = q_fields(item["row"])
        h, w, m = evaluate_question(item)
        pass_hard.extend(h); pass_warn.extend(w); pass_metrics[item["id"]] = m
        if len(f["options"]) == 4 and isinstance(f["correct"], int) and 0 <= f["correct"] < 4:
            order = [0, 1, 2, 3]
            rng.shuffle(order)
            shuffled = [f["options"][i] for i in order]
            new_key = order.index(f["correct"])
            need(shuffled[new_key] == f["options"][f["correct"]], f"{item['id']}: option shuffle changed keyed answer")
            if len(f["feedback"]) == 4:
                shuffled_feedback = [f["feedback"][i] for i in order]
                need(shuffled_feedback[new_key] == f["feedback"][f["correct"]], f"{item['id']}: option shuffle broke keyed feedback")
            permutation_checks += 1

    for si in s_order:
        s = scenarios[si]
        h, w, m = evaluate_scenario(si, s)
        pass_hard.extend(h); pass_warn.extend(w); pass_metrics[f"scenario:{si}"] = m
        choices = s.get("choices", [])
        correct = s.get("correct")
        if len(choices) == 4 and isinstance(correct, int) and 0 <= correct < 4:
            order = [0, 1, 2, 3]
            rng.shuffle(order)
            shuffled = [choices[i] for i in order]
            new_key = order.index(correct)
            need(shuffled[new_key] == choices[correct], f"scenario {si}: choice shuffle changed keyed answer")
            feedback = s.get("feedback", [])
            if len(feedback) == 4:
                shuffled_feedback = [feedback[i] for i in order]
                need(shuffled_feedback[new_key] == feedback[correct], f"scenario {si}: choice shuffle broke keyed feedback")
            permutation_checks += 1

    fingerprint_payload = {
        "hard": sorted(pass_hard),
        "warn": sorted(pass_warn),
        "metrics": {k: pass_metrics[k] for k in sorted(pass_metrics)},
    }
    fingerprint = hashlib.sha256(json.dumps(fingerprint_payload, sort_keys=True).encode()).hexdigest()
    if baseline_fingerprint is None:
        baseline_fingerprint = fingerprint
        question_metrics = {k: v for k, v in pass_metrics.items() if not k.startswith("scenario:")}
        scenario_metrics = {k: v for k, v in pass_metrics.items() if k.startswith("scenario:")}
    else:
        need(fingerprint == baseline_fingerprint, f"pass {pass_no + 1}: audit result changed with order/permutation")
    all_hard.update(tuple(x) for x in pass_hard)
    all_warn.update(tuple(x) for x in pass_warn)

question_url_items = [q for q in questions if q_fields(q["row"])["url"]]
question_exact_sources = sum(1 for q in question_url_items if q_fields(q["row"])["url"] in source_urls)
question_low_specific = sum(1 for v in question_metrics.values() if v.get("best_unit", 0) < 2)
scenario_low_specific = sum(1 for v in scenario_metrics.values() if v.get("best_unit", 0) < 2)

report = {
    "schema": 1,
    "audit": "MouldMaster reference/data vs current questions and answers — 500-pass deep dive",
    "source_commit_expected": "current checkout",
    "passes": PASSES,
    "question_bank_version": "2026.08.24.2",
    "current_questions": len(questions),
    "current_scenarios": len(scenarios),
    "question_evaluations": PASSES * len(questions),
    "scenario_evaluations": PASSES * len(scenarios),
    "answer_permutation_checks": permutation_checks,
    "reference_files": reference_files,
    "reference_source_url_count": len(source_urls),
    "questions_with_direct_source_url": len(question_url_items),
    "direct_question_sources_also_in_general_library": question_exact_sources,
    "low_specific_match_questions": question_low_specific,
    "low_specific_match_scenarios": scenario_low_specific,
    "hard_issue_count": len(all_hard),
    "warning_count": len(all_warn),
    "hard_issues": [list(x) for x in sorted(all_hard)],
    "warnings": [list(x) for x in sorted(all_warn)],
    "invariance_fingerprint": baseline_fingerprint,
    "notes": [
        "Each pass audits every current technical and regional item, not just one generated exam form.",
        "The live technical bank is reconstructed by applying assessment-deep-dive.js, assessment-answer-cue-fix.js and assessment-quality-suite.js to the audited core data.",
        "All 40 current troubleshooting scenarios are included.",
        "Reference matching is evidence-support coverage, not a claim that a generic reference replaces grade-specific supplier data, machine/tool documentation or applicable law.",
        "The 500 passes vary item order and answer-option order to detect order-dependent or key/feedback alignment failures.",
    ],
}
REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

print(
    f"MouldMaster 500-pass reference/question deep dive: {PASSES}/{PASSES} passes; "
    f"{PASSES * len(questions)} question evaluations; {PASSES * len(scenarios)} scenario evaluations; "
    f"{permutation_checks} answer/feedback permutation checks; "
    f"{len(source_urls)} reference URLs; {len(all_hard)} hard issues; {len(all_warn)} warnings"
)
print(f"Direct question source coverage in general reference library: {question_exact_sources}/{len(question_url_items)}")
print(f"Low-specific-match items: questions={question_low_specific}, scenarios={scenario_low_specific}")
if all_warn:
    print("Warnings (unique):")
    for row in sorted(all_warn):
        print(" - " + " | ".join(str(x) for x in row))
need(not all_hard, "500-pass cross-audit found hard issues: " + json.dumps([list(x) for x in sorted(all_hard)[:20]]))
