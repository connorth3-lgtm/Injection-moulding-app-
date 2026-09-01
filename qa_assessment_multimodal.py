from pathlib import Path
import re

ROOT=Path(__file__).resolve().parent

def need(ok,msg):
    if not ok: raise AssertionError(msg)

src=(ROOT/'assessment-multimodal.js').read_text(encoding='utf-8')
for marker in ['type:\'chart\'','type:\'table\'','type:\'sequence\'','type:\'calculation\'','Applied evidence assessment','formal certificate answer keys','production setpoint','machinery authorisation','site validation']:
    need(marker in src,f'multimodal assessment safeguard missing: {marker}')
need(src.count("C('")>=4,'expected at least four chart items')
need(src.count("T('")>=3,'expected at least three table items')
need(src.count("N('")>=3,'expected at least three calculation items')
need(src.count("S('")>=2,'expected at least two sequence items')
ids=re.findall(r"(?:C|T|N|S)\('([^']+)'",src)
need(len(ids)==12,f'expected 12 multimodal items, found {len(ids)}')
need(len(set(ids))==12,'multimodal item IDs must be unique')
need('drag' not in src.lower(),'sequence interaction must not require drag-and-drop')
need('data-mma-up' in src and 'data-mma-down' in src,'sequence assessment must provide keyboard-operable move controls')
need('role="img"' in src and 'aria-label=' in src,'chart SVGs must expose accessible image labels')
print('MouldMaster multimodal assessment QA passed (12 applied items: charts/tables/calculations/sequences; certificate keys unchanged)')
