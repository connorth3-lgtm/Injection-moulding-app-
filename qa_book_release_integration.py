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

runtime_manifest = json.loads(MANIFEST_PATH.read_text(encoding='utf-8'))
sw = SW_PATH.read_text(encoding='utf-8')
desktop = json.loads(DESKTOP_PACKAGE.read_text(encoding='utf-8'))
integrity = INTEGRITY_SCRIPT.read_text(encoding='utf-8')
book_runtime = PACKAGED_RUNTIME.read_text(encoding='utf-8')
source_runtime = SOURCE_RUNTIME.read_text(encoding='utf-8')
authorization = json.loads(AUTH_SOURCE.read_text(encoding='utf-8'))
book_sme = json.loads(SME_SOURCE.read_text(encoding='utf-8'))

book_data = [
    'book-manifest-v1.json',
    'book-publication-authorization-v1.json',
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

# Independent SME evidence is packaged with the desktop/domain tree for truthful status display.
# It is intentionally optional at runtime so an uncached web/offline session fails to "status unavailable"
# rather than hiding the Book or inferring approval.
sme_target = PACKAGED_ROOT / 'book-sme-review-v1.json'
assert sme_target.exists(), 'packaged Book SME review contract is missing'
assert SME_SOURCE.read_bytes() == sme_target.read_bytes(), 'packaged Book SME review contract drifted from governed source'
assert book_sme.get('schemaVersion') == 1 and book_sme.get('bookId') == 'mouldmaster-book'
assert len(book_sme.get('chapterIds', [])) == 46 and len(set(book_sme.get('chapterIds', []))) == 46
assert isinstance(book_sme.get('reviews'), list)
approved_sme = {r.get('chapterId') for r in book_sme['reviews'] if r.get('conclusion') == 'approved'}
assert approved_sme <= set(book_sme['chapterIds'])
if book_sme.get('status') == 'validated':
    assert len(approved_sme) == 46, 'Book SME status cannot be validated without 46 approved chapter reviews'

assert runtime_asset in sw, 'Book runtime not in atomic offline cache'
assert "const BOOK_DATA='./src/domains/learning/book-data/';" in book_runtime
assert "const AUTH_PATH=`${BOOK_DATA}book-publication-authorization-v1.json`;" in book_runtime
assert "const SME_PATH=`${BOOK_DATA}book-sme-review-v1.json`;" in book_runtime
assert "const AUTH_PATH='./data/book-publication-authorization-v1.json';" in source_runtime
assert "const SME_PATH='./data/book-sme-review-v1.json';" in source_runtime
for runtime in (source_runtime, book_runtime):
    assert 'function applyPublicationAuthorization(data,declared,auth)' in runtime
    assert 'function validateSmeReview(data,declared)' in runtime
    assert 'function smeStatusText()' in runtime
    assert "if(auth.status!=='authorized')return;" in runtime
    assert "if(auth?.governanceSnapshot?.manifestVersion!==data.version)throw new Error('Book publication authorization manifest version mismatch')" in runtime
    assert "snapshot.supported!==116" in runtime and "snapshot.qualified!==21" in runtime
    assert "snapshot.hold!==0" in runtime and "snapshot.conflicting!==0" in runtime
    assert "if(ids.length!==declared.size||new Set(ids).size!==ids.length)" in runtime
    assert runtime.count("chapter.state='verified'") == 1, 'runtime verification assignment must exist only inside governed authorization application'
    assert "const effectiveState=authored.state||(batch.status==='technical-review'?" in runtime
    assert "if(effectiveState==='verified')throw new Error(`Authored draft cannot self-promote to verified:" in runtime
    assert 'getPublicationAuthorization:()=>publicationAuthorization' in runtime
    assert 'getSmeReview:()=>bookSmeReview' in runtime
    assert "chapter.state==='verified'" in runtime
    assert 'style=' not in runtime, 'Book runtime reintroduced inline style attributes'
    assert 'window.MMBook=' in runtime
    assert "verified:'Evidence verified'" in runtime, 'learner-facing Book state must distinguish evidence verification from independent external validation'
    assert '<span class="eyebrow">Evidence verified</span>' in runtime, 'verified chapter eyebrow must say Evidence verified'
    assert 'evidence verification does not imply independent human SME approval' in runtime, 'Book must disclose the independent SME boundary'
    assert 'Independent human SME review:' in runtime and 'chapters approved.' in runtime, 'Book must surface independent SME review coverage'
    assert 'status unavailable — do not infer approval' in runtime, 'SME status load failure must fail safe rather than infer approval'
    assert 'physical-device validation' in runtime and 'learner-outcome validation' in runtime, 'Book must disclose separate physical/learner external-validation gates'
    assert "verified:'Verified'" not in runtime, 'bare Verified learner-facing state reintroduces assurance ambiguity'

# Publication authorization itself must be a complete, explicit release decision.
assert authorization['schema'] == 1 and authorization['bookId'] == 'mouldmaster-book'
assert authorization['status'] == 'authorized'
assert authorization['authorizationType'] == 'governed-book-publication'
assert authorization['publicationScope'] == 'generic-evidence-governed-reference'
snapshot = authorization['governanceSnapshot']
assert snapshot == {
    'manifestVersion': '2026.09.14.1',
    'verificationAuditVersion': '2026.09.14.5-audit',
    'qualificationResolutionVersion': '2026.09.14.5-audit',
    'parts': 8,
    'chapters': 46,
    'claims': 137,
    'supported': 116,
    'qualified': 21,
    'hold': 0,
    'conflicting': 0,
    'scopeQualifiedClaimsBlockingPublication': 0,
    'sourceCurrencyChecked': '2026-09-14',
}
assert authorization['authorizationBasis']['releaseQaConclusion'] == 'success'
assert authorization['authorizationBasis']['releaseQaRun'] == 34799571637
assert authorization['authorizationBasis']['sourceRevision'] == '7ef28bd8b02994223e320fda64e99808357d3219'
assert len(authorization.get('publicationBoundaries', [])) >= 5
assert authorization.get('revocationRules', {}).get('claimHoldOrConflict') == 'block-release'
assert authorization.get('revocationRules', {}).get('readListenTextDivergence') == 'block-release'
assert authorization.get('revocationRules', {}).get('manifestOrAuthorizationIdentityMismatch') == 'fail-closed-runtime'

# Read/listen publication parity: both surfaces render evidence-verified chapters through
# one governed renderer. Listening may use device TTS, but may not maintain a second
# copy of technical teaching text.
assert 'function verifiedChapterHtml(chapter)' in book_runtime, 'missing shared verified-chapter renderer'
assert "if(chapter.state==='verified')ui.reader.innerHTML=`${back}${verifiedChapterHtml(chapter)}`" in book_runtime, 'Read mode bypasses shared verified renderer'
assert "verified.map(verifiedChapterHtml).join('')" in book_runtime, 'Listen mode does not use the shared verified renderer'
assert "ui.listen.addEventListener('click',startVerifiedListening)" in book_runtime, 'evidence-verified Book listen control has no handler'
assert 'window.MMReadAloud' in book_runtime and 'reader.refresh?.()' in book_runtime, 'Book listening does not hand the governed surface to Read Aloud'
assert 'data-mm-read="play"' in book_runtime, 'Book listening cannot invoke the existing device speech control'

# Desktop already packages src/domains as one governed resource tree.
extra = desktop['build']['extraResources']
assert any(x.get('from') == '../../src/domains' and x.get('to') == 'mouldmaster/src/domains' for x in extra)
assert "'src/domains/learning/book-data'" in integrity, 'desktop integrity scanner does not include governed Book data'
assert 'STATIC_DATA_DIRS.flatMap(filesUnder)' in integrity
assert 'runtimeManifest.assets' in integrity and 'runtimeManifest.dataAssets' in integrity

# Source manuscript state remains immutable; authorization is an overlay, never a draft edit.
source_manifest = json.loads((ROOT / 'data/book-manifest-v1.json').read_text(encoding='utf-8'))
chapters = [c for p in source_manifest['parts'] for c in p.get('chapters', [])]
manifest_ids = {c['id'] for c in chapters}
assert len(chapters) == 46
assert not any(c.get('state') == 'verified' for c in chapters), 'source manifest must remain pre-authorization review state'
authorized_ids = authorization['authorizedChapterIds']
assert len(authorized_ids) == 46 and len(set(authorized_ids)) == 46
assert set(authorized_ids) == manifest_ids
assert set(book_sme['chapterIds']) == manifest_ids, 'SME review contract must cover the same governed Book chapters'

print('PASS: Book runtime/data/publication authorization are registered for domain loading, atomic web offline cache and desktop package/integrity inclusion.')
print('PASS: authorization is the only runtime promotion path; source authored/manifest state remains immutable and fail-closed.')
print('PASS: evidence-verified Book Read and Listen surfaces share one governed renderer and surface governed independent-SME coverage without inferring approval.')
