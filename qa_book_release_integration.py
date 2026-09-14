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
ENRICHMENT_SOURCE = ROOT / 'data/book-evidence-enrichment-v1.json'
ENRICHMENT_PACKAGED = PACKAGED_ROOT / 'book-evidence-enrichment-v1.json'

runtime_manifest = json.loads(MANIFEST_PATH.read_text(encoding='utf-8'))
sw = SW_PATH.read_text(encoding='utf-8')
desktop = json.loads(DESKTOP_PACKAGE.read_text(encoding='utf-8'))
integrity = INTEGRITY_SCRIPT.read_text(encoding='utf-8')
book_runtime = PACKAGED_RUNTIME.read_text(encoding='utf-8')
source_runtime = SOURCE_RUNTIME.read_text(encoding='utf-8')
authorization = json.loads(AUTH_SOURCE.read_text(encoding='utf-8'))
enrichment = json.loads(ENRICHMENT_SOURCE.read_text(encoding='utf-8'))

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

# Evidence enrichment is governed as a source/runtime byte pair, but is deliberately
# not folded into the existing 2026.09.14.4 physical-device cache generation. Doing
# that without a new cache identity would mutate bytes visible to the old generation.
assert ENRICHMENT_SOURCE.read_bytes() == ENRICHMENT_PACKAGED.read_bytes(), 'Book evidence enrichment source/runtime pair drifted'
enrichment_asset = './src/domains/learning/book-data/book-evidence-enrichment-v1.json'
release_version = json.loads((ROOT / 'version.json').read_text(encoding='utf-8'))['web_release']
assert release_version == '2026.09.15.1', f'unexpected Book enrichment candidate release: {release_version}'
assert f"const CACHE_VERSION='{release_version}';" in sw, 'Book enrichment cache generation is not bound to the new web release'
assert enrichment_asset in sw, 'Book evidence enrichment is missing from the new offline cache generation'

assert runtime_asset in sw, 'Book runtime not in atomic offline cache'
assert "const BOOK_DATA='./src/domains/learning/book-data/';" in book_runtime
assert "const AUTH_PATH=`${BOOK_DATA}book-publication-authorization-v1.json`;" in book_runtime
assert "const ENRICHMENT_PATH=`${BOOK_DATA}book-evidence-enrichment-v1.json`;" in book_runtime
assert "const AUTH_PATH='./data/book-publication-authorization-v1.json';" in source_runtime
assert "const ENRICHMENT_PATH='./data/book-evidence-enrichment-v1.json';" in source_runtime
for runtime in (source_runtime, book_runtime):
    assert 'function applyPublicationAuthorization(data,declared,auth)' in runtime
    assert 'function applyTechnicalReviewEnrichment(data,declared,sourceMap,patch)' in runtime
    assert "if(auth.status!=='authorized')return;" in runtime
    assert "if(auth?.governanceSnapshot?.manifestVersion!==data.version)throw new Error('Book publication authorization manifest version mismatch')" in runtime
    assert "snapshot.supported!==116" in runtime and "snapshot.qualified!==21" in runtime
    assert "snapshot.hold!==0" in runtime and "snapshot.conflicting!==0" in runtime
    assert "if(ids.length!==declared.size||new Set(ids).size!==ids.length)" in runtime
    assert runtime.count("chapter.state='verified'") == 1, 'runtime verification assignment must exist only inside governed authorization application'
    assert "chapter.state='technical-review';" in runtime, 'enriched chapters must be explicitly downgraded to technical review'
    assert "const effectiveState=authored.state||(batch.status==='technical-review'?" in runtime
    assert "if(effectiveState==='verified')throw new Error(`Authored draft cannot self-promote to verified:" in runtime
    assert 'const enrichment=await json(ENRICHMENT_PATH);' in runtime
    assert 'applyTechnicalReviewEnrichment(data,declared,sourceMap,enrichment);' in runtime
    assert runtime.index('applyPublicationAuthorization(data,declared,auth);') < runtime.index('applyTechnicalReviewEnrichment(data,declared,sourceMap,enrichment);'), 'enrichment must run after legacy authorization so changed chapters fail closed to technical review'
    assert 'getPublicationAuthorization:()=>publicationAuthorization' in runtime
    assert "chapter.state==='verified'" in runtime
    assert 'style=' not in runtime, 'Book runtime reintroduced inline style attributes'
    assert 'window.MMBook=' in runtime

