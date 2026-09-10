#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import importlib.util
import json
import re

ROOT=Path(__file__).resolve().parents[1]

def replace_once(path,old,new):
    p=ROOT/path; text=p.read_text(encoding='utf-8'); count=text.count(old)
    if count!=1: raise SystemExit(f'{path}: expected one occurrence, found {count}: {old[:100]!r}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

def fnv1a(value:str)->str:
    h=2166136261
    for ch in value:
        h^=ord(ch); h=(h*16777619)&0xffffffff
    return f'fnv1a-{h:08x}'

def norm(value)->str:
    return ' '.join(str(value or '').strip().lower().split())

def identity_fp(kind,level,region,stem,options,correct):
    canonical='␟'.join([kind,level or '',region or '',norm(stem),'␞'.join(sorted(norm(x) for x in options)),norm(options[int(correct)])])
    return fnv1a(canonical)

BLUEPRINT=['materials','machine','tooling','process','quality','troubleshooting']
COMP=[
 ('materials',r'resin|polymer|material|moisture|dry|mfr|mvr|rheolog|viscos|melt temp|temperature check|crystalli|regrind|recycl'),
 ('machine',r'machine|screw|cushion|recovery|non-return|check ring|barrel|controller|setpoint|injection unit|clamp|transfer position|hydraulic|servo'),
 ('tooling',r'mould|mold|cavity|gate|runner|vent|cooling|water line|parting line|ejection|hot runner|valve gate|surface temperature|tool'),
 ('process',r'fill|pack|hold|gate seal|velocity|pressure|cycle|process window|transfer|shot|flow|shear|residence'),
 ('quality',r'cpk|ppk|capability|measurement|gauge|gage|doe|experiment|random|block|validation|specification|sample|control chart|quality|dimension'),
 ('troubleshooting',r'diagnos|troubleshoot|first|strongest|investigat|drift|changes|becomes|fails|defect|short shot|flash|sink|splay|burn|weld|warpage|brittle|disagree'),
]
CONCEPT=[
 ('moisture-drying',r'moisture|hygroscopic|dry'),('mfr-rheology',r'\bmfr\b|\bmvr\b|rheolog|viscos'),
 ('gate-seal',r'gate seal|gate freeze|mass plateau'),('cavity-pressure',r'cavity pressure|in-cavity|machine peak pressure'),
 ('shot-delivery',r'cushion|non-return|check ring|shot delivery|recovery'),('cooling-thermal',r'cooling|water line|mould-surface|mold-surface|warpage'),
 ('capability',r'cpk|ppk|capability'),('measurement',r'measurement|gauge|gage|fixture'),('doe',r'\bdoe\b|experiment|randomis|randomiz|blocking|confound'),
 ('process-transfer',r'receiving machine|process equivalence|transfer strategy'),('setpoint-actual',r'setpoint|saved recipe|known-good baseline'),
 ('tooling-locality',r'one cavity|local flow|branch|parting line|gate wear'),('safety-isolation',r'lockout|isolation|interlock|guard|hazardous energy'),
]
def competency_set(stem):
    t=norm(stem); return [name for name,pat in COMP if re.search(pat,t)]
def concept(stem):
    t=norm(stem)
    for name,pat in CONCEPT:
        if re.search(pat,t): return name
    words=[x for x in re.split(r'[^a-z0-9]+',t) if len(x)>4]
    return '-'.join(words[:4]) or 'general'
def difficulty(level,index):
    if level=='Beginner': return 'Foundation' if index<4 else 'Applied'
    if level=='Intermediate': return 'Applied' if index<3 else ('Diagnostic' if index<8 else 'Applied')
    return 'Diagnostic' if index<3 else 'Expert'

spec=importlib.util.spec_from_file_location('assessment_manifest_generator',ROOT/'tools/generate_assessment_decision_manifest.py')
mod=importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
snap=mod.runtime_snapshot(mod.extract_core_data())
manifest=json.loads((ROOT/'data/assessment-decision-manifest-v1.json').read_text(encoding='utf-8'))
formal=[r for r in manifest['decisions'] if r['kind'] in {'technical-exam','regional-exam'}]
if len(formal)!=57: raise SystemExit(f'expected 57 formal items, got {len(formal)}')

locked=[]
for row in formal:
    rid=row['id']
    if row['kind']=='technical-exam':
        _,level,index=rid.split(':'); index=int(index); q=snap['exams'][level][index]; region=None; kind='technical'
        stem,options,correct=q[0],list(q[1]),int(q[2]); comps=competency_set(stem); primary=comps[0] if comps else BLUEPRINT[index%len(BLUEPRINT)]
        entry={'stableId':rid,'fingerprint':identity_fp(kind,level,region,stem,options,correct),'reviewedRevision':int(row['revision']),'kind':kind,'level':level,'region':None,'difficulty':difficulty(level,index),'competency':primary,'competencies':comps,'concept':concept(stem),'reviewedContentFingerprint':row['contentFingerprint'],'reviewedSourceFingerprint':row['sourceFingerprint']}
    else:
        _,region,level,index=rid.split(':'); index=int(index); q=snap['regionalQuestions'][region][level][index]; kind='regional'
        stem,options,correct=q[0],list(q[1]),int(q[2])
        entry={'stableId':rid,'fingerprint':identity_fp(kind,level,region,stem,options,correct),'reviewedRevision':int(row['revision']),'kind':kind,'level':level,'region':region,'difficulty':'Expert safety' if level=='Advanced' else 'Applied safety','competency':'safety','competencies':['safety'],'concept':'safety-'+region.lower()+'-'+concept(stem),'reviewedContentFingerprint':row['contentFingerprint'],'reviewedSourceFingerprint':row['sourceFingerprint']}
    locked.append(entry)
locked.sort(key=lambda x:x['stableId'])
if len({x['stableId'] for x in locked})!=57 or len({x['fingerprint'] for x in locked})!=57: raise SystemExit('identity lock IDs/fingerprints must be unique')
lock_json=json.dumps(locked,ensure_ascii=False,separators=(',',':'))

suite_path=ROOT/'assessment-quality-suite.js'; suite=suite_path.read_text(encoding='utf-8')
anchor="const LABELS={materials:'Materials & rheology',machine:'Machine & controls',tooling:'Tooling & thermal',process:'Process development',quality:'Quality & statistics',troubleshooting:'Troubleshooting',safety:'Safety & compliance'};\n"
if suite.count(anchor)!=1: raise SystemExit('quality-suite LABELS anchor drifted')
insert=anchor+"const IDENTITY_LOCK_VERSION='2026.09.10.1';\nconst LOCKED_IDENTITIES="+lock_json+";\nconst IDENTITY_BY_FINGERPRINT=new Map(LOCKED_IDENTITIES.map(x=>[x.fingerprint,Object.freeze({...x,competencies:Object.freeze((x.competencies||[]).slice())})]));\n"
suite=suite.replace(anchor,insert,1)

old="""const META_BY_TEXT=new Map();
function rebuildMeta(){
 META_BY_TEXT.clear();
 LEVELS.forEach(level=>(D.exams[level]||[]).forEach((q,i)=>META_BY_TEXT.set(norm(q[0]),{stableId:techId(level,i),revision:VERSION,difficulty:difficulty(level,i),competency:primaryCompetency(q[0],i),competencies:competencySet(q[0]),concept:concept(q[0]),level,kind:'technical',bankIndex:i})));
 REGIONS.forEach(region=>LEVELS.forEach(level=>(D.regionalQuestions[region]?.[level]||[]).forEach((q,i)=>META_BY_TEXT.set(norm(q[0]),{stableId:regId(region,level,i),revision:VERSION,difficulty:level==='Advanced'?'Expert safety':'Applied safety',competency:'safety',competencies:['safety'],concept:'safety-'+region.toLowerCase()+'-'+concept(q[0]),level,region,kind:'regional',bankIndex:i}))));
}
function normaliseTech(q,i,level){const m=META_BY_TEXT.get(norm(q[0]))||{stableId:techId(level,i),revision:VERSION,difficulty:difficulty(level,i),competency:primaryCompetency(q[0],i),competencies:competencySet(q[0]),concept:concept(q[0]),level,kind:'technical',bankIndex:i};return {q:q[0],options:q[1],correct:q[2],explanation:q[3],reference:q[4],sourceUrl:q[5]||null,optionFeedback:q[6]||[],critical:!!q[7],kind:'technical',...m}}
function normaliseReg(q,i,region,level){const m=META_BY_TEXT.get(norm(q[0]))||{stableId:regId(region,level,i),revision:VERSION,difficulty:level==='Advanced'?'Expert safety':'Applied safety',competency:'safety',competencies:['safety'],concept:'safety-'+region.toLowerCase()+'-'+concept(q[0]),level,region,kind:'regional',bankIndex:i};return {q:q[0],options:q[1],correct:q[2],explanation:q[3],reference:q[4],sourceUrl:q[5]||null,optionFeedback:q[6]||[],critical:q[7]!==false,kind:'regional',region,...m}}
"""
new="""const META_BY_TEXT=new Map();
function fnv1a32(value){let h=2166136261;for(const ch of String(value??'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return 'fnv1a-'+(h>>>0).toString(16).padStart(8,'0')}
function identityFingerprint(q,kind,level,region){const options=Array.isArray(q?.[1])?q[1]:[],correct=Number(q?.[2]),sorted=options.map(norm).sort(),correctText=Number.isInteger(correct)&&correct>=0&&correct<options.length?norm(options[correct]):'';return fnv1a32([kind,level||'',region||'',norm(q?.[0]),sorted.join('␞'),correctText].join('␟'))}
function identityFor(q,kind,level,region,index){
 const fingerprint=identityFingerprint(q,kind,level,region),locked=IDENTITY_BY_FINGERPRINT.get(fingerprint);
 if(!locked)throw new Error(`Assessment identity drift: ${kind}:${region||''}:${level}:${index} is not in reviewed identity lock ${IDENTITY_LOCK_VERSION}`);
 if(locked.kind!==kind||locked.level!==level||(locked.region||null)!==(region||null))throw new Error(`Assessment identity context drift for ${locked.stableId}`);
 const inferredCompetencies=kind==='technical'?competencySet(q[0]):['safety'],inferredPrimary=kind==='technical'?(inferredCompetencies[0]||BLUEPRINT[index%BLUEPRINT.length]):'safety',inferredConcept=kind==='technical'?concept(q[0]):'safety-'+region.toLowerCase()+'-'+concept(q[0]);
 return {...locked,revision:VERSION,bankIndex:index,identityFingerprint:fingerprint,metadataInference:{competency:inferredPrimary,competencies:inferredCompetencies,concept:inferredConcept,matches:locked.competency===inferredPrimary&&locked.concept===inferredConcept}};
}
function rebuildMeta(){
 META_BY_TEXT.clear();const seen=new Set();
 LEVELS.forEach(level=>(D.exams[level]||[]).forEach((q,i)=>{const m=identityFor(q,'technical',level,null,i);if(seen.has(m.stableId))throw new Error(`Duplicate reviewed assessment identity ${m.stableId}`);seen.add(m.stableId);META_BY_TEXT.set(norm(q[0]),m)}));
 REGIONS.forEach(region=>LEVELS.forEach(level=>(D.regionalQuestions[region]?.[level]||[]).forEach((q,i)=>{const m=identityFor(q,'regional',level,region,i);if(seen.has(m.stableId))throw new Error(`Duplicate reviewed assessment identity ${m.stableId}`);seen.add(m.stableId);META_BY_TEXT.set(norm(q[0]),m)})));
 if(seen.size!==LOCKED_IDENTITIES.length)throw new Error(`Assessment identity lock coverage drift: ${seen.size}/${LOCKED_IDENTITIES.length}`);
}
function normaliseTech(q,i,level){const m=identityFor(q,'technical',level,null,i);return {q:q[0],options:q[1],correct:q[2],explanation:q[3],reference:q[4],sourceUrl:q[5]||null,optionFeedback:q[6]||[],critical:!!q[7],kind:'technical',...m}}
function normaliseReg(q,i,region,level){const m=identityFor(q,'regional',level,region,i);return {q:q[0],options:q[1],correct:q[2],explanation:q[3],reference:q[4],sourceUrl:q[5]||null,optionFeedback:q[6]||[],critical:q[7]!==false,kind:'regional',region,...m}}
"""
if suite.count(old)!=1: raise SystemExit('quality-suite metadata block drifted')
suite=suite.replace(old,new,1)
old_leak="if(c>med*1.85&&c-med>28)out.push({id:techId(level,i),type:'correct-option-length',correctLength:c,peerMedian:med})"
new_leak="if(c>med*1.85&&c-med>28)out.push({id:identityFor(q,'technical',level,null,i).stableId,type:'correct-option-length',correctLength:c,peerMedian:med})"
if suite.count(old_leak)!=1: raise SystemExit('quality-suite leak risk marker drifted')
suite=suite.replace(old_leak,new_leak,1)
old_qa="D.assessmentQA.qualitySuite={version:VERSION,reviewed:'26 August 2026',questionBankRevision:VERSION,stableQuestionIds:true,analytics:'device-local only'"
new_qa="D.assessmentQA.qualitySuite={version:VERSION,reviewed:'26 August 2026',questionBankRevision:VERSION,stableQuestionIds:true,identityLockVersion:IDENTITY_LOCK_VERSION,identityLockedQuestions:LOCKED_IDENTITIES.length,analytics:'device-local only'"
if suite.count(old_qa)!=1: raise SystemExit('quality-suite QA summary marker drifted')
suite=suite.replace(old_qa,new_qa,1)
old_api="window.MM_ASSESSMENT_QUALITY={version:VERSION,blueprint:BLUEPRINT.slice(),labels:{...LABELS},scenarioCount:D.scenarios.length,questionCount:57,nearDuplicates:nearDuplicates(),answerLeakRisks:leakRisks(),coverage:(level)=>blueprintCoverage(selectBlueprint(level)),sourceReview:{reviewed:SOURCE_REVIEWED,reviewBy:SOURCE_REVIEW_BY}};"
new_api="window.MM_ASSESSMENT_QUALITY={version:VERSION,identityLockVersion:IDENTITY_LOCK_VERSION,identityCount:LOCKED_IDENTITIES.length,blueprint:BLUEPRINT.slice(),labels:{...LABELS},scenarioCount:D.scenarios.length,questionCount:57,nearDuplicates:nearDuplicates(),answerLeakRisks:leakRisks(),coverage:(level)=>blueprintCoverage(selectBlueprint(level)),resolveIdentity:(q,kind,level,region,index)=>identityFor(q,kind,level,region,index),sourceReview:{reviewed:SOURCE_REVIEWED,reviewBy:SOURCE_REVIEW_BY}};"
if suite.count(old_api)!=1: raise SystemExit('quality-suite public API marker drifted')
suite=suite.replace(old_api,new_api,1)
suite_path.write_text(suite,encoding='utf-8')

qa_path=ROOT/'qa_stable_review_bridge.py'; qa=qa_path.read_text(encoding='utf-8')
qa=qa.replace('import json\nimport subprocess\n','import json\nimport re\nimport subprocess\n',1)
marker="need('competencies:competencySet' in suite,'technical questions must retain multi-competency tags for blueprint coverage')\n"
extra=marker+"need(\"const IDENTITY_LOCK_VERSION='2026.09.10.1'\" in suite,'reviewed assessment identity lock version missing')\nneed('function identityFingerprint' in suite and 'function identityFor' in suite,'reorder-safe assessment identity resolver missing')\nneed('Assessment identity drift:' in suite and 'metadataInference' in suite,'identity/content drift must fail closed while regex metadata remains audit-only')\nneed(\"stableId:techId(level,i),revision:VERSION,difficulty:difficulty(level,i)\" not in suite,'technical runtime identity must not fall back to live array position')\nlock_match=re.search(r'const LOCKED_IDENTITIES=(\\[[\\s\\S]*?\\]);\\nconst IDENTITY_BY_FINGERPRINT',suite)\nneed(lock_match is not None,'reviewed identity lock payload missing')\nidentity_lock=json.loads(lock_match.group(1))\nneed(len(identity_lock)==57 and len({x['stableId'] for x in identity_lock})==57 and len({x['fingerprint'] for x in identity_lock})==57,'reviewed identity lock must contain 57 unique IDs/fingerprints')\nrevision_index=json.loads(text('sources/QUESTION_REVISION_INDEX.json'))\nneed({x['stableId'] for x in identity_lock}==set(revision_index.get('all_stable_ids') or []),'reviewed identity lock IDs differ from governed revision index')\nneed(sum(x['kind']=='technical' for x in identity_lock)==30 and sum(x['kind']=='regional' for x in identity_lock)==27,'identity lock formal kind split drifted')\nneed(all(x.get('reviewedRevision') in {2,3} for x in identity_lock),'identity lock must retain reviewed revision numbers')\nneed(all(x.get('competency') and x.get('concept') and x.get('difficulty') for x in identity_lock),'identity lock must carry explicit competency/concept/difficulty metadata')\n"
if qa.count(marker)!=1: raise SystemExit('stable-review QA insertion marker drifted')
qa=qa.replace(marker,extra,1)
qa=qa.replace("print('MouldMaster stable spaced-review ID and full-blueprint guard QA passed')","print('MouldMaster stable spaced-review ID, reviewed fingerprint identity lock and full-blueprint guard QA passed')",1)
qa_path.write_text(qa,encoding='utf-8')

replace_once('qa_release.py','WEB_RELEASE = "2026.09.10.3"','WEB_RELEASE = "2026.09.10.4"')
version_path=ROOT/'version.json'; version=json.loads(version_path.read_text(encoding='utf-8'))
if version.get('web_release')!='2026.09.10.3': raise SystemExit(f"expected web_release .3, got {version.get('web_release')!r}")
version['web_release']='2026.09.10.4'; version_path.write_text(json.dumps(version,indent=2)+'\n',encoding='utf-8')
print('Applied reorder-safe 57-item assessment identity lock and web release 2026.09.10.4')
