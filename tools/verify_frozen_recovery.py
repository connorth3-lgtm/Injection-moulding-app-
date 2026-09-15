#!/usr/bin/env python3
from __future__ import annotations
import hashlib,json,re,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'latest.json').read_text(encoding='utf-8'))
url=str(manifest.get('app_url') or '')
match=re.fullmatch(r'https://raw\.githubusercontent\.com/connorth3-lgtm/Injection-moulding-app-/([0-9a-f]{40})/MouldMaster_Core_App\.html',url)
if not match: raise SystemExit('frozen recovery app_url must be raw.githubusercontent.com and pinned to an immutable 40-hex commit SHA')
expected=str(manifest.get('sha256') or '').lower()
if not re.fullmatch(r'[0-9a-f]{64}',expected): raise SystemExit('frozen recovery sha256 is invalid')
req=urllib.request.Request(url,headers={'User-Agent':'MouldMaster-Recovery-Contract/1'})
with urllib.request.urlopen(req,timeout=30) as response: payload=response.read()
actual=hashlib.sha256(payload).hexdigest()
if actual!=expected: raise SystemExit(f'frozen recovery hash mismatch: expected {expected}, got {actual}')
print(f'Frozen recovery contract passed: commit {match.group(1)} payload matches sha256:{actual}.')
