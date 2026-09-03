#!/usr/bin/env python3
from __future__ import annotations

import argparse
import ast
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "assessment-decision-manifest-v1.json"
MANIFEST_VERSION = "2026.09.04.1"
QUESTION_BANK_VERSION = "2026.08.30.1"
APPROVAL_VERSION = "2026.08.30.3"
MEASURED_VERSION = "2026.09.01.1"


def need(ok: bool, message: str) -> None:
    if not ok:
        raise AssertionError(message)


def text(path: str | Path) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def fnv1a(value: str) -> str:
    h = 2166136261
    for ch in value:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    return f"fnv1a-{h:08x}"


def compact_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def normal_choice(value: Any) -> str:
    return " ".join(str(value or "").split())


def choice_fingerprint(decision_id: str, revision: int, choice_text: Any) -> str:
    return fnv1a(f"{decision_id}@r{revision}|{normal_choice(choice_text)}")


def extract_core_data() -> dict[str, Any]:
    core = text("MouldMaster_Core_App.html")
    marker = "window.MM_DATA = "
    need(marker in core, "MM_DATA marker missing")
    data, _ = json.JSONDecoder().raw_decode(core[core.index(marker) + len(marker):])

    training = text("training-upgrade.js")
    match = re.search(r"const EXTRA=(\[[\s\S]*?\n\]);", training)
    need(match is not None, "training EXTRA scenario bank could not be parsed")
    extra = ast.literal_eval(match.group(1))
    need(len(extra) == 8, "training upgrade must contribute eight scenarios")
    for row in extra:
        data["scenarios"].append({
            "title": row[0],
            "situation": row[1],
            "choices": row[2],
            "correct": row[3],
            "why": row[4],
            "feedback": [
                row[4] if i == row[3] else "This does not directly test the mechanism best supported by the evidence."
                for i in range(4)
            ],
        })
    return data


def runtime_snapshot(data: dict[str, Any]) -> dict[str, Any]:
    node = r'''
const fs=require('fs'),vm=require('vm');
const D=%s;
const store={};
const localStorage={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
const makeEl=()=>({textContent:'',innerHTML:'',className:'',dataset:{},style:{},appendChild(){},insertAdjacentHTML(){},insertAdjacentElement(){},querySelector(){return null},querySelectorAll(){return[]},addEventListener(){},setAttribute(){},hasAttribute(){return false},classList:{add(){},remove(){},contains(){return false}}});
const document={getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,createElement:makeEl,head:{appendChild(){}},body:{appendChild(){}},documentElement:{},readyState:'complete',addEventListener(){}};
function MutationObserver(){this.observe=()=>{};this.disconnect=()=>{}}
const sandbox={window:{MM_DATA:D,requestAnimationFrame:fn=>fn(),addEventListener(){},scrollTo(){}},document,localStorage,performance:{now:()=>1000},console,setTimeout:(fn)=>{if(typeof fn==='function')fn()},clearTimeout(){},Date,Math,JSON,Map,Set,Blob:function(){},URL:{createObjectURL:()=>'',revokeObjectURL(){}},MutationObserver};
sandbox.window.window=sandbox.window;sandbox.window.document=document;sandbox.window.localStorage=localStorage;sandbox.window.MutationObserver=MutationObserver;sandbox.window.URL=sandbox.URL;sandbox.window.setTimeout=sandbox.setTimeout;
vm.createContext(sandbox);
for(const file of ['diagnostic-learning-labs.js','material-behaviour-labs.js','assessment-deep-dive.js','assessment-answer-cue-fix.js','assessment-quality-suite.js','assessment-stable-review-bridge.js','assessment-evidence-sources.js','assessment-evidence-approval.js'])vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const A=sandbox.window.MM_EVIDENCE_APPROVAL;
if(!A||A.summary?.total!==157||A.blockedIds?.length)throw new Error('evidence approval runtime is not complete');
const measuredSource=fs.readFileSync('real-measured-data-assessment.js','utf8');
const measuredMatch=/const CASES=(\[[\s\S]*?\]);\nconst esc=/.exec(measuredSource);
if(!measuredMatch)throw new Error('real measured CASES block missing');
const measuredCtx={};vm.runInNewContext('cases='+measuredMatch[1],measuredCtx);
process.stdout.write(JSON.stringify({records:A.records,exams:D.exams,regionalQuestions:D.regionalQuestions,scenarios:D.scenarios,diagnostic:sandbox.window.MM_DIAGNOSTIC_LABS?.labs||[],material:sandbox.window.MM_MATERIAL_BEHAVIOUR_LABS?.labs||[],measured:measuredCtx.cases||[]}));
''' % json.dumps(data, ensure_ascii=False)
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8", dir=ROOT) as handle:
        handle.write(node)
        node_path = Path(handle.name)
    try:
        proc = subprocess.run(
            ["node", str(node_path)], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace"
        )
    finally:
        node_path.unlink(missing_ok=True)
    need(proc.returncode == 0, "assessment decision runtime extraction failed: " + (proc.stderr or proc.stdout)[:8000])
    return json.loads(proc.stdout)


