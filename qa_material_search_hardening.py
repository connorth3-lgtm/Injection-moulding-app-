from pathlib import Path
import json, subprocess

ROOT=Path(__file__).resolve().parent

def text(p): return (ROOT/p).read_text(encoding='utf-8')
def need(ok,msg):
    if not ok: raise AssertionError(msg)

registry='src/domains/materials/material-registry.js'
module='src/domains/materials/material-search-pagination.js'
spec='qa/material-search-scale.spec.js'
unified_spec='qa/material-unified-search.spec.js'
for p in [registry,module,spec,unified_spec,'src/domains/materials/material-search-index.js','runtime-domain-manifest.json','service-worker.js','playwright.config.cjs','playwright.webkit-full.config.cjs']:
    need((ROOT/p).exists(),f'material search hardening asset missing: {p}')
for p in [registry,module,spec,unified_spec,'src/domains/materials/material-search-index.js']:
    r=subprocess.run(['node','--check',str(ROOT/p)],capture_output=True,text=True)
    need(r.returncode==0,f'{p} syntax error: {r.stderr or r.stdout}')
code=text(module)
for marker in ['MM_MATERIAL_SEARCH_PAGINATION','index.searchPage','index.searchAllPage','PAGE_SIZE=24','ALL_PAGE_SIZE=12','data-mm-all-material-index','aria-live','mmMaterialSearchMode','cloneNode(true)','hasPrevious','hasNext']:
    need(marker in code,f'indexed material pagination marker missing: {marker}')
need('style=' not in code,'material pagination must not emit inline style attributes')
registry_code=text(registry)
need(registry_code.count("host=document.getElementById('materials')")>=2,'material registry must re-resolve the live materials host after async catalog load')
need("style();const c=await load();\n  host=document.getElementById('materials');if(!host||host.querySelector('#mmExactMaterialCatalog'))return false;" in registry_code,'material registry must re-check catalog ownership after async load')
manifest=json.loads(text('runtime-domain-manifest.json'))['assets']
paths=['./src/domains/materials/material-registry.js','./src/domains/materials/material-search-index.js','./src/domains/materials/material-search-pagination.js','./src/domains/materials/material-observation-v2.js']
need(all(p in manifest for p in paths),'material runtime assets missing from manifest')
need(all(manifest.index(paths[i])<manifest.index(paths[i+1]) for i in range(len(paths)-1)),'material pagination dependency order drifted')
need('./src/domains/materials/material-search-pagination.js' in text('service-worker.js'),'material pagination is not in atomic offline core')
for cfg in ['playwright.config.cjs','playwright.webkit-full.config.cjs']:
    need('material-search-scale' in text(cfg),f'{cfg} does not run scaled material pagination')
    need('material-unified-search' in text(cfg),f'{cfg} does not run unified material index regression')
scale=text(spec)
for marker in ['length:72','toHaveCount(1)','toHaveCount(24)','page 1 of 3','page 2 of 3','aria-live','1500']:
    need(marker in scale,f'material scale regression marker missing: {marker}')
index_code=text('src/domains/materials/material-search-index.js')
for marker in ['searchAllPage','referenceDocuments','labDocuments','exactGradeDocument','window.MM_REFERENCE_DATA','window.MM_MATERIAL_BEHAVIOUR_LABS','window.MM_MATERIAL_PRACTICE_EXTENSIONS']:
    need(marker in index_code,f'unified material index marker missing: {marker}')
unified=text(unified_spec)
for marker in ['maximum moisture content','hydrolysis','formaldehyde','reference-material','material-lab','Show exact grade']:
    need(marker in unified,f'unified material search regression marker missing: {marker}')
print('MouldMaster material search hardening QA passed (race-safe exact catalog plus unified published-material index, accessible pagination, Chromium/WebKit regression, offline core)')
