#!/usr/bin/env python3
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
manifest=json.loads((ROOT/'data/book-manifest-v1.json').read_text(encoding='utf-8'))
batch=json.loads((ROOT/'data/book-authored-foundations-v1.json').read_text(encoding='utf-8'))
runtime=(ROOT/'book-runtime.js').read_text(encoding='utf-8')

def require(ok,msg):
    if not ok: raise SystemExit(f'BOOK AUTHORED QA FAILED: {msg}')

require(batch.get('schema')==1 and batch.get('bookId')=='mouldmaster-book','batch identity mismatch')
require(batch.get('status')=='technical-review','authored batch must remain in technical review')
require('not verified' in batch.get('reviewBoundary','').lower(),'review boundary must explicitly deny verified status')
chapters=batch.get('chapters',[])
require(len(chapters)==5,'foundation batch must contain exactly five review chapters')
manifest_ids={c['id'] for p in manifest.get('parts',[]) for c in p.get('chapters',[])}
source_ids={s['id'] for s in manifest.get('sourceSeeds',[])}|{s['id'] for s in batch.get('sourceSeeds',[])}
for chapter in chapters:
    require(chapter['id'] in manifest_ids,f"undeclared chapter {chapter['id']}")
    require(chapter.get('state')=='technical-review',f"{chapter['id']} must not be auto-verified")
    require(chapter.get('applicability'),f"{chapter['id']} missing applicability")
    require(len(chapter.get('sections',[]))>=4,f"{chapter['id']} lacks substantive review sections")
    require(chapter.get('sourceIds'),f"{chapter['id']} has no evidence anchors")
    require(all(s in source_ids for s in chapter['sourceIds']),f"{chapter['id']} references unknown source")
require('book-authored-foundations-v1.json' in runtime,'runtime does not load authored foundation batch')
require("chapter.state==='verified'" in runtime,'verified publication gate missing')
require("chapter.state==='technical-review'" in runtime and 'not verified' in runtime.lower(),'review-draft disclosure missing')
require('machine setting, safety procedure or verified production instruction' in runtime,'review boundary is not explicit enough')
print('MouldMaster Book authored QA passed: five sourced foundation drafts remain technical-review-only and fail closed for publication.')
