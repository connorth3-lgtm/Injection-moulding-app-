#!/usr/bin/env python3
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]


def replace_once(path,old,new):
    p=ROOT/path
    text=p.read_text(encoding='utf-8')
    if new in text:
        return
    count=text.count(old)
    if count!=1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {old[:120]!r}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')


def patch_process_storage():
    replace_once(
        'data-integration-runtime.js',
        "r.onsuccess=()=>{const rows=(r.result||[]).sort((a,b)=>Number(a.shotIndex)-Number(b.shotIndex)).map(x=>x.values);resolve(rows);db.close()};",
        "r.onsuccess=()=>{const rows=(r.result||[]).sort((a,b)=>Number(a.rowOrdinal??a.shotIndex)-Number(b.rowOrdinal??b.shotIndex)||Number(a.shotIndex)-Number(b.shotIndex)).map(x=>x.values);resolve(rows);db.close()};"
    )
    replace_once(
        'data-integration-runtime.js',
        """  for(let i=0;i<prepared.rows.length;i++){
    const row=prepared.rows[i],shotIndex=row.shot_index??i+1;
    shots.put({
      id:`${id}:${shotIndex}`,datasetId:id,shotIndex:Number(shotIndex)||i+1,
      machine:row.machine||row.machine_id||record.entities.machine||'',
      mould:row.mould||row.mold||row.tool||record.entities.mould||'',
      materialGrade:row.material_grade||row.resin_grade||record.entities.materialGrade||'',
      cavity:row.cavity||'',intervention:row.intervention_code||row.intervention||'',values:row
    });
  }""",
        """  for(let i=0;i<prepared.rows.length;i++){
    const row=prepared.rows[i],rowOrdinal=i+1,sourceShotIndex=row.shot_index??null,parsedShotIndex=Number(sourceShotIndex);
    shots.put({
      id:`${id}:row:${rowOrdinal}`,datasetId:id,rowOrdinal,
      sourceShotIndex:sourceShotIndex==null?null:String(sourceShotIndex),
      shotIndex:Number.isFinite(parsedShotIndex)?parsedShotIndex:rowOrdinal,
      machine:row.machine||row.machine_id||record.entities.machine||'',
      mould:row.mould||row.mold||row.tool||record.entities.mould||'',
      materialGrade:row.material_grade||row.resin_grade||record.entities.materialGrade||'',
      cavity:row.cavity||'',intervention:row.intervention_code||row.intervention||'',values:row
    });
  }"""
    )
    replace_once(
        'qa_data_integration.py',
        """    for token in required_runtime_tokens:
        require(token in runtime, f\"connected runtime missing required behavior: {token}\")

""",
        """    for token in required_runtime_tokens:
        require(token in runtime, f\"connected runtime missing required behavior: {token}\")

    require('id:`${id}:row:${rowOrdinal}`' in runtime, 'stored process rows must use immutable row-ordinal identity')
    require('sourceShotIndex' in runtime and 'rowOrdinal' in runtime, 'stored process rows must preserve source shot index separately from row identity')
    require('id:`${id}:${shotIndex}`' not in runtime, 'source shot_index must never be the IndexedDB primary key')
    require('Number(a.rowOrdinal??a.shotIndex)' in runtime, 'dataset reads must preserve source row order while remaining backward-compatible')

"""
    )


def patch_process_practice_api():
    replace_once('process-data-diagnostics.js',"const VERSION='2026.08.26.1';","const VERSION='2026.09.10.1';")
    replace_once(
        'process-data-diagnostics.js',
        """function deterministicChoices(step,caseId,stepIndex){
  const arr=[{text:step.correct,correct:true},...step.distractors.map(x=>({text:x,correct:false}))];
  let seed=0;for(const ch of `${caseId}:${stepIndex}`)seed=(seed*31+ch.charCodeAt(0))>>>0;
  for(let i=arr.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[arr[i],arr[j]]=[arr[j],arr[i]]}
  return arr
}

let activeId=null,answers=[],hadError=false;""",
        """function deterministicChoices(step,caseId,stepIndex){
  const arr=[{text:step.correct,correct:true},...step.distractors.map(x=>({text:x,correct:false}))];
  let seed=0;for(const ch of `${caseId}:${stepIndex}`)seed=(seed*31+ch.charCodeAt(0))>>>0;
  for(let i=arr.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[arr[i],arr[j]]=[arr[j],arr[i]]}
  return arr
}
function evaluateChoice(caseId,stepIndex,choiceIndex){
  const ds=DATASETS.find(x=>x.id===String(caseId||'')),stepNo=Number(stepIndex),choiceNo=Number(choiceIndex);
  if(!ds||!Number.isInteger(stepNo)||stepNo<0||stepNo>3||!Number.isInteger(choiceNo)||choiceNo<0||choiceNo>3)return {valid:false,correct:false,total:4};
  const steps=buildSteps(ds),choices=deterministicChoices(steps[stepNo],ds.id,stepNo),choice=choices[choiceNo];
  return {valid:!!choice,correct:!!choice?.correct,total:steps.length};
}

let activeId=null,answers=[],hadError=false;"""
    )
    replace_once(
        'process-data-diagnostics.js',
        "window.MM_PROCESS_DATA_DIAGNOSTICS={version:VERSION,cases:DATASETS.map(d=>({id:d.id,title:d.title,kind:d.kind,signals:Object.keys(d.signals),sourceIds:d.sourceIds})),open:openHome,scope:'Guided use of deterministic synthetic training data; outside the formal assessment bank and not a production recipe.'};",
        "window.MM_PROCESS_DATA_DIAGNOSTICS={version:VERSION,cases:DATASETS.map(d=>({id:d.id,title:d.title,kind:d.kind,signals:Object.keys(d.signals),sourceIds:d.sourceIds})),open:openHome,evaluateChoice,scope:'Guided use of deterministic synthetic training data; outside the formal assessment bank and not a production recipe. evaluateChoice exposes structured practice correctness for local analytics without scraping rendered CSS or score text.'};"
    )


