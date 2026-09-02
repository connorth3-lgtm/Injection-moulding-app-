from pathlib import Path
import json

ROOT=Path(__file__).resolve().parent
MANIFEST=ROOT/'data'/'research-utilisation-manifest-v1.json'


def need(ok,msg):
    if not ok: raise AssertionError(msg)


def main():
    need(MANIFEST.exists(),'research utilisation manifest missing')
    data=json.loads(MANIFEST.read_text(encoding='utf-8'))
    need(data.get('schema')==1,'research utilisation manifest schema must be 1')
    state=data.get('resolvedEvidenceState') or {}
    need(state.get('promotedMechanisms')==12,'resolved promoted mechanism total must be 12')
    need(state.get('publisherVerifiedPrimaryMeasuredStudies')==70,'resolved primary measured study total must be 70')
    model=data.get('decisionModel') or {}
    for key in ['separateEvidenceQualityFromApplicability','requiresLocalMeasuredConfirmation','supportsFalsification','supportsAlternativeExplanations','supportsVerificationPlan']:
        need(model.get(key) is True,f'{key} must be enabled')
    need(model.get('universalSetpointsAllowed') is False,'universal setpoints must remain disabled')
    need(model.get('researchCanOverrideApprovedLimits') is False,'research must not override approved limits')
    for rel in data.get('runtimeFiles') or []: need((ROOT/rel).exists(),f'missing runtime file: {rel}')
    for rel in data.get('qa') or []: need((ROOT/rel).exists(),f'missing QA file: {rel}')
    print('MouldMaster research utilisation manifest QA passed')

if __name__=='__main__': main()
