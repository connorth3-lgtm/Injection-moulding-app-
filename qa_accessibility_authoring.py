#!/usr/bin/env python3
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parent
hardening=(ROOT/'accessibility-hardening.js').read_text(encoding='utf-8')
for prohibited in ("setAttribute('aria-label','Action')",'img.alt=\'\'', 'input.setAttribute(\'aria-label\',p)'):
    if prohibited in hardening:
        raise SystemExit(f'generic runtime accessibility fallback remains: {prohibited}')
for required in ('Meaningful image requires authored alt text','generic “Action” fallbacks are prohibited','authoringAudit'):
    if required not in hardening:
        raise SystemExit(f'missing accessibility authoring guard: {required}')
# Static high-signal checks on authored HTML. Empty alt is allowed only for explicit decorative assets.
for name in ('index.html','privacy.html','support.html'):
    p=ROOT/name
    if not p.exists(): continue
    text=p.read_text(encoding='utf-8')
    for tag in re.findall(r'<img\b[^>]*>',text,re.I):
        if not re.search(r'\balt\s*=\s*["\']',tag,re.I):
            raise SystemExit(f'{name}: image without alt attribute: {tag[:120]}')
        m=re.search(r'\balt\s*=\s*(["\'])\1',tag,re.I)
        if m and 'data-decorative="true"' not in tag and "data-decorative='true'" not in tag and 'aria-hidden="true"' not in tag and "aria-hidden='true'" not in tag:
            raise SystemExit(f'{name}: empty alt without explicit decorative marker: {tag[:120]}')
print('Accessibility authoring QA passed: runtime does not invent generic semantics and authored HTML uses explicit image semantics.')
