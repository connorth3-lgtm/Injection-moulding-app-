#!/usr/bin/env python3
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PACKAGED_ROOT = ROOT / 'src/domains/learning/book-data'
PACKAGED_RUNTIME = ROOT / 'src/domains/learning/book-runtime.js'
COMPAT_LOADER = ROOT / 'book-runtime.js'
AUTH_SOURCE = ROOT / 'data/book-publication-authorization-v1.json'
SME_SOURCE = ROOT / 'data/book-sme-review-v1.json'
QUAL_SOURCE = ROOT / 'data/book-qualification-resolution-all-v1.json'
HIGH_RISK_SOURCE = ROOT / 'data/book-claim-resolution-high-risk-v1.json'
HIGH_RISK_V2_SOURCE = ROOT / 'data/book-claim-resolution-high-risk-v2.json'
ENRICHMENT_SOURCE = ROOT / 'data/book-evidence-enrichment-v2.json'
MANIFEST_PATH = ROOT / 'runtime-domain-manifest.json'
SW_PATH = ROOT / 'service-worker.js'
INDEX_PATH = ROOT / 'index.html'
LEARNING_PACK = ROOT / 'src/domains/runtime-packs/learning-foundation-runtime-pack.js'
DESKTOP_PACKAGE = ROOT / 'desktop/electron/package.json'
INTEGRITY_SCRIPT = ROOT / 'desktop/electron/scripts/generate-integrity.cjs'
MATERIAL_CATALOG_SOURCE = ROOT / 'material-catalog-v1.json'
MATERIAL_REGIONAL_SOURCE = PACKAGED_ROOT / 'book-material-regional-evidence-v1.json'
MATERIAL_SEARCH_INDEX_SOURCE = ROOT / 'data/book-material-search-index-v1.json'
MATERIAL_SEARCH_INDEX_PACKAGED = PACKAGED_ROOT / 'book-material-search-index-v1.json'


def git_blob_sha(path: Path) -> str:
    data = path.read_bytes()
    return hashlib.sha1(f'blob {len(data)}\0'.encode() + data).hexdigest()


def need(ok, message):
    if not ok:
        raise AssertionError(message)


def normalize_search(value):
    import re
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9]+', ' ', str(value or '').lower())).strip()


runtime_manifest = json.loads(MANIFEST_PATH.read_text(encoding='utf-8'))
sw = SW_PATH.read_text(encoding='utf-8')
index = INDEX_PATH.read_text(encoding='utf-8')
learning_pack = LEARNING_PACK.read_text(encoding='utf-8')
book_runtime = PACKAGED_RUNTIME.read_text(encoding='utf-8')
compat_loader = COMPAT_LOADER.read_text(encoding='utf-8')
authorization = json.loads(AUTH_SOURCE.read_text(encoding='utf-8'))
book_sme = json.loads(SME_SOURCE.read_text(encoding='utf-8'))
qualification = json.loads(QUAL_SOURCE.read_text(encoding='utf-8'))
high_risk = json.loads(HIGH_RISK_SOURCE.read_text(encoding='utf-8'))
high_risk_v2 = json.loads(HIGH_RISK_V2_SOURCE.read_text(encoding='utf-8'))
enrichment = json.loads(ENRICHMENT_SOURCE.read_text(encoding='utf-8'))
desktop = json.loads(DESKTOP_PACKAGE.read_text(encoding='utf-8'))
integrity_script = INTEGRITY_SCRIPT.read_text(encoding='utf-8')

runtime_asset = './src/domains/learning/book-runtime.js'
need(runtime_asset in runtime_manifest['assets'], 'canonical Book runtime missing from domain manifest')
need(runtime_manifest['dataAssets'] == ['./material-catalog-v1.json'], 'Book integration must not widen canonical material dataAssets')
need(runtime_asset in sw, 'canonical Book runtime missing from atomic offline cache')

book_data = [
    'book-manifest-v1.json',
    'book-publication-authorization-v1.json',
    'book-sme-review-v1.json',
    'book-qualification-resolution-all-v1.json',
    'book-claim-resolution-high-risk-v1.json',
    'book-claim-resolution-high-risk-v2.json',
    'book-authored-foundations-v1.json',
    'book-evidence-registry-v1.json',
    'book-chapters-materials-machine-v1.json',
    'book-authored-remaining-v1.json',
    'book-worked-engineering-cases-v1.json',
    'book-evidence-enrichment-v2.json',
    'book-reader-architecture-v2.json',
    'book-editorial-expansion-review-v1.json',
    'book-material-grade-atlas-v1.json',
    'book-material-regional-evidence-v1.json',
    'book-material-search-index-v1.json',
]
for name in book_data:
    packaged = f'./src/domains/learning/book-data/{name}'
    need(packaged in sw, f'Book data not in atomic offline cache: {packaged}')
    source = ROOT / 'data' / name
    target = PACKAGED_ROOT / name
    if source.exists():
        need(source.read_bytes() == target.read_bytes(), f'packaged Book data drifted from governed source: {name}')

