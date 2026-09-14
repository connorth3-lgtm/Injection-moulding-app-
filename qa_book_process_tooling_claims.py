#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = json.loads((ROOT / 'data/book-claim-review-process-tooling-v1.json').read_text(encoding='utf-8'))
MANIFEST = json.loads((ROOT / 'data/book-manifest-v1.json').read_text(encoding='utf-8'))

assert DATA['schema'] == 1 and DATA['bookId'] == 'mouldmaster-book'
assert DATA['policy'] == 'accuracy-overkill'
assert DATA['chapterPromotionAuthorized'] is False
assert len(DATA['chapters']) == 8

claims = [c for chapter in DATA['chapters'] for c in chapter['claims']]
assert len(claims) == 24
assert len({c['claimId'] for c in claims}) == 24
assert all(c['conclusion'] in {'supported', 'qualified', 'conflicting', 'hold'} for c in claims)
assert all(c.get('applicability') and c.get('exclusions') and c.get('basis') for c in claims)
assert all(c.get('evidence') for c in claims)

counts = {k: sum(c['conclusion'] == k for c in claims) for k in ['supported','qualified','conflicting','hold']}
for key, value in counts.items():
    assert DATA['summary'][key] == value, (key, DATA['summary'][key], value)
assert counts == {'supported': 6, 'qualified': 13, 'conflicting': 0, 'hold': 5}
assert DATA['summary']['chaptersPromoted'] == 0

manifest_ids = {c['id'] for p in MANIFEST['parts'] for c in p.get('chapters', [])}
reviewed_ids = {chapter['chapterId'] for chapter in DATA['chapters']}
assert reviewed_ids <= manifest_ids
assert not any(c.get('state') == 'verified' for p in MANIFEST['parts'] for c in p.get('chapters', []))

source_ids = {s['id'] for s in DATA['sourceCurrency']}
external_known = {
    'BASF-INJECTION-TROUBLESHOOTER','BASF-ULTRASON-INJECTION',
    'BIELENBERG-2025-SWITCHOVER-REVIEW','ENGEL-IQ-PROCESS-CONTROL'
}
for claim in claims:
    for sid in claim['evidence']:
        assert sid in source_ids or sid in external_known, f'unregistered claim evidence: {sid}'

print('PASS: 24 process/tooling claims governed across 8 chapters; 5 intentional HOLD claims; 0 chapters promoted')
