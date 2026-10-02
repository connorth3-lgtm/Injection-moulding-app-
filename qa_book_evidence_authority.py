from pathlib import Path
import json

ROOT=Path(__file__).resolve().parent
LEDGERS=[
 "data/book-claim-review-foundations-materials-machine-v1.json",
 "data/book-claim-review-process-tooling-v1.json",
 "data/book-claim-review-troubleshooting-v1.json",
 "data/book-claim-review-engineering-advanced-v1.json",
 "data/book-claim-review-high-risk-v1.json",
 "data/book-claim-resolution-high-risk-v1.json",
 "data/book-claim-resolution-high-risk-v2.json",
 "data/book-claim-resolution-all-v1.json",
 "data/book-qualification-resolution-all-v1.json",
]

def load(path):
    value=json.loads((ROOT/path).read_text(encoding="utf-8"))
    if not isinstance(value,dict): raise AssertionError(f"{path} must be an object")
    return value

policy=load("data/book-evidence-authority-v1.json")
classes=policy.get("classes") or {}
source_type_to_class={}
for cls,definition in classes.items():
    for source_type in definition.get("sourceTypes") or []:
        if source_type in source_type_to_class:
            raise AssertionError(f"source type mapped twice: {source_type}")
        source_type_to_class[source_type]=cls

seen={}
for rel in LEDGERS:
    ledger=load(rel)
    candidates=list(ledger.get("sourceSeeds") or [])+list(ledger.get("newEvidence") or [])
    for chapter in ledger.get("chapters") or []:
        candidates.extend(chapter.get("sourceSeeds") or [])
    for source in candidates:
        if not source.get("id"): continue
        st=source.get("type")
        if not st or st not in source_type_to_class:
            raise AssertionError(f"unclassified Book evidence source type {st!r} for {source.get('id')}")
        existing=seen.get(source["id"])
        row=(st,source_type_to_class[st])
        if existing and existing!=row:
            raise AssertionError(f"evidence authority drift for {source['id']}: {existing} vs {row}")
        seen[source["id"]]=row

assert len(seen)>=35, f"unexpectedly small governed Book evidence registry: {len(seen)}"
assert "supported claim is not a statement that every supporting source has equal authority" in policy.get("policy","").lower()
assert "independent human sme approval" in policy.get("learnerFacingBoundary","").lower()
print(f"Book evidence-authority QA passed: {len(seen)} governed source IDs have explicit authority classes separate from supported/qualified claim conclusions.")
