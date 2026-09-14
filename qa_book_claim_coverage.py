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
audit = load('data/book-verification-audit-all-v1.json')
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
    'data/book-claim-resolution-all-v1.json',
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
assert sum(counts.values()) == 137
assert counts['supported'] == 74, counts
assert counts['qualified'] == 63, counts
assert counts['hold'] == 0, counts
assert counts['conflicting'] == 0, counts

all_resolution = resolutions[-1]
expected_counts = {
    'chapters': 46,
    'claims': 137,
    'supported': 74,
    'qualified': 63,
    'hold': 0,
    'conflicting': 0,
}
assert all_resolution.get('reviewScope') == 'all-46-chapters-all-137-claims'
assert all_resolution.get('effectiveCountsAfterAllResolutions') == expected_counts
assert all_resolution.get('publicationBoundary', {}).get('verifiedChaptersAuthorized') == 0

# Recount the two historical ledgers whose stored summary objects were found to be stale.
review_by_scope = {r['reviewScope']: r for r in reviews}
corrections = {x['ledger']: x for x in all_resolution.get('auditCorrections', [])}
for filename, scope in [
    ('book-claim-review-foundations-materials-machine-v1.json', 'remaining-foundations-materials-machine'),
    ('book-claim-review-troubleshooting-v1.json', 'troubleshooting-excluding-warpage'),
]:
    review = review_by_scope[scope]
    raw = Counter(c['conclusion'] for ch in review['chapters'] for c in ch['claims'])
    correction = corrections[filename]
    assert correction['storedSummary'] != correction['recountFromClaimRecords'], f'{filename} correction must document a real mismatch'
    assert correction['recountFromClaimRecords'] == {
        'claims': sum(raw.values()),
        'supported': raw['supported'],
        'qualified': raw['qualified'],
        'hold': raw['hold'],
        'conflicting': raw['conflicting'],
    }

# The all-chapter audit must enumerate exactly the same 46 chapters as the manifest.
audit_ids = [cid for part in audit.get('parts', []) for cid in part.get('chapters', [])]
assert audit.get('scope', {}).get('chapters') == 46
assert audit.get('scope', {}).get('claims') == 137
assert len(audit_ids) == 46 and len(set(audit_ids)) == 46
assert set(audit_ids) == manifest_ids
assert audit.get('effectiveClaimDisposition') == {
    'supported': 74,
    'qualified': 63,
    'hold': 0,
    'conflicting': 0,
    'rule': 'Qualified claims remain scoped by their applicability, exclusions and evidence basis; qualified does not mean universal.',
}
publication = audit.get('publicationDecision', {})
assert publication.get('evidenceReviewComplete') is True
assert publication.get('claimLevelEvidenceBlockersRemaining') == 0
assert publication.get('claimLevelConflictsRemaining') == 0
assert publication.get('chaptersReadyForExplicitPromotionReview') == 46
assert publication.get('chaptersAutomaticallyVerified') == 0
assert publication.get('currentBookDisposition') == 'technical-review-only'

print('PASS: 46/46 Book chapters have claim-level review coverage; 137 claims inventoried; 0 chapters self-promoted.')
print('PASS: all effective claim evidence blockers cleared without publication self-promotion.')
print('PASS: historical summary-count drift is governed by explicit recount records; all-chapter audit matches the manifest.')
print(f"PASS: effective claim dispositions: supported={counts['supported']}, qualified={counts['qualified']}, hold={counts['hold']}, conflicting={counts['conflicting']}.")
