#!/usr/bin/env python3
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
path=ROOT/'qa_architecture_debt.py'
text=path.read_text(encoding='utf-8')

import_marker='from pathlib import Path\n'
import_line='from tools.externalize_core_scripts import runtime_transform as core_runtime_transform\n'
if import_line not in text:
    if import_marker not in text: raise SystemExit('qa_architecture_debt.py import marker missing')
    text=text.replace(import_marker,import_marker+import_line,1)
old='    expected_handler_free = retire_handler_attrs(source)\n'
new='    expected_handler_free = core_runtime_transform(path.name, source)\n'
if old not in text and new not in text: raise SystemExit('core runtime comparator marker missing')
text=text.replace(old,new,1)
path.write_text(text,encoding='utf-8')
print('Architecture comparator now delegates approved core transforms to the canonical generator')
