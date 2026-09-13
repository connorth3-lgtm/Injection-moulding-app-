#!/usr/bin/env python3
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def load(rel):
    return json.loads((ROOT / rel).read_text(encoding='utf-8'))

manifest = load('data/book-manifest-v1.json')
gate = load('data/book-accuracy-gate-v1.json')
evidence_registry = load('data/book-evidence-registry-v1.json')
review_paths = [
    'data/book-claim-review-high-risk-v1.json',
    'data/book-claim-review-process-tooling-v1.json',
    'data/book-claim-review-foundations-materials-machine-v1.json',
    'data/book-claim-review-troubleshooting-v1.json',
    'data/book-claim-review-engineering-advanced-v1.json',
]
resolution_paths = [
    'data/book-claim-resolution-high-risk-v1.json',
    'data/book-claim-resolution-high-risk-v2.json',
]
authored_paths = [
    'data/book-authored-foundations-v1.json',
    'data/book-chapters-materials-machine-v1.json',
    'data/book-authored-remaining-v1.json',
]
reviews = [load(p) for p in review_paths]
resolutions = [load(p) for p in resolution_paths]
authored = [load(p) for p in authored_paths]

assert manifest['schema'] == 1 and manifest['bookId'] == 'mouldmaster-book'
assert gate['policy'] == 'accuracy-overkill' and gate['verificationUnit'] == 'claim'
manifest_chapters = [c for part in manifest['parts'] for c in part.get('chapters', [])]
manifest_ids = {c['id'] for c in manifest_chapters}
assert len(manifest_chapters) == 46 and len(manifest_ids) == 46
assert not any(c.get('state') == 'verified' for c in manifest_chapters)

reviewed_ids = []
claims = []
for review in reviews:
    assert review['schema'] == 1 and review['bookId'] == manifest['bookId']
    assert review.get('chapterPromotionAuthorized') is False
    assert review.get('summary', {}).get('chaptersPromoted') == 0
    for chapter in review.get('chapters', []):
        reviewed_ids.append(chapter['chapterId'])
        claims.extend(chapter.get('claims', []))

assert len(reviewed_ids) == 46, f'expected 46 chapter reviews, got {len(reviewed_ids)}'
assert len(set(reviewed_ids)) == 46, 'chapter reviewed more than once across base ledgers'
assert set(reviewed_ids) == manifest_ids, f'claim-review coverage mismatch: missing={manifest_ids-set(reviewed_ids)}, extra={set(reviewed_ids)-manifest_ids}'
assert len(claims) == 137, f'expected 137 claims, got {len(claims)}'
claim_ids = [c.get('claimId') for c in claims]
assert None not in claim_ids and len(set(claim_ids)) == 137, 'claim IDs must be present and globally unique'

allowed = {'supported', 'qualified', 'conflicting', 'hold'}
required_fields = ('claimId','section','claimClass','claim','applicability','exclusions','evidence','conclusion','basis')
for claim in claims:
    for field in required_fields:
        assert field in claim, f"{claim.get('claimId')} missing {field}"
    assert claim['conclusion'] in allowed, f"invalid conclusion for {claim['claimId']}"
    assert isinstance(claim['evidence'], list), f"evidence must be a list for {claim['claimId']}"
    if not claim['evidence']:
        assert claim['conclusion'] == 'hold', f"evidence-free claim must be HOLD: {claim['claimId']}"
    for field in ('section','claimClass','claim','applicability','exclusions','basis'):
        assert str(claim[field]).strip(), f"blank {field} in {claim['claimId']}"

# Build one evidence namespace from all governed source records. Different ledgers may
# use a shorter display title for the same source ID; the canonical URL may not diverge.
source_records = {}
def add_sources(items):
    for src in items or []:
        sid = src.get('id')
        assert sid, 'source record missing id'
        if sid in source_records:
            prior = source_records[sid]
            if prior.get('url') and src.get('url'):
                assert prior['url'] == src['url'], f'conflicting source URL for {sid}'
            # Keep the richer record if the first registration was metadata-light.
            if len(src) > len(prior):
                source_records[sid] = {**prior, **src}
        else:
            source_records[sid] = src

add_sources(manifest.get('sourceSeeds'))
add_sources(evidence_registry.get('sourceSeeds'))
for batch in authored:
    add_sources(batch.get('sourceSeeds'))
for anchor in gate.get('evidenceAnchorsConfirmed2026_09_14', []):
    add_sources([anchor])
for review in reviews:
    add_sources(review.get('sourceSeeds'))
for resolution in resolutions:
    assert resolution.get('chapterPromotionAuthorized') is False
    add_sources(resolution.get('newEvidence'))

# Currency-only records in the high-risk ledger must still resolve to a traceable source record elsewhere.
high_risk = reviews[0]
for snap in high_risk.get('sourceCurrency', []):
    sid = snap['id']
    assert sid in source_records, f'high-risk source currency record lacks traceable source record: {sid}'

for claim in claims:
    for sid in claim['evidence']:
        assert sid in source_records, f"unknown evidence {sid} in {claim['claimId']}"
        src = source_records[sid]
        assert str(src.get('url','')).startswith('https://'), f"evidence source has no HTTPS trace: {sid}"
        assert src.get('title'), f"evidence source missing title: {sid}"

# Apply ordered resolution overlays and ensure they can only amend real claims.
effective = {c['claimId']: c['conclusion'] for c in claims}
for overlay in resolutions:
    seen = set()
    for res in overlay.get('resolutions', []):
        cid = res['claimId']
        assert cid in effective, f'resolution targets unknown claim: {cid}'
        assert cid not in seen, f'duplicate resolution target in overlay: {cid}'
        seen.add(cid)
        assert res.get('previous') == effective[cid], f'resolution previous-state mismatch for {cid}'
        assert res.get('newConclusion') in allowed
        assert res.get('reason','').strip()
        ev = res.get('evidence', [])
        assert ev, f'resolution lacks evidence: {cid}'
        for sid in ev:
            assert sid in source_records, f'unknown resolution evidence {sid} for {cid}'
            assert str(source_records[sid].get('url','')).startswith('https://')
        effective[cid] = res['newConclusion']

for batch in authored:
    for chapter in batch.get('chapters', []):
        assert chapter.get('state') != 'verified', f"authored chapter self-promoted: {chapter.get('id')}"

counts = Counter(effective.values())
assert counts['conflicting'] == 0
assert sum(counts.values()) == 137
print('PASS: 46/46 Book chapters have claim-level review coverage; 137 claims inventoried; 0 chapters self-promoted.')
print(f"PASS: effective claim dispositions: supported={counts['supported']}, qualified={counts['qualified']}, hold={counts['hold']}, conflicting={counts['conflicting']}.")
