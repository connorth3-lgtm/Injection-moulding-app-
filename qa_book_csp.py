#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RUNTIME = (ROOT / 'book-runtime.js').read_text(encoding='utf-8')
CSS = (ROOT / 'reading-patch.css').read_text(encoding='utf-8')

assert 'style=' not in RUNTIME.lower(), 'Book runtime must not emit inline style attributes under style-src-attr none'
assert 'mm-book-chapter-button' in RUNTIME, 'Book chapter button class missing from runtime'
assert '.mm-book-chapter-button{' in CSS, 'Book chapter button styling missing from external stylesheet'
assert 'width:100%' in CSS and 'text-align:left' in CSS, 'Book chapter button layout rule incomplete'

print('PASS: Book runtime emits no inline style attributes and uses CSP-safe external styling')
