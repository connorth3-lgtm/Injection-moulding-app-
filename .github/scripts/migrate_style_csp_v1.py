#!/usr/bin/env python3
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[2]

def read(path): return (ROOT/path).read_text(encoding='utf-8')
def write(path,content): (ROOT/path).write_text(content,encoding='utf-8')
def replace_once(text,old,new,label):
    count=text.count(old)
    if count!=1: raise SystemExit(f'{label}: expected exactly one match, found {count}')
    return text.replace(old,new,1)

# Bootstrap the style bridge before any replayed core scripts and rewrite frozen
# style attributes to inert data before the strict CSP becomes active.
index=read('index.html')
index=replace_once(
    index,
    "      ['reading-patch.css','<link rel=\"stylesheet\" href=\"./reading-patch.css\">'],\n",
    "      ['reading-patch.css','<link rel=\"stylesheet\" href=\"./reading-patch.css\">'],\n      ['inline-style-bridge.js','<script src=\"./src/core-runtime/inline-style-bridge.js\"></scr'+'ipt>'],\n",
    'style bridge HEAD asset',
)
old_prepare='    function retireInlineHandlerAttrs(parsed){for(const eventName of ["click","change","input","keydown"]){const attr="on"+eventName;for(const element of Array.from(parsed.querySelectorAll(`[${attr}]`))){element.setAttribute(`data-mm-on${eventName}`,element.getAttribute(attr)||"");element.removeAttribute(attr)}}return parsed}\n    function prepareDocument(html){const parsed=new DOMParser().parseFromString(html,"text/html");if(!parsed.documentElement||!parsed.head||!parsed.body)throw new Error("Core training document could not be parsed");retireInlineHandlerAttrs(parsed);const scripts=[];'
new_prepare='    function retireInlineHandlerAttrs(parsed){for(const eventName of ["click","change","input","keydown"]){const attr="on"+eventName;for(const element of Array.from(parsed.querySelectorAll(`[${attr}]`))){element.setAttribute(`data-mm-on${eventName}`,element.getAttribute(attr)||"");element.removeAttribute(attr)}}return parsed}\n    function retireInlineStyleAttrs(parsed){for(const element of Array.from(parsed.querySelectorAll("[style]"))){element.setAttribute("data-mm-style",element.getAttribute("style")||"");element.removeAttribute("style")}return parsed}\n    function prepareDocument(html){const parsed=new DOMParser().parseFromString(html,"text/html");if(!parsed.documentElement||!parsed.head||!parsed.body)throw new Error("Core training document could not be parsed");retireInlineHandlerAttrs(parsed);retireInlineStyleAttrs(parsed);const scripts=[];'
index=replace_once(index,old_prepare,new_prepare,'frozen style attribute retirement')
index=replace_once(
    index,
    'retry.style.cssText="padding:10px 14px;border-radius:10px;border:1px solid #41658d;background:#1a2b45;color:#fff";',
    'retry.style.padding="10px 14px";retry.style.borderRadius="10px";retry.style.border="1px solid #41658d";retry.style.background="#1a2b45";retry.style.color="#fff";',
    'bootstrap retry cssText retirement',
)
index=index.replace('mouldmaster-static-2026.09.03.1-maturity-hardening-v2-r5-20260903','mouldmaster-static-2026.09.03.1-maturity-hardening-v2-r6-20260904',1)
write('index.html',index)

worker=read('service-worker.js')
worker=replace_once(worker,"const CACHE_REVISION='maturity-hardening-v2-r5-20260903';","const CACHE_REVISION='maturity-hardening-v2-r6-20260904';",'service worker cache revision')
marker="  './MouldMaster_Core_App.html',\n"
if "'./src/core-runtime/inline-style-bridge.js'" not in worker:
    worker=replace_once(worker,marker,marker+"  './src/core-runtime/inline-style-bridge.js',\n",'style bridge offline core')
write('service-worker.js',worker)

