from pathlib import Path
from datetime import date
import json, re
import subprocess, sys

ROOT=Path(__file__).resolve().parent

def text(p): return (ROOT/p).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

V=json.loads(text('version.json'))
expected={
'web_release':'2026.11.14.3',
 'android_release':'2026.11.08.1',
 'desktop_release':'2026.09.29.1',
 'content_version':'2026.08.26.1',
 'question_bank_version':'2026.08.30.1',
 'assessment_quality_version':'2026.08.24.3',
 'assessment_storage_scope_version':'2026.08.24.4',
 'assessment_evidence_version':'2026.10.05.1',
  'read_aloud_version':'2026.11.14.3',
 'windows_recovery_release':'2026.08.21.1',
}
for k,v in expected.items(): need(V.get(k)==v,f'version.json {k} drift: {V.get(k)!r} != {v!r}')
published=str(V.get('published') or '')
need(re.fullmatch(r'\d{4}-\d{2}-\d{2}',published) is not None,'version.json published must use YYYY-MM-DD')
published_date=date.fromisoformat(published)
release_family_date=date.fromisoformat('.'.join(V['web_release'].split('.')[:3]).replace('.','-'))
need((release_family_date-published_date).days in (0,1),'version.json published UTC date must match the Auckland release-family date or the immediately preceding UTC date')
need(V.get('published_timezone')=='UTC','version.json must explicitly define the published date timezone')
need(V.get('published_date_basis')=='governed web-release publication date in UTC; web_release date component is the Pacific/Auckland release-family date','version.json publication/release-family date semantics are ambiguous')

new2=text('docs/NEW2_MATERIAL_INTELLIGENCE.md')
for marker in [
 'The baseline SHA above is a historical comparison point only.',
 'must be bound to the exact protected-main commit for the release being evaluated',
 'it must never be inferred from the baseline commit',
 'The workspace\'s legacy delete action is now an archive operation',
 'structured evidence and audit history are retained locally',
 'case-archive',
 'Full erasure is reserved for explicit app/site-data clearing',
]:
    need(marker in new2,f'New2 release/evidence contract missing marker: {marker}')
need('Post-merge verification for `7382aa9b...`' not in new2,'New2 must not treat the historical baseline SHA as the current release candidate')
need('Deleting the parent case still cascades its owned evidence' not in new2,'New2 documentation still claims destructive case/evidence deletion')

readme=text('README.md')
for label,k in [
 ('PWA / browser shell','web_release'),('Open Windows desktop','desktop_release'),('Training content','content_version'),
 ('Audited assessment bank','question_bank_version'),('Assessment quality / analytics hardening','assessment_quality_version'),
 ('Learner-scoped assessment storage','assessment_storage_scope_version'),('Question evidence approval','assessment_evidence_version'),
 ('Frozen legacy Windows recovery lane','windows_recovery_release')]:
    need(f'- {label}: `{V[k]}`' in readme,f'README release lane stale/missing: {label}')
need('all 30 technical exam items now use evidence-based reasoning' in readme.lower(),'README must describe the evidence-diagnostic technical bank')
need('qa_assessment_storage_scope.py' in readme,'README must list learner-scoped analytics QA')
need('qa_assessment_evidence.py' in readme,'README must list question evidence approval QA')
need('qa_curriculum_integration.py' in readme,'README must list curriculum integration QA')
need('qa_specialist_curriculum.py' in readme,'README must list specialist curriculum QA')
need('qa_evidence_coverage.py' in readme,'README must list mechanism evidence coverage QA')
need('qa_mechanism_promotion.py' in readme,'README must list mechanism promotion QA')
need('qa_specialist_evidence_gaps.py' in readme,'README must list specialist evidence-status QA')
need('qa_app_shell_registry.py' in readme,'README must list canonical app-shell QA')
need('qa_mould_master_workspace.py' in readme,'README must list Mould Ma