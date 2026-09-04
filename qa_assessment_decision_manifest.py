from __future__ import annotations

from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "data" / "assessment-decision-manifest-v1.json"
GENERATOR = ROOT / "tools" / "generate_assessment_decision_manifest.py"
ANALYTICS = ROOT / "src" / "domains" / "assessment" / "assessment-analytics-v2.js"
SPINE = ROOT / "src" / "domains" / "shared" / "data-spine.js"
REVISION_INDEX = ROOT / "sources" / "QUESTION_REVISION_INDEX.json"


def need(ok, message):
    if not ok:
        raise AssertionError(message)


def text(path):
    return path.read_text(encoding="utf-8")


def fnv1a(value: str) -> str:
    h = 2166136261
    for ch in value:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    return f"fnv1a-{h:08x}"


for path in [MANIFEST, GENERATOR, ANALYTICS, SPINE, REVISION_INDEX]:
    need(path.exists(), f"assessment decision identity asset missing: {path.relative_to(ROOT)}")

check = subprocess.run(
    ["python", str(GENERATOR), "--check"], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace"
)
need(check.returncode == 0, "assessment decision manifest drifted: " + (check.stderr or check.stdout)[:8000])

manifest = json.loads(text(MANIFEST))
need(manifest.get("schema") == 1 and manifest.get("version") == "2026.09.04.1", "assessment decision manifest schema/version drift")
need(manifest.get("generated") is True, "assessment decision manifest must remain compiler-owned")
need(manifest.get("questionBankVersion") == "2026.08.30.1", "assessment manifest question-bank version drift")
need(manifest.get("evidenceApprovalVersion") == "2026.08.30.3", "assessment manifest evidence-approval version drift")
need(manifest.get("measuredAssessmentVersion") == "2026.09.01.1", "assessment manifest measured-assessment version drift")
need(manifest.get("choiceIdentity", {}).get("questionScoped") is True, "choice identities must be question-scoped")
need(manifest.get("choiceIdentity", {}).get("rawChoiceTextStored") is False, "manifest must not store raw option text")

counts = manifest.get("counts") or {}
expected_kinds = {
    "technical-exam": 30,
    "regional-exam": 27,
    "scenario": 40,
    "diagnostic-lab-question": 36,
    "material-lab-question": 24,
    "real-measured-decision": 12,
}
need(counts.get("total") == 169, f"governed decision total drift: {counts}")
need(counts.get("evidenceApproved") == 157 and counts.get("measuredEvidence") == 12, f"governed decision scope split drift: {counts}")
need(counts.get("byKind") == expected_kinds, f"governed decision kind split drift: {counts.get('byKind')}")

rows = manifest.get("decisions") or []
need(len(rows) == 169 and len({r.get("id") for r in rows}) == 169, "canonical governed decision IDs must be complete and unique")
need(all(re.fullmatch(r"fnv1a-[0-9a-f]{8}", str(r.get("contentFingerprint") or "")) for r in rows), "content fingerprints missing/malformed")
need(all(re.fullmatch(r"fnv1a-[0-9a-f]{8}", str(r.get("sourceFingerprint") or "")) for r in rows), "source fingerprints missing/malformed")
need(all(r.get("sourceIds") for r in rows), "every governed decision must retain evidence source IDs")
need(all(len(r.get("choiceFingerprints") or []) == 4 for r in rows), "every governed decision must retain exactly four choice fingerprints")
need(all(r.get("correctChoiceFingerprint") in (r.get("choiceFingerprints") or []) for r in rows), "correct choice fingerprint must belong to its decision")
all_choices = [fp for row in rows for fp in row.get("choiceFingerprints") or []]
need(len(all_choices) == 676 and len(set(all_choices)) == 676, "question/revision-scoped choice fingerprints must be globally unique")

approved = [r for r in rows if r.get("decisionScope") == "evidence-approved-learning"]
measured = [r for r in rows if r.get("decisionScope") == "measured-evidence-learning"]
need(len(approved) == 157 and all(r.get("evidenceStatus") == "approved" for r in approved), "157 approval-gated decisions must remain explicitly approved")
need(len(measured) == 12 and all(r.get("evidenceStatus") == "contract-audited" for r in measured), "12 measured-data decisions must remain contract-audited rather than evidence-approval-labelled")
need(all(r.get("evidenceSourceMode") == "measured-dataset-contract" and r.get("contract", {}).get("blob") for r in measured), "measured-data decisions must retain pinned dataset-contract provenance")

forbidden_keys = {"stem", "question", "options", "choices", "rationale", "answerText", "rawAnswer", "title"}
def walk(value):
    if isinstance(value, dict):
        for key, child in value.items():
            need(key not in forbidden_keys, f"audit-only manifest leaked raw content field: {key}")
            walk(child)
    elif isinstance(value, list):
        for child in value:
            walk(child)
walk(manifest)

