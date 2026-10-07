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
CLAIM_EVIDENCE_SOURCE = ROOT / 'data/book-claim-evidence-reference-v1.json'
WORKED_CASE_SOURCE = ROOT / 'data/book-worked-engineering-cases-v1.json'
READER_SOURCE = ROOT / 'data/book-reader-architecture-v2.json'
CLAIM_TRACE_RUNTIME = ROOT / 'src/domains/learning/book-claim-trace.js'
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


def release_key(value):
    try:
        parts = tuple(int(part) for part in str(value).split('.'))
    except (TypeError, ValueError):
        return ()
    return parts if len(parts) == 4 else ()


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
claim_evidence = json.loads(CLAIM_EVIDENCE_SOURCE.read_text(encoding='utf-8'))
worked_cases = json.loads(WORKED_CASE_SOURCE.read_text(encoding='utf-8'))
reader_architecture = json.loads(READER_SOURCE.read_text(encoding='utf-8'))
claim_trace_runtime = CLAIM_TRACE_RUNTIME.read_text(encoding='utf-8')
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
    'book-claim-resolution-all-v1.json',
    'book-claim-review-foundations-materials-machine-v1.json',
    'book-claim-review-process-tooling-v1.json',
    'book-claim-review-troubleshooting-v1.json',
    'book-claim-review-engineering-advanced-v1.json',
    'book-claim-review-high-risk-v1.json',
    'book-authored-foundations-v1.json',
    'book-evidence-registry-v1.json',
    'book-chapters-materials-machine-v1.json',
    'book-authored-remaining-v1.json',
    'book-worked-engineering-cases-v1.json',
    'book-evidence-enrichment-v2.json',
    'book-claim-evidence-reference-v1.json',
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
need("script.src=runtimeScriptUrl('./src/domains/learning/book-runtime.js')" in compat_loader, 'root Book compatibility loader must delegate to canonical packaged runtime through explicit release versioning')
for forbidden in ("const AUTH_PATH='./data/", 'function showChapter(', 'function verifiedChapterHtml('):
    need(forbidden not in compat_loader, f'root Book path still contains a second implementation: {forbidden}')
need("window.MM_RUNTIME_SCRIPT_URL?.('./book-runtime.js')||'./book-runtime.js'" in learning_pack, 'learning foundation must reach the compatibility loader through the explicit release-version helper')
# Bootstrap-owned explicit release versioning replaces the former global
# HTMLScriptElement prototype interception.
for marker in ('function runtimeScriptUrl(value)', 'window.MM_RUNTIME_SCRIPT_URL=runtimeScriptUrl', "url.searchParams.set('v',version)"):
    need(marker in index, f'explicit runtime script release-version helper missing: {marker}')
need(index.index('window.MM_RUNTIME_SCRIPT_URL=runtimeScriptUrl') < index.index('await installDocument(html)'), 'runtime script release-version helper must exist before governed runtime execution')
need("window.MM_RUNTIME_SCRIPT_URL" in compat_loader and "runtimeScriptUrl('./src/domains/learning/book-runtime.js')" in compat_loader, 'Book compatibility loader must use explicit runtime script versioning')
for forbidden in ('__MM_RELEASE_SCRIPT_VERSIONER__', 'HTMLScriptElement', "Object.defineProperty(proto,'src'"):
    need(forbidden not in compat_loader, f'Book compatibility loader must not globally intercept script loading: {forbidden}')

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
    'book-claim-resolution-high-risk-v1.json', 'book-claim-resolution-high-risk-v2.json', 'book-claim-resolution-all-v1.json',
    'book-claim-review-foundations-materials-machine-v1.json', 'book-claim-review-process-tooling-v1.json',
    'book-claim-review-troubleshooting-v1.json', 'book-claim-review-engineering-advanced-v1.json', 'book-claim-review-high-risk-v1.json',
    'book-authored-foundations-v1.json',
    'book-evidence-registry-v1.json', 'book-chapters-materials-machine-v1.json', 'book-authored-remaining-v1.json',
    'book-worked-engineering-cases-v1.json', 'book-engineering-diagrams-v1.json', 'book-evidence-enrichment-v2.json', 'book-claim-evidence-reference-v1.json', 'book-reader-architecture-v2.json', 'book-editorial-expansion-review-v1.json', 'book-material-grade-atlas-v1.json',
    'book-material-regional-evidence-v1.json', 'material-catalog-v1.json',
}
need(required_integrity <= set(sha_by_file), f'Book byte-integrity coverage incomplete: {sorted(required_integrity - set(sha_by_file))}')
for name in required_integrity:
    path = ROOT / name if name == 'material-catalog-v1.json' else PACKAGED_ROOT / name
    need(sha_by_file[name] == git_blob_sha(path), f'Book byte-integrity Git object mismatch: {name}')
