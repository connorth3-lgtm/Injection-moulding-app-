#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASE = json.loads((ROOT / 'data/book-claim-review-high-risk-v1.json').read_text(encoding='utf-8'))
R1 = json.loads((ROOT / 'data/book-claim-resolution-high-risk-v1.json').read_text(encoding='utf-8'))
R2 = json.loads((ROOT / 'data/book-claim-resolution-high-risk-v2.json').read_text(encoding='utf-8'))
MANIFEST = json.loads((ROOT / 'data/book-manifest-v1.json').read_text(encoding='utf-8'))

assert BASE['policy'] == R1['policy'] == R2['policy'] == 'accuracy-overkill'
assert R2['chapterPromotionAuthorized'] is False

claims = {
    c['claimId']: c
    for chapter in BASE['chapters']
    for c in chapter['claims']
}
assert len(claims) == 20

resolved = {}
for record in (R1, R2):
    for item in record['resolutions']:
        cid = item['claimId']
        assert cid in claims, f'unknown claim resolution: {cid}'
        assert item['newConclusion'] in {'supported', 'qualified', 'conflicting', 'hold'}
        assert item.get('evidence'), f'missing evidence for {cid}'
        assert item.get('reason'), f'missing resolution basis for {cid}'
        resolved[cid] = item['newConclusion']

final = {cid: resolved.get(cid, claim['conclusion']) for cid, claim in claims.items()}
assert set(final.values()) <= {'supported', 'qualified', 'conflicting', 'hold'}
assert sum(v == 'hold' for v in final.values()) == 0, final
assert sum(v == 'conflicting' for v in final.values()) == 0, final
assert R2['effectiveHighRiskDisposition']['remainingHoldClaimsFromReviewedSet'] == 0
assert R2['effectiveHighRiskDisposition']['remainingConflictingClaimsFromReviewedSet'] == 0
assert R2['effectiveHighRiskDisposition']['chaptersPromoted'] == 0

for cid in ['safety-foundations-02', 'vp-transfer-02', 'clamp-01', 'clamp-03']:
    assert cid in {x['claimId'] for x in R2['resolutions']}

all_manifest_chapters = [c for p in MANIFEST['parts'] for c in p.get('chapters', [])]
assert not any(c.get('state') == 'verified' for c in all_manifest_chapters)

print('PASS: 20 reviewed high-risk claims have 0 hold/conflict conclusions after governed resolutions; 0 chapters promoted')
