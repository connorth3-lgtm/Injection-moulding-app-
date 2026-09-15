#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MANIFEST_PATH = ROOT / 'runtime-domain-manifest.json'
SW_PATH = ROOT / 'service-worker.js'
DESKTOP_PACKAGE = ROOT / 'desktop/electron/package.json'
INTEGRITY_SCRIPT = ROOT / 'desktop/electron/scripts/generate-integrity.cjs'
PACKAGED_ROOT = ROOT / 'src/domains/learning/book-data'
PACKAGED_RUNTIME = ROOT / 'src/domains/learning/book-runtime.js'
SOURCE_RUNTIME = ROOT / 'book-runtime.js'
AUTH_SOURCE = ROOT / 'data/book-publication-authorization-v1.json'
SME_SOURCE = ROOT / 'data/book-sme-review-v1.json'
QUAL_SOURCE = ROOT / 'data/book-qualification-resolution-all-v1.json'
HIGH_RISK_SOURCE = ROOT / 'data/book-claim-resolution-high-risk-v1.json'

runtime_manifest = json.loads(MANIFEST_PATH.read_text(encoding='utf-8'))
sw = SW_PATH.read_text(encoding='utf-8')
desktop = json.loads(DESKTOP_PACKAGE.read_text(encoding='utf-8'))
integrity = INTEGRITY_SCRIPT.read_text(encoding='utf-8')
book_runtime = PACKAGED_RUNTIME.read_text(encoding='utf-8')
source_runtime = SOURCE_RUNTIME.read_text(encoding='utf-8')
authorization = json.loads(AUTH_SOURCE.read_text(encoding='utf-8'))
book_sme = json.loads(SME_SOURCE.read_text(encoding='utf-8'))
qualification = json.loads(QUAL_SOURCE.read_text(encoding='utf-8'))
high_risk = json.loads(HIGH_RISK_SOURCE.read_text(encoding='utf-8'))

book_data = [
    'book-manifest-v1.json',
    'book-publication-authorization-v1.json',
    'book-sme-review-v1.json',
    'book-qualification-resolution-all-v1.json',
    'book-claim-resolution-high-risk-v1.json',
    'book-authored-foundations-v1.json',
    'book-evidence-registry-v1.json',
    'book-chapters-materials-machine-v1.json',
    'book-authored-remaining-v1.json',
]

runtime_asset = './src/domains/learning/book-runtime.js'
assert runtime_asset in runtime_manifest['assets']
assert runtime_manifest['dataAssets'] == ['./material-catalog-v1.json'], 'Book integration must not widen canonical material dataAssets'
for name in book_data:
    packaged = f'./src/domains/learning/book-data/{name}'
    assert packaged in sw, f'Book data not in atomic offline cache: {packaged}'
    source = ROOT / 'data' / name
    target = PACKAGED_ROOT / name
    assert source.read_bytes() == target.read_bytes(), f'packaged Book data drifted from governed source: {name}'

assert book_sme.get('schemaVersion') == 1 and book_sme.get('bookId') == 'mouldmaster-book'
assert len(book_sme.get('chapterIds', [])) == 46 and len(set(book_sme.get('chapterIds', []))) == 46
assert isinstance(book_sme.get('reviews'), list)
approved_sme = {r.get('chapterId') for r in book_sme['reviews'] if r.get('conclusion') == 'approved'}
assert approved_sme <= set(book_sme['chapterIds'])
if book_sme.get('status') == 'validated':
    assert len(approved_sme) == 46, 'Book SME status cannot be validated without 46 approved chapter reviews'

assert qualification['schema'] == 1 and qualification['bookId'] == 'mouldmaster-book'
assert qualification['effectiveCountsAfterQualificationReview'] == {'chapters':46,'claims':137,'supported':116,'qualified':21,'hold':0,'conflicting':0}
assert len(qualification['remainingQualifiedClaims']) == 21
assert high_risk['schema'] == 1 and high_risk['bookId'] == 'mouldmaster-book'
high_risk_sources = {x['id']: x for x in high_risk.get('newEvidence', [])}
for evidence_id in ('HUSKY-SCVG-HOT-SPRUE-SERVICE-2024','MOLD-MASTERS-HOT-RUNNER-USER-MANUAL-2020'):
    assert evidence_id in high_risk_sources and high_risk_sources[evidence_id].get('url'), f'missing learner-linkable high-risk evidence: {evidence_id}'
hot_runner_trace = next(x for x in qualification['resolutions'] if x.get('claimId') == 'hot-runners-01')
assert set(hot_runner_trace['evidence']) >= {'HUSKY-SCVG-HOT-SPRUE-SERVICE-2024','MOLD-MASTERS-HOT-RUNNER-USER-MANUAL-2020'}