auth_blob = git_blob_sha(PACKAGED_ROOT / 'book-publication-authorization-v1.json')
need(f"const AUTH_GIT_BLOB_SHA1='{auth_blob}'" in book_runtime, 'canonical runtime is not pinned to exact authorization bytes')
for marker in ('gitBlobSha1', 'verifiedJson', 'validateIntegrityAuthorization', 'Book byte-integrity mismatch', 'WORKED_CASES_PATH', 'validateWorkedCases', 'workedCaseHtml', 'getWorkedCases', 'DIAGRAMS_PATH', 'validateEngineeringDiagrams', 'diagramHtml', 'getEngineeringDiagrams', 'ENRICHMENT_PATH', 'validateEvidenceEnrichment', 'getEvidenceEnrichment', 'CLAIM_EVIDENCE_PATH', 'validateClaimEvidenceReference', 'MATERIAL_ATLAS_PATH', 'MATERIAL_REGIONAL_PATH', 'MATERIAL_CATALOG_PATH', 'MATERIAL_SEARCH_INDEX_PATH', 'MATERIAL_SEARCH_INDEX_GIT_BLOB_SHA1', 'validateMaterialAtlas', 'validateMaterialCatalog', 'validateMaterialRegionalEvidence', 'materialAtlasHtml', 'ensureManifest', 'ensureMaterialData', 'hydrateMaterialAtlas', 'coldMaterialSearchTerms', 'coldMaterialHit', 'MATERIAL_PAGE_SIZE=24', 'data-mm-book-material-more', 'getMaterialAtlas', 'getMaterialCatalog', 'getMaterialRegionalEvidence', 'READER_PATH', 'EDITORIAL_REVIEW_PATH', 'validateReaderArchitecture', 'validateEditorialExpansionReview', 'readerChapterHtml', 'readerLearningHtml', 'readerReferencesHtml', 'showReaderChapter', 'getReaderArchitecture', 'getEditorialExpansionReview'):
    need(marker in book_runtime, f'Book runtime exact-byte/lazy-load safeguard missing: {marker}')
load_manifest_block = book_runtime.split('async function loadManifest(){',1)[1].split('function failBook(',1)[0]
for forbidden in ('MATERIAL_ATLAS_PATH', 'MATERIAL_CATALOG_PATH', 'MATERIAL_REGIONAL_PATH', 'MATERIAL_SEARCH_INDEX_PATH'):
    need(forbidden not in load_manifest_block, f'heavy material payload must not load during core Book manifest initialization: {forbidden}')
