#!/usr/bin/env python3
from pathlib import Path
import json
q=json.loads(Path("data/material-primary-tds-acquisition-queue-v1.json").read_text())
w=json.loads(Path("data/asian-aus-nz-material-grade-extraction-wave2-v1.json").read_text())
assert q["rules"]["secondaryAggregatorCannotPromote"] is True
assert q["rules"]["adjacentGradeCannotSubstitute"] is True
assert q["rules"]["familyPageCannotPromoteWithoutGradeNumericEvidence"] is True
assert q["rules"]["sourceRevisionConflictsRemainConditional"] is True
assert q["queueCount"] == len(q["queue"])
assert q["queueCount"] >= 50
keys=[(str(x.get("manufacturer","")).strip().lower(),str(x.get("grade","")).strip().lower()) for x in q["queue"]]
assert len(keys) == len(set(keys)), "duplicate manufacturer+grade lifecycle rows in primary TDS queue"
metrics=q.get("metrics", {})
assert metrics.get("convertedComplete") == sum(bool(x.get("convertedToComplete")) for x in q["queue"])
assert metrics.get("exactGradeSourceLocatedPending") == sum(bool(x.get("exactGradeSourceLocated")) and not bool(x.get("convertedToComplete")) for x in q["queue"])
assert metrics.get("stillNeedPrimarySource") == sum(not bool(x.get("exactGradeSourceLocated")) and not bool(x.get("convertedToComplete")) for x in q["queue"])
for x in q["queue"]:
    assert x["priority"] in {"validate-and-convert","extract-numeric-table","acquire-primary-TDS","converted-complete"}
    assert x["conversionRequirement"]
# Discovery entries in this queue must not simultaneously masquerade as complete solely by queue membership.
complete={(str(r.get("manufacturer","")).lower(),str(r.get("grade","")).lower()) for r in w["records"] if r.get("status")=="candidate-complete"}
for x in q["queue"]:
    if (str(x.get("manufacturer","")).lower(),str(x.get("grade","")).lower()) in complete:
        # Historical enrichment can coexist, but queue record itself remains explicitly non-promotional.
        assert x["conversionRequirement"]
assert q.get("metrics", {}).get("convertedComplete", 0) >= 1
assert q.get("metrics", {}).get("stillNeedPrimarySource", 0) >= 1
print(f"Primary TDS acquisition QA passed: {q['queueCount']} evidence-gated exact grades")