need((ROOT / 'data/asian-aus-nz-material-grade-extraction-wave2-v1.json').read_bytes() == (PACKAGED_ROOT / 'book-material-regional-evidence-v1.json').read_bytes(), 'packaged regional Book material evidence drifted from governed source wave')

# One canonical Book implementation: the legacy root path is now only a stable compatibility loader.
need("script.src='./src/domains/learning/book-runtime.js'" in compat_loader, 'root Book compatibility loader must delegate to canonical packaged runtime')
for forbidden in ("const AUTH_PATH='./data/", 'function showChapter(', 'function verifiedChapterHtml('):
    need(forbidden not in compat_loader, f'root Book path still contains a second implementation: {forbidden}')
need("script.src='./book-runtime.js'" in learning_pack, 'learning foundation must still reach the compatibility loader')
need(index.index('learning-foundation-runtime-pack.js') < index.index('shell-finalization-runtime-pack.js'), 'release script versioner must install before packed app-shell dynamic loaders execute')

# Every dynamically created same-origin script after the compatibility loader gets the current shell release query.
for marker in ('__MM_RELEASE_SCRIPT_VERSIONER__', 'HTMLScriptElement', 'versionScriptUrl', "url.searchParams.set('v',release)"):
    need(marker in compat_loader, f'dynamic release-versioning safeguard missing: {marker}')

# Canonical DOI/publisher links replace intermediary academic-discovery links in learner-facing Book surfaces.
canonical_links = {
    '24f22c3f6f355c0497be3aea21e1a1cc': 'https://doi.org/10.3390/polym17081096',
    'c82506ff62375c969e92b74a15c92c3c': 'https://doi.org/10.1007/s00170-024-12990-5',
    '87423bb5d6e15bcba62bfe49843785c7': 'https://doi.org/10.1007/s00170-022-08859-0',
    '4c976e13bbb957b0862288b2202429ee': 'https://doi.org/10.3390/s23031735',
    'c253cc9c68cd5db1b1afec5c98425d9d': 'https://doi.org/10.1007/s00170-024-13607-7',
}
for fingerprint, doi in canonical_links.items():
    need(fingerprint in compat_loader and doi in compat_loader, f'canonical academic evidence rewrite missing for {doi}')
need('https://doi.org/10.1007/s00170-024-12990-5' in HIGH_RISK_SOURCE.read_text(encoding='utf-8'), 'high-risk v1 must retain canonical fibre-orientation DOI')
need('consensus.app' not in HIGH_RISK_SOURCE.read_text(encoding='utf-8'), 'high-risk v1 must not retain intermediary academic URL')
need('https://doi.org/10.3390/polym17081096' in HIGH_RISK_V2_SOURCE.read_text(encoding='utf-8'), 'high-risk v2 must retain canonical switchover DOI')
need('consensus.app' not in HIGH_RISK_V2_SOURCE.read_text(encoding='utf-8'), 'high-risk v2 must not retain intermediary academic URL')
need(authorization.get('canonicalAcademicEvidenceUrls', {}).get('PARIZS-2023-IN-MOLD-SENSORS') == 'https://doi.org/10.3390/s23031735', 'authorization canonical academic evidence map missing')

# Authorization is now byte-bound to the exact served payloads that can influence publication promotion.
need(AUTH_SOURCE.read_bytes() == (PACKAGED_ROOT / 'book-publication-authorization-v1.json').read_bytes(), 'packaged authorization drifted from governed source')
need(MATERIAL_SEARCH_INDEX_SOURCE.read_bytes() == MATERIAL_SEARCH_INDEX_PACKAGED.read_bytes(), 'packaged Book material search index drifted from governed source')
need('./src/domains/learning/book-data/book-material-search-index-v1.json' in sw, 'Book material search index missing from atomic offline cache')
material_catalog = json.loads(MATERIAL_CATALOG_SOURCE.read_text(encoding='utf-8'))
material_regional = json.loads(MATERIAL_REGIONAL_SOURCE.read_text(encoding='utf-8'))
material_search_index = json.loads(MATERIAL_SEARCH_INDEX_SOURCE.read_text(encoding='utf-8'))
need(material_search_index.get('schemaVersion') == 1 and material_search_index.get('release') == '2026.10.04.3', 'Book material search index identity drift')
need(material_search_index.get('sourceCounts') == {'canonicalExactGrades':260,'regionalEvidenceRows':284,'total':544}, 'Book material search index source-count drift')
expected_search_entries = []
for grade in material_catalog.get('grades', []):
    expected_search_entries.append({
        'id': grade.get('id'),
        'search': normalize_search(' '.join(str(x) for x in [
            (grade.get('manufacturer') or {}).get('name'),
            grade.get('brand'),
            grade.get('grade'),
            *((grade.get('aliases') or [])),
            (grade.get('polymer') or {}).get('family'),
        ] if x)),
        'kind': 'canonical',
    })