need("async function init(){createUI();bindBookScrollRoot();armBookSearch();return true;}" in book_runtime and "async function init(){createUI();ensureManifest" not in book_runtime, 'Book shell must initialize UI/scroll/search without eagerly fetching governed Book payloads')
need("if(!manifest){ui.summary.textContent='Loading governed Book content on demand…'" in book_runtime, 'Book open action must demand-load governed content')
need("materialSearchIndex={catalog:[],regional:[]}" in book_runtime, 'Book material search must use a precomputed normalized index')
search_block = book_runtime.split('function searchBook(query){',1)[1].split('async function appendBookSearchResults',1)[0]
need("JSON.stringify(row)" not in search_block, 'Book material search must not re-serialize all regional evidence rows on every query')
need("materialSearchIndex.regional.some" in search_block, 'Book material search must query the precomputed regional evidence index')
need("void ensureManifest().catch(()=>{})" in book_runtime, 'Book open must consume the controlled fail-closed manifest rejection')
need("retry.dataset.mmBookRetry='1'" in book_runtime and "Retry governed Book load" in book_runtime and "void ensureManifest().catch(()=>{}).finally" in book_runtime, 'Book fail-closed state must offer a governed retry that re-runs exact manifest/authorization verification')
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
need(release_key(book_sme.get('release')) and release_key(current_web_release) and release_key(book_sme.get('release')) <= release_key(current_web_release), 'Book SME evidence cannot target a future learner release')
need(book_sme.get('release') == enrichment.get('release'), 'Book SME and evidence-enrichment review scope must remain bound to the same content release')
need(len(book_sme.get('workedCaseIds', [])) == 27 and len(set(book_sme.get('workedCaseIds', []))) == 27, 'Book SME worked-case review scope is incomplete')
need(len(book_sme.get('enrichmentChapterIds', [])) == 10 and len(set(book_sme.get('enrichmentChapterIds', []))) == 10, 'Book SME evidence-enrichment review scope is incomplete')
need(len(book_sme.get('diagramIds', [])) == 25 and len(set(book_sme.get('diagramIds', []))) == 25, 'Book SME diagram review scope is incomplete')
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
need(sum(len(x.get('sections') or []) for x in enrichment.get('chapterPatches', []) if isinstance(x, dict)) == 14, 'evidence-enrichment ledger section count drifted')
live_pages_verifier=(ROOT/'tools/verify_book_pages_candidate.py').read_text(encoding='utf-8')
need('sum(len(x.get("sections") or []) for x in patches if isinstance(x, dict)) != 14' in live_pages_verifier, 'live Book Pages verifier enrichment count drifted from governed 14-section contract')
need((authorization.get('evidenceEnrichmentAuthorization') or {}).get('independentSmeStatus') == 'hold', 'evidence-enrichment authorization must preserve SME HOLD')

claim_auth=authorization.get('claimEvidenceReferenceAuthorization') or {}
need(claim_auth.get('status')=='authorized-derived-evidence-index' and claim_auth.get('release')==claim_evidence.get('release') and claim_auth.get('ledger')=='data/book-claim-evidence-reference-v1.json' and claim_auth.get('chapterCount')==46 and claim_auth.get('sourceCount')==52 and claim_auth.get('claimCount')==137 and claim_auth.get('noNewClaims') is True and claim_auth.get('independentSmeStatus')=='hold', 'claim-evidence reference authorization boundary drift')
need(claim_evidence.get('schemaVersion')==1 and claim_evidence.get('bookId')=='mouldmaster-book' and claim_evidence.get('status')=='governed-reader-claim-evidence-index', 'claim-evidence reference identity drift')
need(claim_evidence.get('release')==book_sme.get('release') and claim_evidence.get('chapterCount')==46 and claim_evidence.get('sourceCount')==52 and claim_evidence.get('claimCount')==137, 'claim-evidence reference release/coverage drift')
claim_review_paths=[
    ROOT / 'data/book-claim-review-foundations-materials-machine-v1.json',
    ROOT / 'data/book-claim-review-process-tooling-v1.json',
    ROOT / 'data/book-claim-review-troubleshooting-v1.json',
    ROOT / 'data/book-claim-review-engineering-advanced-v1.json',
    ROOT / 'data/book-claim-review-high-risk-v1.json',
]
claim_resolution_paths=[
    ROOT / 'data/book-claim-resolution-high-risk-v1.json',
    ROOT / 'data/book-claim-resolution-high-risk-v2.json',
    ROOT / 'data/book-claim-resolution-all-v1.json',
    ROOT / 'data/book-qualification-resolution-all-v1.json',
]
expected_claim_state={}
expected_claim_order={}
for path in claim_review_paths:
    ledger=json.loads(path.read_text(encoding='utf-8'))
    for chapter in ledger.get('chapters', []):
        chapter_id=chapter.get('chapterId')
        expected_claim_order.setdefault(chapter_id, [])
        for claim in chapter.get('claims', []):
            claim_id=claim.get('claimId')
            need(isinstance(claim_id,str) and claim_id and claim_id not in expected_claim_state, f'duplicate/missing governed claim id: {claim_id}')
            expected_claim_state[claim_id]={'chapterId':chapter_id,'evidenceIds':list(dict.fromkeys(claim.get('evidence', [])))}
            expected_claim_order[chapter_id].append(claim_id)
