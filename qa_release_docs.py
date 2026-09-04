from pathlib import Path
import json, re

ROOT=Path(__file__).resolve().parent

def text(p): return (ROOT/p).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

V=json.loads(text('version.json'))
expected={
 'android_release':'2026.08.26.2',
 'desktop_release':'2026.08.26.6',
 'content_version':'2026.08.26.1',
 'question_bank_version':'2026.08.30.1',
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
need('all 30 technical exam items now use evidence-based reasoning' in readme.lower(),'README must describe the evidence-diagnostic technical bank')
need('qa_assessment_storage_scope.py' in readme,'README must list learner-scoped analytics QA')
need('qa_assessment_evidence.py' in readme,'README must list question evidence approval QA')
need('qa_curriculum_integration.py' in readme,'README must list curriculum integration QA')
need('qa_specialist_curriculum.py' in readme,'README must list specialist curriculum QA')
need('qa_evidence_coverage.py' in readme,'README must list mechanism evidence coverage QA')
need('qa_mechanism_promotion.py' in readme,'README must list mechanism promotion QA')
need('qa_specialist_evidence_gaps.py' in readme,'README must list specialist evidence-status QA')
need('qa_app_shell_registry.py' in readme,'README must list canonical app-shell QA')
need('qa_mould_master_workspace.py' in readme,'README must list Mould Master workspace QA')
need('120 core lessons' in readme and '20 lessons total' in readme and 'S13–S20' in readme,'README must describe current 120-core / 20-optional specialist curriculum boundary')
need('learner completion never promotes evidence maturity' in readme,'README must preserve learner-completion/evidence-maturity separation')
need(V.get('desktop_release_tag')==f"desktop-v{V['desktop_release']}",'desktop release tag/version mismatch')
need(V.get('desktop_release_url')==f"https://github.com/{V['repository']}/releases/tag/{V['desktop_release_tag']}",'desktop release URL/tag mismatch')

pkg=json.loads(text('desktop/electron/package.json'))
lock=json.loads(text('desktop/electron/package-lock.json'))
release_parts=[str(int(x)) for x in V['desktop_release'].split('.')]
need(pkg.get('version')=='.'.join(release_parts[:3]),'desktop package version must match desktop_release')
need(str(pkg.get('build',{}).get('buildNumber'))==release_parts[3],'desktop buildNumber must match desktop_release fourth component')
need(pkg.get('build',{}).get('buildVersion')=='.'.join(release_parts),'desktop buildVersion must match desktop_release')

# Electron 44 is an explicit supported-platform decision, not just a package bump.
need(pkg.get('devDependencies',{}).get('electron')=='44.1.1','desktop runtime must remain pinned to reviewed Electron 44.1.1')
need(lock.get('packages',{}).get('',{}).get('devDependencies',{}).get('electron')=='44.1.1','desktop lock must resolve reviewed Electron 44.1.1')
electron_support=text('desktop/electron/ELECTRON_44_SUPPORT.md')
for marker in [
 'Electron `44.1.1`',
 'Windows 10/11, 64-bit only',
 'GitHub portable/NSIS validation lane is x64',
 'Microsoft Store MSIX lane packages x64 and arm64',
 'Windows ia32 is not a supported MouldMaster target',
 'clipboard',
 'net.request',
 'select-client-certificate',
 'setLoginItemSettings',
 'ANGLE is statically linked',
 'https://www.electronjs.org/blog/electron-44-0',
 'https://releases.electronjs.org/release/v44.1.1',
]:
    need(marker in electron_support,f'Electron 44 support policy missing marker: {marker}')

desktop_readme=text('desktop/electron/README.md')
for marker in ['Electron 44.1.1','Windows 10/11 64-bit','ELECTRON_44_SUPPORT.md']:
    need(marker in desktop_readme,f'desktop README Electron 44 support marker missing: {marker}')

# The manual retirement guide is release evidence too. Keep its human test target
# tied to version.json so a desktop release bump cannot leave operators testing stale bytes.
real_windows_validation=text('desktop/electron/REAL_WINDOWS_VALIDATION.md')
desktop_build_version='.'.join(release_parts)
for marker in [
    f"Target release family: open desktop `{V['desktop_release']}`",
    f"`MouldMaster-Academy-{desktop_build_version}-x64.exe`",
    f"displayed desktop release is `{V['desktop_release']}`",
]:
    need(marker in real_windows_validation,f'real Windows validation guide stale/missing: {marker}')
need('2026.08.26.5' not in real_windows_validation and '2026.8.26.5' not in real_windows_validation,'real Windows validation guide still targets superseded desktop .5 bytes')

privileged_parts=[]
for folder in [ROOT/'desktop/electron/src', ROOT/'desktop/electron/scripts']:
    for path in sorted(folder.rglob('*')):
        if path.is_file() and path.suffix in {'.cjs','.js'}:
            privileged_parts.append(path.read_text(encoding='utf-8'))
privileged_code='\n'.join(privileged_parts)
for token in ['clipboard', 'net.request', 'select-client-certificate', 'setLoginItemSettings']:
    need(token not in privileged_code,f'Electron 44 affected API introduced without compatibility review: {token}')
store_workflow=text('.github/workflows/microsoft-store-msix.yml')
need('node scripts/run-msix-builder.cjs --win msix --x64 --arm64' in store_workflow,'Store MSIX lane must preserve x64+arm64 Electron 44 targets')
need('--ia32' not in store_workflow,'Store MSIX lane must not reintroduce removed Electron 44 ia32 targeting')

android=text('ANDROID_INSTALL_README.txt')
for marker in [
 'assessment-storage-scope.js','assessment-final-hardening.js','assessment-evidence-sources.js','assessment-evidence-approval.js',
 'reference-20x-extension.js','diagnostic-learning-labs.js','material-behaviour-labs.js','process-data-diagnostics.js',
 'learning-experience.js','curriculum-integration.js','specialist-curriculum.js','specialist-evidence-gap-extension.js','learning-analytics.js',
 'app-shell-registry.js','mould-master-workspace.js','app-shell-finalize.js',
 'evidence-maturity-deep-dive.js','evidence-maturity-formal-bridge.js','lesson-evidence-depth.js','privacy.html','support.html']:
    need(marker in android,f'Android install inventory missing: {marker}')
for label,k in [('Android/PWA shell','android_release'),('Training content','content_version'),('Audited question bank','question_bank_version'),('Assessment quality / analytics hardening','assessment_quality_version'),('Learner-scoped assessment storage','assessment_storage_scope_version'),('Question evidence approval','assessment_evidence_version')]:
    need(f'{label}: {V[k]}' in android,f'Android install version stale/missing: {label}')
need('stable question IDs independent of content-release wording' in android,'Android assessment-ID description is stale')
need('All 157 keyed learner questions' in android,'Android evidence-approval question count is stale')
need('120 core lessons' in android and '20 optional specialist lessons total' in android,'Android curriculum boundary is stale')
need('S13-S20 evidence maturity is registry-controlled' in android,'Android specialist evidence-status boundary missing')
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
for marker in ["'./privacy.html'","'./support.html'","'./assessment-storage-scope.js'","'./assessment-evidence-sources.js'","'./assessment-evidence-approval.js'","'./curriculum-integration.js'","'./specialist-curriculum.js'","'./specialist-evidence-gap-extension.js'","'./app-shell-registry.js'","'./mould-master-workspace.js'","'./app-shell-finalize.js'"]:
    need(marker in sw,f'offline compliance/runtime asset missing: {marker}')

for name in ['README.md','ANDROID_INSTALL_README.txt','support.html','UPLOAD_README.txt']:
    t=text(name);need('2026.08.23.10' not in t and '2026.08.23.5' not in t,f'stale August 23 release identifier remains in {name}')

print('MouldMaster release/documentation coherence QA passed')