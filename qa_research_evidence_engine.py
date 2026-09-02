from pathlib import Path
import json, re

ROOT=Path(__file__).resolve().parent
ENGINE=ROOT/'research-evidence-engine.js'
UI=ROOT/'research-evidence-ui.js'


def need(ok,msg):
    if not ok: raise AssertionError(msg)


def main():
    need(ENGINE.exists(),'research-evidence-engine.js missing')
    need(UI.exists(),'research-evidence-ui.js missing')
    text=ENGINE.read_text(encoding='utf-8')
    ui=UI.read_text(encoding='utf-8')
    ids=re.findall(r"id:'([a-z0-9-]+)'",text)
    # Only count mechanism object IDs before SOURCE_META. Runtime method/property IDs are not in this literal form.
    mechanism_ids=[]
    for x in ids:
        if x not in mechanism_ids: mechanism_ids.append(x)
    expected={
      'ejection-demoulding-physics','residual-stress-birefringence','weld-line-mechanical-strength',
      'fibre-breakage-retained-length','runner-gate-multicavity-imbalance','hot-runner-actual-behaviour',
      'liquid-silicone-rubber','fluid-assisted-moulding','moisture-drying-degradation',
      'recyclate-process-variability','surface-replication-release','injection-compression-precision-optics'
    }
    need(expected.issubset(set(mechanism_ids)),f'missing promoted mechanisms: {sorted(expected-set(mechanism_ids))}')
    need(text.count("status:'promoted'")>=12,'all 12 evidence mechanisms must be promoted in runtime engine')
    for field in ['supports:','weakens:','alternatives:','nextEvidence:','recovery:','limitation:','sourceIds:']:
        need(text.count(field)>=12,f'each mechanism must define {field}')
    dois=set(re.findall(r"doi:10\.[0-9]{4,9}/[^'\"]+",text))
    need(len(dois)>=24,f'expected at least 24 primary source links, found {len(dois)}')
    need('applicability' in text and 'evidenceQuality' in text,'engine must separate applicability from evidence quality')
    need('verificationPlan' in text,'verification plan API missing')
    need('Would weaken it' in ui,'UI must expose falsifying/weakening evidence')
    need('Build verification plan' in ui,'UI must expose verification-plan workflow')
    need('do not override local measured evidence' in ui.lower(),'UI must preserve local-evidence boundary')
    print(f'MouldMaster research evidence engine QA passed ({len(expected)} mechanisms; {len(dois)} primary-source links)')

if __name__=='__main__': main()