# Make core generation permanently transform the sole cssText assignment and
# understand the style bridge/cache revision.
gen=read('tools/externalize_core_scripts.py')
gen=replace_once(gen,"HANDLER_BRIDGE_PATH = OUT_DIR / \"inline-handler-bridge.js\"\n","HANDLER_BRIDGE_PATH = OUT_DIR / \"inline-handler-bridge.js\"\nSTYLE_BRIDGE_PATH = OUT_DIR / \"inline-style-bridge.js\"\n",'generator style bridge constant')
old_transform='def runtime_transform(name: str, source: str) -> str:\n    transformed = source\n    if name == "core-inline-004.js":\n'
new_transform='''def runtime_transform(name: str, source: str) -> str:\n    transformed = source\n    if name == "core-inline-001.js":\n        old = \'''    box.style.cssText =\n      "position:fixed;inset:16px;z-index:999999;background:#20151a;color:#fff;" +\n      "border:2px solid #ff7b86;border-radius:14px;padding:18px;overflow:auto;" +\n      "font-family:system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5)";\'''\n        new = \'''    box.style.position = "fixed";\n    box.style.inset = "16px";\n    box.style.zIndex = "999999";\n    box.style.background = "#20151a";\n    box.style.color = "#fff";\n    box.style.border = "2px solid #ff7b86";\n    box.style.borderRadius = "14px";\n    box.style.padding = "18px";\n    box.style.overflow = "auto";\n    box.style.fontFamily = "system-ui,sans-serif";\n    box.style.boxShadow = "0 20px 60px rgba(0,0,0,.5)";\'''\n        if transformed.count(old) != 1:\n            fail("frozen startup failure cssText source drifted; review the runtime hardening transform")\n        transformed = transformed.replace(old, new, 1)\n    if name == "core-inline-004.js":\n'''
gen=replace_once(gen,old_transform,new_transform,'generator cssText transform')
old_csp='''def tighten_script_csp(index: str) -> str:\n    old = "script-src 'self'; script-src-attr 'unsafe-inline'; style-src 'self' 'unsafe-inline';"\n    new = "script-src 'self'; script-src-attr 'none'; style-src 'self' 'unsafe-inline';"\n    if old in index:\n        return index.replace(old, new, 1)\n    if new in index:\n        return index\n    fail("index.html CSP shape was not recognised")\n'''
new_csp='''def tighten_script_csp(index: str) -> str:\n    old = "script-src 'self'; script-src-attr 'unsafe-inline';"\n    new = "script-src 'self'; script-src-attr 'none';"\n    if old in index:\n        return index.replace(old, new, 1)\n    if new in index:\n        return index\n    fail("index.html script CSP shape was not recognised")\n'''
gen=replace_once(gen,old_csp,new_csp,'generator script-only CSP tightening')
gen=gen.replace('old_revision = "maturity-hardening-v2-r4-20260903"','old_revision = "maturity-hardening-v2-r5-20260903"',1)
gen=gen.replace('new_revision = "maturity-hardening-v2-r5-20260903"','new_revision = "maturity-hardening-v2-r6-20260904"',1)
gen=gen.replace('old_cache = "mouldmaster-static-2026.08.26.2-maturity-hardening-v2-r4-20260903"','old_cache = "mouldmaster-static-2026.09.03.1-maturity-hardening-v2-r5-20260903"',1)
gen=gen.replace('new_cache = "mouldmaster-static-2026.08.26.2-maturity-hardening-v2-r5-20260903"','new_cache = "mouldmaster-static-2026.09.03.1-maturity-hardening-v2-r6-20260904"',1)
check_marker='''    if not HANDLER_BRIDGE_PATH.is_file():\n        fail("strict handler bridge source is missing")\n'''
gen=replace_once(gen,check_marker,check_marker+'''    if not STYLE_BRIDGE_PATH.is_file():\n        fail("strict style bridge source is missing")\n''','generator bridge source checks')
gen=replace_once(gen,"    worker = insert_worker_assets(worker, list(expected))\n","    worker = insert_worker_assets(worker, list(expected) + [STYLE_BRIDGE_PATH.name])\n",'generator worker style bridge')
state_marker='''    if "function retireInlineHandlerAttrs(parsed)" not in index or "retireInlineHandlerAttrs(parsed);const scripts=[]" not in index:\n        fail("browser bootstrap does not retire static frozen-core handler attributes before installation")\n'''
state_new='''    if "function retireInlineHandlerAttrs(parsed)" not in index or "retireInlineHandlerAttrs(parsed);retireInlineStyleAttrs(parsed);const scripts=[]" not in index:\n        fail("browser bootstrap does not retire static frozen-core handler attributes before installation")\n    if "function retireInlineStyleAttrs(parsed)" not in index or "./src/core-runtime/inline-style-bridge.js" not in index:\n        fail("browser bootstrap strict style bridge is missing")\n'''
gen=replace_once(gen,state_marker,state_new,'generator style bridge state check')
worker_check='''    for name in expected_names:\n        if f"'./src/core-runtime/{name}'" not in worker:\n            fail(f"service-worker CORE missing generated runtime asset: {name}")\n'''
gen=replace_once(gen,worker_check,worker_check+'''    if "'./src/core-runtime/inline-style-bridge.js'" not in worker:\n        fail("service-worker CORE missing strict style bridge")\n''','generator style bridge worker check')
write('tools/externalize_core_scripts.py',gen)

