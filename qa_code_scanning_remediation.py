#!/usr/bin/env python3
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
