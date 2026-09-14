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
assert runtime_manifest['dataAssets'] == ['./material-catalog-v1.json'], 'Book integration must not widen canonical material dataAssets'
for name in book_data:
    packaged = f'./src/domains/learning/book-data/{name}'
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

# Read/listen publication parity: both surfaces must render verified chapters through
# one governed renderer. Listening may use device TTS, but it may not maintain a second
# copy of technical teaching text.
assert 'function verifiedChapterHtml(chapter)' in book_runtime, 'missing shared verified-chapter renderer'
assert "if(chapter.state==='verified')ui.reader.innerHTML=`${back}${verifiedChapterHtml(chapter)}`" in book_runtime, 'Read mode bypasses shared verified renderer'
assert "verified.map(verifiedChapterHtml).join('')" in book_runtime, 'Listen mode does not use the shared verified renderer'
assert "ui.listen.addEventListener('click',startVerifiedListening)" in book_runtime, 'verified Book listen control has no handler'
assert 'window.MMReadAloud' in book_runtime and 'reader.refresh?.()' in book_runtime, 'Book listening does not hand the governed surface to Read Aloud'
assert 'data-mm-read="play"' in book_runtime, 'Book listening cannot invoke the existing device speech control'

# Desktop already packages src/domains as one governed resource tree.
extra = desktop['build']['extraResources']
assert any(x.get('from') == '../../src/domains' and x.get('to') == 'mouldmaster/src/domains' for x in extra)
# Book JSON stays outside the canonical material dataAssets channel, but its packaged
# directory is still included in desktop integrity hashing as a governed static-data tree.
assert "'src/domains/learning/book-data'" in integrity, 'desktop integrity scanner does not include governed Book data'
assert 'STATIC_DATA_DIRS.flatMap(filesUnder)' in integrity
assert 'runtimeManifest.assets' in integrity and 'runtimeManifest.dataAssets' in integrity

# Keep source/runtime review state fail-closed until explicit promotion work exists.
source_manifest = json.loads((ROOT / 'data/book-manifest-v1.json').read_text(encoding='utf-8'))
chapters = [c for p in source_manifest['parts'] for c in p.get('chapters', [])]
assert len(chapters) == 46
assert not any(c.get('state') == 'verified' for c in chapters)

print('PASS: Book runtime/data are registered for domain loading, atomic web offline cache and desktop package/integrity inclusion.')
print('PASS: verified Book Read and Listen surfaces share one governed chapter renderer and existing device TTS path.')
print('PASS: canonical material dataAssets remains isolated; packaged Book data are byte-identical to governed source; 0 chapters self-promoted.')
