from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parent
MODULE = ROOT / "src/domains/learning/delayed-transfer-reviews.js"


def need(cond, msg):
    if not cond:
        raise AssertionError(msg)


need(MODULE.exists(), "delayed transfer review module missing")
source = MODULE.read_text(encoding="utf-8")
for marker in [
    "MM_DELAYED_TRANSFER_REVIEWS",
    "MM_ACTIVITY_EVENTS_V2 required",
    "lesson_complete",
    "practice_complete",
    "delayed_transfer_review",
    "delayed-transfer-review",
    "7d",
    "30d",
    "graceDays:3",
    "graceDays:7",
    "review score must be between 0 and 100",
    "review is not due yet",
    "review is already completed",
    "competence certification",
]:
    need(marker in source, f"delayed transfer marker missing: {marker}")
for forbidden in ["localStorage", "fetch(", "XMLHttpRequest", "navigator.sendBeacon"]:
    need(forbidden not in source, f"delayed transfer layer must remain projection-only/local API backed: {forbidden}")

p = subprocess.run(["node", "--check", str(MODULE)], capture_output=True, text=True)
need(p.returncode == 0, "delayed transfer module syntax failed: " + p.stderr)

node_qa = r'''
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const DAY=86400000,T0=Date.parse('2026-01-01T00:00:00.000Z');
let now=T0+7*DAY;
class MockDate extends Date { static now(){return now;} }
const store=[];
const api={
  events:()=>store.slice(),
  record:(type,data)=>{const e={v:2,t:new MockDate(now).toISOString(),type,...data};store.push(e);return e;}
};
const context={window:{MM_ACTIVITY_EVENTS_V2:api},Date:MockDate,console};
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/domains/learning/delayed-transfer-reviews.js','utf8'),context);
const dtr=context.window.MM_DELAYED_TRANSFER_REVIEWS;
assert(dtr&&typeof dtr.project==='function'&&typeof dtr.recordOutcome==='function');
const anchor={v:2,t:new Date(T0).toISOString(),type:'practice_complete',activityType:'scenario',activityId:'scenario:transfer-a',itemId:'transfer-a',score:84,mechanismIds:['gate-freeze','packing-balance']};
const noTarget={...anchor,activityId:'scenario:no-target',itemId:'no-target',mechanismIds:[]};
let q=dtr.project({events:[anchor],nowMs:T0+6*DAY});
assert.equal(q.items.length,2);
assert.equal(q.summary.upcoming,2);
assert.equal(q.items.find(x=>x.window==='7d').status,'upcoming');
const stable=q.items.map(x=>x.reviewKey);
assert(stable.every(x=>/^dtr:[0-9a-f]{16}:(7d|30d)$/.test(x)));
assert.deepEqual(stable,dtr.project({events:[anchor],nowMs:T0+6*DAY}).items.map(x=>x.reviewKey));
assert.equal(dtr.project({events:[anchor,{...anchor}],nowMs:T0+6*DAY}).items.length,2);
q=dtr.project({events:[anchor],nowMs:T0+7*DAY});
assert.equal(q.items.find(x=>x.window==='7d').status,'due');
assert.equal(q.items.find(x=>x.window==='30d').status,'upcoming');
q=dtr.project({events:[anchor],nowMs:T0+11*DAY});
assert.equal(q.items.find(x=>x.window==='7d').status,'overdue');
q=dtr.project({events:[anchor],nowMs:T0+30*DAY});
assert.equal(q.items.find(x=>x.window==='30d').status,'due');
assert.equal(dtr.project({events:[noTarget],nowMs:T0+30*DAY}).items.length,0);
assert.throws(()=>dtr.project({events:[anchor],nowMs:NaN}),/nowMs/);
store.push(anchor);
now=T0+7*DAY;
q=dtr.project({nowMs:now});
const seven=q.items.find(x=>x.window==='7d'),thirty=q.items.find(x=>x.window==='30d');
assert(seven&&thirty);
assert.throws(()=>dtr.recordOutcome(thirty.reviewKey,{score:70}),/not due yet/);
assert.throws(()=>dtr.recordOutcome(seven.reviewKey,{score:101}),/between 0 and 100/);
assert.throws(()=>dtr.recordOutcome('bad-key',{score:70}),/invalid delayed transfer review key/);
const written=dtr.recordOutcome(seven.reviewKey,{score:82,correct:true});
assert.equal(written.type,'delayed_transfer_review');
assert.equal(written.activityType,'delayed-transfer-review');
assert.equal(written.stage,'7d');
assert.equal(written.outcome,'completed');
assert.deepEqual(written.mechanismIds,['gate-freeze','packing-balance']);
q=dtr.project({nowMs:now});
assert.equal(q.items.find(x=>x.window==='7d').status,'completed');
assert.equal(q.items.find(x=>x.window==='30d').status,'upcoming');
assert.throws(()=>dtr.recordOutcome(seven.reviewKey,{score:82}),/already completed/);
const duplicate={...written,t:new Date(now+1000).toISOString(),score:91};
q=dtr.project({events:[anchor,written,duplicate],nowMs:now+1000});
assert.equal(q.items.find(x=>x.window==='7d').score,91);
assert.equal(q.items.length,2);
console.log(JSON.stringify({ok:true,keys:stable,summary:q.summary}));
'''
p = subprocess.run(["node", "-e", node_qa], cwd=ROOT, capture_output=True, text=True)
need(p.returncode == 0, "delayed transfer behavioral QA failed:\n" + (p.stderr or p.stdout))
result = json.loads(p.stdout.strip().splitlines()[-1])
need(result.get("ok") is True, "delayed transfer Node QA did not report success")