for index, row in enumerate(material_regional.get('records', []), start=1):
    expected_search_entries.append({
        'id': f'regional-{index:03d}',
        'search': normalize_search(' '.join(str(x) for x in [
            row.get('manufacturer'),
            row.get('grade'),
            row.get('polymer'),
            row.get('manufacturerCountry'),
            row.get('region'),
            row.get('status'),
        ] if x)),
        'kind': 'regional',
    })
need(len(expected_search_entries) == 544, 'Book material search source coverage drift')
need(material_search_index.get('entries') == expected_search_entries, 'Book material search index drifted from canonical catalogue/regional evidence sources')
byte_contract = authorization.get('runtimeIntegrity') or {}
need(byte_contract.get('algorithm') == 'git-blob-sha1', 'Book runtime integrity algorithm missing')
sha_by_file = byte_contract.get('gitBlobSha1ByFile') or {}
required_integrity = {
    'book-manifest-v1.json', 'book-sme-review-v1.json', 'book-qualification-resolution-all-v1.json',
    'book-claim-resolution-high-risk-v1.json', 'book-authored-foundations-v1.json',
    'book-evidence-registry-v1.json', 'book-chapters-materials-machine-v1.json', 'book-authored-remaining-v1.json',
    'book-worked-engineering-cases-v1.json', 'book-engineering-diagrams-v1.json', 'book-evidence-enrichment-v2.json', 'book-reader-architecture-v2.json', 'book-editorial-expansion-review-v1.json', 'book-material-grade-atlas-v1.json',
    'book-material-regional-evidence-v1.json', 'material-catalog-v1.json',
}
need(required_integrity <= set(sha_by_file), f'Book byte-integrity coverage incomplete: {sorted(required_integrity - set(sha_by_file))}')
for name in required_integrity:
    path = ROOT / name if name == 'material-catalog-v1.json' else PACKAGED_ROOT / name
    need(sha_by_file[name] == git_blob_sha(path), f'Book byte-integrity Git object mismatch: {name}')
auth_blob = git_blob_sha(PACKAGED_ROOT / 'book-publication-authorization-v1.json')
need(f"const AUTH_GIT_BLOB_SHA1='{auth_blob}'" in book_runtime, 'canonical runtime is not pinned to exact authorization bytes')
for marker in ('gitBlobSha1', 'verifiedJson', 'validateIntegrityAuthorization', 'Book byte-integrity mismatch', 'WORKED_CASES_PATH', 'validateWorkedCases', 'workedCaseHtml', 'getWorkedCases', 'DIAGRAMS_PATH', 'validateEngineeringDiagrams', 'diagramHtml', 'getEngineeringDiagrams', 'ENRICHMENT_PATH', 'validateEvidenceEnrichment', 'getEvidenceEnrichment', 'MATERIAL_ATLAS_PATH', 'MATERIAL_REGIONAL_PATH', 'MATERIAL_CATALOG_PATH', 'MATERIAL_SEARCH_INDEX_PATH', 'MATERIAL_SEARCH_INDEX_GIT_BLOB_SHA1', 'validateMaterialAtlas', 'validateMaterialCatalog', 'validateMaterialRegionalEvidence', 'materialAtlasHtml', 'ensureManifest', 'ensureMaterialData', 'hydrateMaterialAtlas', 'coldMaterialSearchTerms', 'coldMaterialHit', 'MATERIAL_PAGE_SIZE=24', 'data-mm-book-material-more', 'getMaterialAtlas', 'getMaterialCatalog', 'getMaterialRegionalEvidence', 'READER_PATH', 'EDITORIAL_REVIEW_PATH', 'validateReaderArchitecture', 'validateEditorialExpansionReview', 'readerChapterHtml', 'readerLearningHtml', 'readerReferencesHtml', 'showReaderChapter', 'getReaderArchitecture', 'getEditorialExpansionReview'):
    need(marker in book_runtime, f'Book runtime exact-byte/lazy-load safeguard missing: {marker}')