def question_options(record: dict[str, Any], snap: dict[str, Any]) -> tuple[list[str], int]:
    rid = record["id"]
    kind = record["kind"]
    if kind == "technical-exam":
        _, level, index = rid.split(":", 2)
        q = snap["exams"][level][int(index)]
        return list(q[1] if isinstance(q, list) else q["options"]), int(record["answerKey"])
    if kind == "regional-exam":
        _, region, level, index = rid.split(":", 3)
        q = snap["regionalQuestions"][region][level][int(index)]
        return list(q[1] if isinstance(q, list) else q["options"]), int(record["answerKey"])
    if kind == "scenario":
        candidates = [s for s in snap["scenarios"] if s.get("mmStableId") == rid]
        if not candidates and record.get("title"):
            candidates = [s for s in snap["scenarios"] if s.get("title") == record["title"]]
        need(len(candidates) == 1, f"scenario identity could not be resolved uniquely: {rid}")
        scenario = candidates[0]
        return list(scenario["choices"]), int(record["answerKey"])
    if kind == "diagnostic-lab-question":
        match = re.fullmatch(r"lab:(.+):(\d+)", rid)
        need(match is not None, f"diagnostic stable id malformed: {rid}")
        lab_id, index = match.group(1), int(match.group(2))
        lab = next((x for x in snap["diagnostic"] if x.get("id") == lab_id), None)
        need(lab is not None, f"diagnostic lab missing: {lab_id}")
        step = lab["steps"][index]
        choices = list(step["choices"])
        correct = [i for i, c in enumerate(choices) if c.get("correct") is True]
        need(len(correct) == 1, f"diagnostic step must have one correct choice: {rid}")
        return [c["text"] for c in choices], correct[0]
    if kind == "material-lab-question":
        match = re.fullmatch(r"material:(.+):(\d+)", rid)
        need(match is not None, f"material stable id malformed: {rid}")
        lab_id, index = match.group(1), int(match.group(2))
        lab = next((x for x in snap["material"] if x.get("id") == lab_id), None)
        need(lab is not None, f"material lab missing: {lab_id}")
        step = lab["steps"][index]
        choices = list(step["choices"])
        correct = [i for i, c in enumerate(choices) if c.get("correct") is True]
        need(len(correct) == 1 and correct[0] == int(record["answerKey"]), f"material answer identity drift: {rid}")
        return [c["text"] for c in choices], correct[0]
    raise AssertionError(f"unsupported approved decision kind: {kind}")


def approved_rows(snap: dict[str, Any], revisions: dict[str, Any]) -> list[dict[str, Any]]:
    rev2 = revisions.get("revision2", {})
    rev3 = revisions.get("revision3", {})
    rows = []
    for record in snap["records"]:
        rid = record["id"]
        revision = int((rev3.get(rid) or rev2.get(rid) or {}).get("revision") or record.get("revision") or 1)
        choices, correct = question_options(record, snap)
        need(len(choices) == 4, f"approved decision must retain four choices: {rid}")
        fps = [choice_fingerprint(rid, revision, choice) for choice in choices]
        need(len(set(fps)) == 4, f"choice fingerprints must be unique within decision: {rid}")
        rows.append({
            "id": rid,
            "kind": record["kind"],
            "decisionScope": "evidence-approved-learning",
            "revision": revision,
            "bankVersion": QUESTION_BANK_VERSION if record["kind"] in {"technical-exam", "regional-exam"} else None,
            "contentFingerprint": record["fingerprint"],
            "evidenceStatus": record["status"],
            "evidenceSourceMode": record["sourceMode"],
            "sourceIds": list(record.get("sourceIds") or []),
            "sourceFingerprint": fnv1a(compact_json(sorted(record.get("sourceIds") or []))),
            "choiceFingerprints": fps,
            "correctChoiceFingerprint": fps[correct],
            "critical": bool(record.get("critical", False) or record["kind"] == "regional-exam"),
        })
    return rows


