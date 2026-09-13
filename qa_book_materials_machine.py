#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MANIFEST = json.loads((ROOT / 'data/book-manifest-v1.json').read_text(encoding='utf-8'))
BATCH = json.loads((ROOT / 'data/book-chapters-materials-machine-v1.json').read_text(encoding='utf-8'))

assert BATCH['schema'] == 1
assert BATCH['bookId'] == 'mouldmaster-book'
assert BATCH['status'] == 'technical-review'
assert BATCH['publicationStatus'] == 'not-verified'

expected = {
    'polymer-structure','rheology','moisture-drying','thermal-history','material-families',
    'fillers-additives','plasticising-unit','shot-utilisation','velocity-pressure'
}
chapters = BATCH['chapters']
assert {c['id'] for c in chapters} == expected

manifest_chapters = {
    c['id']: c
    for p in MANIFEST['parts']
    for c in p.get('chapters', [])
}
source_ids = {s['id'] for s in MANIFEST['sourceSeeds']}

for chapter in chapters:
    cid = chapter['id']
    assert cid in manifest_chapters, f'authored chapter missing from governed manifest: {cid}'
    assert manifest_chapters[cid]['state'] != 'verified', f'draft chapter must not be verified: {cid}'
    assert chapter.get('applicability','').strip(), f'missing applicability: {cid}'
    assert chapter.get('sourceIds'), f'missing evidence anchors: {cid}'
    assert all(sid in source_ids for sid in chapter['sourceIds']), f'unknown source in {cid}'
    assert len(chapter.get('sections', [])) >= 2, f'insufficient authored teaching sections: {cid}'
    text = ' '.join(section.get('text','') for section in chapter['sections']).lower()
    assert 'guaranteed fix' not in text

# Numeric process recipes must not silently enter this general teaching batch.
# Manufacturer-specific examples belong in evidence/source metadata until scoped and reviewed.
for chapter in chapters:
    for section in chapter['sections']:
        text = section.get('text','')
        assert '°C' not in text and ' bar' not in text and ' psi' not in text, (
            f'unscoped numeric process recipe found in {chapter["id"]}'
        )

print(f'PASS: governed Materials + Machine Book batch ({len(chapters)} chapters)')
