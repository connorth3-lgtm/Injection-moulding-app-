from pathlib import Path
import json
import re

ROOT=Path(__file__).resolve().parent
CONTRACT=ROOT/'data'/'accessibility-real-at-validation-v1.json'
VERSION=ROOT/'version.json'
SHA_RE=re.compile(r'^[0-9a-f]{40}$')
FP_RE=re.compile(r'^sha256:[0-9a-f]{64}$')

def need(ok,msg):
    if not ok:
        raise AssertionError(msg)

need(CONTRACT.exists(),'real AT validation contract missing')
data=json.loads(CONTRACT.read_text(encoding='utf-8'))
version=json.loads(VERSION.read_text(encoding='utf-8'))
release=version.get('web_release')
need(data.get('schemaVersion')==1,'real AT contract schema drifted')
need(data.get('release')==release,'real AT contract must be bound to the current web release')
packet=data.get('packet')
need(packet==f'qa/ACCESSIBILITY_REAL_AT_{release}.md','real AT release packet path is stale')
need((ROOT/packet).is_file(),'real AT release packet is missing')
need(SHA_RE.fullmatch(str(data.get('sourceSha') or '')) is not None,'real AT sourceSha must be a lowercase 40-character commit SHA')
need(FP_RE.fullmatch(str(data.get('runtimeFingerprint') or '')) is not None,'real AT runtimeFingerprint must be sha256:<64 lowercase hex>')
need('Automated browser and accessibility regressions do not substitute for real assistive-technology interaction' in data.get('boundary',''),'real AT automation boundary missing')
rows=data.get('requiredMatrix') or []
need(len(rows)==4,'real AT matrix must contain four required combinations')
need({r.get('id') for r in rows}=={'nvda-firefox-windows','nvda-chromium-windows','voiceover-safari-macos','voiceover-safari-ios'},'real AT matrix combinations drifted')
for row in rows:
    need(row.get('status') in {'pending','validated'},f"invalid real AT row status: {row.get('id')}")
    if row.get('status')=='validated':
        need(all(row.get(k) for k in ('testedAt','reviewer','evidenceRef')),f"validated real AT row lacks evidence: {row.get('id')}")
    else:
        need(not any(row.get(k) for k in ('testedAt','reviewer','evidenceRef')),f"pending real AT row must not carry pseudo-validation metadata: {row.get('id')}")
status=data.get('status')
if status=='validated':
    need(all(r.get('status')=='validated' for r in rows),'top-level real AT validation requires every matrix row validated')
else:
    need(status=='pending-real-at-validation','real AT contract may only be pending-real-at-validation or validated')
    need(any(r.get('status')!='validated' for r in rows),'fully validated matrix must promote top-level status')
need(len(data.get('requiredTasks') or [])>=5,'real AT task coverage is incomplete')
print(f'MouldMaster real assistive-technology contract QA passed for {release} (human validation remains fail-closed until evidence exists)')
