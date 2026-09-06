from pathlib import Path
import hashlib, json, re, runpy

# Apply the audited UI migration first.
runpy.run_path('tools/ui_consolidation_migration_v2.py', run_name='__main__')

# The mobile navigation icon change modifies the audited core bytes. Keep the
# Windows recovery feed and release QA pinned to the exact new core content.
core=Path('MouldMaster_Core_App.html').read_bytes()
core_sha=hashlib.sha256(core).hexdigest()

latest_path=Path('latest.json')
latest=json.loads(latest_path.read_text(encoding='utf-8'))
latest['sha256']=core_sha
latest_path.write_text(json.dumps(latest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

qa_path=Path('qa_release.py')
qa=qa_path.read_text(encoding='utf-8')
qa,n=re.subn(r'^CORE_SHA256 = "[0-9a-f]{64}"$',f'CORE_SHA256 = "{core_sha}"',qa,count=1,flags=re.M)
if n!=1: raise SystemExit('qa_release.py CORE_SHA256 marker not found exactly once')
qa_path.write_text(qa,encoding='utf-8')

print('audited core SHA-256:',core_sha)
print('UI consolidation v3 complete')
