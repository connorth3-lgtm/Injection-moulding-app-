from pathlib import Path
import json, re

ROOT=Path(__file__).resolve().parent

def text(p): return (ROOT/p).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

V=json.loads(text('version.json'))
expected={
 'android_release':'2026.08.26.2',
 'desktop_release':'2026.08.26.4',
 'content_version':'2026.08.26.1',
 'question_bank_version':'2026.08.24.2',
 'assessment_quality_version':'2026.08.24.3',
 'assessment_storage_scope_version':'2026.08.24.4',
 'assessment_evidence_version':'2026.08.25.2',
 'windows_recovery_release':'2026.08.21.1',
}
for k,v in expected.items(): need(V.get(k)==v,f'version.json {k} drift: {V.get(k)!r} != {v!r}')

readme=text('README.md')
for label,k in [
 ('PWA / browser shell','android_release'),('Open Windows desktop','desktop_release'),('Training content','content_version'),
 ('Audited assessment bank','question_bank_version'),('Assessment quality / analytics hardening','assessment_quality_version'),
 ('Learner-scoped assessment storage','assessment_storage_scope_version'),('Question evidence approval','assessment_evidence_version'),
 ('Frozen legacy Windows recovery lane','windows_recovery_release')]:
    need(f'- {label}: `{V[k]}`' in readme,f'README release lane stale/missing: {label}')
need('qa_assessment_storage_scope.py' in readme,'README must list learner-scoped analytics QA')
need('qa_assessment_evidence.py' in readme,'README must list question evidence approval QA')
need('qa_curriculum_integration.py' in readme,'README must list curriculum integration QA')
need('qa_specialist_curriculum.py' in readme,'README must list specialist curriculum QA')
need('qa_app_shell_registry.py' in readme,'README must list canonical app-shell QA')
need('qa_mould_master_workspace.py' in readme,'README must list Mould Master workspace QA')
need('120 core lessons' in readme and 'Twelve optional specialist extensions' in readme,'README must describe current core/specialist curriculum boundary')
need(V.get('desktop_release_tag')==f"desktop-v{V['desktop_release']}",'desktop release tag/version mismatch')
need(V.get('desktop_release_url')==f"https://github.com/{V['repository']}/releases/tag/{V['desktop_release_tag']}",'desktop release URL/tag mismatch')

pkg=json.loads(text('desktop/electron/package.json'))
release_parts=[str(int(x)) for x in V['desktop_release'].split('.')]
need(pkg.get('version')=='.'.join(release_parts[:3]),'desktop package version must match desktop_release')
need(str(pkg.get('build',{}).get('buildNumber'))==release_parts[3],'desktop buildNumber must match desktop_release')
need(pkg.get('build',{}).get('buildVersion')=='.'.join(release_parts),'desktop buildVersion must match desktop_release')

android=text('ANDROID_INSTALL_README.txt')
for marker in [
 'assessment-storage-scope.js','assessment-final-hardening.js','assessment-evidence-sources.js','assessment-evidence-approval.js',
 'reference-20x-extension.js','diagnostic-learning-labs.js','material-behaviour-labs.js','process-data-diagnostics.js',
 'learning-experience.js','curriculum-integration.js','specialist-curriculum.js','learning-analytics.js',
 'app-shell-registry.js','mould-master-workspace.js','app-shell-finalize.js',
 'evidence-maturity-deep-dive.js','evidence-maturity-formal-bridge.js','lesson-evidence-depth.js','privacy.html','support.html']:
    need(marker in android,f'Android install inventory missing: {marker}')
for label,k in [('Android/PWA shell','android_release'),('Training content','content_version'),('Audited question bank','question_bank_version'),('Assessment quality / analytics hardening','assessment_quality_version'),('Learner-scoped assessment storage','assessment_storage_scope_version'),('Question evidence approval','assessment_evidence_version')]:
    need(f'{label}: {V[k]}' in android,f'Android install version stale/missing: {label}')
need('stable question IDs independent of content-release wording' in android,'Android assessment-ID description is stale')
need('All 157 keyed learner questions' in android,'Android evidence-approval question count is stale')
need('120 core lessons' in android and '12 specialist extensions' in android,'Android curriculum boundary is stale')
need('Mould Master troubleshooting cases are learner-scoped' in android,'Android Mould Master local evidence boundary missing')

upload=text('UPLOAD_README.txt')
need('LEGACY WINDOWS RECOVERY FEED' in upload,'Windows upload instructions must identify the recovery-only lane')
for label,k in [('CURRENT LEGACY RECOVERY CONTENT','windows_recovery_release'),('CURRENT PWA TRAINING CONTENT','content_version'),('CURRENT AUDITED QUESTION BANK','question_bank_version'),('CURRENT ASSESSMENT QUALITY / ANALYTICS HARDENING','assessment_quality_version'),('LEARNER-SCOPED ASSESSMENT STORAGE','assessment_storage_scope_version')]:
    need(re.search(re.escape(label)+r'\s*\n'+re.escape(V[k]),upload),f'Windows recovery doc version stale/missing: {label}')
need('must NOT be silently inserted into this legacy feed' in upload,'recovery/PWA lane separation warning missing')

support=text('support.html')
for k,id_ in {'android_release':'mmPwa','desktop_release':'mmDesktop','content_version':'mmContent','question_bank_version':'mmBank','assessment_quality_version':'mmQuality','assessment_storage_scope_version':'mmScope','assessment_evidence_version':'mmEvidence','windows_recovery_release':'mmRecovery'}.items():
    need(f'id="{id_}">{V[k]}' in support,f'support fallback version stale: {k}')
    need(f"{k}:'{id_}'" in support,f'support dynamic version mapping missing: {k}')
need("fetch('./version.json',{cache:'no-store'})" in support,'support page must synchronise from version.json')
need('MouldMaster GitHub Issues' in support and 'Do not post learner names' in support,'support contact/privacy warning missing')

privacy=text('privacy.html')
for marker in ['assessment analytics','scoped to the active learner profile','first meaningful question exposure','does not currently upload','deliberately not included in the progress backup','successful progress-backup import resets local assessment analytics','Reset local analytics','confirmed factory reset']:
    need(marker in privacy,f'privacy disclosure missing: {marker}')

sw=text('service-worker.js')
for marker in ["'./privacy.html'","'./support.html'","'./assessment-storage-scope.js'","'./assessment-evidence-sources.js'","'./assessment-evidence-approval.js'","'./curriculum-integration.js'","'./specialist-curriculum.js'","'./app-shell-registry.js'","'./mould-master-workspace.js'","'./app-shell-finalize.js'"]:
    need(marker in sw,f'offline compliance/runtime asset missing: {marker}')

for name in ['README.md','ANDROID_INSTALL_README.txt','support.html','UPLOAD_README.txt']:
    t=text(name);need('2026.08.23.10' not in t and '2026.08.23.5' not in t,f'stale August 23 release identifier remains in {name}')

print('MouldMaster release/documentation coherence QA passed')