# Architecture guard: no style unsafe-inline, no cssText/setAttribute style APIs,
# and require the deterministic style bridge + hash allowlist.
qa=read('qa_architecture_debt.py')
qa=replace_once(qa,'HANDLER_BRIDGE_PATH = CORE_RUNTIME_DIR / "inline-handler-bridge.js"\n','HANDLER_BRIDGE_PATH = CORE_RUNTIME_DIR / "inline-handler-bridge.js"\nSTYLE_BRIDGE_PATH = CORE_RUNTIME_DIR / "inline-style-bridge.js"\n','architecture style bridge constant')
qa=replace_once(qa,"return token in {\"'self'\", \"'unsafe-inline'\", \"'unsafe-hashes'\"} or token.startswith(\"'nonce-\") or token.startswith(\"'sha256-\") or token.startswith(\"'sha384-\") or token.startswith(\"'sha512-\")","return token == \"'self'\" or token.startswith(\"'sha256-\") or token.startswith(\"'sha384-\") or token.startswith(\"'sha512-\")",'architecture style CSP token policy')
qa=replace_once(qa,'need(HANDLER_BRIDGE_PATH.is_file(), "strict delegated handler bridge source is missing")\n','need(HANDLER_BRIDGE_PATH.is_file(), "strict delegated handler bridge source is missing")\nneed(STYLE_BRIDGE_PATH.is_file(), "strict inline-style bridge source is missing")\n','architecture style bridge file')
qa=replace_once(qa,'need("retireInlineHandlerAttrs(parsed);const scripts=[]" in index, "static handler retirement does not run before document installation")\n','need("retireInlineHandlerAttrs(parsed);retireInlineStyleAttrs(parsed);const scripts=[]" in index, "static handler retirement does not run before document installation")\nneed("function retireInlineStyleAttrs(parsed)" in index, "runtime frozen-core style-attribute retirement is missing")\nneed("./src/core-runtime/inline-style-bridge.js" in index, "strict inline-style bridge is not loaded before core replay")\n','architecture bootstrap style retirement')
qa=replace_once(qa,'need("\'unsafe-eval\'" not in csp_raw, "CSP must never permit unsafe-eval")\n','need("\'unsafe-eval\'" not in csp_raw, "CSP must never permit unsafe-eval")\nneed("\'unsafe-inline\'" not in csp_raw, "CSP must not permit unsafe-inline scripts or styles")\n','architecture no unsafe-inline')
qa=replace_once(qa,'style_src = csp.get("style-src") or []\nconnect_src = csp.get("connect-src") or []\n','style_src = csp.get("style-src") or []\nstyle_src_attr = csp.get("style-src-attr") or []\nconnect_src = csp.get("connect-src") or []\n','architecture style-src-attr parse')
qa=replace_once(qa,'need(style_src and all(local_style_token(token) for token in style_src), f"CSP style-src added a non-local source: {style_src}")\n','need(style_src and style_src[0] == "\'self\'" and all(local_style_token(token) for token in style_src), f"CSP style-src added a non-local source: {style_src}")\nneed(any(token.startswith("\'sha256-") for token in style_src), "CSP style-src must include exact hashes for deterministic runtime style blocks")\nneed(style_src_attr == ["\'none\'"], f"CSP inline style attributes must remain disabled: {style_src_attr}")\n','architecture strict style CSP')
scan_marker='''    need("document.write(" not in source and "document.writeln(" not in source, f"document.write is forbidden in active runtime code: {path.relative_to(ROOT)}")\n    need(HANDLER_ATTR_RE.search(source) is None, f"inline handler attribute is forbidden in active runtime source: {path.relative_to(ROOT)}")\n'''
scan_new='''    need("document.write(" not in source and "document.writeln(" not in source, f"document.write is forbidden in active runtime code: {path.relative_to(ROOT)}")\n    need(HANDLER_ATTR_RE.search(source) is None, f"inline handler attribute is forbidden in active runtime source: {path.relative_to(ROOT)}")\n    need(re.search(r"\\.style\\.cssText\\s*=", source) is None, f"style.cssText is forbidden under strict style CSP: {path.relative_to(ROOT)}")\n    need(re.search(r"\\.setAttribute\\(\\s*[\'\\\"]style[\'\\\"]", source) is None, f"setAttribute(style) is forbidden under strict style CSP: {path.relative_to(ROOT)}")\n'''
qa=replace_once(qa,scan_marker,scan_new,'architecture forbidden style APIs')
qa=replace_once(qa,'    "script-src self-only; script-src-attr none; no active inline handlers, remote scripts, unsafe-eval, eval(), or new Function()"\n','    "script-src self-only; script-src-attr none; style-src exact-hash/self-only with style-src-attr none; no unsafe-inline, cssText, setAttribute(style), active inline handlers, remote scripts, unsafe-eval, eval(), or new Function()"\n','architecture output')
write('qa_architecture_debt.py',qa)

baseline=json.loads(read('qa/architecture-debt-baseline.json'))
note="2026-09-04 style-CSP tranche removes the final unsafe-inline directive: deterministic style elements are exact SHA-256 allowlisted, frozen/generated style attributes are neutralized at HTML sinks and applied via property-level CSSOM, and cssText/setAttribute(style) are forbidden."
if note not in baseline['notes']: baseline['notes'].append(note)
write('qa/architecture-debt-baseline.json',json.dumps(baseline,indent=2)+"\n")

pw=read('playwright.config.cjs')
pw=replace_once(pw,"/inline-handler-bridge\\.spec\\.js/],","/inline-handler-bridge\\.spec\\.js/,/inline-style-csp\\.spec\\.js/],",'Playwright strict style spec')
write('playwright.config.cjs',pw)

print('Prepared strict style CSP migration')
