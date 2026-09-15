#!/usr/bin/env python3
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parent
EXPECTED={'chapters':46,'claims':137,'supported':116,'qualified':21,'hold':0,'conflicting':0}
REVIEWS=[
 'book-claim-review-foundations-materials-machine-v1.json',
 'book-claim-review-process-tooling-v1.json',
 'book-claim-review-troubleshooting-v1.json',
 'book-claim-review-engineering-advanced-v1.json',
 'book-claim-review-high-risk-v1.json',
]
RESOLUTIONS=[
 'book-claim-resolution-high-risk-v1.json',
 'book-claim-resolution-high-risk-v2.json',
 'book-claim-resolution-all-v1.json',
 'book-qualification-resolution-all-v1.json',
]

def need(ok,msg):
 if not ok: raise AssertionError(msg)
def load(path): return json.loads((ROOT/path).read_text(encoding='utf-8'))
def text(path): return (ROOT/path).read_text(encoding='utf-8')

version=load('version.json')
need(version['web_release']=='2026.09.15.6','audit-remediation release must be 2026.09.15.6')

claims={};chapters=set()
for name in REVIEWS:
 ledger=load('data/'+name)
 need(ledger.get('schema')==1 and ledger.get('bookId')=='mouldmaster-book',f'invalid Book review ledger {name}')
 for chapter in ledger.get('chapters',[]):
  cid=chapter.get('chapterId');need(cid and isinstance(chapter.get('claims'),list),f'malformed chapter in {name}');chapters.add(cid)
  for claim in chapter['claims']:
   qid=claim.get('claimId');need(qid and qid not in claims,f'duplicate/missing claim {qid!r}')
   claims[qid]={'conclusion':claim.get('conclusion'),'evidence':set(claim.get('evidence') or [])}
for name in RESOLUTIONS:
 ledger=load('data/'+name)
 need(ledger.get('schema')==1 and ledger.get('bookId')=='mouldmaster-book',f'invalid Book resolution ledger {name}')
 for item in ledger.get('resolutions',[]):
  qid=item.get('claimId');need(qid in claims,f'{name} references unknown claim {qid!r}')
  if item.get('newConclusion'): claims[qid]['conclusion']=item['newConclusion']
  claims[qid]['evidence'].update(item.get('evidence') or [])
 for item in ledger.get('remainingQualifiedClaims',[]):
  qid=item.get('claimId');need(qid in claims,f'{name} qualification references unknown claim {qid!r}')
  claims[qid]['conclusion']='qualified';claims[qid]['evidence'].update(item.get('evidence') or [])
counts={'chapters':len(chapters),'claims':len(claims),'supported':0,'qualified':0,'hold':0,'conflicting':0}
for claim in claims.values():
 conclusion=claim['conclusion'];need(conclusion in {'supported','qualified','hold','conflicting'},f'unsupported final conclusion {conclusion!r}')
 counts[conclusion]+=1
need(counts==EXPECTED,f'complete Book claim trace does not resolve to publication snapshot: {counts}')
need(all(claim['evidence'] for claim in claims.values()),'every Book claim must retain at least one evidence identifier')

for name in REVIEWS+RESOLUTIONS:
 source=ROOT/'data'/name;packaged=ROOT/'src/domains/learning/book-data'/name
 need(packaged.is_file(),f'packaged Book claim ledger missing: {name}')
 need(source.read_bytes()==packaged.read_bytes(),f'packaged Book claim ledger drifted: {name}')

manifest=load('runtime-domain-manifest.json')['assets']
book_runtime='./src/domains/learning/book-runtime.js';claim_runtime='./src/domains/learning/book-claim-trace.js';backup_runtime='./src/domains/learning/backup-authority-notice.js'
for asset in (book_runtime,claim_runtime,backup_runtime): need(asset in manifest,f'domain manifest missing {asset}')
need(manifest.index(book_runtime)<manifest.index(claim_runtime),'complete claim trace must load after Book runtime')
need(manifest.index(backup_runtime)<manifest.index(book_runtime),'backup authority notice must load before Book UI')

trace=text('src/domains/learning/book-claim-trace.js')
for marker in ["claims:137","supported:116","qualified:21","mm-book-complete-claim-trace","Complete claim evidence trace","MM_BOOK_CLAIM_TRACE","getChapterClaims:chapterClaims"]:
 need(marker in trace,f'complete Book claim-trace runtime missing marker: {marker}')
for name in REVIEWS+RESOLUTIONS: need(name in trace,f'complete Book claim-trace runtime missing ledger: {name}')

backup=text('src/domains/learning/backup-authority-notice.js')
for marker in ['Certificates and pass authority must be re-earned','local analytics do not transfer as trusted evidence','MM_BACKUP_AUTHORITY_NOTICE']:
 need(marker in backup,f'backup authority disclosure missing: {marker}')

sw=text('service-worker.js')
need("const CACHE_VERSION='2026.09.15.6';" in sw,'service-worker release identity stale')
core=ROOT/'MouldMaster_Core_App.html';payload=ROOT/'src/core-runtime/core-source.txt'
need(payload.is_file() and payload.read_bytes()==core.read_bytes(),'non-executable core assembly payload must be byte-identical to frozen core')
index=text('index.html');need('const CORE_URL="./src/core-runtime/core-source.txt";' in index,'supported bootstrap must assemble from non-executable core source')
for asset in [claim_runtime,backup_runtime]+[f'./src/domains/learning/book-data/{x}' for x in REVIEWS+RESOLUTIONS]:
 need(repr(asset) in sw or f"'{asset}'" in sw,f'offline cache missing audit-remediation asset: {asset}')
for marker in ["const LEGACY_CORE_PATH=new URL('./MouldMaster_Core_App.html',self.registration.scope).pathname;","if(url.pathname===LEGACY_CORE_PATH)return index||offlineDocumentResponse();","not a supported learner-facing web entry point"]:
 need(marker in sw,f'legacy raw-core navigation containment missing: {marker}')
core_match=__import__('re').search(r'const\s+CORE\s*=\s*\[(.*?)\]\s*;',sw,__import__('re').S)
need(core_match and "'./src/core-runtime/core-source.txt'" in core_match.group(1),'service-worker CORE must cache non-executable core source')
need("'./MouldMaster_Core_App.html'" not in core_match.group(1),'service-worker CORE must not publish raw executable core HTML')
package=text('desktop/electron/package.json');need('../../MouldMaster_Core_App.html' not in package,'desktop package must not publish raw executable core HTML')

integrity=text('desktop/electron/scripts/generate-integrity.cjs')
need("'src/domains/learning/book-data'" in integrity and 'STATIC_DATA_DIRS.flatMap(filesUnder)' in integrity,'desktop integrity must hash the complete packaged Book ledger directory')

print('PASS: 2026.09.15.6 audit remediation — 137/137 Book claim provenance, backup authority disclosure, offline/desktop packaging and legacy-core PWA navigation containment are governed.')
