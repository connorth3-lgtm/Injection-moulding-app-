from pathlib import Path
import json
import os
import re
import shutil
import subprocess

ROOT=Path(__file__).resolve().parent
def text(name): return (ROOT/name).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

version=json.loads(text('version.json'))
web=str(version.get('web_release',''))
need(re.fullmatch(r'\d{4}\.\d{2}\.\d{2}\.\d+',web) is not None,'web_release must use YYYY.MM.DD.N')
need(version.get('android_release'),'android_release must remain an independent platform release')

sw=text('service-worker.js')
rev=re.search(r"^const CACHE_REVISION='([^']+)';$",sw,re.M)
need(rev is not None,'service-worker cache revision missing')
need(f"const CACHE_VERSION='{web}';" in sw,'service-worker cache version is not web_release')
expected=f'mouldmaster-static-{web}-{rev.group(1)}'

idx=text('index.html')
need(f'const SHELL_RELEASE="{web}";' in idx,'index shell release is not web_release')
need('const RUNTIME_ASSET_VERSION=SHELL_RELEASE;' in idx,'runtime asset query identity is not derived from web_release')
need(f'const EXPECTED_STATIC_CACHE="{expected}";' in idx,'index expected cache is not derived from web_release + cache revision')
need(f"const RELEASE='{web}';" in text('pwa-shell.js'),'PWA display release is not web_release')

subprocess.run(['python','tools/sync_web_release.py','--check'],cwd=ROOT,check=True)
env=os.environ.copy();env['GITHUB_SHA']='0123456789abcdef0123456789abcdef01234567';env['GITHUB_REF_NAME']='qa-web-release'
subprocess.run(['python','tools/build_pages_artifact.py'],cwd=ROOT,env=env,check=True)
deployment=json.loads(text('.pages-dist/deployment.json'))
manifest=json.loads(text('.pages-dist/pages-manifest.json'))
for payload,label in [(deployment,'deployment'),(manifest,'pages manifest')]:
    need(payload.get('web_release')==web,f'{label} does not preserve canonical web_release')
    need(payload.get('source_sha')==env['GITHUB_SHA'],f'{label} does not preserve deployment source_sha provenance')
    need(payload.get('schema')==3,f'{label} schema was not advanced for web_release metadata')
need(deployment.get('service_worker_cache_version')==web,'deployment cache version does not equal web_release')
shutil.rmtree(ROOT/'.pages-dist',ignore_errors=True)
print(f'MouldMaster web release identity QA passed ({web}; source_sha remains independent provenance)')
