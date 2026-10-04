from pathlib import Path
import json
import re

ROOT=Path(__file__).resolve().parent
CONTRACT=ROOT/'data'/'accessibility-real-at-validation-v1.json'
VERSION=ROOT/'version.json'
SHA_RE=re.compile(r'^[0-9a-f]{40}$')
FP_RE=re.compile(r'^sha256:[0-9a-f]{64}$')
PACKET_TASK_RE=re.compile(r'^\d+\. \x60(AT-\d{2})\x60',re.MULTILINE)
EXPECTED_TASK_IDS={f'AT-{i:02d}' for i in range(1,13)}

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
packet_path=ROOT/packet
need(packet_path.is_file(),'real AT release packet is missing')
need(SHA_RE.fullmatch(str(data.get('sourceSha') or '')) is not None,'real AT sourceSha must be a lowercase 40-character commit SHA')
need(FP_RE.fullmatch(str(data.get('runtimeFingerprint') or '')) is not None,'real AT runtimeFingerprint must be sha256:<64 lowercase hex>')
need('Automated browser and accessibility regressions do not substitute for real assistive-technology interaction' in data.get('boundary',''),'real AT automation boundary missing')

tasks=data.get('requiredTasks') or []
need(len(tasks)==12,'real AT contract must contain exactly 12 canonical tasks')
need(all(isinstance(t,dict) and t.get('id') and t.get('instruction') for t in tasks),'real AT tasks must use id+instruction objects')
task_ids=[t['id'] for t in tasks]
need(len(set(task_ids))==12 and set(task_ids)==EXPECTED_TASK_IDS,'real AT canonical task IDs drifted')
packet_task_ids=PACKET_TASK_RE.findall(packet_path.read_text(encoding='utf-8'))
need(len(packet_task_ids)==12,'real AT packet must contain exactly 12 canonical task IDs')
need(packet_task_ids==task_ids,'real AT packet/task contract ordering or IDs drifted')

rows=data.get('requiredMatrix') or []
need(len(rows)==4,'real AT matrix must contain four required combinations')
need({r.get('id') for r in rows}=={'nvda-firefox-windows','nvda-chromium-windows','voiceover-safari-macos','voiceover-safari-ios'},'real AT matrix combinations drifted')
for row in rows:
    need(row.get('status') in {'pending','validated'},f"invalid real AT row status: {row.get('id')}")
    evidence=row.get('taskEvidence')
    need(isinstance(evidence,dict) and set(evidence)==set(task_ids),f"real AT row task coverage drifted: {row.get('id')}")
    if row.get('status')=='validated':
        need(all(row.get(k) for k in ('testedAt','reviewer','evidenceRef')),f"validated real AT row lacks evidence: {row.get('id')}")
        for task_id in task_ids:
            task=evidence[task_id]
            need(isinstance(task,dict) and task.get('status')=='pass' and str(task.get('evidenceRef') or '').strip(),f"validated real AT row lacks task-level pass evidence: {row.get('id')} / {task_id}")
    else:
        need(not any(row.get(k) for k in ('testedAt','reviewer','evidenceRef')),f"pending real AT row must not carry pseudo-validation metadata: {row.get('id')}")
        for task_id in task_ids:
            task=evidence[task_id]
            need(isinstance(task,dict) and task.get('status')=='pending' and task.get('evidenceRef') is None,f"pending real AT task must remain evidence-free: {row.get('id')} / {task_id}")

status=data.get('status')
if status=='validated':
    need(all(r.get('status')=='validated' for r in rows),'top-level real AT validation requires every matrix row validated')
else:
    need(status=='pending-real-at-validation','real AT contract may only be pending-real-at-validation or validated')
    need(any(r.get('status')!='validated' for r in rows),'fully validated matrix must promote top-level status')

scope=data.get('auditScope') or {}
for key in ('uiNavigation','bookLongForm','assessmentQuestionsAndFeedback','keyboardFocusRecovery','textZoom200Percent'):
    need(scope.get(key) is True,f'real AT audit scope missing: {key}')
print(f'MouldMaster real assistive-technology contract QA passed with exact 12-task packet parity for evidence release {evidence_release}; current web release {release} remains fail-closed until matching human evidence exists')