def patch_learning_analytics():
    replace_once('learning-analytics.js',"const VERSION='2026.09.10.1';","const VERSION='2026.09.10.2';")
    replace_once(
        'learning-analytics.js',
        """const attemptTimers={diagnostic:null,'process-data':null};
let currentDiagnostic=null,currentProcessData=null;
function startPractice(module,id){
  const safeId=safeString(id,96);if(!safeId)return;attemptTimers[module]={id:safeId,startedAt:Date.now()};
  const prior=eventsFor().filter(x=>x.type==='practice_start'&&x.module===module&&x.id===safeId).length;
  record('practice_start',{module,id:safeId,attempt:prior+1});
}
function finishPractice(module,id,score){
  const timer=attemptTimers[module],durationSec=timer&&timer.id===id?Math.round((Date.now()-timer.startedAt)/1000):0;
  record('practice_complete',{module,id,score:Number(score)||0,durationSec});attemptTimers[module]=null;
}
function abandonPractice(module,id){
  const timer=attemptTimers[module];if(timer&&timer.id===id){record('practice_abandon',{module,id,durationSec:Math.round((Date.now()-timer.startedAt)/1000)});attemptTimers[module]=null}
}
""",
        """const attemptTimers={diagnostic:null,'process-data':null};
const practiceStepResults={diagnostic:new Map(),'process-data':new Map()};
let currentDiagnostic=null,currentProcessData=null;
function startPractice(module,id){
  const safeId=safeString(id,96);if(!safeId)return;attemptTimers[module]={id:safeId,startedAt:Date.now()};practiceStepResults[module]=new Map();
  const prior=eventsFor().filter(x=>x.type==='practice_start'&&x.module===module&&x.id===safeId).length;
  record('practice_start',{module,id:safeId,attempt:prior+1});
}
function markPracticeChoice(module,id,step,correct){
  const timer=attemptTimers[module];if(!timer||timer.id!==id||typeof correct!=='boolean')return false;
  practiceStepResults[module].set(Number(step)||0,correct);
  if(!correct)record('practice_miss',{module,id,step:Number(step)||0,correct:false});
  return true;
}
function trackedPracticeScore(module,id,total){
  const timer=attemptTimers[module],n=Number(total)||0;if(!timer||timer.id!==id||n<1)return 0;
  const correct=[...practiceStepResults[module].values()].filter(Boolean).length;return Math.round(correct/n*100)
}
function finishPractice(module,id,score){
  const timer=attemptTimers[module],durationSec=timer&&timer.id===id?Math.round((Date.now()-timer.startedAt)/1000):0;
  record('practice_complete',{module,id,score:Number(score)||0,durationSec});attemptTimers[module]=null;practiceStepResults[module]=new Map();
}
function abandonPractice(module,id){
  const timer=attemptTimers[module];if(timer&&timer.id===id){record('practice_abandon',{module,id,durationSec:Math.round((Date.now()-timer.startedAt)/1000)});attemptTimers[module]=null;practiceStepResults[module]=new Map()}
}
function diagnosticChoiceCorrect(id,step,choiceIndex){
  const lab=(window.MM_DIAGNOSTIC_LABS?.labs||[]).find(x=>x.id===id),choice=lab?.steps?.[Number(step)]?.choices?.[Number(choiceIndex)];
  return choice&&typeof choice.correct==='boolean'?choice.correct:null
}
function processChoiceCorrect(id,step,choiceIndex){
  const result=window.MM_PROCESS_DATA_DIAGNOSTICS?.evaluateChoice?.(id,Number(step),Number(choiceIndex));
  return result?.valid?!!result.correct:null
}
"""
    )
    start="function handlePracticeClick(e){\n"
    end="\nfunction ensureStyle(){"
    p=ROOT/'learning-analytics.js';text=p.read_text(encoding='utf-8')
    a=text.find(start);b=text.find(end,a)
    if a<0 or b<0:raise SystemExit('learning-analytics.js: handlePracticeClick block not found')
    new="""function handlePracticeClick(e){
  const t=e.target.closest?.('[data-dl-start],[data-dl-choice],[data-dl-finish],[data-dl-restart],[data-dl-home],[data-dl-back],[data-pd-start],[data-pd-choice],[data-pd-finish],[data-pd-restart],[data-pd-home],[data-pd-back]');if(!t)return;
  if(t.dataset.dlStart){currentDiagnostic=t.dataset.dlStart;startPractice('diagnostic',currentDiagnostic);return}
  if(t.hasAttribute('data-dl-restart')){if(currentDiagnostic)startPractice('diagnostic',currentDiagnostic);return}
  if(t.dataset.dlChoice!==undefined&&currentDiagnostic){const host=document.getElementById('diagnosticLabs'),step=Number(host?.dataset.step||0),correct=diagnosticChoiceCorrect(currentDiagnostic,step,Number(t.dataset.dlChoice));markPracticeChoice('diagnostic',currentDiagnostic,step,correct);return}
  if(t.hasAttribute('data-dl-finish')&&currentDiagnostic){const lab=(window.MM_DIAGNOSTIC_LABS?.labs||[]).find(x=>x.id===currentDiagnostic),total=lab?.steps?.length||4;finishPractice('diagnostic',currentDiagnostic,trackedPracticeScore('diagnostic',currentDiagnostic,total));return}
  if((t.hasAttribute('data-dl-home')||t.hasAttribute('data-dl-back'))&&currentDiagnostic){abandonPractice('diagnostic',currentDiagnostic);currentDiagnostic=null;return}

  if(t.dataset.pdStart){currentProcessData=t.dataset.pdStart;startPractice('process-data',currentProcessData);return}
  if(t.hasAttribute('data-pd-restart')){if(currentProcessData)startPractice('process-data',currentProcessData);return}
  if(t.dataset.pdChoice!==undefined&&currentProcessData){const host=document.getElementById('processDataLabs'),step=Number(host?.dataset.step||0),correct=processChoiceCorrect(currentProcessData,step,Number(t.dataset.pdChoice));markPracticeChoice('process-data',currentProcessData,step,correct);return}
  if(t.hasAttribute('data-pd-finish')&&currentProcessData){finishPractice('process-data',currentProcessData,trackedPracticeScore('process-data',currentProcessData,4));return}
  if((t.hasAttribute('data-pd-home')||t.hasAttribute('data-pd-back'))&&currentProcessData){abandonPractice('process-data',currentProcessData);currentProcessData=null}
}"""
    p.write_text(text[:a]+new+text[b:],encoding='utf-8')

    qa=ROOT/'qa_learning_analytics.py';q=qa.read_text(encoding='utf-8')
    q=q.replace("\"const VERSION='2026.09.10.1'\",","\"const VERSION='2026.09.10.2'\",",1)
    anchor="need(p.returncode==0,'learning-analytics.js syntax error: '+(p.stderr or p.stdout))\n"
    addition=anchor+"p=subprocess.run(['node','--check',str(ROOT/'process-data-diagnostics.js')],capture_output=True,text=True)\nneed(p.returncode==0,'process-data-diagnostics.js syntax error: '+(p.stderr or p.stdout))\n"
    if "process-data-diagnostics.js syntax error" not in q:
        if anchor not in q:raise SystemExit('qa_learning_analytics.py syntax anchor missing')
        q=q.replace(anchor,addition,1)
    marker_anchor="    'MM_LEARNING_ANALYTICS'\n]:\n"
    marker_new="    'practiceStepResults',\n    'diagnosticChoiceCorrect',\n    'processChoiceCorrect',\n    'MM_PROCESS_DATA_DIAGNOSTICS?.evaluateChoice?.',\n    'MM_LEARNING_ANALYTICS'\n]:\n"
    if "'practiceStepResults'" not in q:
        if marker_anchor not in q:raise SystemExit('qa_learning_analytics.py marker anchor missing')
        q=q.replace(marker_anchor,marker_new,1)
    privacy_anchor="need('Math.max(...a)-a[0]' not in js,'retry gain must not use best-ever score because that hides later regression')\n"
    extra=privacy_anchor+"for forbidden_dom_inference in [\"querySelector('.dl-choice.wrong')\",\"querySelector('.pd-choice.wrong')\",\".dl-summary strong\",\".pd-summary strong\"]:\n    need(forbidden_dom_inference not in js,f'practice analytics must use structured correctness, not rendered DOM state: {forbidden_dom_inference}')\nneed('evaluateChoice' in text('process-data-diagnostics.js'),'process-data practice must expose structured choice evaluation')\n"
    if 'forbidden_dom_inference' not in q:
        if privacy_anchor not in q:raise SystemExit('qa_learning_analytics.py DOM inference anchor missing')
        q=q.replace(privacy_anchor,extra,1)
    qa.write_text(q,encoding='utf-8')


def main():
    patch_process_storage()
    patch_process_practice_api()
    patch_learning_analytics()
    print('Follow-up audit hardening applied: immutable process-row identity and structured practice analytics.')

if __name__=='__main__':
    main()
