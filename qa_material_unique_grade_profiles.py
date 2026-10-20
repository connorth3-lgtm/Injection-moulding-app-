#!/usr/bin/env python3
from pathlib import Path
import json,re
p=Path("data/asian-aus-nz-material-grade-extraction-wave2-v1.json")
d=json.loads(p.read_text())
rows=d["records"]

def norm(x): return re.sub(r"[^a-z0-9]+","",str(x).lower())
exact=[]
for i,r in enumerate(rows):
    if r.get("status")!="candidate-complete": continue
    if isinstance(r.get("grade"),str):
        exact.append((norm(r.get("manufacturer") or r.get("organization")),norm(r["grade"]),i,r))
seen={}
dup=[]
for m,g,i,r in exact:
    k=(m,g)
    if k in seen: dup.append((k,seen[k],i))
    else: seen[k]=i
# Existing historical duplicates are reported, never counted twice by downstream unique-profile metrics.
unique_complete=len(seen)
assert unique_complete >= 60
assert d["policy"]["noUniversalSettings"] is True
assert d["policy"]["noInterpolationAcrossGrades"] is True
print(f"Unique exact candidate-complete profiles: {unique_complete}; raw exact complete rows: {len(exact)}; duplicate identities: {len(dup)}")
if dup:
    print("Duplicate identities retained for audit/reconciliation, not unique-profile counting:", dup[:20])
