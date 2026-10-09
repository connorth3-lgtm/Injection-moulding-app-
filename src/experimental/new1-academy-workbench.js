/* NEW1 development workbench. Never loaded by the public application shell. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=String(text);if(cls)el.className=cls;return el};
const text=(s,t='p',cls)=>node(t,s,cls);
const action=(s,fn)=>{const b=node('button',s);b.type='button';b.addEventListener('click',fn);return b};
const clear=el=>el.replaceChildren();
const PILLARS=[['factory','Virtual Factory'],['book','Encyclopaedia'],['tutor','Personal tutor'],['pathway','Apprenticeship'],['trainer','Trainer workspace']];
const state={tab:'factory',phase:'fault',answers:{},review:null,search:''};let academy=null;
function frame(host,eyebrow,title,description){host.append(text(eyebrow,'span','eyebrow'),text(title,'h2'),text(description))}
function switchTo(tab){state.tab=tab;render()}
function factory(host){
 frame(host,'1 / 5 · Simulated engineering','Virtual Factory — Case One','One cavity in a four-cavity tool becomes light. Compare authored shot patterns, choose a discriminating test, and verify all cavities.');
 const caseRow=academy.canonicalCase();
 const sections=node('section',undefined,'columns');
 const left=node('article',undefined,'panel');
 left.append(text('Four cavity comparison','h3'),text(academy.factory.metricLabel,'p','muted'));
 const phases=node('div',undefined,'buttons');
 academy.factory.phases.forEach(phase=>{const b=action(phase,()=>{state.phase=phase;render()});b.setAttribute('aria-pressed',String(state.phase===phase));phases.append(b)});
 left.append(phases);
 const metrics=node('div',undefined,'metrics');
 academy.factory.compare(state.phase).forEach(x=>{
  const item=node('div',undefined,'metric');if(x.cavity===4)item.classList.add('warn');
  item.append(text('Cavity '+x.cavity,'small'),text(x.index.toFixed(2),'strong'),text((x.changeFromBaseline>0?'+':'')+x.changeFromBaseline.toFixed(2)+' vs known good','small','muted'));metrics.append(item)
 });left.append(metrics);
 const wrapper=node('div',undefined,'scroll');
 const table=node('table');const heading=node('tr');
 ['Shot','Phase','C1','C2','C3','C4'].forEach(s=>heading.append(text(s,'th')));
 const thead=node('thead');thead.append(heading);table.append(thead);
 const tbody=node('tbody');
 academy.factory.shots.filter(x=>x.phase===state.phase).forEach(shot=>{
  const tr=node('tr');[shot.shot,shot.phase,...shot.cavities.map(x=>x.toFixed(1))].forEach(v=>tr.append(text(v,'td')));tbody.append(tr)
 });
 table.append(tbody);wrapper.append(table);left.append(wrapper);
 const right=node('article',undefined,'panel');
 right.append(text('Authored shop-floor brief','h3'),text(caseRow.brief),text('Known-good record: '+caseRow.baseline,'p','muted'),text('Evidence board','h3'));
 const observations=node('dl');
 caseRow.observations.forEach(([key,value])=>{observations.append(text(key,'dt'),text(value,'dd'))});
 right.append(observations,text('Synthetic, dimensionless indices are illustrative only. They are not grams, measured shots or acceptance limits.','p','muted'));
 sections.append(left,right);host.append(sections);
 const assessment=node('section',undefined,'panel');assessment.append(text('Four-step evidence assessment','h3'),text('The existing Virtual Apprenticeship owns every question, answer key and score.'));
 const questions=node('div',undefined,'question-grid');
 for(const step of window.MM_NEW1_ACADEMY.steps){
  const row=caseRow[step],fieldset=node('fieldset',undefined,'question'),legend=text(step[0].toUpperCase()+step.slice(1)+' · '+row.prompt,'legend');
  fieldset.append(legend);
  row.options.forEach(([id,label])=>{
   const option=node('label',undefined,'option'),input=node('input');
   input.type='radio';input.name='new1-'+step;input.value=id;input.checked=state.answers[step]===id;
   input.addEventListener('change',()=>{state.answers[step]=id;state.review=null;const res=$('new1Review');if(res)res.textContent='Ready to review when all four choices are selected.'});
   option.append(input,text(label,'span'));fieldset.append(option)
  });questions.append(fieldset);
 }
 assessment.append(questions);
 const controls=node('div',undefined,'buttons');
 controls.append(action('Review my reasoning',()=>{state.review=academy.review(state.answers);render()}),
  action('Reset',()=>{state.answers={};state.review=null;render()}),
  action('Read multi-cavity module',()=>{state.search='multi-cavity';switchTo('book')}));
 assessment.append(controls);
 const output=node('div',undefined,'result');output.id='new1Review';output.setAttribute('aria-live','polite');
 const result=state.review;
 if(!result){output.append(text('Complete all four choices, then select Review.'))}
 else if(result.state!=='formative-review')output.append(text(result.reason||'All four decisions are needed.'));
 else{
  output.append(text('Formative reasoning '+result.total+'/'+result.max,'h3'));
  result.dimensions.forEach(d=>output.append(text((d.correct?'✓ ':'Review · ')+d.label,'p',d.correct?'good':'needs-work')));
  output.append(text(result.tutor),action('Go to your tutor',()=>switchTo('tutor')));
 }
 assessment.append(output);host.append(assessment);
}
function book(host){
 frame(host,'2 / 5 · Source-first reference','Engineering Encyclopaedia','Search the 46 governed Book modules and their existing course-level crosswalk. Evidence status remains exactly as authored.');
 const field=node('input');field.type='search';field.value=state.search;field.placeholder='Search module, course or theme';field.setAttribute('aria-label','Search governed Book modules');
 const list=node('div',undefined,'cards');const feedback=node('p',undefined,'muted');
 function update(){
  state.search=field.value;clear(list);const rows=academy.index.search(state.search);
  if(!rows.length){list.append(text('No matching governed Book module.'));return}
  rows.forEach(ch=>{
   const card=node('article',undefined,'panel');
   card.append(text(ch.part,'small','eyebrow'),text(ch.title,'h3'),text(ch.level+' · evidence status: '+ch.state,'p','muted'));
   if(ch.courses.length)card.append(text('Aligned courses: '+ch.courses.join(', '),'p','muted'));
   card.append(text(ch.sourceIds.length?'Source IDs: '+ch.sourceIds.join(', '):'No module-level source ID listed in the foundation manifest.','p','muted'));
   card.append(action('Open in canonical Book reader',()=>{
    if(!window.MMBook?.openChapter){feedback.textContent='Full Book reader is available inside the governed MouldMaster app. This development page shows metadata only.';return}
    void academy.openChapter(ch.id);
   }));list.append(card);
  })
 }
 field.addEventListener('input',update);host.append(field,feedback,list);update();
}
function tutor(host){
 frame(host,'3 / 5 · Evidence-first feedback','Personal engineering tutor','Your recommended Book modules and next case are derived from the existing authored reasoning scorer.');
 const plan=academy.tutor();const intro=node('section',undefined,'panel');
 intro.append(text(plan.headline,'h3'),text('Recommended practice: '+plan.recommendedCase+' · Coaching level: '+plan.nextCoachingLevel));
 if(academy.lastReview()?.state==='formative-review')intro.append(text('Current formative result '+academy.lastReview().total+'/4'));
 else intro.append(text('Review Case One to personalize the recommendations.'));
 host.append(intro);
 const cards=node('div',undefined,'cards');
 plan.bookRecommendations.forEach(ch=>{const el=node('section',undefined,'panel');
  el.append(text(ch.title,'h3'),text('Governed evidence: '+ch.evidenceState,'p','muted'));
  el.append(action('Find Book chapter',()=>{state.search=ch.id;switchTo('book')}));cards.append(el)
 });host.append(cards,action('Return to the factory case',()=>switchTo('factory')));
 host.append(text(plan.authority,'p','boundary'));
}
function pathway(host){
 frame(host,'4 / 5 · Work-related learning','Five-level virtual apprenticeship','Role-oriented formative practice built from the existing six authored investigations, not a workplace sign-off.');
 const list=node('div',undefined,'cards');
 academy.pathway().forEach(level=>{const card=node('section',undefined,'panel');
  card.append(text(level.name,'h3'),text(level.goal));
  level.cases.forEach(x=>card.append(text(x.caseId+(x.attempted?' · reviewed '+x.best+'/4':' · no recorded attempt'),'p','muted')));
  card.append(text('Formal credential: not awarded · Workplace competence: not verified','p','boundary'));
  list.append(card)
 });host.append(list);
}
function trainer(host){
 frame(host,'5 / 5 · Optional supervisor tools','Trainer assignment workspace','Create a local assignment template from governed case IDs. No student accounts, remote data sharing or tracker are installed.');
 const form=node('form',undefined,'panel editor');
 const name=node('input');name.type='text';name.minLength=5;name.maxLength=100;name.required=true;name.placeholder='Four-cavity diagnosis session';
 const title=node('label');title.append(text('Assignment title (do not enter people, customers or machine IDs)','span'),name);
 const level=node('select');window.MM_NEW1_ACADEMY.pathways.forEach(p=>{const option=node('option',p.name);option.value=p.id;level.append(option)});
 const choose=node('label');choose.append(text('Suggested apprenticeship level','span'),level);
 const cases=node('fieldset',undefined,'question');cases.append(text('Choose authored cases','legend'));const checks=[];
 window.MM_VIRTUAL_APPRENTICESHIP.cases.forEach(row=>{
  const label=node('label',undefined,'option');const input=node('input');input.type='checkbox';input.value=row.id;input.checked=row.id==='VA-02';
  checks.push(input);label.append(input,text(row.id+' · '+row.title,'span'));cases.append(label)
 });
 const instructions=node('textarea');instructions.rows=3;instructions.maxLength=500;instructions.value='Compare cavity-specific evidence with a traceable known-good window. Explain one discriminating test and verification approach.';
 const notes=node('label');notes.append(text('Trainer instructions (max 500 characters; no sensitive details)','span'),instructions);
 const output=node('pre',undefined,'output');output.setAttribute('aria-live','polite');
 const submit=action('Generate local assignment JSON',()=>{});submit.type='submit';form.append(title,choose,cases,notes,submit,output);
 form.addEventListener('submit',event=>{
  event.preventDefault();
  try{
   const draft=academy.trainerDraft({title:name.value,level:level.value,caseIds:checks.filter(x=>x.checked).map(x=>x.value),instructions:instructions.value});
   const content=academy.assignmentExport(draft);output.textContent=content;
   const prev=form.querySelector('[data-new1-save]');prev?.remove();
   const save=action('Download template',()=>{
    const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));
    const anchor=node('a');anchor.href=url;anchor.download='mouldmaster-formative-assignment.json';document.body.append(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
   });
   save.dataset.new1Save='1';output.after(save)
  }catch(error){output.textContent='Assignment rejected: '+error.message}
 });
 host.append(form);
 const share=node('section',undefined,'panel');
 share.append(text('Voluntary learner feedback export','h3'),text('Only your reviewed four-step formative score and topic gaps are included. The result is not automatically transmitted.'));
 const consent=node('input');consent.type='checkbox';const label=node('label',undefined,'option');label.append(consent,text('I agree to prepare my anonymous formative summary.','span'));share.append(label);
 const summary=node('pre',undefined,'output');summary.setAttribute('aria-live','polite');
 share.append(action('Prepare summary',()=>{
  try{summary.textContent=JSON.stringify(academy.learnerShare(academy.lastReview(),consent.checked),null,2)}
  catch(error){summary.textContent='Cannot prepare summary: '+error.message}
 }),summary);
 share.append(text('Learning-performance summaries can still be sensitive; sharing remains voluntary and external to this workbench.','p','boundary'));host.append(share);
}
function render(){
 if(!academy)return;
 // Never present the previous learner's locally cached score after a profile change.
 if(state.review?.state==='formative-review'&&academy.lastReview()!==state.review)state.review=null;
 const tabs=$('academyTabs'),panel=$('academyPanel');clear(tabs);clear(panel);
 PILLARS.forEach(([key,label])=>{const b=action(label,()=>switchTo(key));b.setAttribute('aria-current',state.tab===key?'page':'false');tabs.append(b)});
 panel.setAttribute('aria-label',PILLARS.find(x=>x[0]===state.tab)?.[1]||'New1');
 ({factory,book,tutor,pathway,trainer}[state.tab]||factory)(panel);
 panel.append(text('LOCAL DEVELOPMENT ONLY — all observations are synthetic or governed metadata. No accredited or production-machine authority.','p','boundary'));
}
async function boot(){
 try{
  const paths=['../data/book-manifest-v1.json','../data/book-curriculum-crosswalk-v1.json','../data/new1-factory-evidence-v1.json'];
  const response=await Promise.all(paths.map(p=>fetch(p)));
  if(response.some(r=>!r.ok))throw Error('Use a local repository-root HTTP server; one of the governed source files was not found.');
  const [bookManifest,crosswalk,factoryEvidence]=await Promise.all(response.map(r=>r.json()));
  const va=window.MM_VIRTUAL_APPRENTICESHIP,adapter=window.MM_NEW1_VIRTUAL_FACTORY,core=window.MM_NEW1_ACADEMY;
  if(!va||!adapter||!core)throw Error('Canonical Virtual Apprenticeship or New1 experimental modules did not load.');
  const bridge=adapter.createBridge({apprenticeship:va,runtime:{storage:{get(){return null}}},
   spatial:{open:()=>{switchTo('factory');return true}},book:{openChapter:()=>false}});
  academy=core.createAcademy({apprenticeship:va,bridge,bookManifest,crosswalk,factoryEvidence});
  $('academyStatus').textContent='Development workbench ready · '+academy.index.chapters+' governed Book modules · '+core.pathways.length+' role tracks';
  render();
 }catch(error){$('academyStatus').textContent='Workbench unavailable: '+error.message}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else void boot();
})();