# The enrichment patch is additive and explicitly non-authorizing.
assert enrichment['schema'] == 1 and enrichment['bookId'] == 'mouldmaster-book'
assert enrichment['patchId'] == 'book-evidence-enrichment-2026-09-15-v1'
assert enrichment['status'] == 'technical-review'
assert str(enrichment.get('reviewBoundary', '')).strip()
review_ids = enrichment.get('reviewChapterIds', [])
expected_review_ids = {
    'mould-anatomy', 'cooling', 'hot-runners', 'black-specks', 'pressure-loss',
    'warpage', 'process-window', 'documentation', 'process-monitoring', 'multi-cavity'
}
assert len(review_ids) == 10 and len(set(review_ids)) == 10
assert set(review_ids) == expected_review_ids
patches = enrichment.get('chapterPatches', [])
patch_ids = [x.get('chapterId') for x in patches]
expected_patch_ids = {
    'hot-runners', 'black-specks', 'pressure-loss', 'warpage', 'process-window',
    'documentation', 'process-monitoring', 'multi-cavity'
}
assert len(patch_ids) == 8 and len(set(patch_ids)) == 8
assert set(patch_ids) == expected_patch_ids
assert set(patch_ids).issubset(set(review_ids))
assert expected_review_ids - set(patch_ids) == {'mould-anatomy', 'cooling'}, 'only already-authored first-batch chapters may be gated without overlay sections'

source_seed_ids = [x.get('id') for x in enrichment.get('sourceSeeds', [])]
assert len(source_seed_ids) == len(set(source_seed_ids)) and all(source_seed_ids)
for source in enrichment.get('sourceSeeds', []):
    assert source.get('title') and str(source.get('url', '')).startswith('https://') and source.get('scope')
for patch in patches:
    assert patch.get('chapterId') in expected_review_ids
    assert isinstance(patch.get('sourceIds', []), list)
    sections = patch.get('sections', [])
    assert sections and all(str(x.get('title', '')).strip() and str(x.get('text', '')).strip() for x in sections)
    titles = [x['title'] for x in sections]
    assert len(titles) == len(set(titles)), f'duplicate enrichment section title in {patch["chapterId"]}'

# Publication authorization itself remains the prior, complete release decision. It
# may still verify the unchanged legacy Book, but enrichment is applied afterward and
# therefore cannot inherit this authorization.
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

# Read/listen publication parity: both surfaces render verified chapters through
# one governed renderer. Listening may use device TTS, but may not maintain a second
# copy of technical teaching text.
assert 'function verifiedChapterHtml(chapter)' in book_runtime, 'missing shared verified-chapter renderer'
assert "if(chapter.state==='verified')ui.reader.innerHTML=`${back}${verifiedChapterHtml(chapter)}`" in book_runtime, 'Read mode bypasses shared verified renderer'
assert "verified.map(verifiedChapterHtml).join('')" in book_runtime, 'Listen mode does not use the shared verified renderer'
assert "ui.listen.addEventListener('click',startVerifiedListening)" in book_runtime, 'verified Book listen control has no handler'
assert 'window.MMReadAloud' in book_runtime and 'reader.refresh?.()' in book_runtime, 'Book listening does not hand the governed surface to Read Aloud'
assert 'data-mm-read="play"' in book_runtime, 'Book listening cannot invoke the existing device speech control'

# Desktop already packages src/domains as one governed resource tree. The enrichment
# pair therefore ships with a future desktop release once a deliberate release identity
# is chosen; the integrity scanner covers the directory rather than a hand-maintained list.
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
assert expected_review_ids.issubset(manifest_ids)

print('PASS: governed Book data/runtime pairs remain aligned and legacy publication authorization remains intact.')
print('PASS: evidence enrichment is additive, source-traceable, and all 10 touched chapters are forced back to technical review after legacy authorization.')
print('PASS: 2026.09.14.4 remains the historical candidate; 2026.09.15.1 is the new enrichment technical-review cache generation and still requires a separate publication decision.')
