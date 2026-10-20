#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LEDGER = json.loads((ROOT / 'data/book-claim-review-high-risk-v1.json').read_text(encoding='utf-8'))
RES = json.loads((ROOT / 'data/book-claim-resolution-high-risk-v1.json').read_text(encoding='utf-8'))
MANIFEST = json.loads((ROOT / 'data/book-manifest-v1.json').read_text(encoding='utf-8'))

assert RES['schema'] == 1 and RES['bookId'] == 'mouldmaster-book'
assert RES['policy'] == 'accuracy-overkill'
assert RES['supersedesConclusionsOnlyForListedClaimIds'] is True
assert RES['chapterPromotionAuthorized'] is False

base = {
    claim['claimId']: claim['conclusion']
    for chapter in LEDGER['chapters']
    for claim in chapter['claims']
}
assert len(base) == 20
new_sources = {s['id'] for s in RES['newEvidence']}
assert len(new_sources) == len(RES['newEvidence'])

seen = set()
for item in RES['resolutions']:
    cid = item['claimId']
    assert cid in base, f'unknown resolved claim: {cid}'
    assert cid not in seen, f'duplicate resolution: {cid}'
    seen.add(cid)
    assert item['previous'] == base[cid], f'previous conclusion mismatch: {cid}'
    assert item['newConclusion'] in {'supported','qualified','conflicting','hold'}
    assert item.get('reason','').strip()
    assert item.get('evidence'), f'resolution without stronger evidence: {cid}'
    assert all(source_id in new_sources for source_id in item['evidence'])
    base[cid] = item['newConclusion']

counts = {key: list(base.values()).count(key) for key in ['supported','qualified','conflicting','hold']}
expected = RES['effectiveHighRiskCountsAfterResolution']
for key, value in counts.items():
    assert expected[key] == value, f'effective count mismatch: {key}'
assert expected['claims'] == len(base) == 20
assert expected['chaptersPromoted'] == 0

blocking = sorted(cid for cid, conclusion in base.items() if conclusion in {'hold','conflicting'})
assert blocking == sorted(RES['remainingBlockingClaims'])
assert blocking, 'overkill review must not silently erase unresolved blockers'

chapters = [c for part in MANIFEST['parts'] for c in part.get('chapters', [])]
assert not any(c.get('state') == 'verified' for c in chapters)

print(f'PASS: high-risk evidence resolution leaves {len(blocking)} blocking claims and authorizes 0 chapter promotions')
