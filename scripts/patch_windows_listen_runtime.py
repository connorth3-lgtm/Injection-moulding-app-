from pathlib import Path
import hashlib

APP = Path("MouldMaster_Academy_App.html")
READ_ALOUD = Path("read-aloud.js")
TARGET_SIZE = 540_000
READ_ALOUD_COMMIT = "3e7144b68c5dfe79232cf2ba0180060f1395ffcc"
NEW_CONTENT_VERSION = "2026.09.14.1"

text = APP.read_text(encoding="utf-8")
read_aloud = READ_ALOUD.read_bytes()
read_aloud_sha256 = hashlib.sha256(read_aloud).hexdigest()

assert 'const RELEASE_COMMIT = "016a04a9afaa4c32f747398e868673c3d87caa63";' in text
assert 'const CACHE_KEY="mm_windows_academy_cache_v5";' in text
assert 'readAloud' not in text
assert len(text.encode("utf-8")) == TARGET_SIZE

text = text.replace(
    '  const CONTENT = "2026.08.23.24";\n  const BASE = "https://raw.githubusercontent.com/connorth3-lgtm/Injection-moulding-app-/" + RELEASE_COMMIT + "/";',
    f'  const CONTENT = "{NEW_CONTENT_VERSION}";\n  const READ_ALOUD_COMMIT = "{READ_ALOUD_COMMIT}";\n  const BASE = "https://raw.githubusercontent.com/connorth3-lgtm/Injection-moulding-app-/" + RELEASE_COMMIT + "/";\n  const READ_ALOUD_BASE = "https://raw.githubusercontent.com/connorth3-lgtm/Injection-moulding-app-/" + READ_ALOUD_COMMIT + "/";'
)
text = text.replace(
    '    reading: {path:"reading-patch.js",sha256:"338851562016adc7ae24f67924a464df15033ea415b84faa9cc71a054361de35"},',
    f'    readAloud: {{path:"read-aloud.js",sha256:"{read_aloud_sha256}",base:READ_ALOUD_BASE}},\n    reading: {{path:"reading-patch.js",sha256:"338851562016adc7ae24f67924a464df15033ea415b84faa9cc71a054361de35"}},'
)
text = text.replace(
    '    const r=await fetch(BASE+expected.path,{cache:"no-store"});',
    '    const r=await fetch((expected.base||BASE)+expected.path,{cache:"no-store"});'
)
text = text.replace(
    '  function assemble(core,reading,training,qa,platformCss,platformJs){',
    '  function assemble(core,readAloud,reading,training,qa,platformCss,platformJs){'
)
text = text.replace(
    '<\\/script><script>${reading}<\\/script><script>${training}<\\/script><script>${qa}<\\/script>`;',
    '<\\/script><script>${readAloud}<\\/script><script>${reading}<\\/script><script>${training}<\\/script><script>${qa}<\\/script>`;'
)
text = text.replace(
    '      const [core,reading,training,qa,platformCss,platformJs]=await Promise.all([\n        get("core"),get("reading"),get("training"),get("qa"),get("platformCss"),get("platformJs")\n      ]);\n      const html=assemble(core,reading,training,qa,platformCss,platformJs);',
    '      const [core,readAloud,reading,training,qa,platformCss,platformJs]=await Promise.all([\n        get("core"),get("readAloud"),get("reading"),get("training"),get("qa"),get("platformCss"),get("platformJs")\n      ]);\n      const html=assemble(core,readAloud,reading,training,qa,platformCss,platformJs);'
)
text = text.replace('const CACHE_KEY="mm_windows_academy_cache_v5";', 'const CACHE_KEY="mm_windows_academy_cache_v6";')

# Preserve the launcher-compatible exact payload size by resizing only the trailing M padding comment.
pad_start = text.find("\n<!--", text.find("</body>"))
pad_end = text.rfind("-->")
assert pad_start != -1 and pad_end > pad_start
prefix = text[:pad_start] + "\n<!--"
suffix = text[pad_end:]
base_size = len((prefix + suffix).encode("utf-8"))
pad_len = TARGET_SIZE - base_size
assert pad_len >= 0
text = prefix + ("M" * pad_len) + suffix
assert len(text.encode("utf-8")) == TARGET_SIZE

# Regression assertions: immutable pin + hash verification + load order + cache bust.
assert f'const READ_ALOUD_COMMIT = "{READ_ALOUD_COMMIT}";' in text
assert f'path:"read-aloud.js",sha256:"{read_aloud_sha256}",base:READ_ALOUD_BASE' in text
assert 'fetch((expected.base||BASE)+expected.path' in text
assert 'get("readAloud"),get("reading")' in text
assert '${readAloud}<\\/script><script>${reading}' in text
assert 'mm_windows_academy_cache_v6' in text

APP.write_text(text, encoding="utf-8")
print(f"Patched {APP} with read-aloud SHA-256 {read_aloud_sha256}; size={len(text.encode('utf-8'))}")
