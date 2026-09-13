from pathlib import Path
import hashlib

APP = Path("MouldMaster_Academy_App.html")
READ_ALOUD = Path("read-aloud.js")
TARGET_SIZE = 540_000
CURRENT_RELEASE_COMMIT = "36119f5922feb06e5b8db291b1b61b401072b961"
READ_ALOUD_COMMIT = "3e7144b68c5dfe79232cf2ba0180060f1395ffcc"
NEW_CONTENT_VERSION = "2026.09.14.1"

text = APP.read_text(encoding="utf-8")
read_aloud_sha256 = hashlib.sha256(READ_ALOUD.read_bytes()).hexdigest()

assert f'const RELEASE_COMMIT="{CURRENT_RELEASE_COMMIT}";' in text
assert 'const CONTENT="2026.08.23.5";' in text
assert 'readAloud' not in text
assert len(text.encode("utf-8")) == TARGET_SIZE

text = text.replace(
    'const CONTENT="2026.08.23.5";\n'
    f'const RELEASE_COMMIT="{CURRENT_RELEASE_COMMIT}";\n'
    'const CACHE_KEY="mouldmaster_windows_assembled_"+CONTENT.replace(/\\./g,"_");\n'
    'const BASE="https://raw.githubusercontent.com/connorth3-lgtm/Injection-moulding-app-/"+RELEASE_COMMIT+"/";',
    f'const CONTENT="{NEW_CONTENT_VERSION}";\n'
    f'const RELEASE_COMMIT="{CURRENT_RELEASE_COMMIT}";\n'
    f'const READ_ALOUD_COMMIT="{READ_ALOUD_COMMIT}";\n'
    'const CACHE_KEY="mouldmaster_windows_assembled_"+CONTENT.replace(/\\./g,"_");\n'
    'const BASE="https://raw.githubusercontent.com/connorth3-lgtm/Injection-moulding-app-/"+RELEASE_COMMIT+"/";\n'
    'const READ_ALOUD_BASE="https://raw.githubusercontent.com/connorth3-lgtm/Injection-moulding-app-/"+READ_ALOUD_COMMIT+"/";'
)
text = text.replace(
    ' css:{path:"reading-patch.css",sha256:"55f20703459ab5d9c5cf50effbae04f5bd134f5c6e6a2f258a58f021e7b1470e"},\n reading:{path:"reading-patch.js",sha256:"2a1236a9fb4b2023261d3600238a26be7b90defcdf5b9540d8aac28af46997c9"},',
    ' css:{path:"reading-patch.css",sha256:"55f20703459ab5d9c5cf50effbae04f5bd134f5c6e6a2f258a58f021e7b1470e"},\n'
    f' readAloud:{{path:"read-aloud.js",sha256:"{read_aloud_sha256}",base:READ_ALOUD_BASE}},\n'
    ' reading:{path:"reading-patch.js",sha256:"2a1236a9fb4b2023261d3600238a26be7b90defcdf5b9540d8aac28af46997c9"},'
)
text = text.replace(
    '  const r=await fetch(BASE+expected.path,{cache:"no-store",signal:ctl.signal});',
    '  const r=await fetch((expected.base||BASE)+expected.path,{cache:"no-store",signal:ctl.signal});'
)
text = text.replace(
    'function assemble(core,css,reading,training,qa){',
    'function assemble(core,css,readAloud,reading,training,qa){'
)
text = text.replace(
    "const scripts='<script>window.MM_PLATFORM=\"windows\";window.MM_CONTENT_RELEASE=\"'+CONTENT+'\";</scr'+'ipt>'+ '<script>'+reading+'</scr'+'ipt><script>'+training+'</scr'+'ipt><script>'+qa+'</scr'+'ipt>';",
    "const scripts='<script>window.MM_PLATFORM=\"windows\";window.MM_CONTENT_RELEASE=\"'+CONTENT+'\";</scr'+'ipt>'+ '<script>'+readAloud+'</scr'+'ipt><script>'+reading+'</scr'+'ipt><script>'+training+'</scr'+'ipt><script>'+qa+'</scr'+'ipt>';"
)
text = text.replace(
    ' const [core,css,reading,training,qa]=await Promise.all([get("core"),get("css"),get("reading"),get("training"),get("qa")]);\n const html=assemble(core,css,reading,training,qa);',
    ' const [core,css,readAloud,reading,training,qa]=await Promise.all([get("core"),get("css"),get("readAloud"),get("reading"),get("training"),get("qa")]);\n const html=assemble(core,css,readAloud,reading,training,qa);'
)

# Preserve the launcher-compatible exact payload size by resizing only the trailing M padding comment.
pad_start = text.find("\n<!--", text.find("</body>"))
pad_end = text.rfind("-->")
assert pad_start != -1 and pad_end > pad_start
prefix = text[:pad_start] + "\n<!--"
suffix = text[pad_end:]
pad_len = TARGET_SIZE - len((prefix + suffix).encode("utf-8"))
assert pad_len >= 0
text = prefix + ("M" * pad_len) + suffix

assert len(text.encode("utf-8")) == TARGET_SIZE
assert f'const READ_ALOUD_COMMIT="{READ_ALOUD_COMMIT}";' in text
assert f'path:"read-aloud.js",sha256:"{read_aloud_sha256}",base:READ_ALOUD_BASE' in text
assert 'fetch((expected.base||BASE)+expected.path' in text
assert 'get("readAloud"),get("reading")' in text
assert "'<script>'+readAloud+'</scr'+'ipt><script>'+reading" in text
assert f'const CONTENT="{NEW_CONTENT_VERSION}";' in text

APP.write_text(text, encoding="utf-8")
print(f"Patched {APP} with read-aloud SHA-256 {read_aloud_sha256}; size={len(text.encode('utf-8'))}")
