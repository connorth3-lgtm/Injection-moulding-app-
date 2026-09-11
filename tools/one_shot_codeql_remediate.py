#!/usr/bin/env python3
from pathlib import Path
import importlib.util
import json
import re
import textwrap


def read(path: str | Path) -> str:
    return Path(path).read_text(encoding="utf-8")


def write(path: str | Path, text: str) -> None:
    Path(path).write_text(text, encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


helper = '''#!/usr/bin/env python3
"""Fail-closed HTML script extraction for trusted repository documents."""
from __future__ import annotations

from dataclasses import dataclass
from html.parser import HTMLParser


@dataclass(frozen=True)
class ScriptBlock:
    attrs: tuple[tuple[str, str | None], ...]
    body: str

    @property
    def has_src(self) -> bool:
        return any(name.lower() == "src" for name, _value in self.attrs)


class _ScriptParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.blocks: list[ScriptBlock] = []
        self._attrs: tuple[tuple[str, str | None], ...] | None = None
        self._parts: list[str] = []

    @property
    def in_script(self) -> bool:
        return self._attrs is not None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "script":
            return
        if self.in_script:
            raise ValueError("nested script element is not valid for runtime extraction")
        self._attrs = tuple(attrs)
        self._parts = []

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() == "script":
            self.blocks.append(ScriptBlock(tuple(attrs), ""))

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() != "script" or not self.in_script:
            return
        assert self._attrs is not None
        self.blocks.append(ScriptBlock(self._attrs, "".join(self._parts)))
        self._attrs = None
        self._parts = []

    def handle_data(self, data: str) -> None:
        if self.in_script:
            self._parts.append(data)

    def handle_entityref(self, name: str) -> None:
        if self.in_script:
            self._parts.append(f"&{name};")

    def handle_charref(self, name: str) -> None:
        if self.in_script:
            self._parts.append(f"&#{name};")


def script_blocks(html: str) -> list[ScriptBlock]:
    parser = _ScriptParser()
    parser.feed(html)
    parser.close()
    if parser.in_script:
        raise ValueError("unterminated or malformed script element")
    return parser.blocks


def inline_script_bodies(html: str) -> list[str]:
    return [block.body for block in script_blocks(html) if not block.has_src]
'''
write("tools/html_script_parser.py", helper)

# Fix the canonical current core while keeping the legacy recovery feed pinned remotely.
core_path = Path("MouldMaster_Core_App.html")
core = core_path.read_bytes().decode("utf-8")
eol = "\r\n" if "\r\n" in core else "\n"
old_handler = '''onclick="closeModal();switchView('coach');setCoachPrompt('${esc(d.name).replace(/'/g,"\\\\'")}')">'''
core = replace_once(core, old_handler, '''onclick="openDefectCoach(${i})">''', "defect coach handler")
marker = "function openDefect(i){"
addition = (
    "function openDefectCoach(i){" + eol
    + " const d=D.defects[i]; if(!d)return;" + eol
    + ' closeModal();switchView("coach");setCoachPrompt(d.name);' + eol
    + "}" + eol
)
core = replace_once(core, marker, addition + marker, "openDefectCoach insertion")

xss_pattern = re.compile(r"  function mmUpdateCard\(\)\{.*?  const originalSwitch = window\.switchView;", re.S)
xss_replacement = eol.join([
    '  function mmTextElement(tag,className,text){',
    '    const el=document.createElement(tag);',
    '    if(className)el.className=className;',
    '    el.textContent=String(text==null?"":text);',
    '    return el;',
    '  }',
    '  function mmUpdateCard(){',
    '    const s=mmUpdateState(), copy=mmStatusText(s.status);',
    '    const card=mmTextElement("div","card form-card","");',
    '    card.style.marginTop="14px";',
    '    card.appendChild(mmTextElement("span","eyebrow","Updates"));',
    '    const title=mmTextElement("h2","",copy[0]);',
    '    title.style.marginBottom="6px";',
    '    card.appendChild(title);',
    '    card.appendChild(mmTextElement("p","muted",copy[1]));',
    '    const grid=mmTextElement("div","grid2","");',
    '    grid.style.marginTop="10px";',
    '    const version=mmTextElement("div","stat","");',
    '    version.appendChild(mmTextElement("span","","Installed version"));',
    '    version.appendChild(mmTextElement("b","",s.version));',
    '    const mode=mmTextElement("div","stat","");',
    '    mode.appendChild(mmTextElement("span","","Update mode"));',
    '    mode.appendChild(mmTextElement("b","","Automatic on launch"));',
    '    grid.appendChild(version);grid.appendChild(mode);card.appendChild(grid);',
    '    const note=mmTextElement("p","tiny muted","Learner progress, notes, scores and certificates stay in your browser profile and are not replaced by app updates.");',
    '    note.style.marginTop="10px";card.appendChild(note);',
    '    return card;',
    '  }',
    '  function attachUpdateCard(){',
    '    try{',
    '      const profile=document.getElementById("profile");',
    '      if(profile && !profile.querySelector("[data-mm-update-card]")){',
    '        const card=mmUpdateCard();',
    '        card.setAttribute("data-mm-update-card","1");',
    '        profile.appendChild(card);',
    '      }',
    '    }catch(e){}',
    '  }',
    '  const originalSwitch = window.switchView;',
])
core, count = xss_pattern.subn(lambda _m: xss_replacement, core, count=1)
if count != 1:
    raise SystemExit(f"update-card XSS block: expected one match, found {count}")
core_path.write_bytes(core.encode("utf-8"))

bridge_path = Path("src/core-runtime/inline-handler-bridge.js")
bridge = read(bridge_path)
bridge = replace_once(
    bridge,
    "'openCourse','openDefect','openMaterialChapter'",
    "'openCourse','openDefect','openDefectCoach','openMaterialChapter'",
    "handler allowlist",
)
write(bridge_path, bridge)

# Replace regex-based script-tag rewriting with parsed DOM traversal.
index_path = Path("index.html")
index = read(index_path)
pattern = re.compile(r"    function externalizeCoreScripts\(out\)\{.*?\}\n    function assemble", re.S)
parsed_externalizer = '''    function externalizeParsedCoreScripts(parsed){let cursor=0;for(const source of Array.from(parsed.querySelectorAll("script"))){if(source.hasAttribute("src"))continue;const src=CORE_INLINE_SCRIPTS[cursor++];if(!src)throw new Error("Core training content contains more inline scripts than the externalized runtime set");source.textContent="";source.setAttribute("src",`${src}?v=${RUNTIME_ASSET_VERSION}`)}if(cursor!==CORE_INLINE_SCRIPTS.length)throw new Error(`Core inline script count drifted: ${cursor}/${CORE_INLINE_SCRIPTS.length}`);return parsed}
    function assemble'''
index, count = pattern.subn(parsed_externalizer, index, count=1)
if count != 1:
    raise SystemExit(f"index regex externalizer: expected one match, found {count}")
index = replace_once(index, "out=ensureViewportFit(out);out=externalizeCoreScripts(out);", "out=ensureViewportFit(out);", "assemble externalizer removal")
parse_marker = 'if(!parsed.documentElement||!parsed.head||!parsed.body)throw new Error("Core training document could not be parsed");retireInlineHandlerAttrs(parsed);'
index = replace_once(
    index,
    parse_marker,
    'if(!parsed.documentElement||!parsed.head||!parsed.body)throw new Error("Core training document could not be parsed");externalizeParsedCoreScripts(parsed);retireInlineHandlerAttrs(parsed);',
    "parsed externalizer call",
)
write(index_path, index)

# Use a real parser for build/QA script extraction.
ext_path = Path("tools/externalize_core_scripts.py")
ext = read(ext_path)
ext = replace_once(
    ext,
    '`MouldMaster_Core_App.html` is also the immutable legacy Windows recovery payload,\nso its bytes are intentionally not rewritten. The browser bootstrap replaces those\ninline blocks with same-origin generated assets during runtime assembly.\n',
    '`MouldMaster_Core_App.html` is the current canonical web/desktop core source. The\nlegacy Windows recovery feed is independently pinned to a historical commit and SHA-256.\nThe browser bootstrap replaces current inline blocks with same-origin generated assets.\n',
    "externalizer architecture doc",
)
ext = replace_once(
    ext,
    "from pathlib import Path\n\n",
    "from pathlib import Path\n\ntry:\n    from html_script_parser import inline_script_bodies\nexcept ModuleNotFoundError:\n    from tools.html_script_parser import inline_script_bodies\n\n",
    "externalizer parser import",
)
ext, count = re.subn(r"INLINE_SCRIPT_RE = .*?\nSRC_ATTR_RE = .*?\n", "", ext, count=1)
if count != 1:
    raise SystemExit("externalizer regex constants not found exactly once")
old_inline = '''def inline_blocks(core: str) -> list[str]:
    return [
        match.group("body")
        for match in INLINE_SCRIPT_RE.finditer(core)
        if not SRC_ATTR_RE.search(match.group("attrs") or "")
    ]
'''
ext = replace_once(ext, old_inline, 'def inline_blocks(core: str) -> list[str]:\n    return inline_script_bodies(core)\n', "inline_blocks parser")
ext = replace_once(
    ext,
    '    if "function externalizeCoreScripts(out)" not in index or "out=externalizeCoreScripts(out)" not in index:\n        fail("browser bootstrap does not externalize frozen core scripts during assembly")\n',
    '    if "function externalizeParsedCoreScripts(parsed)" not in index or "externalizeParsedCoreScripts(parsed);retireInlineHandlerAttrs(parsed);" not in index:\n        fail("browser bootstrap does not externalize parsed core scripts before installation")\n',
    "externalizer check-state marker",
)
write(ext_path, ext)

arch_path = Path("qa_architecture_debt.py")
arch = read(arch_path)
arch = replace_once(
    arch,
    "from tools.externalize_core_scripts import runtime_transform as core_runtime_transform\n",
    "from tools.externalize_core_scripts import runtime_transform as core_runtime_transform\nfrom tools.html_script_parser import inline_script_bodies\n",
    "architecture parser import",
)
old_arch = 'inline_core_script_re = re.compile(r"<script\\b(?![^>]*\\bsrc\\s*=)[^>]*>(.*?)</script\\s*>", re.I | re.S)\ninline_core_scripts = inline_core_script_re.findall(core)'
arch = replace_once(arch, old_arch, "inline_core_scripts = inline_script_bodies(core)", "architecture script extraction")
write(arch_path, arch)

release_path = Path("qa_release.py")
release = read(release_path)
release = replace_once(release, "import tempfile\n", "import tempfile\nfrom tools.html_script_parser import inline_script_bodies\n", "release parser import")
release = replace_once(
    release,
    'CORE_SHA256 = "96ed07e1487633538359eb12073fe50bfe595d9d5aaa807173e0a764b9123754"\n',
    'LEGACY_RECOVERY_CORE_SHA256 = "96ed07e1487633538359eb12073fe50bfe595d9d5aaa807173e0a764b9123754"\nLEGACY_RECOVERY_CORE_COMMIT = "ffc05506e6baebc8d9f0e047f556a017a06c110a"\n',
    "legacy recovery constants",
)
release = replace_once(
    release,
    'assert latest["sha256"] == CORE_SHA256, "Windows recovery feed must use audited core SHA-256"',
    'assert latest["sha256"] == LEGACY_RECOVERY_CORE_SHA256, "Windows recovery feed must use audited core SHA-256"',
    "recovery hash assertion",
)
release = replace_once(
    release,
    'assert latest["app_url"].endswith("/MouldMaster_Core_App.html"), "Windows recovery feed must point to audited full core"\nassert sha256("MouldMaster_Core_App.html") == latest["sha256"], "Windows recovery content hash mismatch"',
    'assert latest["app_url"].endswith("/MouldMaster_Core_App.html"), "Windows recovery feed must point to audited full core"\nassert f"/{LEGACY_RECOVERY_CORE_COMMIT}/MouldMaster_Core_App.html" in latest["app_url"], "Windows recovery feed must remain pinned to the audited immutable commit"',
    "recovery/current decoupling",
)
release = replace_once(release, 'assert sha256("MouldMaster_Core_App.html") == CORE_SHA256, "audited core bytes changed"\n', "", "current core frozen-hash assertion removal")
old_release_scripts = 'scripts = re.findall(r"<script(?:\\s[^>]*)?>(.*?)</script>", text(html_name), flags=re.S | re.I)'
release = replace_once(release, old_release_scripts, "scripts = inline_script_bodies(text(html_name))", "release script extraction")
write(release_path, release)

qa_parser = '''#!/usr/bin/env python3
from tools.html_script_parser import inline_script_bodies, script_blocks

sample = '<script>const a=1;</script><script src="./x.js"></script><script>const b="&amp;";</script>'
assert inline_script_bodies(sample) == ['const a=1;', 'const b="&amp;";']
assert len(script_blocks(sample)) == 3
assert inline_script_bodies('<script>ok</script   >') == ['ok']
try:
    inline_script_bodies('<script>unsafe</script\\t\\n bar><p>x</p>')
except ValueError:
    pass
else:
    raise AssertionError('malformed script end tag must fail closed')
print('HTML script parser QA passed')
'''
write("qa_html_script_parser.py", qa_parser)

qa_security = '''#!/usr/bin/env python3
from pathlib import Path


def text(path):
    return Path(path).read_text(encoding='utf-8')

core = text('MouldMaster_Core_App.html')
index = text('index.html')
generated = text('src/core-runtime/core-inline-004.js') + text('src/core-runtime/core-inline-010.js')
externalizer = text('tools/externalize_core_scripts.py')
release = text('qa_release.py')
architecture = text('qa_architecture_debt.py')

assert 'function openDefectCoach(i)' in core
assert 'setCoachPrompt(d.name)' in core
assert "setCoachPrompt('${esc(d.name).replace" not in core
assert 'wrap.innerHTML=mmUpdateCard()' not in core
assert 'version.appendChild(mmTextElement("b","",s.version))' in core
assert 'function externalizeCoreScripts(out)' not in index
assert 'function externalizeParsedCoreScripts(parsed)' in index
assert 'INLINE_SCRIPT_RE' not in externalizer
assert 'inline_core_script_re' not in architecture
assert 're.findall(r"<script' not in release
assert 'openDefectCoach' in generated
assert 'wrap.innerHTML=mmUpdateCard()' not in generated
print('Code scanning remediation QA passed')
'''
write("qa_code_scanning_remediation.py", qa_security)

fast_path = Path("qa_fast_feedback.py")
fast = read(fast_path)
anchor = "    release_docs_changed = bool(files & {\n"
security_block = '''    code_scanning_changed = bool(files & {
        "MouldMaster_Core_App.html",
        "index.html",
        "tools/externalize_core_scripts.py",
        "tools/html_script_parser.py",
        "qa_release.py",
        "qa_architecture_debt.py",
        "src/core-runtime/inline-handler-bridge.js",
        "src/core-runtime/core-inline-004.js",
        "src/core-runtime/core-inline-010.js",
        "qa_html_script_parser.py",
        "qa_code_scanning_remediation.py",
    })
    if code_scanning_changed:
        commands.append([sys.executable, "qa_html_script_parser.py"])
        commands.append([sys.executable, "qa_code_scanning_remediation.py"])
        commands.append([sys.executable, "tools/externalize_core_scripts.py", "--check"])

'''
fast = replace_once(fast, anchor, security_block + anchor, "fast feedback security block")
write(fast_path, fast)

# Generate the runtime copies directly; do not invoke the generator's historical cache bump helper.
spec = importlib.util.spec_from_file_location("mm_externalize", "tools/externalize_core_scripts.py")
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)
expected = module.expected_assets(Path("MouldMaster_Core_App.html").read_text(encoding="utf-8"))
for name, body in expected.items():
    Path("src/core-runtime", name).write_text(body, encoding="utf-8")

# Release identity must change because active runtime bytes changed.
version_path = Path("version.json")
version = json.loads(read(version_path))
if version.get("web_release") != "2026.09.11.1":
    raise SystemExit(f"unexpected starting web release {version.get('web_release')!r}")
version["web_release"] = "2026.09.11.2"
write(version_path, json.dumps(version, indent=2) + "\n")
for path in ["qa_release.py", "qa_release_docs.py", "README.md", "support.html"]:
    data = read(path)
    if "2026.09.11.1" not in data:
        raise SystemExit(f"{path}: old web release marker missing")
    write(path, data.replace("2026.09.11.1", "2026.09.11.2"))
worker_path = Path("service-worker.js")
worker = read(worker_path)
worker, count = re.subn(r"^const CACHE_REVISION='[^']+';$", "const CACHE_REVISION='security-codeql-r1-20260911';", worker, count=1, flags=re.M)
if count != 1:
    raise SystemExit("service-worker CACHE_REVISION not found exactly once")
write(worker_path, worker)

print("CodeQL remediation patch applied")