for path in claim_resolution_paths:
    ledger=json.loads(path.read_text(encoding='utf-8'))
    for item in ledger.get('resolutions', []):
        claim_id=item.get('claimId')
        need(claim_id in expected_claim_state, f'claim resolution references unknown claim: {claim_id}')
        evidence=expected_claim_state[claim_id]['evidenceIds']
        for source_id in item.get('evidence', []):
            if source_id not in evidence:
                evidence.append(source_id)
    for item in ledger.get('remainingQualifiedClaims', []):
        claim_id=item.get('claimId')
        need(claim_id in expected_claim_state, f'claim qualification references unknown claim: {claim_id}')
        evidence=expected_claim_state[claim_id]['evidenceIds']
        for source_id in item.get('evidence', []):
            if source_id not in evidence:
                evidence.append(source_id)

need(len(expected_claim_state)==137, 'final governed claim-evidence state must retain 137 claims')
need(all(row['evidenceIds'] for row in expected_claim_state.values()), 'every final governed claim must expose at least one evidence id')
expected_claim_rows={
    chapter_id:[{'claimId':claim_id,'evidenceIds':expected_claim_state[claim_id]['evidenceIds']} for claim_id in claim_ids]
    for chapter_id,claim_ids in expected_claim_order.items()
}
expected_claim_evidence={
    chapter_id:list(dict.fromkeys(source_id for row in rows for source_id in row['evidenceIds']))
    for chapter_id,rows in expected_claim_rows.items()
}
actual_claim_rows={row.get('chapterId'):row.get('claims') for row in claim_evidence.get('chapters', [])}
actual_claim_evidence={row.get('chapterId'):row.get('evidenceIds') for row in claim_evidence.get('chapters', [])}
need(len(expected_claim_rows)==46 and sum(len(rows) for rows in expected_claim_rows.values())==137, 'final claim-evidence chapter/claim coverage drift')
need(actual_claim_rows==expected_claim_rows, 'reader claim-level evidence trace drifted from final governed review/resolution state')
need(actual_claim_evidence==expected_claim_evidence, 'reader claim-evidence index drifted from final governed review/resolution state')
expected_source_ids={source_id for ids in expected_claim_evidence.values() for source_id in ids}
actual_source_ids={source.get('id') for source in claim_evidence.get('sourceSeeds', [])}
need(len(expected_source_ids)==52 and actual_source_ids==expected_source_ids, 'reader final claim-evidence source coverage drift')
need(all(source.get('title') and source.get('url') and source.get('scope') for source in claim_evidence.get('sourceSeeds', [])), 'reader claim-evidence source metadata incomplete')
hot=actual_claim_evidence.get('hot-runners') or []
need({'HUSKY-SCVG-HOT-SPRUE-SERVICE-2024','MOLD-MASTERS-HOT-RUNNER-USER-MANUAL-2020','BASF-ULTRAMID-PROCESSING'} <= set(hot), 'hot-runner final governed evidence disappeared from reader references')
flash_case=next((case for case in worked_cases.get('cases', []) if case.get('id')=='worked-filling-boundary-defect-v1'), None)
need(flash_case is not None and 'BASF-INJECTION-TROUBLESHOOTER' in flash_case.get('sourceIds', []) and 'BASF-INJECTION-TROUBLESHOOTER' in (flash_case.get('claims') or [{}])[0].get('sourceIds', []), 'r12 filling-boundary case must expose the direct BASF troubleshooting evidence anchor')
claim_sources={source.get('id'):source for source in claim_evidence.get('sourceSeeds', [])}
worked_sources={source.get('id'):source for source in worked_cases.get('sourceSeeds', [])}
shared_worked=set(claim_sources) & set(worked_sources)
need(shared_worked=={'BIELENBERG-2025-SWITCHOVER-REVIEW','RJG-DECOUPLED-WORKSHOP'}, 'worked-case/final-claim shared evidence identity set drift')
for source_id in shared_worked:
    need(worked_sources[source_id]==claim_sources[source_id], f'shared worked-case evidence metadata conflicts with final claim evidence: {source_id}')
