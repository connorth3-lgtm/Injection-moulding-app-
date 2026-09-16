#!/usr/bin/env python3
from pathlib import Path
import json, shutil

ROOT=Path(__file__).resolve().parents[1]
OLD_REL='2026.09.16.1'; NEW_REL='2026.09.16.2'
OLD_SHA='b34a8a637f8006bca868c436411bacb689c067e2'; NEW_SHA='5d7808a1cae6e256d633553061c6ac1652f237e2'
OLD_FP='sha256:c0b4ac65d7701a231250262e43a6aca6bf6d479b4010ccbb30593346d00f4407'; NEW_FP='sha256:f3195f0e8aa5585bb5ee8fa957a2d65efb8a9ac003e181a1d48fe7438fa7f122'
OLD_RUN='35042785613'; NEW_RUN='35058788000'
OLD_ART='10425941965'; NEW_ART='10431443080'
OLD_DIG='sha256:cff263f6f00316742ae49119fde44e7ad7c701296fbc60196d8687b7657b9b71'; NEW_DIG='sha256:f5e16827f6593338a8b76dfca9eb3459826377b715e60ec3bcad9879630a8255'
OLD_EXP='2026-10-16T01:07:44Z'; NEW_EXP='2026-10-16T05:15:28Z'

def read(p): return (ROOT/p).read_text(encoding='utf-8')
def write(p,s):
    q=ROOT/p;q.parent.mkdir(parents=True,exist_ok=True);q.write_text(s,encoding='utf-8')
def dump(p,d): write(p,json.dumps(d,indent=2,ensure_ascii=False)+'\n')
def rebind_text(s):
    for a,b in [(OLD_REL,NEW_REL),(OLD_SHA,NEW_SHA),(OLD_FP,NEW_FP),(OLD_RUN,NEW_RUN),(OLD_ART,NEW_ART),(OLD_DIG,NEW_DIG),(OLD_EXP,NEW_EXP)]: s=s.replace(a,b)
    s=s.replace('Exact protected-main candidate source','Exact pre-merge candidate source')
    s=s.replace('protected-main source commit','pre-merge candidate source commit')
    s=s.replace('protected-main physical-device candidate','pre-merge physical-device candidate')
    s=s.replace('protected-main Pages release-HOLD candidate retention','pre-merge exact-candidate staging retention')
    return s

packets=[
 ('qa/EXTERNAL_VALIDATION_2026.09.16.1.md','qa/EXTERNAL_VALIDATION_2026.09.16.2.md'),
 ('qa/PWA_PHYSICAL_DEVICE_2026.09.16.1.md','qa/PWA_PHYSICAL_DEVICE_2026.09.16.2.md'),
 ('qa/ACCESSIBILITY_REAL_AT_2026.09.16.1.md','qa/ACCESSIBILITY_REAL_AT_2026.09.16.2.md'),
 ('qa/BOOK_SME_REVIEW_2026.09.16.1.md','qa/BOOK_SME_REVIEW_2026.09.16.2.md'),
 ('qa/CURRICULUM_SME_REVIEW_2026.09.16.1.md','qa/CURRICULUM_SME_REVIEW_2026.09.16.2.md'),
 ('qa/LEARNER_PILOT_2026.09.16.1.md','qa/LEARNER_PILOT_2026.09.16.2.md'),
 ('certification/WINDOWS_SIGNING_READINESS_2026.09.16.1.md','certification/WINDOWS_SIGNING_READINESS_2026.09.16.2.md'),
]
for src,dst in packets:
    write(dst,rebind_text(read(src)))

ledger=json.loads(read('data/release-external-validation-v1.json'))
ledger['release']=NEW_REL
ledger['validationIndex']=f'qa/EXTERNAL_VALIDATION_{NEW_REL}.md'
ledger['accessibility']['reviewPacket']=f'qa/ACCESSIBILITY_REAL_AT_{NEW_REL}.md'
ledger['accessibility']['candidate']={'release':NEW_REL,'sourceSha':NEW_SHA,'runtimeFingerprint':NEW_FP}
ledger['pwaPhysicalDevices']['reviewPacket']=f'qa/PWA_PHYSICAL_DEVICE_{NEW_REL}.md'
ledger['pwaPhysicalDevices']['currentCandidate']={
 'release':NEW_REL,'sourceSha':NEW_SHA,'runtimeFingerprint':NEW_FP,
 'candidateRunId':int(NEW_RUN),'candidateWorkflow':'pre-merge exact-candidate staging retention',
 'artifactId':int(NEW_ART),'artifactName':f'physical-pwa-candidate-{NEW_SHA}',
 'artifactDigest':NEW_DIG,'artifactExpiresAt':NEW_EXP}
ledger['windowsDistribution']['readinessPacket']=f'certification/WINDOWS_SIGNING_READINESS_{NEW_REL}.md'
ledger['windowsDistribution']['sourceSha']=NEW_SHA
ledger['bookSme']['reviewPacket']=f'qa/BOOK_SME_REVIEW_{NEW_REL}.md'
ledger['curriculumSme']['reviewPacket']=f'qa/CURRICULUM_SME_REVIEW_{NEW_REL}.md'
ledger['learnerOutcomes']['pilotPacket']=f'qa/LEARNER_PILOT_{NEW_REL}.md'
# Genuine external state must remain fail-closed.
for key in ['accessibility','pwaPhysicalDevices','windowsDistribution','bookSme','curriculumSme','learnerOutcomes']:
    ledger[key]['status']='hold'
ledger['claims']={'fullyExternallyValidated':False,'accreditationAuthorized':False,'learnerEfficacyEstablished':False,'productionRecipeValidated':False,'automaticMachineControlAuthorized':False}
dump('data/release-external-validation-v1.json',ledger)

at=json.loads(read('data/accessibility-real-at-validation-v1.json'))
at.update({'release':NEW_REL,'packet':f'qa/ACCESSIBILITY_REAL_AT_{NEW_REL}.md','sourceSha':NEW_SHA,'runtimeFingerprint':NEW_FP,'status':'pending-real-at-validation'})
for row in at.get('requiredMatrix',[]):
    row.update({'status':'pending','testedAt':None,'reviewer':None,'evidenceRef':None})
dump('data/accessibility-real-at-validation-v1.json',at)

book=json.loads(read('data/book-sme-review-v1.json'));book['release']=NEW_REL;book['status']='hold';book['reviews']=[]
dump('data/book-sme-review-v1.json',book);dump('src/domains/learning/book-data/book-sme-review-v1.json',book)

curr=json.loads(read('qa/curriculum-semantic-review.json'));curr['release']=NEW_REL;curr['packet']=f'qa/CURRICULUM_SME_REVIEW_{NEW_REL}.md';curr['reviews']=[]
dump('qa/curriculum-semantic-review.json',curr)

pilot=json.loads(read('data/learner-pilot-v1.json'));pilot['release']=NEW_REL;pilot['status']='prepared';pilot['evidence']=None
dump('data/learner-pilot-v1.json',pilot)

print('Rebound 2026.09.16.2 external-validation packets to exact pre-merge candidate; all genuine evidence remains HOLD.')
