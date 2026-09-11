#!/usr/bin/env python3
"""Temporary branch-only helper for issue #282 standalone learner-ID hardening."""
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'MouldMaster_Core_App.html'
text=p.read_text(encoding='utf-8')

def once(old,new,label):
    global text
    count=text.count(old)
    if count!=1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    text=text.replace(old,new,1)

def exact_count(old,new,count,label):
    global text
    actual=text.count(old)
    if actual!=count:
        raise SystemExit(f'{label}: expected {count} matches, found {actual}')
    text=text.replace(old,new)

# Canonical ID contract: legacy generated IDs plus bounded benign punctuation only.
once(
    'function pvCleanString(v,max=10000){\n  return String(v==null?"":v).slice(0,max);\n}\nfunction pvUniqueInts(xs,min,max){',
    'function pvCleanString(v,max=10000){\n  return String(v==null?"":v).slice(0,max);\n}\n'
    'function pvCanonicalLearnerId(v){\n'
    '  const raw=String(v==null?"":v);\n'
    '  return raw.length>=1&&raw.length<=160&&/^[A-Za-z0-9][A-Za-z0-9._:@+-]*$/.test(raw)?raw:"";\n'
    '}\n'
    'function pvRequireLearnerId(v){\n'
    '  const raw=String(v==null?"":v),canonical=pvCanonicalLearnerId(raw);\n'
    '  if(!canonical||canonical!==raw)throw new Error("Invalid learner identifier");\n'
    '  return canonical;\n'
    '}\n'
    'function pvBuildImportedUsers(x){\n'
    '  const users={};\n'
    '  for(const [id,u] of Object.entries(x.users).slice(0,500)){\n'
    '    const sid=pvRequireLearnerId(id);\n'
    '    if(Object.prototype.hasOwnProperty.call(users,sid))throw new Error("Duplicate learner identifier");\n'
    '    const clean=normaliseImportedUser(u,sid);\n'
    '    if(clean.id!==sid)throw new Error("Learner identifier mismatch");\n'
    '    users[sid]=clean;\n'
    '  }\n'
    '  const active=pvRequireLearnerId(x.activeUser);\n'
    '  if(!users[active])throw new Error("Missing active learner");\n'
    '  return {activeUser:active,users};\n'
    '}\n'
    'function pvWireInstructorSwitches(users){\n'
    '  const host=$("#instructor");if(!host)return;\n'
    '  host.querySelectorAll("[data-mm-switch-user]").forEach(button=>button.addEventListener("click",()=>{\n'
    '    const index=Number(button.dataset.mmSwitchUser),target=Number.isInteger(index)?users[index]:null;\n'
    '    if(target)switchUser(target.id);\n'
    '  }));\n'
    '}\n'
    'function pvUniqueInts(xs,min,max){',
    'canonical learner-ID helpers',
)

# All current learner creation paths must generate through the canonical contract.
exact_count(
    'const id="learner-"+Date.now();',
    'const id=pvRequireLearnerId("learner-"+Date.now());',
    2,
    'learner creation ID contract',
)

# Stored/selected IDs are guarded even if old local state predates strict import.
once(
    'function switchUser(id){persist();db.activeUser=id;user=db.users[id];persist();updateGlobalProgress();renderInstructor();toast("Switched learner")}',
    'function switchUser(id){const sid=pvCanonicalLearnerId(id);if(!sid||!db.users[sid]){toast("Learner profile unavailable");return}persist();db.activeUser=sid;user=db.users[sid];persist();updateGlobalProgress();renderInstructor();toast("Switched learner")}',
    'guard learner switching',
)

# Remove both data-to-inline-JavaScript sinks. User IDs never enter handler source.
exact_count('users.map(u=>','users.map((u,userIndex)=>',2,'instructor row indexing')
exact_count(
    'onclick="switchUser(\'${u.id}\')"',
    'data-mm-switch-user="${userIndex}"',
    2,
    'inline learner-ID handler removal',
)
# Both instructor renderers wire the index token through addEventListener after rendering.
needle='</tbody></table></div>`;\n}'
replacement='</tbody></table></div>`;\n pvWireInstructorSwitches(users);\n}'
exact_count(needle,replacement,2,'instructor DOM event wiring')

# Final strict normaliser requires embedded ID (when present) to be the same canonical key.
pattern=(
    r'normaliseImportedUser=function\(u,id\)\{\n'
    r'  if\(!u\|\|typeof u!=="object"\|\|Array\.isArray\(u\)\)throw new Error\("Invalid learner"\);\n'
)
match=re.search(pattern,text)
if not match:
    raise SystemExit('strict normaliser header: expected one match, found 0')
insert=(
    match.group(0)
    +'  const keyId=pvRequireLearnerId(id);\n'
    +'  const embeddedId=u.id==null||String(u.id)===""?keyId:pvRequireLearnerId(u.id);\n'
    +'  if(embeddedId!==keyId)throw new Error("Learner identifier mismatch");\n'
)
text=text[:match.start()]+insert+text[match.end():]
once(
    '    id:pvCleanString(u.id||id,160)||pvCleanString(id,160),',
    '    id:keyId,',
    'strict normaliser canonical ID field',
)

