#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parent
CATALOG=json.loads((ROOT/'material-catalog-v1.json').read_text(encoding='utf-8'))
INDEX=json.loads((ROOT/'data/material-unique-profile-index-v1.json').read_text(encoding='utf-8'))
SOURCE=json.loads((ROOT/'data/asian-aus-nz-material-grade-extraction-wave2-v1.json').read_text(encoding='utf-8'))
ATLAS=json.loads((ROOT/'data/book-material-grade-atlas-v1.json').read_text(encoding='utf-8'))
PACKAGED_ATLAS=json.loads((ROOT/'src/domains/learning/book-data/book-material-grade-atlas-v1.json').read_text(encoding='utf-8'))
PACKAGED_REGIONAL=json.loads((ROOT/'src/domains/learning/book-data/book-material-regional-evidence-v1.json').read_text(encoding='utf-8'))
SEARCH_INDEX=json.loads((ROOT/'data/book-material-search-index-v1.json').read_text(encoding='utf-8'))
PACKAGED_SEARCH_INDEX=json.loads((ROOT/'src/domains/learning/book-data/book-material-search-index-v1.json').read_text(encoding='utf-8'))

def need(ok,msg):
    if not ok:
        raise AssertionError(msg)

need(ATLAS==PACKAGED_ATLAS,'packaged Book material atlas manifest drifted from governed source')
need(SOURCE==PACKAGED_REGIONAL,'packaged regional material evidence must preserve every governed source-wave row exactly')
need(SEARCH_INDEX==PACKAGED_SEARCH_INDEX,'packaged Book material search index drifted from governed source')

def norm(value):
    return re.sub(r'[^a-z0-9]+',' ',str(value or '').lower()).strip()

need(ATLAS.get('schemaVersion')==2 and ATLAS.get('bookId')=='mouldmaster-book','Book material atlas identity mismatch')
need(ATLAS.get('status')=='technical-review-material-atlas','Book material atlas must remain technical review')
need(ATLAS.get('atlasVersion')=='2026.10.01.2','Book material atlas version mismatch')
need(ATLAS.get('bookRuntimeCompatibility')=='2026.10.01.3','Book material atlas runtime compatibility mismatch')

need(CATALOG.get('schemaVersion')==1 and CATALOG.get('status')=='validated','canonical material catalogue identity mismatch')
grades=CATALOG.get('grades') or []
need(len(grades)==260,'Book must consume the complete 260-grade canonical runtime catalogue')
ids=[g.get('id') for g in grades]
need(all(ids) and len(set(ids))==260,'canonical exact-grade ids must be complete and unique')
need(all(g.get('manufacturer',{}).get('name') and g.get('grade') and g.get('polymer',{}).get('family') for g in grades),'canonical exact-grade identities are incomplete')
need(all((g.get('provenance') or {}).get('stage') in {'validated','published'} for g in grades),'Book catalogue must not promote unvalidated exact-grade records')

rows=SOURCE.get('records') or []
need(len(rows)==284,'Book must package all 284 governed regional material evidence rows')
counts={}
for row in rows:
    counts[row.get('status')]=counts.get(row.get('status'),0)+1
need(counts=={'candidate-complete':161,'conditional':4,'discovery-only':112,'candidate-partial':7},f'regional evidence status counts drifted: {counts}')
need(SOURCE.get('policy',{}).get('noUniversalSettings') is True,'regional evidence universal-setting boundary weakened')
need(SOURCE.get('policy',{}).get('noInterpolationAcrossGrades') is True,'regional evidence no-interpolation boundary weakened')
need(SOURCE.get('policy',{}).get('typicalValuesAreNotSpecifications') is True,'regional evidence typical-value boundary weakened')

canonical=ATLAS.get('canonicalCatalog') or {}
regional=ATLAS.get('regionalEvidence') or {}
profile=ATLAS.get('regionalProfileIndex') or {}
coverage=ATLAS.get('coverage') or {}
need(canonical.get('path')=='material-catalog-v1.json' and canonical.get('gradeCount')==260,'atlas canonical catalogue declaration mismatch')
need(regional.get('sourcePath')=='data/asian-aus-nz-material-grade-extraction-wave2-v1.json','atlas regional source path mismatch')
need(regional.get('packagedPath')=='src/domains/learning/book-data/book-material-regional-evidence-v1.json','atlas regional packaged path mismatch')
need(regional.get('recordCount')==284 and regional.get('statusCounts')==counts,'atlas regional complete-coverage declaration mismatch')
need(profile.get('profileCount')==INDEX.get('uniqueExactCompleteProfiles')==89,'regional profile reconciliation count mismatch')
need('does not define complete Book material coverage' in profile.get('role',''),'89-profile index must be explicitly non-authoritative for complete Book coverage')

search_counts=SEARCH_INDEX.get('sourceCounts') or {}
search_entries=SEARCH_INDEX.get('entries') or []
need(SEARCH_INDEX.get('schemaVersion')==1 and SEARCH_INDEX.get('release')=='2026.10.04.3','Book material search index identity mismatch')
need(search_counts=={'canonicalExactGrades':260,'regionalEvidenceRows':284,'total':544},'Book material search index source counts drifted')
need(len(search_entries)==544,'Book material search index must cover all 544 governed material rows')
expected_canonical=[
    norm(' '.join(str(x) for x in [g.get('manufacturer',{}).get('name'),g.get('brand'),g.get('grade'),*(g.get('aliases') or []),g.get('polymer',{}).get('family')] if x))
    for g in grades
]
expected_regional=[
    norm(' '.join(str(x) for x in [row.get('manufacturer'),row.get('grade'),row.get('polymer'),row.get('manufacturerCountry'),row.get('region'),row.get('status')] if x))
    for row in rows
]
actual_canonical=[entry.get('search') for entry in search_entries if entry.get('kind')=='canonical']
actual_regional=[entry.get('search') for entry in search_entries if entry.get('kind')=='regional']
need(actual_canonical==expected_canonical,'Book material search index canonical coverage/content drifted')
need(actual_regional==expected_regional,'Book material search index regional coverage/content drifted')
need(any('duracon m90 44' in text for text in actual_regional),'Book material search index lost governed DURACON M90-44 regional discovery')
need(coverage=={
    'canonicalExactGrades':260,
    'regionalEvidenceRows':284,
    'regionalExactProfiles':89,
    'completeDefinition':'All canonical public exact-grade records plus every row in the governed Asia/Australia/New Zealand evidence wave.'
},'Book material complete-coverage definition drifted')

boundary=ATLAS.get('boundary','').lower()
for marker in ('not guaranteed specifications','universal settings','current supplier'):
    need(marker in boundary,f'Book material atlas boundary missing: {marker}')

print('PASS: Book material atlas consumes all 260 canonical exact grades and preserves all 284 regional evidence rows exactly.')
print('PASS: the 89-profile regional index is reconciliation-only, not a completeness boundary.')
print('PASS: lightweight Book search index exactly covers all 260 canonical grades and 284 regional evidence rows.')
