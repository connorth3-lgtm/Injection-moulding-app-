#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LEDGER = json.loads((ROOT / 'data/book-claim-review-high-risk-v1.json').read_text(encoding='utf-8'))
MANIFEST = json.loads((ROOT / 'data/book-manifest-v1.json').read_text(encoding='utf-8'))
GATE = json.loads((ROOT / 'data/book-accuracy-gate-v1.json').read_text(encoding='utf-8'))

assert LEDGER['schema'] == 1
assert LEDGER['bookId'] == 'mouldmaster-book'
assert LEDGER['policy'] == 'accuracy-overkill'
assert LEDGER['publicationEffect'] == 'none'
assert LEDGER['chapterPromotionAuthorized'] is False

required_chapters = {
    'safety-foundations', 'moisture-drying', 'thermal-history', 'vp-transfer',
    'clamp', 'hot-runners', 'warpage'
}
chapters = LEDGER['chapters']
assert {c['chapterId'] for c in chapters} == required_chapters

manifest_chapters = {
    c['id']: c
    for part in MANIFEST['parts']
    for c in part.get('chapters', [])
}
assert all(cid in manifest_chapters for cid in required_chapters)
assert not any(manifest_chapters[cid].get('state') == 'verified' for cid in required_chapters)

allowed = set(LEDGER['conclusionVocabulary'])
source_currency = {s['id']: s for s in LEDGER['sourceCurrency']}
claim_ids = set()
counts = {key: 0 for key in allowed}
claim_count = 0

for chapter in chapters:
    assert chapter['promotionDisposition'] != 'verified'
    assert chapter.get('riskClass')
    assert chapter.get('claims')
    for claim in chapter['claims']:
        claim_count += 1
        cid = claim['claimId']
        assert cid not in claim_ids, f'duplicate claim id: {cid}'
        claim_ids.add(cid)
        for key in ['section','claimClass','claim','applicability','exclusions','evidence','conclusion','basis']:
            assert key in claim, f'missing {key}: {cid}'
        assert claim['section'].strip() and claim['claim'].strip()
        assert claim['applicability'].strip() and claim['exclusions'].strip()
        conclusion = claim['conclusion']
        assert conclusion in allowed
        counts[conclusion] += 1
        if conclusion in {'supported','qualified'}:
            assert claim['evidence'], f'{conclusion} claim requires evidence: {cid}'
        for source_id in claim['evidence']:
            assert source_id in source_currency, f'unregistered claim evidence: {cid} -> {source_id}'
            src = source_currency[source_id]
            assert src.get('checked') == '2026-09-14'
            assert src.get('state') and src.get('scope')
        if conclusion == 'hold':
            assert claim['basis'].strip(), f'hold claim missing blocking reason: {cid}'

summary = LEDGER['summary']
assert summary['chaptersReviewed'] == len(chapters) == 7
assert summary['claimsReviewed'] == claim_count == 20
for key in ['supported','qualified','conflicting','hold']:
    assert summary[key] == counts[key], f'summary mismatch: {key}'
assert summary['chaptersPromoted'] == 0
assert counts['hold'] > 0, 'high-risk review must preserve unresolved blocking claims'

# Overkill gate must continue to prohibit chapter verification while this first-pass ledger has holds.
assert GATE['verifiedChapterCountAuthorizedByThisGate'] == 0
assert GATE['currentBookDisposition'] == 'technical-review-only'
assert not any(c.get('state') == 'verified' for c in manifest_chapters.values())

print(f"PASS: high-risk claim ledger reviewed {claim_count} claims across {len(chapters)} chapters; {counts['hold']} remain HOLD and 0 chapters promoted")
