#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RUNTIME = (ROOT / 'src/domains/learning/book-runtime.js').read_text(encoding='utf-8')
COMPAT = (ROOT / 'book-runtime.js').read_text(encoding='utf-8')
CSS = (ROOT / 'reading-patch.css').read_text(encoding='utf-8')

assert 'style=' not in RUNTIME.lower(), 'Canonical Book runtime must not emit inline style attributes under style-src-attr none'
assert 'style=' not in COMPAT.lower(), 'Book compatibility loader must not emit inline style attributes under style-src-attr none'
assert 'mm-book-chapter-button' in RUNTIME, 'Book chapter button class missing from canonical runtime'
assert '.mm-book-chapter-button{' in CSS, 'Book chapter button styling missing from external stylesheet'
assert 'width:100%' in CSS and 'text-align:left' in CSS, 'Book chapter button layout rule incomplete'
assert "script.src='./src/domains/learning/book-runtime.js'" in COMPAT, 'Book compatibility loader must delegate to canonical runtime'

print('PASS: canonical Book runtime and compatibility loader emit no inline style attributes and use CSP-safe external styling')