revision = json.loads(text(REVISION_INDEX))
need(revision.get("bank_version") == "2026.08.30.1", "revision-index bank version drift")
formal = [r for r in rows if r.get("kind") in {"technical-exam", "regional-exam"}]
need(len(formal) == 57 and {r["id"] for r in formal} == set(revision.get("all_stable_ids") or []), "manifest formal stable IDs differ from reviewed revision index")
rev2 = set((revision.get("revision2") or {}).keys())
rev3 = set((revision.get("revision3") or {}).keys())
need(sum(1 for r in formal if r["revision"] == 2) == 39 and sum(1 for r in formal if r["revision"] == 3) == 18, "formal revision distribution must remain 39 r2 + 18 r3")
need(all((r["id"] in rev2 and r["revision"] == 2) or (r["id"] in rev3 and r["revision"] == 3) for r in formal), "manifest formal revisions do not match governance index")
need(all(r.get("critical") is True for r in formal if r.get("kind") == "regional-exam"), "all 27 regional safety/compliance decisions must remain critical")

analytics = text(ANALYTICS)
for marker in [
    "const LEGACY_REVISION='legacy-unversioned'",
    "function normalChoice(v)",
    "choiceFingerprint(questionId,revision,text)",
    "choiceFingerprint(id,meta.revision,answer)",
    "question-and-revision-scoped fingerprints",
    "questionRevision:null",
    "revisionStatus:LEGACY_REVISION",
]:
    need(marker in analytics, f"assessment analytics provenance marker missing: {marker}")
need("choiceFingerprint:fp(text)" not in analytics, "legacy globally text-scoped choice fingerprint must not return")

node = r'''
const fs=require('fs'),vm=require('vm');
const option='  Same   displayed option  ';
const legacy={export:()=>({responseTimingBasis:'question-exposure',questions:{x:{stableId:'tech:Beginner:0',attempts:2,correct:1,wrong:1,unanswered:0,totalResponseMs:1800,optionSelections:{[option]:2},difficulty:'Beginner',competency:'test',concept:'test'}},exams:{}})};
const window={MM_ASSESSMENT_ANALYTICS:legacy,MM_QUESTION_REVISIONS:{bankVersion:'2026.08.30.1',forId:id=>({revision:id==='tech:Beginner:0'?2:3,date:'2026-08-30'})},addEventListener(){}};
const sandbox={window,console,setTimeout:fn=>{if(typeof fn==='function')fn();return 1},clearTimeout(){},Date,Math,JSON,Object,Map,Set};window.window=window;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(%s,'utf8'),sandbox,{filename:'data-spine.js'});
vm.runInContext(fs.readFileSync(%s,'utf8'),sandbox,{filename:'assessment-analytics-v2.js'});
const A=window.MM_ASSESSMENT_ANALYTICS_V2;
const same=A.choiceFingerprint('tech:Beginner:0',2,option),collapsed=A.choiceFingerprint('tech:Beginner:0',2,'Same displayed option'),otherQuestion=A.choiceFingerprint('tech:Intermediate:0',2,option),otherRevision=A.choiceFingerprint('tech:Beginner:0',3,option),exported=A.export();
process.stdout.write(JSON.stringify({same,collapsed,otherQuestion,otherRevision,exported}));
''' % (json.dumps(str(SPINE)), json.dumps(str(ANALYTICS)))
proc = subprocess.run(["node", "-e", node], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
need(proc.returncode == 0, "assessment analytics identity runtime failed: " + (proc.stderr or proc.stdout)[:8000])
runtime = json.loads(proc.stdout)
expected = fnv1a("tech:Beginner:0@r2|Same displayed option")
need(runtime["same"] == expected == runtime["collapsed"], "analytics choice fingerprint algorithm differs from canonical manifest algorithm")
need(runtime["same"] != runtime["otherQuestion"] and runtime["same"] != runtime["otherRevision"], "choice fingerprints must separate question and proven revision identity")
serialized = json.dumps(runtime["exported"])
need("Same displayed option" not in serialized and "Same   displayed option" not in serialized, "analytics v2 export leaked displayed answer text")
row = runtime["exported"]["questions"].get("tech:Beginner:0@legacy-unversioned")
legacy_expected = fnv1a("tech:Beginner:0@legacy-unversioned|Same displayed option")
need(row is not None, "legacy stable-ID counters were not retained in an explicit unversioned analytics bucket")
need(row.get("questionRevision") is None and row.get("revisionStatus") == "legacy-unversioned", "legacy counters were assigned a fabricated proven revision")
need(row.get("catalogRevision") == 2, "current catalog revision metadata was not kept separate from historical analytics provenance")
need(row["choiceSelections"][0]["choiceFingerprint"] == legacy_expected and row["choiceSelections"][0]["count"] == 2, "legacy analytics export did not apply explicit unversioned choice identity")

runtime_manifest = json.loads((ROOT / "runtime-domain-manifest.json").read_text(encoding="utf-8"))
need("./data/assessment-decision-manifest-v1.json" not in (runtime_manifest.get("dataAssets") or []), "audit-only decision manifest must not become a public runtime data asset")

print("MouldMaster assessment decision identity QA passed: 169 governed decisions, 157 evidence-approved + 12 measured-contract decisions, 676 globally unique question/revision-scoped choices, explicit legacy-unversioned analytics provenance, no raw question/answer text.")