load_manifest_block = book_runtime.split('async function loadManifest(){',1)[1].split('function failBook(',1)[0]
for forbidden in ('MATERIAL_ATLAS_PATH', 'MATERIAL_CATALOG_PATH', 'MATERIAL_REGIONAL_PATH', 'MATERIAL_SEARCH_INDEX_PATH'):
    need(forbidden not in load_manifest_block, f'heavy material payload must not load during core Book manifest initialization: {forbidden}')
need("async function init(){createUI();armBookSearch();return true;}" in book_runtime, 'Book shell must initialize without fetching governed Book payloads while retrying global-search binding')
need("if(!manifest){ui.summary.textContent='Loading governed Book content on demand…'" in book_runtime, 'Book open action must demand-load governed content')
need("materialSearchIndex={catalog:[],regional:[]}" in book_runtime, 'Book material search must use a precomputed normalized index')
search_block = book_runtime.split('function searchBook(query){',1)[1].split('async function appendBookSearchResults',1)[0]
need("JSON.stringify(row)" not in search_block, 'Book material search must not re-serialize all regional evidence rows on every query')
need("materialSearchIndex.regional.some" in search_block, 'Book material search must query the precomputed regional evidence index')
need("void ensureManifest().catch(()=>{})" in book_runtime, 'Book open must consume the controlled fail-closed manifest rejection')
need("async function coldMaterialSearchTerms()" in book_runtime and "verifiedJson(MATERIAL_SEARCH_INDEX_PATH,MATERIAL_SEARCH_INDEX_GIT_BLOB_SHA1)" in book_runtime, 'Book cold material discovery must use the exact-byte-pinned lightweight search index')
need("async function coldMaterialHit(query)" in book_runtime, 'Book global search must support cold canonical and regional material discovery')
need("counts.canonicalExactGrades!==260" in book_runtime and "counts.regionalEvidenceRows!==284" in book_runtime and "counts.total!==544" in book_runtime, 'Book cold search index must fail closed on coverage drift')
need("String(input.value||'').trim().toLowerCase()!==q" in book_runtime, 'Book async global search must reject stale query results')
need("function bindBookSearchInput()" in book_runtime and "event.target?.id==='globalSearch'" in book_runtime, 'Book global search must use delegated input integration that survives late doSearch replacement')
need("window.__MM_BOOK_SEARCH_INPUT_BOUND__=VERSION" in book_runtime, 'Book delegated global-search binding must be idempotent')
need("bindBookSearchInput();\n  window.MMBook=Object.freeze" in book_runtime, 'Book global-search listener must bind before MMBook becomes externally observable')
search_index_blob = git_blob_sha(PACKAGED_ROOT / 'book-material-search-index-v1.json')
need(f"const MATERIAL_SEARCH_INDEX_GIT_BLOB_SHA1='{search_index_blob}'" in book_runtime, 'Book material search index is not pinned to exact bytes')
need("auth?.authorizationBasis?.sourceRevision!=='7ef28bd8b02994223e320fda64e99808357d3219'" in book_runtime, 'runtime no longer enforces reviewed source revision')