assert runtime_asset in sw, 'Book runtime not in atomic offline cache'
assert "const BOOK_DATA='./src/domains/learning/book-data/';" in book_runtime
assert "const AUTH_PATH=`${BOOK_DATA}book-publication-authorization-v1.json`;" in book_runtime
assert "const SME_PATH=`${BOOK_DATA}book-sme-review-v1.json`;" in book_runtime
assert "const QUAL_PATH=`${BOOK_DATA}book-qualification-resolution-all-v1.json`;" in book_runtime
assert "const HIGH_RISK_PATH=`${BOOK_DATA}book-claim-resolution-high-risk-v1.json`;" in book_runtime
assert "const AUTH_PATH='./data/book-publication-authorization-v1.json';" in source_runtime
assert "const SME_PATH='./data/book-sme-review-v1.json';" in source_runtime
assert "const QUAL_PATH='./data/book-qualification-resolution-all-v1.json';" in source_runtime
for runtime in (source_runtime, book_runtime):
    assert 'function applyPublicationAuthorization(data,declared,auth)' in runtime
    assert 'function validateSmeReview(data,declared)' in runtime
    assert 'function validateQualificationReview(data)' in runtime
    assert 'function smeStatusText()' in runtime
    assert 'function claimTraceHtml(chapter)' in runtime
    assert 'function evidenceItem(id)' in runtime
    assert 'Publication claim trace' in runtime
    assert 'why this wording was authorized' in runtime
    assert 'target="_blank" rel="noopener"' in runtime
    assert "if(auth.status!=='authorized')return;" in runtime
    assert "snapshot.supported!==116" in runtime and "snapshot.qualified!==21" in runtime
    assert "snapshot.hold!==0" in runtime and "snapshot.conflicting!==0" in runtime
    assert "if(ids.length!==declared.size||new Set(ids).size!==ids.length)" in runtime
    assert runtime.count("chapter.state='verified'") == 1, 'runtime verification assignment must exist only inside governed authorization application'
    assert "const effectiveState=authored.state||(batch.status==='technical-review'?" in runtime
    assert "if(effectiveState==='verified')throw new Error(`Authored draft cannot self-promote to verified:" in runtime
    assert 'getPublicationAuthorization:()=>publicationAuthorization' in runtime
    assert 'getSmeReview:()=>bookSmeReview' in runtime
    assert 'getQualificationReview:()=>qualificationReview' in runtime
    assert "chapter.state==='verified'" in runtime
    assert 'style=' not in runtime, 'Book runtime reintroduced inline style attributes'
    assert 'window.MMBook=' in runtime
    assert "verified:'Evidence verified'" in runtime
    assert '<span class="eyebrow">Evidence verified</span>' in runtime
    assert 'evidence verification does not imply independent human SME approval' in runtime
    assert 'Independent human SME review:' in runtime and 'chapters approved.' in runtime
    assert 'status unavailable — do not infer approval' in runtime
    assert 'physical-device validation' in runtime and 'learner-outcome validation' in runtime
    assert "verified:'Verified'" not in runtime

assert authorization['schema'] == 1 and authorization['bookId'] == 'mouldmaster-book'
assert authorization['status'] == 'authorized'
assert authorization['authorizationType'] == 'governed-book-publication'
assert authorization['publicationScope'] == 'generic-evidence-governed-reference'
snapshot = authorization['governanceSnapshot']
assert snapshot == {
    'manifestVersion': '2026.09.14.1','verificationAuditVersion': '2026.09.14.5-audit','qualificationResolutionVersion': '2026.09.14.5-audit','parts': 8,'chapters': 46,'claims': 137,'supported': 116,'qualified': 21,'hold': 0,'conflicting': 0,'scopeQualifiedClaimsBlockingPublication': 0,'sourceCurrencyChecked': '2026-09-14',
}
assert authorization['authorizationBasis']['releaseQaConclusion'] == 'success'
assert authorization['authorizationBasis']['releaseQaRun'] == 34799571637
assert authorization['authorizationBasis']['sourceRevision'] == '7ef28bd8b02994223e320fda64e99808357d3219'
assert len(authorization.get('publicationBoundaries', [])) >= 5
assert authorization.get('revocationRules', {}).get('claimHoldOrConflict') == 'block-release'
assert authorization.get('revocationRules', {}).get('readListenTextDivergence') == 'block-release'
assert authorization.get('revocationRules', {}).get('manifestOrAuthorizationIdentityMismatch') == 'fail-closed-runtime'

assert 'function verifiedChapterHtml(chapter)' in book_runtime
assert "if(chapter.state==='verified')ui.reader.innerHTML=`${back}${verifiedChapterHtml(chapter)}`" in book_runtime
assert "verified.map(verifiedChapterHtml).join('')" in book_runtime
assert "ui.listen.addEventListener('click',startVerifiedListening)" in book_runtime
assert 'window.MMReadAloud' in book_runtime and 'reader.refresh?.()' in book_runtime
assert 'data-mm-read="play"' in book_runtime

extra = desktop['build']['extraResources']
assert any(x.get('from') == '../../src/domains' and x.get('to') == 'mouldmaster/src/domains' for x in extra)
assert "'src/domains/learning/book-data'" in integrity
assert 'STATIC_DATA_DIRS.flatMap(filesUnder)' in integrity
assert 'runtimeManifest.assets' in integrity and 'runtimeManifest.dataAssets' in integrity

source_manifest = json.loads((ROOT / 'data/book-manifest-v1.json').read_text(encoding='utf-8'))
chapters = [c for p in source_manifest['parts'] for c in p.get('chapters', [])]
manifest_ids = {c['id'] for c in chapters}
assert len(chapters) == 46
assert not any(c.get('state') == 'verified' for c in chapters)
authorized_ids = authorization['authorizedChapterIds']
assert len(authorized_ids) == 46 and len(set(authorized_ids)) == 46
assert set(authorized_ids) == manifest_ids
assert set(book_sme['chapterIds']) == manifest_ids

print('PASS: Book runtime/data/publication authorization, claim provenance and SME status are registered for offline and desktop use.')
print('PASS: authorization remains the only runtime promotion path; source state is immutable and fail-closed.')
print('PASS: readers can inspect clickable source anchors plus effective claim evidence/qualification reasons without implying independent SME approval.')