need('Conflicting worked-case source id' in book_runtime and "fields=['type','issuer','title','url','checked','state','scope','canonicalUrl']" in book_runtime, 'Book runtime must accept only metadata-identical shared worked-case evidence records')
readers=reader_architecture.get('readerChapters', [])
need(len(readers)==20, 'reader evidence transparency must cover 20 reader chapters')
for reader in readers:
    governed=set()
    for module_id in reader.get('moduleIds', []):
        need(module_id in actual_claim_evidence, f'reader module missing final claim evidence: {module_id}')
        governed.update(actual_claim_evidence[module_id])
    need(governed, f'reader chapter has no governed evidence: {reader.get("id")}')
need("for(const id of claimEvidenceIds(ch.id))ids.add(id)" in book_runtime, 'reader chapter references must include every module final claim-evidence id')
need("ids=[...new Set([...(chapter.sourceIds||[]),...claimEvidenceIds(chapter.id)])]" in book_runtime, 'module evidence anchors must include final claim evidence')
for marker in ('EVIDENCE_IDENTITIES','BASF-INJECTION-PROBLEMS','NIST-SEMATECH-DOE','NIST-SEMATECH-CAPABILITY','PARIZS-2023-IN-MOLD-SENSORS-WORKED','getEvidenceIdentity'):
    need(marker in book_runtime, f'evidence alias/family normalization missing from Book runtime: {marker}')
