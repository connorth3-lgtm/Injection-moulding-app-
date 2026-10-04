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
evidence_release=data.get('release')
need(evidence_release==release,'real AT validation contract must be rebound to the current web release')
packet=data.get('packet')
need(packet==f'qa/ACCESSIBILITY_REAL_AT_{evidence_release}.md','real AT evidence packet must remain bound to its recorded release')
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
task_ids=data.get('requiredTaskIds') or []
task_labels=data.get('requiredTasks') or []
need(len(task_ids)==12 and len(set(task_ids))==12,'real AT contract must define exactly 12 unique task ids')
need(len(task_labels)==12,'real AT contract must define exactly 12 task labels')
need(len(set(task_labels))==12,'real AT task labels must be unique')
for row in rows:
    task_evidence=row.get('taskEvidence') or {}
    if row.get('status')=='validated':
        need(set(task_evidence)==set(task_ids),f"validated real AT row lacks exact 12-task evidence: {row.get('id')}")
        for task_id in task_ids:
            record=task_evidence.get(task_id) or {}
            need(record.get('status')=='pass',f"validated real AT task did not pass: {row.get('id')} {task_id}")
            need(str(record.get('evidenceRef') or '').strip(),f"validated real AT task lacks evidenceRef: {row.get('id')} {task_id}")
    else:
        need(not task_evidence,f"pending real AT row must not carry task-level pseudo-evidence: {row.get('id')}")
scope=data.get('auditScope') or {}
for key in ('uiNavigation','bookLongForm','assessmentQuestionsAndFeedback','keyboardFocusRecovery','textZoom200Percent'):
    need(scope.get(key) is True,f'real AT audit scope missing: {key}')
tasks='\n'.join(task_labels)
for marker in ('Book topic','assessment interactions','focus order','Standards & readiness','worked-example'):
    need(marker in tasks,f'real AT task matrix missing UI/Book/assessment coverage: {marker}')
print(f'MouldMaster real assistive-technology contract QA passed for evidence release {evidence_release}; current web release {release} remains fail-closed until matching human evidence exists')