# Publication/SME/qualification boundaries remain fail-closed and unchanged in meaning.
need(book_sme.get('status') == 'hold' and book_sme.get('reviews') == [], 'independent Book SME HOLD must not be manufactured by hardening')
current_web_release=json.loads((ROOT / 'version.json').read_text(encoding='utf-8')).get('web_release')
need(isinstance(book_sme.get('release'),str) and book_sme.get('release') <= current_web_release, 'Book SME evidence cannot target a future learner release')
need(book_sme.get('release') == enrichment.get('release'), 'Book SME and evidence-enrichment review scope must remain bound to the same content release')
need(len(book_sme.get('workedCaseIds', [])) == 24 and len(set(book_sme.get('workedCaseIds', []))) == 24, 'Book SME worked-case review scope is incomplete')
need(len(book_sme.get('enrichmentChapterIds', [])) == 10 and len(set(book_sme.get('enrichmentChapterIds', []))) == 10, 'Book SME evidence-enrichment review scope is incomplete')
need(len(book_sme.get('diagramIds', [])) == 18 and len(set(book_sme.get('diagramIds', []))) == 18, 'Book SME diagram review scope is incomplete')
need(len(book_sme.get('chapterIds', [])) == 46 and len(set(book_sme['chapterIds'])) == 46, 'Book SME chapter coverage drift')
need(qualification['effectiveCountsAfterQualificationReview'] == {'chapters':46,'claims':137,'supported':116,'qualified':21,'hold':0,'conflicting':0}, 'qualification counts drift')
need(authorization['status'] == 'authorized' and authorization['authorizationType'] == 'governed-book-publication', 'publication authorization identity drift')
need(authorization.get('revocationRules', {}).get('runtimeByteIntegrityMismatch') == 'fail-closed-runtime', 'runtime byte mismatch must revoke publication at runtime')
need(authorization.get('revocationRules', {}).get('evidenceEnrichmentLedgerOrEvidenceMismatch') == 'fail-closed-runtime', 'evidence-enrichment mismatch must fail closed at runtime')
need(authorization.get('revocationRules', {}).get('diagramLedgerOrAssetMismatch') == 'fail-closed-runtime', 'diagram ledger/asset mismatch must fail closed at runtime')
reader_auth=authorization.get('readerArchitectureAuthorization') or {}
need(reader_auth.get('status')=='authorized-derived-structure' and reader_auth.get('readerChapterCount')==20 and reader_auth.get('governedModuleCount')==46 and reader_auth.get('noNewTechnicalClaims') is True and reader_auth.get('independentSmeStatus')=='hold', 'reader architecture authorization boundary drift')
editorial_auth=authorization.get('editorialExpansionAuthorization') or {}
need(editorial_auth.get('status')=='authorized-repository-technical-source-review' and editorial_auth.get('moduleCount')==37 and editorial_auth.get('noNewClaimIds') is True and editorial_auth.get('independentSmeStatus')=='hold', 'editorial expansion authorization boundary drift')
need((authorization.get('evidenceEnrichmentAuthorization') or {}).get('release') == enrichment.get('release'), 'evidence-enrichment authorization must remain bound to the reviewed content release')
need((authorization.get('evidenceEnrichmentAuthorization') or {}).get('sectionCount') == 14, 'evidence-enrichment authorization section count drifted')
need((authorization.get('evidenceEnrichmentAuthorization') or {}).get('independentSmeStatus') == 'hold', 'evidence-enrichment authorization must preserve SME HOLD')
need(authorization['authorizationBasis']['sourceRevision'] == '7ef28bd8b02994223e320fda64e99808357d3219', 'authorization provenance revision drift')

# Book is now part of the primary search surface and read/listen still render one governed chapter representation.
for marker in ('function searchBook(', 'function appendBookSearchResults(', 'function installBookSearch(', 'function armBookSearch()', 'function openChapter('):
    need(marker in book_runtime, f'Book search integration missing: {marker}')
need("window.addEventListener('mm:domains-ready',installBookSearch,{once:true})" in book_runtime, 'Book search binding must retry after manifest-driven domains are ready')
need("window.__MM_BOOK_SEARCH_BOUND__===VERSION" in book_runtime, 'Book search binding must be idempotent for the current Book runtime')
need('function verifiedChapterHtml(chapter,options={})' in book_runtime, 'verified chapter renderer missing')
need("if(chapter.state==='verified')ui.reader.innerHTML=`${back}${verifiedChapterHtml(chapter)}`" in book_runtime, 'Book read surface no longer uses governed verified renderer')
need("verified.map(chapter=>verifiedChapterHtml(chapter,{includeTechnicalMaterial:false})).join('')" in book_runtime, 'Book listen surface must exclude technical-review material appendix')
need("ui.listen.addEventListener('click',startVerifiedListening)" in book_runtime, 'Book listening control is not bound')
need('style=' not in book_runtime, 'Book runtime reintroduced inline style attributes')

# Desktop packaging must continue to carry the same canonical domain/data tree.
extra = desktop['build']['extraResources']
need(any(x.get('from') == '../../src/domains' and x.get('to') == 'mouldmaster/src/domains' for x in extra), 'desktop package no longer carries canonical domain runtime/data')
need("'src/domains/learning/book-data'" in integrity_script, 'desktop integrity manifest no longer includes Book data')
need('STATIC_DATA_DIRS.flatMap(filesUnder)' in integrity_script, 'desktop static-data integrity enumeration missing')

print('PASS: Book uses one canonical runtime with exact-byte publication binding and fail-closed authorization.')
print('PASS: dynamic scripts are release-versioned before late loaders, Book is globally searchable, and learner-facing academic evidence uses canonical DOI links.')
print('PASS: twenty-four synthetic worked cases and eighteen governed engineering diagrams are integrated while independent SME/external validation remains HOLD.')
