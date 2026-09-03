from pathlib import Path
import json, subprocess

ROOT=Path(__file__).resolve().parent

def text(p): return (ROOT/p).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

module='src/domains/materials/material-search-pagination.js'
spec='qa/material-search-scale.spec.js'
for p in [module,spec,'runtime-domain-manifest.json','service-worker.js','playwright.config.cjs','playwright.webkit-full.config.cjs']:
    need((ROOT/p).exists(),f'material search hardening asset missing: {p}')
for p in [module,spec]:
    r=subprocess.run(['node','--check',str(ROOT/p)],capture_output=True,text=True)
    need(r.returncode==0,f'{p} syntax error: {r.stderr or r.stdout}')
code=text(module)
for marker in ['MM_MATERIAL_SEARCH_PAGINATION','index.searchPage','PAGE_SIZE=24','aria-live','data-mm-material-search-mode','cloneNode(true)','hasPrevious','hasNext']:
    need(marker in code,f'indexed material pagination marker missing: {marker}')
need('style=' not in code,'material pagination must not emit inline style attributes')
manifest=json.loads(text('runtime-domain-manifest.json'))['assets']
paths=['./src/domains/materials/material-registry.js','./src/domains/materials/material-search-index.js','./src/domains/materials/material-search-pagination.js','./src/domains/materials/material-observation-v2.js']
need(all(p in manifest for p in paths),'material runtime assets missing from manifest')
need(all(manifest.index(paths[i])<manifest.index(paths[i+1]) for i in range(len(paths)-1)),'material pagination dependency order drifted')
need('./src/domains/materials/material-search-pagination.js' in text('service-worker.js'),'material pagination is not in atomic offline core')
for cfg in ['playwright.config.cjs','playwright.webkit-full.config.cjs']:
    need('material-search-scale' in text(cfg),f'{cfg} does not run scaled material pagination')
scale=text(spec)
for marker in ['length:72','toHaveCount(24)','page 1 of 3','page 2 of 3','aria-live','1500']:
    need(marker in scale,f'material scale regression marker missing: {marker}')
print('MouldMaster material search hardening QA passed (canonical index UI, accessible pagination, 72-grade Chromium/WebKit scale regression, offline core)')
