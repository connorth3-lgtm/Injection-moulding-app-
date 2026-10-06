from pathlib import Path
from datetime import date
import json, re

ROOT=Path(__file__).resolve().parent

def text(p): return (ROOT/p).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

V=json.loads(text('version.json'))
expected={
 'web_release':'2026.10.07.6',
 'android_release':'2026.08.26.2',
 'desktop_release':'2026.09.29.1',
 'content_version':'2026.08.26.1',
 'question_bank_version':'2026.08.30.1',
 'assessment_quality_version':'2026.08.24.3',
 'assessment_storage_scope_version':'2026.08.24.4',
 'assessment_evidence_version':'2026.10.05.1',
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
need('qa_mould_master_workspace.py' in readme,'README must list Mould Master workspace QA')
need('qa_process_data_integrity.cjs' in readme,'README must list process-data integrity regression QA')
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
need(pkg.get('devDependencies',{}).get('electron')=='44.4.5','desktop runtime must remain pinned to reviewed Electron 44.4.5')
need(lock.get('packages',{}).get('',{}).get('devDependencies',{}).get('electron')=='44.4.5','desktop lock must resolve reviewed Electron 44.4.5')
electron_support=text('desktop/electron/ELECTRON_44_SUPPORT.md')
for marker in [
 'Electron `44.4.5`',
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
 'https://releases.electronjs.org/release/v44.4.5',
]:
    need(marker in electron_support,f'Electron 44 support policy missing marker: {marker}')

desktop_readme=text('desktop/electron/README.md')
for marker in ['Electron 44.4.5','Windows 10/11 64-bit','ELECTRON_44_SUPPORT.md','127.0.0.1:43139']:
    need(marker in desktop_readme,f'desktop README Electron 44/stable-origin marker missing: {marker}')

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
 'assessment-storage-scope.js','src/domains/assessment/assessment-final-hardening.js','assessment-evidence-sources.js','assessment-evidence-approval.js',
 'src/domains/research/reference-20x-extension.js','diagnostic-learning-labs.js','material-behaviour-labs.js','process-data-diagnostics.js',
 'learning-experience.js','curriculum-integration.js','specialist-curriculum.js','src/domains/learning/specialist-evidence-gap-extension.js','learning-analytics.js',
 'src/domains/shell/app-shell-registry.js','mould-master-workspace.js','src/domains/shell/app-shell-finalize.js',
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
learner_ui=text('src/domains/shell/learner-ui-polish.js')
for k,id_ in {'web_release':'mmPwa','desktop_release':'mmDesktop','content_version':'mmContent','question_bank_version':'mmBank','assessment_quality_version':'mmQuality','assessment_storage_scope_version':'mmScope','assessment_evidence_version':'mmEvidence','windows_recovery_release':'mmRecovery'}.items():
    need(f'id="{id_}">{V[k]}' in support,f'support fallback version stale: {k}')
    need(f"{k}:'{id_}'" in support,f'support dynamic version mapping missing: {k}')
need("fetch('./version.json',{cache:'no-store'})" in support,'support page must synchronise from version.json')
need('MouldMaster GitHub Issues' in support and 'Do not post learner names' in support,'support contact/privacy warning missing')
need('Learning insights events' in support and 'resets both analytics histories' in support,'support import analytics lifecycle disclosure is stale')
for marker in ('Data &amp; Reset','mouldmaster-process-data-v1','mouldmaster-engineering-v2','Delete all local process-data evidence','Full erasure is reserved','browser/OS site-data controls'):
    need(marker in support,f'support Data & Reset ownership map missing marker: {marker}')
for marker in ['measured-assessment','process-diagnostics','Diagnostic Learning Lab','Material Behaviour Lab']:
    need(marker in support,f'support backup/reset scope disclosure missing: {marker}')

privacy=text('privacy.html')
for marker in ['assessment analytics','scoped to the active learner profile','first meaningful question exposure','does not currently upload','deliberately not included in the progress backup','successful progress-backup import resets local assessment analytics and Learning insights analytics','orphaned buckets','Reset local analytics','Reset learner data','other local learner profiles','all local learner profiles','replaces the local learner registry','measured-assessment','process-diagnostics','Diagnostic Learning Lab','Material Behaviour Lab','10 MiB','Delete all local process-data evidence','mouldmaster-process-data-v1']:
    need(marker in privacy,f'privacy disclosure missing: {marker}')
need('scoped cleanup or clean learner write cannot be verified' in privacy,'privacy notice must disclose fail-closed learner-reset cleanup/write behavior')
need('replaces the local learner registry after confirmation' in support,'support must disclose destructive backup registry replacement before import')
need("support.html#data-reset" in learner_ui and "Data & Reset" in learner_ui,'Profile must link to the canonical Data & Reset guide')

sw=text('service-worker.js')
for marker in ["'./privacy.html'","'./support.html'","'./src/domains/runtime-packs/assessment-foundation-runtime-pack.js'","'./src/domains/runtime-packs/evidence-runtime-pack.js'","'./src/domains/runtime-packs/assessment-evidence-depth-runtime-pack.js'","'./src/domains/runtime-packs/curriculum-workspace-runtime-pack.js'","'./src/domains/shell/app-shell-registry.js'","'./src/domains/runtime-packs/shell-finalization-runtime-pack.js'"]:
    need(marker in sw,f'offline compliance/runtime asset missing: {marker}')

for name in ['README.md','ANDROID_INSTALL_README.txt','support.html','UPLOAD_README.txt']:
    t=text(name);need('2026.08.23.10' not in t and '2026.08.23.5' not in t,f'stale August 23 release identifier remains in {name}')


pwa_shell=text('src/domains/shell/pwa-shell.js')
need('Android release ${RELEASE}' not in pwa_shell,'PWA shell must not relabel the independent Android lane with the web release')
need('data-mm-android-pwa' not in pwa_shell,'retired Android/web label coupling must not return')

visual=json.loads(text('qa/visual-regression-baseline.json'))
need(re.fullmatch(r'[0-9a-f]{40}',str(visual.get('commit') or '')) is not None,'visual baseline commit must be an exact SHA')
need(visual.get('ref')==f"visual-baseline/{visual.get('release')}",'visual baseline must use the release-named retained ref')
mobile_workflow=text('.github/workflows/mobile-browser-qa.yml')
for marker in ['BASELINE_REF','refs/heads/$BASELINE_REF','FETCHED_BASELINE_SHA','Visual baseline ref drifted']:
    need(marker in mobile_workflow,f'mobile visual baseline retention guard missing: {marker}')
prune_workflow=text('.github/workflows/prune-merged-branches.yml')
need('visual-baseline/*' in prune_workflow,'merged-branch pruning must explicitly preserve visual baseline refs')

print('MouldMaster release/documentation coherence QA passed')