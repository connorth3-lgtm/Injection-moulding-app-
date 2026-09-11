#!/usr/bin/env python3
"""Temporarily align lifecycle/release QA with the canonical learner-ID prerequisite."""
from pathlib import Path

p=Path('qa_final_audit_lifecycle.cjs')
text=p.read_text(encoding='utf-8')

def once(old,new,label):
    global text
    count=text.count(old)
    if count!=1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    text=text.replace(old,new,1)

once(
    "const trainingSource=fs.readFileSync('training-qa-fix.js','utf8');\n",
    "const trainingSource=fs.readFileSync('training-qa-fix.js','utf8');\n"
    "const coreSource=fs.readFileSync('MouldMaster_Core_App.html','utf8');\n"
    "function extractCoreFunction(name){\n"
    "  const start=coreSource.indexOf(`function ${name}(`);assert(start>=0,`missing ${name}`);\n"
    "  const brace=coreSource.indexOf('{',start);let depth=0,quote=null,escape=false;\n"
    "  for(let i=brace;i<coreSource.length;i++){const ch=coreSource[i];if(quote){if(escape){escape=false;continue}if(ch==='\\\\'){escape=true;continue}if(ch===quote)quote=null;continue}if(ch==='\\\"'||ch===\"'\"||ch==='`'){quote=ch;continue}if(ch==='{')depth++;else if(ch==='}'&&--depth===0)return coreSource.slice(start,i+1)}\n"
    "  throw new Error(`unterminated ${name}`);\n"
    "}\n"
    "const learnerIdApi=new Function(`${extractCoreFunction('pvCanonicalLearnerId')}\\n${extractCoreFunction('pvRequireLearnerId')}\\n${extractCoreFunction('pvHasOwnLearner')}\\nreturn {pvRequireLearnerId,pvHasOwnLearner};`)();\n",
    'lifecycle canonical learner-ID extraction',
)
once(
    "    normaliseImportedUser:(u,id)=>({...u,id:String(id),completed:Array.isArray(u.completed)?u.completed:[]}),\n",
    "    normaliseImportedUser:(u,id)=>({...u,id:String(id),completed:Array.isArray(u.completed)?u.completed:[]}),\n"
    "    pvRequireLearnerId:learnerIdApi.pvRequireLearnerId,pvHasOwnLearner:learnerIdApi.pvHasOwnLearner,\n",
    'lifecycle learner-ID API injection',
)
p.write_text(text,encoding='utf-8')

r=Path('qa_release.py')
release=r.read_text(encoding='utf-8')
old='for marker in ["file.size>10*1024*1024", "clean.id=sid", "clean.certificates=[]", "clean.certificateMeta={}", "clean.examPassStatus={}", "restoreSnapshot(before)", "Certificates must be re-earned", "db!==beforeDb", "LEARNING_ANALYTICS_PREFIX", "ANALYTICS_CLEANUP_CODE", "remaining key(s):", "clearAllAnalyticsStores();clearTrainingExtrasStores()", "analytics were cleared and verified"]:\n    assert marker in bridge, f"import/reset hardening missing: {marker}"\n'
new='for marker in ["file.size>10*1024*1024", "const sid=requireCoreLearnerId(id);", "if(hasOwnCoreLearner(users,sid))", "if(!clean||clean.id!==sid)", "const active=requireCoreLearnerId(x.activeUser);", "if(!hasOwnCoreLearner(users,active))", "clean.certificates=[]", "clean.certificateMeta={}", "clean.examPassStatus={}", "restoreSnapshot(before)", "Certificates must be re-earned", "db!==beforeDb", "LEARNING_ANALYTICS_PREFIX", "ANALYTICS_CLEANUP_CODE", "remaining key(s):", "clearAllAnalyticsStores();clearTrainingExtrasStores()", "analytics were cleared and verified"]:\n    assert marker in bridge, f"import/reset hardening missing: {marker}"\nassert "clean.id=sid" not in bridge, "import bridge must reject learner-ID mismatch instead of silently rewriting it"\nassert "!x.users[x.activeUser]" not in bridge, "import bridge must not use inherited learner lookup for activeUser"\n'
if release.count(old)!=1:
    raise SystemExit(f'release bridge invariant: expected one match, found {release.count(old)}')
r.write_text(release.replace(old,new,1),encoding='utf-8')
print('Aligned lifecycle and release QA with canonical learner-ID bridge contract.')