need('getEvidenceIdentity' in claim_trace_runtime and 'Evidence family:' in claim_trace_runtime, 'complete claim trace must explain evidence-family relationships')
need('data.sourceSeeds.length!==52' in book_runtime, 'Book runtime must require all 52 final governed claim-evidence source records')
need("window.addEventListener('mm:book-manifest-ready',onManifestReady)" in claim_trace_runtime, 'complete claim trace must wait for the governed Book manifest-ready event')
need('await window.MMBook?.load?.()' not in claim_trace_runtime, 'complete claim trace must not eagerly demand-load the governed Book at startup')
need("window.dispatchEvent(new CustomEvent('mm:book-manifest-ready'" in book_runtime, 'Book runtime must announce exact governed manifest readiness after genuine demand')
need('function bookScrollRoot()' in book_runtime and 'function bookViewportTop()' in book_runtime and 'bindBookScrollRoot()' in book_runtime, 'Book resume must track the actual app scroll root rather than assuming window scrolling')
need("for(let node=start;node&&node!==document.body;node=node.parentElement)" in book_runtime and "hasScrollRange=(Number(node.scrollHeight)||0)>(Number(node.clientHeight)||0)+1" in book_runtime and "&&hasScrollRange)return node" in book_runtime, 'Book scroll-root detection must consider the reader itself and then walk outward to the nearest genuinely scrollable container, rejecting overflow:auto containers without real scrolling range, including WebKit')
need("for(let node=start?.parentElement;node&&node!==document.body;node=node.parentElement)" not in book_runtime, 'Book scroll-root detection must not regress to parent-only discovery because WebKit may make the reader itself the scroll root')
need("if(isDocumentScrollRoot(root)){window.scrollBy(0,amount);return}" in book_runtime and "if(isDocumentScrollRoot(root)){window.scrollTo(0,value);return}" in book_runtime and "root.scrollTop=(Number(root.scrollTop)||0)+amount" in book_runtime and "root.scrollTop=value" in book_runtime, 'Book resume scrolling must use browser-native document scrolling and direct nested-root scrolling so restoration is instant and independent of global smooth-scroll CSS')
need("anchorOffsetId:anchor.anchorOffsetId" in book_runtime and "offsetIdentity===anchorId" in book_runtime, 'Book resume pixel offsets must remain bound to the stable anchor identity that produced them')
need("activationTop=top+24" in book_runtime and "x.rect.top<=activationTop" in book_runtime, 'Book resume anchor selection must treat headings in the near-top reading band as current so a visually active heading is not saved as the previous section')
need("scrollBookBy(delta)" in book_runtime and "await alignReadingAnchor(heading,desired)" in book_runtime and "else scrollBookTo(snapshot.scrollY)" in book_runtime, 'Book resume restoration must deterministically align anchors and fallback scroll positions through the active scroll root')
need("setBookInstantScroll(true)" in book_runtime and "setBookInstantScroll(false)" in book_runtime, 'Book open/leave lifecycle must isolate Book scrolling from legacy global smooth-scroll CSS')
need("showContents({restoreScroll:false});scrollBookTo(0)" in book_runtime, 'Book open must not race a delayed contents-scroll restore against Keep Reading')
need('getClaimEvidenceReference' in book_runtime and 'getClaimEvidenceReference' in claim_trace_runtime, 'complete claim trace must reconcile against the governed final claim-evidence index')
need('Complete claim trace final evidence mismatch' in claim_trace_runtime and 'source metadata missing' in claim_trace_runtime, 'complete claim trace must fail closed on final-evidence or source-metadata divergence')
need("getIntegrityMap" in claim_trace_runtime and "gitBlobSha1" in claim_trace_runtime and "byte-integrity mismatch" in claim_trace_runtime, 'complete claim trace must verify exact governed ledger bytes before rendering')
boundary=claim_evidence.get('authorityBoundary') or {}
need(boundary.get('presentationOnly') is True and boundary.get('noNewClaims') is True and boundary.get('noEvidenceUpgrades') is True and boundary.get('noProductionAuthority') is True and boundary.get('independentSmeStatus')=='hold', 'reader claim-evidence authority boundary weakened')

need(authorization['authorizationBasis']['sourceRevision'] == '7ef28bd8b02994223e320fda64e99808357d3219', 'authorization provenance revision drift')

# Book is now part of the primary search surface and read/listen still render one governed chapter representation.
for marker in ('function searchBook(', 'function appendBookSearchResults(', 'function installBookSearch(', 'function armBookSearch()', 'function openChapter('):
    need(marker in book_runtime, f'Book search integration missing: {marker}')
need("window.addEventListener('mm:domains-ready',installBookSearch,{once:true})" in book_runtime, 'Book search binding must retry after manifest-driven domains are ready')
need("window.__MM_BOOK_SEARCH_BOUND__===VERSION" in book_runtime, 'Book search binding must be idempotent for the current Book runtime')
need('function verifiedChapterHtml(chapter,options={})' in book_runtime, 'verified chapter renderer missing')
need("if(chapter.state==='verified')ui.reader.innerHTML=`${back}${verifiedChapterHtml(chapter)}`" in book_runtime, 'Book read surface no longer uses governed verified renderer')
need('function readerListeningModuleHtml(chapter)' in book_runtime and 'function readerListeningChapterHtml(reader)' in book_runtime and 'allReaderChapters().map(readerListeningChapterHtml)' in book_runtime, 'Book listen surface must follow condensed reader sections while excluding technical-review modules')
need("ui.listen.addEventListener('click',startVerifiedListening)" in book_runtime, 'Book listening control is not bound')
need('style="' not in book_runtime and "style='" not in book_runtime, 'Book runtime reintroduced inline HTML style attributes')
for marker in ('READER_SECTION_OMISSIONS','READER_SUPPLEMENT_SECTIONS','readerSections','readerSupplementHtml','readerModuleEvidenceHtml','mm-book-reader-governance','mm-book-inline-evidence'):
    need(marker in book_runtime, f'Book reader editorial consolidation safeguard missing: {marker}')
