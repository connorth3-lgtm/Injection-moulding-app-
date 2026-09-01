from pathlib import Path
import json

ROOT=Path(__file__).resolve().parent
STATE=ROOT/'sources'/'LEGACY_RETIREMENT_STATE.md'
EVIDENCE=ROOT/'data'/'legacy-windows-retirement-evidence.json'
RECOVERY=ROOT/'MouldMasterAcademy.exe'
COMPAT=ROOT/'MouldMaster_Academy_App.html'
REAL=ROOT/'desktop'/'electron'/'REAL_WINDOWS_VALIDATION.md'


def need(ok,msg):
    if not ok: raise AssertionError(msg)

need(STATE.exists(),'legacy retirement state document missing')
text=STATE.read_text(encoding='utf-8')
for marker in ['retired / absent from branch inventory','retained — retirement blocked by required real-Windows evidence','data/legacy-windows-retirement-evidence.json','approved-for-retirement','content_copied_to_evidence: false','must require `MouldMasterAcademy.exe` to remain present']:
    need(marker in text,f'legacy retirement state marker missing: {marker}')
need(REAL.exists(),'real Windows validation protocol missing')
protocol=REAL.read_text(encoding='utf-8')
for marker in ['manual evidence required','normal Windows 10/11','real legacy backup','offline launch','imported certificate/pass state is not trusted']:
    need(marker in protocol,f'real Windows retirement prerequisite missing: {marker}')

if not EVIDENCE.exists():
    need(RECOVERY.exists(),'legacy recovery executable was removed before real-Windows retirement evidence existed')
    need(COMPAT.exists(),'compatibility loader was removed before real-Windows retirement evidence existed')
    print('Legacy retirement QA passed: Pages legacy branch is governed as absent; Windows recovery remains correctly retained pending real-machine evidence.')
else:
    data=json.loads(EVIDENCE.read_text(encoding='utf-8'))
    need(data.get('schema')==1,'legacy retirement evidence schema must be 1')
    need(data.get('status')=='approved-for-retirement','legacy retirement evidence is not approved-for-retirement')
    release=str(data.get('desktop_release',''));need(release and release.count('.')==3,'tested desktop release missing')
    digest=str(data.get('executable_sha256',''));need(len(digest)==64 and all(c in '0123456789abcdefABCDEF' for c in digest),'retirement executable SHA-256 malformed')
    need(str(data.get('windows_version','')).strip(),'Windows validation version missing')
    for field in ['launch_passed','persistence_passed','restart_persistence_passed','offline_launch_passed','real_backup_import_passed','certificate_state_rejected','keyboard_navigation_passed']:
        need(data.get(field) is True,f'real-Windows retirement evidence failed/incomplete: {field}')
    need(data.get('content_copied_to_evidence') is False,'retirement evidence must not copy legacy backup content')
    need(str(data.get('reviewed_on','')).strip() and str(data.get('reviewer','')).strip(),'retirement evidence review metadata missing')
    need(not RECOVERY.exists(),'approved retirement evidence exists but legacy recovery executable is still present; retirement PR is incomplete')
    print('Legacy retirement QA passed: real-machine evidence approved and the frozen recovery executable has been removed.')