manifest = json.loads((ROOT / "runtime-domain-manifest.json").read_text(encoding="utf-8"))
assets = manifest.get("assets", [])
activity_asset = "./src/domains/learning/activity-events-v2.js"
learner_asset = "./src/domains/learning/learner-model.js"
review_asset = "./src/domains/learning/delayed-transfer-reviews.js"
content_asset = "./src/domains/learning/content-intelligence.js"
need(review_asset in assets, "delayed transfer module missing from runtime manifest")
need(assets.index(activity_asset) < assets.index(review_asset), "activity events must load before delayed transfer reviews")
need(assets.index(learner_asset) < assets.index(review_asset), "learner model must load before delayed transfer reviews")
need(assets.index(review_asset) < assets.index(content_asset), "delayed transfer reviews must load before content intelligence")

generator = (ROOT / "tools/generate_runtime_manifest.py").read_text(encoding="utf-8")
need(review_asset in generator, "runtime manifest generator missing delayed transfer priority asset")
sw = (ROOT / "service-worker.js").read_text(encoding="utf-8")
need(f"'{review_asset}'" in sw, "delayed transfer module missing from atomic offline core")

content = (ROOT / "src/domains/learning/content-intelligence.js").read_text(encoding="utf-8")
for marker in [
    "MM_DELAYED_TRANSFER_REVIEWS?.project",
    "Delayed reviews due",
    "Delayed transfer reviews",
    "7-day and 30-day retrieval checks",
    "not competence sign-off",
    "status==='due'||x.status==='overdue'",
]:
    need(marker in content, f"content intelligence delayed-review marker missing: {marker}")
need("reviewKey" not in content, "data intelligence UI must not expose internal delayed-review keys")
p = subprocess.run(["node", "--check", str(ROOT / "src/domains/learning/content-intelligence.js")], capture_output=True, text=True)
need(p.returncode == 0, "content intelligence syntax failed: " + p.stderr)

release = (ROOT / ".github/workflows/qa.yml").read_text(encoding="utf-8")
mobile = (ROOT / ".github/workflows/mobile-browser-qa.yml").read_text(encoding="utf-8")
need("python qa_delayed_transfer_reviews.py" in release, "release QA does not run delayed transfer review QA")
need("python qa_delayed_transfer_reviews.py" in mobile, "mobile QA does not run delayed transfer review QA")

print("MouldMaster delayed transfer review QA passed (deterministic 7d/30d projection + local Data Intelligence surface)")
