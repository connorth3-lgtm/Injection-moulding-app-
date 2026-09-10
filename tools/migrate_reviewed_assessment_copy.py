#!/usr/bin/env python3
from __future__ import annotations

import ast
import json
import re
import subprocess
import tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CORE=ROOT/'MouldMaster_Core_App.html'
TRAINING=ROOT/'training-upgrade.js'
DEEP=ROOT/'assessment-deep-dive.js'
CUE=ROOT/'assessment-answer-cue-fix.js'
QUALITY=ROOT/'assessment-quality-suite.js'
BRIDGE=ROOT/'assessment-stable-review-bridge.js'
APPROVAL=ROOT/'assessment-evidence-approval.js'


def need(ok:bool,msg:str)->None:
    if not ok: raise SystemExit(msg)


def read(path:Path)->str:return path.read_text(encoding='utf-8')
def write(path:Path,text:str)->None:path.write_text(text,encoding='utf-8')


def core_data()->dict:
    src=read(CORE);marker='window.MM_DATA = '
    need(marker in src,'MM_DATA marker missing')
    data,_=json.JSONDecoder().raw_decode(src[src.index(marker)+len(marker):])
    training=read(TRAINING);m=re.search(r"const EXTRA=(\[[\s\S]*?\n\]);",training)
    need(m is not None,'training EXTRA scenario bank could not be parsed')
    extra=ast.literal_eval(m.group(1));need(len(extra)==8,f'guided training scenario count changed: {len(extra)}/8')
    for a in extra:
        data['scenarios'].append({'title':a[0],'situation':a[1],'choices':a[2],'correct':a[3],'why':a[4],
          'feedback':[a[4] if i==a[3] else 'This does not directly test the mechanism best supported by the evidence.' for i in range(4)],
          'category':a[5] if len(a)>5 else ''})
    return data


