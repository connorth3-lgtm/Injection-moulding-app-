#!/usr/bin/env python3
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
INDEX=json.loads((ROOT/'data/material-unique-profile-index-v1.json').read_text(encoding='utf-8'))
EXTRACTION=json.loads((ROOT/'data/asian-aus-nz-material-grade-extraction-wave2-v1.json').read_text(encoding='utf-8'))
ATLAS=json.loads((ROOT/'data/book-material-grade-atlas-v1.json').read_text(encoding='utf-8'))
PACKAGED=json.loads((ROOT/'src/domains/learning/book-data/book-material-grade-atlas-v1.json').read_text(encoding='utf-8'))

def need(ok,msg):
    if not ok:
        raise AssertionError(msg)

need(ATLAS==PACKAGED,'packaged Book material atlas drifted from governed source')
need(ATLAS.get('schemaVersion')==1 and ATLAS.get('bookId')=='mouldmaster-book','Book material atlas identity mismatch')
need(ATLAS.get('status')=='technical-review-material-atlas','Book material atlas must remain technical review')
need(ATLAS.get('atlasVersion')=='2026.10.01.1','Book material atlas version mismatch')
need(ATLAS.get('bookRuntimeCompatibility')=='2026.09.24.14','Book material atlas runtime compatibility mismatch')
need(ATLAS.get('sourceIndex',{}).get('version')==INDEX.get('version'),'Book material atlas source-index version drift')
need(ATLAS.get('sourceExtraction',{}).get('version')==EXTRACTION.get('version'),'Book material atlas extraction version drift')
need(ATLAS.get('sourceExtraction',{}).get('policy')==EXTRACTION.get('policy'),'Book material atlas source policy drift')
need(ATLAS.get('profileCount')==INDEX.get('uniqueExactCompleteProfiles')==89,'Book material atlas profile count mismatch')

profiles=ATLAS.get('profiles') or []
need(len(profiles)==89,'Book material atlas must expose all 89 unique profiles')
keys=set()
evidence_rows=0
for atlas_profile,index_profile in zip(profiles,INDEX.get('profiles') or []):
    key=(atlas_profile.get('manufacturer'),atlas_profile.get('grade'))
    need(all(key),f'incomplete Book material atlas identity: {atlas_profile.get("id")}')
    need(key not in keys,f'duplicate Book material atlas exact-grade identity: {key}')
    keys.add(key)
    for field in ('manufacturer','grade','polymer','evidenceRowCount','supportingRecordIndexes'):
        need(atlas_profile.get(field)==index_profile.get(field),f'Book material atlas profile drift for {key}: {field}')
    expected=[EXTRACTION['records'][i] for i in index_profile['supportingRecordIndexes']]
    need(atlas_profile.get('evidence')==expected,f'Book material atlas evidence drift for {key}')
    need(atlas_profile.get('evidenceRowCount')==len(expected),f'Book material atlas evidence count mismatch for {key}')
    evidence_rows+=len(expected)

need(evidence_rows==147,'Book material atlas must preserve all 147 linked evidence rows')
boundary=ATLAS.get('boundary','').lower()
for marker in ('not universal','not guaranteed','current supplier'):
    need(marker in boundary,f'Book material atlas boundary missing: {marker}')

print('PASS: Book material grade atlas preserves all 89 exact profiles and all 147 linked evidence rows from the current Asia/Australia/NZ material dataset.')
