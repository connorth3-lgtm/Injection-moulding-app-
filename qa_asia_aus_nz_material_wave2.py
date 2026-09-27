from pathlib import Path
import json
p=Path("data/asian-aus-nz-material-grade-extraction-wave2-v1.json")
d=json.loads(p.read_text())
assert d["policy"]["noUniversalSettings"] is True
assert d["policy"]["noInterpolationAcrossGrades"] is True
assert d["policy"]["regionalAvailabilityIsNotManufacturingOrigin"] is True
rows=d["records"]
assert len(rows)>=60
allowed={"candidate-complete","candidate-partial","conditional","discovery-only"}
assert all(r.get("status") in allowed for r in rows)
assert sum(r.get("status")=="candidate-complete" for r in rows)>=40
assert any(r.get("recordType")=="source-revision-conflict" for r in rows)
assert any((r.get("country")=="New Zealand" or r.get("region")=="Australia/New Zealand availability") for r in rows)
assert any(r.get("manufacturerCountry")=="China" for r in rows)
print(f'Asia/Australia/NZ material wave 2 QA passed: {len(rows)} governed records')