# Final strict import validates keys and active ID unchanged and rejects key/embedded mismatch.
pattern=(
    r'    const entries=Object\.entries\(x\.users\)\.slice\(0,500\);\n'
    r'    const users=\{\}; entries\.forEach\(\(\[id,u\]\)=>users\[pvCleanString\(id,160\)\]=normaliseImportedUser\(u,id\)\);\n'
    r'    const active=pvCleanString\(x\.activeUser,160\);\n'
    r'    if\(!users\[active\]\)throw new Error\("Missing active learner"\);\n'
    r'    const proposed=\{activeUser:active,users\};'
)
replacement=(
    '    const proposed=pvBuildImportedUsers(x);\n'
    '    const users=proposed.users,active=proposed.activeUser;'
)
text,new_count=re.subn(pattern,replacement,text,count=1)
if new_count!=1:
    raise SystemExit(f'strict import canonical learner registry: expected one match, found {new_count}')

p.write_text(text,encoding='utf-8')

qa=r'''\
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('MouldMaster_Core_App.html','utf8');
function extractFunction(name){
  const start=source.indexOf(`function ${name}(`);assert(start>=0,`missing ${name}`);
  const brace=source.indexOf('{',start);let depth=0,quote=null,escape=false;
  for(let i=brace;i<source.length;i++){
    const ch=source[i];
    if(quote){if(escape){escape=false;continue}if(ch==='\\'){escape=true;continue}if(ch===quote)quote=null;continue}
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue}
    if(ch==='{')depth++;else if(ch==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error(`unterminated ${name}`);
}
const canonicalSource=extractFunction('pvCanonicalLearnerId');
const requireSource=extractFunction('pvRequireLearnerId');
const buildSource=extractFunction('pvBuildImportedUsers');
const api=new Function('normaliseImportedUser',`${canonicalSource}\n${requireSource}\n${buildSource}\nreturn {pvCanonicalLearnerId,pvRequireLearnerId,pvBuildImportedUsers};`)((u,id)=>({id,name:u?.name||'Learner'}));

for(const id of ['learner-1','learner_2','legacy.ID-3','team:alpha+1','person@example'])assert.equal(api.pvCanonicalLearnerId(id),id,`benign legacy ID should survive unchanged: ${id}`);
for(const id of ['',"bad'id",'bad"id','<tag>','bad\\id','bad/id','bad\nid','bad\rid','bad id','bad;id','bad(id)','-leading'])assert.equal(api.pvCanonicalLearnerId(id),'',`unsafe learner ID must be rejected: ${JSON.stringify(id)}`);
assert.equal(api.pvCanonicalLearnerId('a'.repeat(160)),'a'.repeat(160));
assert.equal(api.pvCanonicalLearnerId('a'.repeat(161)),'');

let registry=api.pvBuildImportedUsers({activeUser:'learner-1',users:{'learner-1':{name:'A'},'legacy.ID-3':{name:'B'}}});
assert.equal(registry.activeUser,'learner-1');assert.deepEqual(Object.keys(registry.users),['learner-1','legacy.ID-3']);
for(const bad of ["bad'id",'<tag>','bad\\id','bad\nid','bad id']){
  assert.throws(()=>api.pvBuildImportedUsers({activeUser:bad,users:{[bad]:{}}}),/Invalid learner identifier/);
}
assert.throws(()=>api.pvBuildImportedUsers({activeUser:'missing',users:{'learner-1':{}}}),/Missing active learner/);

assert(!source.includes(`onclick="switchUser('${'${u.id}'})"`),'learner IDs must never be interpolated into inline JavaScript handlers');
assert.equal((source.match(/data-mm-switch-user="\$\{userIndex\}"/g)||[]).length,2,'both instructor renderers must use inert index tokens');
assert.equal((source.match(/pvWireInstructorSwitches\(users\);/g)||[]).length,2,'both instructor renderers must wire DOM events after rendering');
const strictStart=source.indexOf('/* ---------- Strict backup import allowlist ---------- */');assert(strictStart>=0);
const strict=source.slice(strictStart);
assert(strict.includes('const keyId=pvRequireLearnerId(id);'),'strict normaliser must validate the registry key');
assert(strict.includes('if(embeddedId!==keyId)throw new Error("Learner identifier mismatch");'),'strict normaliser must reject embedded/key identity mismatch');
assert(strict.includes('const proposed=pvBuildImportedUsers(x);'),'strict import must build through the canonical learner-ID contract');
assert(!strict.includes('users[pvCleanString(id,160)]=normaliseImportedUser(u,id)'),'strict import must not truncate unsafe learner IDs into registry keys');
console.log('Standalone learner-ID QA passed: canonical IDs preserve benign legacy punctuation, reject JS/HTML metacharacters/separators, and instructor switching contains no learner-ID inline-code sink.');
'''
(ROOT/'qa_standalone_learner_ids.cjs').write_text(qa.lstrip('\\'),encoding='utf-8')
print('Applied standalone learner-ID hardening for issue #282.')
