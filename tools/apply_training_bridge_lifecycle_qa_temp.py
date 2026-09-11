#!/usr/bin/env python3
"""Temporarily align lifecycle QA with the canonical learner-ID prerequisite."""
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
print('Aligned lifecycle QA sandbox with canonical learner-ID API.')
