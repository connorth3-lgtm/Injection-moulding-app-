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

runtime_manifest = json.loads(MANIFEST_PATH.read_text(encoding='utf-8'))
sw = SW_PATH.read_text(encoding='utf-8')
desktop = json.loads(DESKTOP_PACKAGE.read_text(encoding='utf-8'))
integrity = INTEGRITY_SCRIPT.read_text(encoding='utf-8')
book_runtime = PACKAGED_RUNTIME.read_text(encoding='utf-8')

book_data = [
    'book-manifest-v1.json',
    'book-authored-foundations-v1.json',
    'book-evidence-registry-v1.json',
    'book-chapters-materials-machine-v1.json',
    'book-authored-remaining-v1.json',
]

runtime_asset = './src/domains/learning/book-runtime.js'
assert runtime_asset in runtime_manifest['assets']
for name in book_data:
    packaged = f'./src/domains/learning/book-data/{name}'
    assert packaged in runtime_manifest['dataAssets'], f'missing runtime data asset: {packaged}'
    assert packaged in sw, f'Book data not in atomic offline cache: {packaged}'
    source = ROOT / 'data' / name
    target = PACKAGED_ROOT / name
    assert source.read_bytes() == target.read_bytes(), f'packaged Book data drifted from governed source: {name}'

assert runtime_asset in sw, 'Book runtime not in atomic offline cache'
assert "const BOOK_DATA='./src/domains/learning/book-data/';" in book_runtime
assert "chapter.state==='verified'" in book_runtime
assert "effectiveState==='verified'" in book_runtime
assert 'style=' not in book_runtime, 'Book packaged runtime reintroduced inline style attributes'
assert 'window.MMBook=' in book_runtime

# Desktop already packages src/domains as one governed resource tree.
extra = desktop['build']['extraResources']
assert any(x.get('from') == '../../src/domains' and x.get('to') == 'mouldmaster/src/domains' for x in extra)
# Integrity generation consumes runtime-domain-manifest assets/dataAssets, so the same bytes are hashed.
assert 'runtimeManifest.assets' in integrity and 'runtimeManifest.dataAssets' in integrity
assert 'manifestFiles' in integrity

# Keep source/runtime review state fail-closed until explicit promotion work exists.
source_manifest = json.loads((ROOT / 'data/book-manifest-v1.json').read_text(encoding='utf-8'))
chapters = [c for p in source_manifest['parts'] for c in p.get('chapters', [])]
assert len(chapters) == 46
assert not any(c.get('state') == 'verified' for c in chapters)

print('PASS: Book runtime/data are registered for domain loading, atomic web offline cache and desktop integrity/package inclusion.')
print('PASS: packaged Book data are byte-identical to governed source data; 0 chapters self-promoted.')
