from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / 'data' / 'accessibility-real-at-validation-v1.json'
VERSION = ROOT / 'version.json'


def need(ok, msg):
    if not ok:
        raise AssertionError(msg)


need(CONTRACT.exists(), 'real AT validation contract missing')
data = json.loads(CONTRACT.read_text(encoding='utf-8'))
version = json.loads(VERSION.read_text(encoding='utf-8'))
need(data.get('schemaVersion') == 2, 'real AT contract schema drifted')
need(data.get('webRelease') == version.get('web_release'), 'real AT contract must target exact current web release')
need('Automated browser and accessibility regressions do not substitute for real assistive-technology interaction' in data.get('boundary', ''), 'real AT automation boundary missing')
need('bound to the named web release' in data.get('boundary', ''), 'real AT release-binding boundary missing')
rows = data.get('requiredMatrix') or []
need(len(rows) == 4, 'real AT matrix must contain four required combinations')
need({r.get('id') for r in rows} == {'nvda-firefox-windows', 'nvda-chromium-windows', 'voiceover-safari-macos', 'voiceover-safari-ios'}, 'real AT matrix combinations drifted')
for row in rows:
    need(row.get('status') in {'pending', 'validated'}, f"invalid real AT row status: {row.get('id')}")
    if row.get('status') == 'validated':
        need(all(row.get(k) for k in ('testedRelease', 'testedAt', 'reviewer', 'evidenceRef')), f"validated real AT row lacks evidence: {row.get('id')}")
        need(row.get('testedRelease') == data.get('webRelease'), f"validated real AT row targets another release: {row.get('id')}")
    else:
        need(not any(row.get(k) for k in ('testedRelease', 'testedAt', 'reviewer', 'evidenceRef')), f"pending real AT row must not carry pseudo-validation metadata: {row.get('id')}")
status = data.get('status')
if status == 'validated':
    need(all(r.get('status') == 'validated' for r in rows), 'top-level real AT validation requires every matrix row validated')
else:
    need(status == 'pending-real-at-validation', 'real AT contract may only be pending-real-at-validation or validated')
    need(any(r.get('status') != 'validated' for r in rows), 'fully validated matrix must promote top-level status')
need(len(data.get('requiredTasks') or []) >= 5, 'real AT task coverage is incomplete')
print('MouldMaster real assistive-technology contract QA passed (release-bound human validation remains fail-closed until evidence exists)')