def measured_rows(snap: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for case in snap["measured"]:
        need(case.get("evidenceType") == "real-measured", f"measured case evidence type drift: {case.get('id')}")
        for index, q in enumerate(case.get("questions") or []):
            rid = f"measured:{case['id']}:{index}"
            stem, choices, correct, explanation = q
            revision = 1
            fps = [choice_fingerprint(rid, revision, choice) for choice in choices]
            need(len(choices) == 4 and len(set(fps)) == 4, f"measured decision choice identity drift: {rid}")
            rows.append({
                "id": rid,
                "kind": "real-measured-decision",
                "decisionScope": "measured-evidence-learning",
                "revision": revision,
                "bankVersion": None,
                "contentFingerprint": fnv1a(compact_json([stem, choices, int(correct), explanation])),
                "evidenceStatus": "contract-audited",
                "evidenceSourceMode": "measured-dataset-contract",
                "sourceIds": [case["source"]],
                "sourceFingerprint": fnv1a(compact_json([case["source"], case["contractPath"], case["contractBlob"]])),
                "choiceFingerprints": fps,
                "correctChoiceFingerprint": fps[int(correct)],
                "critical": False,
                "contract": {
                    "path": case["contractPath"],
                    "blob": case["contractBlob"],
                    "license": case["license"],
                },
            })
    return rows


def build() -> dict[str, Any]:
    revisions = json.loads(text("sources/QUESTION_REVISION_INDEX.json"))
    need(revisions.get("bank_version") == QUESTION_BANK_VERSION, "question revision index bank version drift")
    snap = runtime_snapshot(extract_core_data())
    approved = approved_rows(snap, revisions)
    measured = measured_rows(snap)
    rows = sorted([*approved, *measured], key=lambda x: x["id"])
    counts: dict[str, int] = {}
    for row in rows:
        counts[row["kind"]] = counts.get(row["kind"], 0) + 1
    need(len(approved) == 157 and len(measured) == 12 and len(rows) == 169, "canonical governed decision count drift")
    need(len({row["id"] for row in rows}) == len(rows), "canonical decision IDs are not unique")
    all_choice_fps = [fp for row in rows for fp in row["choiceFingerprints"]]
    need(len(all_choice_fps) == 676 and len(set(all_choice_fps)) == 676, "question-scoped choice fingerprints must be globally unique")
    return {
        "schema": 1,
        "version": MANIFEST_VERSION,
        "generated": True,
        "questionBankVersion": QUESTION_BANK_VERSION,
        "evidenceApprovalVersion": APPROVAL_VERSION,
        "measuredAssessmentVersion": MEASURED_VERSION,
        "boundary": "Audit-only canonical identity manifest. It contains no question stems, option text, rationales or raw answer text. Evidence-approved learning decisions remain distinct from measured-dataset contract decisions; neither scope grants production authority.",
        "counts": {
            "total": len(rows),
            "evidenceApproved": len(approved),
            "measuredEvidence": len(measured),
            "byKind": dict(sorted(counts.items())),
        },
        "choiceIdentity": {
            "algorithm": "fnv1a(question_id + '@r' + revision + '|' + collapsed_whitespace_option_text)",
            "questionScoped": True,
            "rawChoiceTextStored": False,
        },
        "decisions": rows,
    }


def render(payload: dict[str, Any]) -> str:
    return json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate the audit-only canonical assessment decision identity manifest")
    parser.add_argument("--check", action="store_true", help="Fail if the checked-in manifest differs from current governed runtime inputs")
    parser.add_argument("--output", type=Path, default=OUT)
    args = parser.parse_args()
    payload = render(build())
    output = args.output if args.output.is_absolute() else ROOT / args.output
    if args.check:
        if not output.exists() or output.read_text(encoding="utf-8") != payload:
            print(f"{output.relative_to(ROOT)} is stale; run tools/generate_assessment_decision_manifest.py", file=sys.stderr)
            return 1
        print("Assessment decision manifest is current: 169 governed decisions, 676 globally unique question-scoped choice fingerprints.")
        return 0
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(payload, encoding="utf-8")
    print(f"Wrote {output.relative_to(ROOT)} with {len(json.loads(payload)['decisions'])} governed decisions.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