need("'diagnostic-method':Object.freeze(['Start with the symptom','Build competing mechanisms','Change to learn'" in book_runtime, 'Book reader must consolidate the repeated diagnostic-method opening')
need("'documentation':Object.freeze(['Reading ISO 9001 marks on material packaging'])" in book_runtime, 'Book reader must move the packaging/certification example into optional context')
need("workedCaseHtml(chapter,{readerMode:true})" in book_runtime and "diagramHtml(chapter,{readerMode:true})" in book_runtime, 'Book reader must keep cases/diagrams while reducing repeated governance text')
need('Module evidence' in book_runtime and 'Worked-example evidence' in book_runtime and 'Chapter references' in book_runtime, 'Book reader evidence must remain available behind progressive disclosure')
need("'black-specks':Object.freeze(['Separate continuous contamination from event-driven contamination'])" in book_runtime, 'Book reader must consolidate the remaining black-speck chronology repetition')
need('function proseHtml(value)' in book_runtime and 'words.length<=90' in book_runtime, 'Book reader must split only unusually long governed prose for readability')
need('const metaList=' in book_runtime and 'No separate assumptions list is declared' in book_runtime and 'No separate units list is declared' in book_runtime, 'Book reader worked examples must present consistent assumptions/units metadata')
need('Reasoning scenario:' in book_runtime and 'Chapter depth:' in book_runtime and 'Depth labels:' in book_runtime, 'Book reader pedagogy/depth clarification missing')
need('readerKeyTermsHtml' in book_runtime and 'readerTermGuideHtml' in book_runtime and 'Chapter thread:' in book_runtime and 'Key-term guide' in book_runtime, 'Book first-read chapter-thread/key-term navigation missing')
need('mm-book-reader-scope' in book_runtime and 'Applicability and scope' in book_runtime, 'Book first-read applicability progressive disclosure missing')
need('mm-book-reader-worked-case' in book_runtime and 'Worked example:' in book_runtime and 'synthetic teaching data' in book_runtime, 'Book first-read worked-example progressive disclosure missing')
need(reader_architecture.get('firstReadPolicy') and 'progressive disclosure' in reader_architecture.get('firstReadPolicy'), 'Book first-read policy missing from governed reader architecture')
need(all(row.get('readingThread') and 3 <= len(row.get('keyTerms') or []) <= 8 for row in readers), 'Book first-read chapter threads/key terms incomplete')
need(authorization.get('readerArchitectureAuthorization',{}).get('firstReadPresentation',{}).get('workedExamplesOptionalExpand') is True, 'Book first-read presentation authorization missing')
for asset in ('polymer-family-evidence-map.svg','process-baseline-evidence-package.svg','filling-boundary-pattern-map.svg','surface-defect-source-map.svg'):
    need(asset in sw, f'new Book instructional diagram missing from atomic cache: {asset}')

# Desktop packaging must continue to carry the same canonical domain/data tree.
extra = desktop['build']['extraResources']
need(any(x.get('from') == '../../src/domains' and x.get('to') == 'mouldmaster/src/domains' for x in extra), 'desktop package no longer carries canonical domain runtime/data')
need("'src/domains/learning/book-data'" in integrity_script, 'desktop integrity manifest no longer includes Book data')
need('STATIC_DATA_DIRS.flatMap(filesUnder)' in integrity_script, 'desktop static-data integrity enumeration missing')

print('PASS: Book uses one canonical runtime with exact-byte publication binding and fail-closed authorization.')
print('PASS: dynamic scripts are release-versioned before late loaders, Book is globally searchable, and learner-facing academic evidence uses canonical DOI links.')
print('PASS: twenty-seven synthetic worked cases, twenty-five governed engineering diagrams and complete governed claim-evidence references are integrated while independent SME/external validation remains HOLD.')
