import json
import subprocess
import tempfile
from pathlib import Path

import qa_question_quality_extreme_runtime_v2 as v2

ROOT = v2.audit.ROOT
POST_APPROVAL_META = None
POST_APPROVAL_CUE = None
POST_APPROVAL_ITEMS = None


def _need(ok, msg):
    v2._original_need(ok, msg)


def _load_all_bank_post_approval_items():
    global POST_APPROVAL_META, POST_APPROVAL_CUE, POST_APPROVAL_ITEMS
    if POST_APPROVAL_ITEMS is not None:
        return POST_APPROVAL_ITEMS

    raw = v2._original_load_psychometric_items()
    items = []
    for x in raw:
        y = dict(x)
        y['options'] = list(x.get('options', []))
        y['feedback'] = list(x.get('feedback', []))
        items.append(y)

    _need(len(items) == 197, f'pre-approval learner-visible item count mismatch: {len(items)}')
    before_ids = [x['id'] for x in items]
    _need(len(before_ids) == len(set(before_ids)), 'pre-approval learner-visible IDs must be unique')
    before = {
        x['id']: {
            'correct': x['correct'],
            'keyed': str(x['options'][x['correct']]),
            'stem': str(x.get('stem', '')),
            'rationale': str(x.get('rationale', '')),
        }
        for x in items
    }

    node = r'''
const fs=require('fs'),vm=require('vm'),items=%s,meta=%s;
const D={
 exams:{Beginner:[],Intermediate:[],Advanced:[]},
 regionalQuestions:{UK:{Beginner:[],Intermediate:[],Advanced:[]},US:{Beginner:[],Intermediate:[],Advanced:[]},NZ:{Beginner:[],Intermediate:[],Advanced:[]}},
 scenarios:[],assessmentQA:{evidenceApproval:{}}
};
const diagMap=new Map(),matMap=new Map(),optMap=new Map();
const mkChoice=(text,correct,feedback)=>({text,correct,feedback});
for(const x of items){
 if(x.kind==='technical-exam')D.exams[x.level].push({__id:x.id,q:x.stem,options:[...x.options],correct:x.correct,optionFeedback:[...(x.feedback||[])],rationale:x.rationale||''});
 else if(x.kind==='regional-exam')D.regionalQuestions[x.region][x.level].push({__id:x.id,q:x.stem,options:[...x.options],correct:x.correct,optionFeedback:[...(x.feedback||[])],rationale:x.rationale||''});
 else if(x.kind==='scenario'){
   const parts=String(x.stem||'').split(': ');
   D.scenarios.push({__id:x.id,title:parts.shift()||x.id,situation:parts.join(': '),choices:[...x.options],correct:x.correct,why:x.rationale||'',feedback:[...(x.feedback||[])],category:x.category||'',difficulty:x.level||'',mmStableId:x.id});
 }
 else if(x.kind==='diagnostic-lab'){
   if(!diagMap.has(x.labId))diagMap.set(x.labId,{id:x.labId,title:x.labId,level:x.level||'',focus:x.focus||'',steps:[]});
   diagMap.get(x.labId).steps.push({__id:x.id,stage:x.stage,question:x.stem,choices:x.options.map((t,i)=>mkChoice(t,i===x.correct,(x.feedback||[])[i]||'')),rationale:x.rationale||''});
 }
 else if(x.kind==='material-lab'){
   if(!matMap.has(x.labId))matMap.set(x.labId,{id:x.labId,title:x.labId,level:x.level||'',focus:x.focus||'',sourceIds:x.sourceIds||[],steps:[]});
   matMap.get(x.labId).steps.push({__id:x.id,stage:x.stage,question:x.stem,choices:x.options.map((t,i)=>mkChoice(t,i===x.correct,(x.feedback||[])[i]||'')),rationale:x.rationale||''});
 }
 else if(x.kind==='optional-material-practice'){
   if(!optMap.has(x.labId))optMap.set(x.labId,{id:x.labId,title:x.labId,level:x.level||'',focus:x.focus||'',sourceIds:x.sourceIds||[],steps:[]});
   optMap.get(x.labId).steps.push({__id:x.id,stage:x.stage,question:x.stem,choices:x.options.map((t,i)=>mkChoice(t,i===x.correct,(x.feedback||[])[i]||'')),rationale:x.rationale||''});
 }
}
const DIAG={labs:[...diagMap.values()]},MAT={labs:[...matMap.values()]},OPT={labs:[...optMap.values()]};
const window={MM_DATA:D,MM_DIAGNOSTIC_LABS:DIAG,MM_MATERIAL_BEHAVIOUR_LABS:MAT,MM_MATERIAL_PRACTICE_EXTENSIONS:OPT,MM_PSYCHOMETRIC_HARDENING:meta,MM_EVIDENCE_APPROVAL:{approvedInputs:{}}};
const sandbox={window,console,setTimeout:(fn)=>fn()};window.window=window;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('assessment-psychometric-approval.js','utf8'),sandbox,{filename:'assessment-psychometric-approval.js'});
const out=[];
for(const level of ['Beginner','Intermediate','Advanced'])for(const q of D.exams[level])out.push({id:q.__id,options:q.options,correct:q.correct,feedback:q.optionFeedback||[],stem:q.q||'',rationale:q.rationale||''});
for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(const q of D.regionalQuestions[region][level])out.push({id:q.__id,options:q.options,correct:q.correct,feedback:q.optionFeedback||[],stem:q.q||'',rationale:q.rationale||''});
for(const s of D.scenarios)out.push({id:s.__id,options:s.choices,correct:s.correct,feedback:s.feedback||[],stem:`${s.title}: ${s.situation}`,rationale:s.why||''});
function labsToOut(labs){for(const lab of labs)for(const s of lab.steps){const correct=s.choices.findIndex(c=>c.correct===true);out.push({id:s.__id,options:s.choices.map(c=>c.text),correct,feedback:s.choices.map(c=>c.feedback||''),stem:s.question||'',rationale:s.rationale||''})}}
labsToOut(DIAG.labs);labsToOut(MAT.labs);labsToOut(OPT.labs);
process.stdout.write(JSON.stringify({items:out,cue:window.MM_PSYCHOMETRIC_CUE_NEUTRALISATION||null,approval:window.MM_PSYCHOMETRIC_APPROVAL||null}));
''' % (json.dumps(items), json.dumps(v2.audit.PSYCHOMETRIC_META or {}))

    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8', dir=ROOT) as h:
        h.write(node)
        pth = Path(h.name)
    try:
        p = subprocess.run(['node', str(pth)], cwd=ROOT, capture_output=True, text=True, encoding='utf-8', errors='replace')
    finally:
        pth.unlink(missing_ok=True)
    _need(p.returncode == 0, 'all-bank post-approval psychometric runtime failed: ' + (p.stderr or p.stdout)[:8000])

    data = json.loads(p.stdout)
    POST_APPROVAL_CUE = data.get('cue') or {}
    POST_APPROVAL_META = data.get('approval') or {}
    transformed = data.get('items') or []
    _need(len(transformed) == 197, f'post-approval learner-visible item count mismatch: {len(transformed)}')
    by_id = {x['id']: x for x in transformed}
    _need(len(by_id) == 197, f'post-approval learner-visible IDs must be unique: {len(by_id)}')
    _need(set(by_id) == set(before_ids), 'post-approval learner-visible ID set changed')

    for x in items:
        item_id = x['id']
        y = by_id[item_id]
        prior = before[item_id]
        _need(y['correct'] == prior['correct'], f'post-approval key index changed: {item_id}')
        _need(str(y['options'][y['correct']]) == prior['keyed'], f'post-approval keyed answer text changed: {item_id}')
        _need(str(y.get('stem', '')) == prior['stem'], f'post-approval stem changed: {item_id}')
        _need(str(y.get('rationale', '')) == prior['rationale'], f'post-approval rationale changed: {item_id}')
        options = [str(o).strip() for o in y.get('options', [])]
        _need(len(options) == 4 and len({o.lower() for o in options}) == 4, f'post-approval option integrity failed: {item_id}')
        x['options'] = y['options']
        x['correct'] = y['correct']
        x['feedback'] = y.get('feedback', [])

    cue = POST_APPROVAL_CUE
    approval = POST_APPROVAL_META
    _need(cue.get('answerKeyChanges') == 0, 'all-bank cue neutralisation must not change answer-key indexes')
    _need(cue.get('keyedChoiceChanges') == 0, 'all-bank cue neutralisation must not change keyed answer text')
    _need(cue.get('missingItems') == 0, 'all-bank cue neutralisation lost learner-visible items')
    _need(cue.get('duplicateOptionConflicts') == 0, 'all-bank cue neutralisation produced duplicate option conflicts')
    _need(cue.get('expectedCoverage') is True, f'all-bank cue coverage mismatch: {cue}')
    _need(int(cue.get('itemsInspected', 0)) == 197, f'all-bank cue item count mismatch: {cue}')
    _need(int(cue.get('totalDistractorEdits', 0)) > int(cue.get('scenarioDistractorEdits', 0)), 'all-bank cue neutralisation did not rewrite any non-scenario distractors')
    _need(approval.get('coverageOk') is True, f'post-approval all-bank coverage failed: {approval}')
    _need(int(approval.get('itemsInspected', 0)) == 197, f'post-approval metadata item count mismatch: {approval}')
    _need(int(approval.get('answerKeyChanges', -1)) == 0 and int(approval.get('keyedChoiceChanges', -1)) == 0, f'post-approval key invariants failed: {approval}')
    _need(int(approval.get('allBankDistractorCueEdits', 0)) == int(cue.get('totalDistractorEdits', 0)), 'post-approval all-bank edit metadata mismatch')

    POST_APPROVAL_ITEMS = items
    return POST_APPROVAL_ITEMS


def main():
    v2.POST_APPROVAL_META = None
    v2.POST_APPROVAL_ITEMS = None
    v2.audit.need = v2._compatible_need
    v2.audit.load_psychometric_items = _load_all_bank_post_approval_items
    v2.audit.surface_cue_model = v2._relative_form_cue_model
    v2.audit.main()
    report_path = ROOT / 'question-quality-extreme-50-pass-report.json'
    report = json.loads(report_path.read_text(encoding='utf-8'))
    report['final_psychometric_approval'] = POST_APPROVAL_META
    report['final_psychometric_cue_neutralisation'] = POST_APPROVAL_CUE
    report['final_runtime_layer'] = 'assessment-psychometric-approval.js'
    report['final_runtime_verifier'] = 'qa_question_quality_extreme_runtime_v3.py'
    report_path.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print('All-bank post-approval learner runtime verified:', POST_APPROVAL_META)


if __name__ == '__main__':
    main()
