from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
PROTOCOL = ROOT / 'desktop' / 'electron' / 'REAL_WINDOWS_VALIDATION.md'
EVIDENCE = ROOT / 'data' / 'legacy-windows-retirement-evidence.json'
RECOVERY = ROOT / 'MouldMasterAcademy.exe'
COMPAT_LOADER = ROOT / 'MouldMaster_Academy_App.html'
LATEST = ROOT / 'latest.json'


def need(ok, message):
    if not ok:
        raise AssertionError(message)


need(PROTOCOL.exists(), 'real-Windows validation protocol is missing')
protocol = PROTOCOL.read_text(encoding='utf-8')
for marker in [
    'manual evidence required',
    'normal Windows 10/11',
    'real legacy backup',
    'offline launch',
    'imported certificate/pass state is **not** trusted',
    'keyboard/navigation smoke checks pass',
    'Do **not** publish learner names, backup content, customer identifiers, proprietary process data',
]:
    need(marker in protocol, f'real-Windows retirement prerequisite missing: {marker}')

if not EVIDENCE.exists():
    need(RECOVERY.exists(), 'legacy recovery executable was removed before approved real-Windows retirement evidence existed')
    need(COMPAT_LOADER.exists(), 'legacy compatibility loader was removed before approved real-Windows retirement evidence existed')
    need(LATEST.exists(), 'legacy recovery feed was removed before approved real-Windows retirement evidence existed')
    latest = json.loads(LATEST.read_text(encoding='utf-8'))
    digest = str(latest.get('launcher_sha256', ''))
    need(re.fullmatch(r'[0-9a-fA-F]{64}', digest) is not None, 'pending recovery feed must retain a valid launcher SHA-256')
    need(str(latest.get('launcher_url', '')).strip(), 'pending recovery feed must retain a launcher URL')
    need(str(latest.get('version', '')).strip(), 'pending recovery feed must retain an explicit recovery version')
    print('Legacy retirement state QA passed: pending real-Windows evidence; frozen recovery executable and feed remain present and hash-governed.')
else:
    data = json.loads(EVIDENCE.read_text(encoding='utf-8'))
    need(data.get('schema') == 1, 'legacy retirement evidence schema must be 1')
    need(data.get('status') == 'approved-for-retirement', 'legacy retirement evidence must be explicitly approved-for-retirement')
    release = str(data.get('desktop_release', '')).strip()
    need(re.fullmatch(r'\d{4}\.\d{1,2}\.\d{1,2}\.\d+', release) is not None, 'tested desktop release is missing or malformed')
    digest = str(data.get('executable_sha256', '')).strip()
    need(re.fullmatch(r'[0-9a-fA-F]{64}', digest) is not None, 'retirement executable SHA-256 is malformed')
    need(str(data.get('windows_version', '')).strip(), 'Windows validation version is missing')
    for field in [
        'launch_passed',
        'persistence_passed',
        'restart_persistence_passed',
        'offline_launch_passed',
        'real_backup_import_passed',
        'certificate_state_rejected',
        'keyboard_navigation_passed',
    ]:
        need(data.get(field) is True, f'real-Windows retirement evidence failed or is incomplete: {field}')
    need(data.get('content_copied_to_evidence') is False, 'retirement evidence must never copy legacy learner-backup content')
    need(str(data.get('reviewed_on', '')).strip(), 'retirement evidence review date is missing')
    need(str(data.get('reviewer', '')).strip(), 'retirement evidence reviewer is missing')
    forbidden = {'learner_name', 'learner_names', 'backup_content', 'customer_id', 'customer_identifier', 'filesystem_path', 'user_path'}
    leaked = forbidden.intersection(data.keys())
    need(not leaked, f'retirement evidence contains forbidden sensitive-content fields: {sorted(leaked)}')
    need(not RECOVERY.exists(), 'approved retirement evidence exists but the frozen recovery executable is still present')
    if LATEST.exists():
        latest = json.loads(LATEST.read_text(encoding='utf-8'))
        stale = [key for key in ('launcher_url', 'launcher_sha256', 'launcher_version') if latest.get(key)]
        need(not stale, f'approved retirement evidence exists but recovery feed still exposes launcher fields: {stale}')
    print('Legacy retirement state QA passed: approved non-sensitive real-Windows evidence exists; frozen recovery executable and launcher feed references are retired.')