def assembled(include_bridge:bool)->dict:
    data=core_data()
    files=['assessment-deep-dive.js','assessment-answer-cue-fix.js','assessment-quality-suite.js']
    if include_bridge:files.append('assessment-stable-review-bridge.js')
    node=r'''
const fs=require('fs'),vm=require('vm');
const D=%s,files=%s;
const store={};
const localStorage={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
const makeEl=()=>({textContent:'',innerHTML:'',className:'',hidden:false,dataset:{},style:{},href:'',download:'',appendChild(){},prepend(){},insertBefore(){},insertAdjacentHTML(){},insertAdjacentElement(){},querySelector(){return null},querySelectorAll(){return[]},addEventListener(){},setAttribute(){},hasAttribute(){return false},remove(){},click(){},classList:{add(){},remove(){},contains(){return false}}});
const document={getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,createElement:makeEl,head:{appendChild(){}},body:{append(){},appendChild(){},prepend(){}},documentElement:{},readyState:'complete',addEventListener(){}};
function MutationObserver(){this.observe=()=>{};this.disconnect=()=>{}}
const URLObj=function(u,b){return new (global.URL)(u,b)};URLObj.createObjectURL=()=>'';URLObj.revokeObjectURL=()=>{};
const sandbox={window:{MM_DATA:D,requestAnimationFrame:fn=>fn(),addEventListener(){},scrollTo(){}},document,localStorage,performance:{now:()=>1000},console,setTimeout:(fn)=>{if(typeof fn==='function')fn()},clearTimeout(){},Date,Math,JSON,Map,Set,Blob:function(){},URL:URLObj,MutationObserver};
sandbox.window.window=sandbox.window;sandbox.window.document=document;sandbox.window.localStorage=localStorage;sandbox.window.MutationObserver=MutationObserver;sandbox.window.URL=URLObj;sandbox.window.setTimeout=sandbox.setTimeout;
vm.createContext(sandbox);for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const out=[];
for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams[level]||[]).length;i++){const q=D.exams[level][i];out.push({id:`tech:${level}:${i}`,stem:q.q??q[0],options:q.options??q[1],correct:Number(q.correct??q[2]),rationale:q.explanation??q.why??q[3]??'',feedback:q.optionFeedback??q[6]??[],reference:q.reference??q[4]??'',sourceUrl:q.sourceUrl??q[5]??null})}
for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[region]?.[level]||[]).length;i++){const q=D.regionalQuestions[region][level][i];out.push({id:`reg:${region}:${level}:${i}`,stem:q.q??q[0],options:q.options??q[1],correct:Number(q.correct??q[2]),rationale:q.explanation??q.why??q[3]??'',feedback:q.optionFeedback??q[6]??[],reference:q.reference??q[4]??'',sourceUrl:q.sourceUrl??q[5]??null})}
for(let i=0;i<(D.scenarios||[]).length;i++){const s=D.scenarios[i];out.push({id:s.mmStableId||`scenario:${String(i+1).padStart(2,'0')}`,stem:`${s.title}: ${s.situation}`,options:s.choices||[],correct:Number(s.correct),rationale:s.why||'',feedback:s.feedback||[],reference:s.reference||'',sourceUrl:s.sourceUrl||null})}
process.stdout.write(JSON.stringify({items:out,bridge:sandbox.window.MM_STABLE_REVIEW_BRIDGE||null,scenarioCount:D.scenarios.length}));
'''%(json.dumps(data),json.dumps(files))
    with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8',dir=ROOT) as h:
        h.write(node);tmp=Path(h.name)
    try:p=subprocess.run(['node',str(tmp)],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
    finally:tmp.unlink(missing_ok=True)
    need(p.returncode==0,'assessment assembly failed: '+(p.stderr or p.stdout)[:8000])
    result=json.loads(p.stdout);need(result['scenarioCount']==40,f"scenario count changed: {result['scenarioCount']}/40")
    return result


def review_map()->dict[str,str]:
    src=read(BRIDGE);start=src.index('const STRICT_ANSWER_BALANCE={');end=src.index('\n};',start)
    block=src[start:end]
    pairs=re.findall(r"^\s*'([^']+)':'([^']*)',?\s*$",block,re.M)
    out=dict(pairs);need(len(out)==94,f'reviewed answer contract changed: {len(out)}/94')
    return out


def item_map(payload:dict)->dict[str,dict]:return {x['id']:x for x in payload['items']}


def replace_answer(path:Path,old:str,new:str,item_id:str)->bool:
    if old==new:return False
    src=read(path);count=src.count(old)
    need(count>=1,f'{item_id}: authored keyed text not found in {path.name}: {old!r}')
    write(path,src.replace(old,new,1));return True


def authored_source(item_id:str)->Path:
    if item_id=='tech:Advanced:7':return CUE
    if item_id.startswith('tech:'):return DEEP
    if item_id.startswith('reg:'):return CUE
    if item_id.startswith('scenario:'):
        n=int(item_id.split(':')[1])
        if n<=8:return DEEP
        if n<=16:return TRAINING
        return QUALITY
    raise SystemExit(f'unsupported reviewed item id: {item_id}')


def migrate_sources(contract:dict[str,str],authored:dict[str,dict])->dict[str,int]:
    changed={p.name:0 for p in [CORE,TRAINING,DEEP,CUE,QUALITY]}
    for item_id,replacement in contract.items():
        row=authored.get(item_id);need(row is not None,f'missing assembled item: {item_id}')
        key=int(row['correct']);opts=row.get('options') or [];need(len(opts)==4 and 0<=key<4,f'invalid authored item: {item_id}')
        old=str(opts[key]);path=authored_source(item_id)
        if replace_answer(path,old,replacement,item_id):changed[path.name]+=1
    return changed


def make_bridge_validation_only()->None:
    src=read(BRIDGE)
    src=src.replace('/* MouldMaster stable spaced-review ID + blueprint guard — 2026-08-30 strict answer balance */','/* MouldMaster stable spaced-review ID + blueprint guard — reviewed answer validation 2026-09-10 */',1)
    src=src.replace('/* Keep the assessed mechanism and correct index unchanged. These concise keyed choices\n   move explanation back into the existing rationale/feedback instead of telegraphing the\n   answer by making it the longest option. Items absent from this map already passed the\n   strict longest/tied-longest audit unchanged. */','/* Reviewed keyed wording contract. The strings below are authored upstream in the source\n   banks. This bridge is validation-only: it must never rewrite learner-visible assessment\n   text. A mismatch is source drift and fails closed until the content is re-reviewed. */',1)
    src=src.replace('function applyBalance(requireFull){\n let applied=0;','function validateReviewedAnswers(requireFull){\n let validated=0;',1)
    src=src.replace(');opts[key]=replacement;applied++;',");if(String(opts[key])!==replacement)throw new Error(`Reviewed keyed answer drift: ${id}`);validated++;",3)
    src=src.replace(" if(applied>94||requireFull&&applied!==94)throw new Error(`Strict answer-balance coverage mismatch: ${applied}/94`);\n window.MM_STABLE_REVIEW_BRIDGE.strictAnswerBalance.applied=applied;\n return applied;"," if(validated>94||requireFull&&validated!==94)throw new Error(`Reviewed keyed answer coverage mismatch: ${validated}/94`);\n window.MM_STABLE_REVIEW_BRIDGE.strictAnswerBalance.validated=validated;\n return validated;",1)
    src=src.replace(' applyBalance(false);',' validateReviewedAnswers(false);')
    src=src.replace("window.MM_STABLE_REVIEW_BRIDGE={version:'2026.08.30.2',stableIdsPrimary:true,fullBlueprintRequired:true,requiredTechnicalDomains:(S.blueprint||[]).slice(),legacyRecordsMigratedBy:'assessment-quality-suite.js',strictAnswerBalance:{applied:0,required:94,policy:'correct option must be shorter than at least one distractor; key indexes unchanged'}};","window.MM_STABLE_REVIEW_BRIDGE={version:'2026.09.10.1',stableIdsPrimary:true,fullBlueprintRequired:true,requiredTechnicalDomains:(S.blueprint||[]).slice(),legacyRecordsMigratedBy:'assessment-quality-suite.js',strictAnswerBalance:{validated:0,required:94,runtimeTextMutations:0,policy:'Reviewed keyed answer wording is source-authored; runtime validates drift only; key indexes unchanged'}};",1)
    src=src.replace('function finalizeBalance(){applyBalance(true)}','function finalizeBalance(){validateReviewedAnswers(true)}',1)
    need('opts[key]=replacement' not in src,'stable-review bridge still mutates keyed option text')
    need('applyBalance(' not in src,'stable-review bridge still exposes mutating balance function')
    need("strictAnswerBalance:{validated:0,required:94,runtimeTextMutations:0" in src,'validation-only bridge metadata missing')
    write(BRIDGE,src)


def patch_qa_contract()->list[str]:
    changed=[]
    for path in ROOT.glob('qa*.py'):
        src=read(path)
        if 'strictAnswerBalance' not in src:continue
        updated=src.replace(".get('applied')==94",".get('validated')==94")
        updated=updated.replace('strict answer-balance bridge did not reach 94/94 before audit','reviewed keyed-answer validator did not reach 94/94 before audit')
        updated=updated.replace('strict answer-balance bridge must be active before evidence snapshot','reviewed keyed-answer validator must pass before evidence snapshot')
        if updated!=src:write(path,updated);changed.append(path.name)
    return changed


def update_approval_hashes(paths:list[Path])->dict[str,str]:
    src=read(APPROVAL);out={}
    for path in paths:
        rel=path.relative_to(ROOT).as_posix()
        p=subprocess.run(['git','hash-object',rel],cwd=ROOT,capture_output=True,text=True)
        need(p.returncode==0,f'git hash-object failed for {rel}: {p.stderr}')
        sha=p.stdout.strip();out[rel]=sha
        pattern=re.compile(rf"'{re.escape(rel)}':'[0-9a-f]{{40}}'")
        replacement=f"'{rel}':'{sha}'"
        src,n=pattern.subn(replacement,src,count=1)
        need(n==1,f'approval pin not found for changed input: {rel}')
    write(APPROVAL,src);return out


def main()->None:
    contract=review_map()
    baseline=assembled(True);baseline_items=baseline['items']
    need(baseline.get('bridge',{}).get('strictAnswerBalance',{}).get('applied')==94,'baseline bridge did not apply 94 reviewed answers')
    authored=item_map(assembled(False));changes=migrate_sources(contract,authored)
    migrated_authored=item_map(assembled(False))
    for item_id,replacement in contract.items():
        row=migrated_authored[item_id];need(row['options'][row['correct']]==replacement,f'{item_id}: reviewed answer was not authored into its source bank')
    make_bridge_validation_only();qa_changed=patch_qa_contract()
    after=assembled(True)
    need(after.get('bridge',{}).get('strictAnswerBalance',{}).get('validated')==94,'validation-only bridge did not validate 94 reviewed answers')
    need(after.get('bridge',{}).get('strictAnswerBalance',{}).get('runtimeTextMutations')==0,'validation-only bridge does not declare zero runtime text mutation')
    need(after['items']==baseline_items,'learner-visible formal assessment output changed during source migration')
    source_paths=[p for p in [TRAINING,DEEP,CUE,QUALITY,BRIDGE] if changes.get(p.name,0)>0 or p==BRIDGE]
    pins=update_approval_hashes(source_paths)
    print(json.dumps({'reviewedAnswers':len(contract),'sourceEdits':changes,'qaContractFiles':qa_changed,'updatedApprovalPins':pins,'formalItems':len(after['items']),'runtimeTextMutations':0},indent=2))

if __name__=='__main__':main()
