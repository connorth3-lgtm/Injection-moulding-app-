from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
REGISTRY = ROOT / "measured-evidence-integration.js"
DECISION = ROOT / "measured-evidence-decision.js"
SCENARIOS = ROOT / "data/measured-evidence-decision-scenarios-v1.json"
DISCOVERY = ROOT / "data/measured-data-discovery-queue-v1.json"
INDEX = ROOT / "index.html"
SW = ROOT / "service-worker.js"


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


def has_topic(text, topic):
    text = text.lower()
    topic = topic.lower()
    if len(topic) > 3:
        return topic in text
    return re.search(r"(?:^|[^a-z0-9])" + re.escape(topic) + r"(?:$|[^a-z0-9])", text, re.I) is not None


registry = REGISTRY.read_text(encoding="utf-8")
decision = DECISION.read_text(encoding="utf-8")
scenario_doc = json.loads(SCENARIOS.read_text(encoding="utf-8"))
discovery = json.loads(DISCOVERY.read_text(encoding="utf-8"))
index = INDEX.read_text(encoding="utf-8")
sw = SW.read_text(encoding="utf-8")

families = []
for line in registry.splitlines():
    if not line.lstrip().startswith("{id:'"):
        continue
    mid = re.search(r"\bid:'([^']+)'", line)
    mkind = re.search(r"\bkind:'([^']+)'", line)
    mts = re.search(r"\btimeSeries:(\d+)", line)
    mtopics = re.search(r"\btopics:\[(.*?)\],boundary:", line)
    need(mid and mkind and mts and mtopics, f"could not parse canonical family line: {line[:100]}")
    topics = re.findall(r"'([^']+)'", mtopics.group(1))
    families.append({"id": mid.group(1), "kind": mkind.group(1), "timeSeries": int(mts.group(1)), "topics": topics})

need(len(families) == 17, f"expected 17 canonical families, got {len(families)}")
need(sum(f["timeSeries"] for f in families) == 85_569_824, "canonical waveform total drifted")
by_id = {f["id"]: f for f in families}
need(len(by_id) == 17, "duplicate runtime family id")


def score(f, text):
    return sum(max(1, len(topic.split(" "))) for topic in f["topics"] if has_topic(text, topic))


def select(text, limit=4):
    ranked = [(score(f, text), f["timeSeries"], f) for f in families]
    ranked = [x for x in ranked if x[0] > 0]
    ranked.sort(key=lambda x: (-x[0], -x[1]))
    return [x[2] for x in ranked[:limit]]


def role(f):
    return "direct" if f["timeSeries"] > 0 else "supporting"

results = []
covered = set()
for scenario in scenario_doc["scenarios"]:
    rows = select(scenario["query"])
    need(rows, f"scenario {scenario['id']} selected no evidence")
    top = rows[0]
    need(top["id"] == scenario["expectedTopId"], f"scenario {scenario['id']} routed to {top['id']} instead of {scenario['expectedTopId']}")
    need(role(top) == scenario["expectedRole"], f"scenario {scenario['id']} role drifted")
    matched = [t for t in top["topics"] if has_topic(scenario["query"], t)]
    need(matched, f"scenario {scenario['id']} has no explainable matched topic")
    covered.add(top["id"])
    results.append({"scenario": scenario["id"], "topFamily": top["id"], "role": role(top), "matchedTopics": matched[:5]})

need(covered == set(by_id), f"decision scenarios must cover all 17 families; missing={sorted(set(by_id)-covered)}")
for negative in scenario_doc["negativeRouting"]:
    selected = {f["id"] for f in select(negative["query"], 17)}
    need(negative["mustNotSelect"] not in selected, f"negative routing failed: {negative['id']}")

for marker in [
    "Why relevant:",
    "Direct measured signal",
    "Supporting process context",
    "Supporting material evidence",
    "root-cause verdict",
    "universal setpoint",
    "matchedTopics",
    "MM_MEASURED_EVIDENCE_DECISIONS",
]:
    need(marker in decision, f"decision layer missing marker: {marker}")

need("./measured-evidence-decision.js" in index, "index runtime loader missing decision layer")
need("./measured-evidence-decision.js" in sw, "offline CORE missing decision layer")
need("rawRows:[" not in decision and "samples:[" not in decision and "signalValues:[" not in decision, "decision layer must remain metadata-only")

active = discovery.get("activeDiscoveries", [])
active_ids = {x.get("canonicalDatasetId") or x.get("id") for x in active}
need(not (active_ids & set(by_id)), f"blocked discovery leaked into runtime evidence: {sorted(active_ids & set(by_id))}")

report = {
    "schema": 1,
    "result": "pass",
    "scenarioCount": len(results),
    "canonicalFamiliesCovered": len(covered),
    "directSignalScenarios": sum(1 for x in results if x["role"] == "direct"),
    "supportingEvidenceScenarios": sum(1 for x in results if x["role"] == "supporting"),
    "negativeRoutingCases": len(scenario_doc["negativeRouting"]),
    "acceptedInjectionProcessTimeSeriesValues": sum(f["timeSeries"] for f in families),
    "scenarios": results,
}
(ROOT / "measured-evidence-decision-workflow-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print("MouldMaster evidence-to-decision workflow QA passed (17/17 canonical families routed; direct/supporting roles and explanations enforced)")
