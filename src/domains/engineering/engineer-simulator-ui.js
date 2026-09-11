/* MouldMaster engineer-friendly simulator UI — 2026.09.11 */
(function(){
'use strict';
if(window.MM_ENGINEER_SIMULATOR_UI)return;
const VERSION='2026.09.11.1';
const baseRender=window.renderSimulator;
const baseUpdate=window.updateSimulator;
if(typeof baseRender!=='function'||typeof baseUpdate!=='function'){
  console.warn('[MouldMaster] Engineer simulator UI unavailable: base simulator is not ready.');
  return;
}
const GROUPS=[
  {title:'1 · Fill',copy:'Control how the cavity fills and where the process transfers from velocity to pressure control.',keys:['fillAgg','transfer']},
  {title:'2 · Pack & hold',copy:'Compare packing intensity and hold duration with the known-good, gate-sealed baseline.',keys:['pack','hold']},
  {title:'3 · Thermal & cooling',copy:'Explore temperature offsets and cooling margin without turning the model into a resin recipe.',keys:['meltOffset','mouldOffset','cooling']},
  {title:'4 · Process conditions',copy:'Use qualitative evidence for clamp margin, venting and material moisture control.',keys:['clampMargin','vent','moistureConfidence']}
];
const VERIFY={
  'Short shot':'Verify fill completion and transfer repeatability. If available, compare actual cavity or transfer pressure and part mass with the known-good cycle.',
  'Flash':'Inspect parting-line condition and clamp/tool evidence. Compare actual pressure response and part mass before changing several settings.',
  'Sink':'Compare part mass versus hold duration and confirm gate-seal behaviour before changing pressure and time together.',
  'Burn':'Check vent condition and location plus evidence of trapped gas. Compare fill behaviour with one controlled change at a time.',
  'Splay':'Verify material-specific drying and handling evidence plus recent material history before adjusting melt conditions.',
  'Warpage':'Compare cooling and ejection symmetry, mould-temperature evidence and part dimensions with the known-good condition.'
};
function node(tag,className,text){
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(text!=null)el.textContent=text;
  return el;
}
function keyForLabel(label){
  const input=label?.querySelector('input[type="range"][data-mm-oninput]');
  const code=input?.getAttribute('data-mm-oninput')||'';
  return code.match(/simChange\('([^']+)'/)?.[1]||'';
}
function makeIntro(root){
  if(root.querySelector('#mmEngineerSimIntro'))return;
  const legal=root.querySelector('.legal-note');
  const intro=node('div','tip');intro.id='mmEngineerSimIntro';
  const icon=node('span','', '✓');
  const copy=node('div');
  const strong=node('b','', 'Engineer workflow: baseline → one change → signal → measurement');
  const text=document.createTextNode(' Start from a known-good process, move one variable deliberately, read the strongest advisory signal, then verify it with real machine, mould, material and part evidence.');
  copy.append(strong,text);intro.append(icon,copy);
  legal?.insertAdjacentElement('afterend',intro);
}
function groupInputs(form){
  const grid=form.querySelector(':scope > .form-grid');
  if(!grid||grid.dataset.mmEngineerGrouped==='1')return;
  const labels=Array.from(grid.querySelectorAll(':scope > label'));
  const byKey=new Map(labels.map(label=>[keyForLabel(label),label]));
  const groups=node('div','mm-engineer-sim-groups');
  for(const group of GROUPS){
    const section=node('section','content-block');
    const heading=node('h3','',group.title);
    const copy=node('p','muted',group.copy);
    const inner=node('div','form-grid');
    for(const key of group.keys){const label=byKey.get(key);if(label)inner.appendChild(label)}
    section.append(heading,copy,inner);groups.appendChild(section);
  }
  for(const label of labels)if(label.parentElement===grid)groups.appendChild(label);
  grid.replaceWith(groups);groups.dataset.mmEngineerGrouped='1';
}
function demoteChallenge(form){
  const challenge=form.querySelector(':scope > .sim-challenge');
  if(!challenge||challenge.closest('#mmSimPractice'))return;
  const details=node('details','content-block');details.id='mmSimPractice';
  const summary=node('summary','', 'Optional practice challenge');
  details.append(summary,challenge);form.prepend(details);
  const eyebrow=challenge.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent='Practice mode';
}
function movePartVisual(output){
  const visual=output.querySelector(':scope > .part-visual');
  if(!visual||visual.closest('#mmSimPartVisual'))return;
  const details=node('details','content-block');details.id='mmSimPartVisual';
  const summary=node('summary','', 'Illustrative part visual');
  const note=node('p','tiny muted','Conceptual only. The visual is not CFD, a cavity-pressure map or a prediction of actual part appearance.');
  details.append(summary,note,visual);output.appendChild(details);
}
function engineeringDetail(output){
  if(output.querySelector('#mmSimEngineeringDetail'))return;
  const details=node('details','content-block');details.id='mmSimEngineeringDetail';
  const summary=node('summary','', 'Engineering detail');
  const list=node('ul');
  [
    'The 0–100 values are internal training indicators, not defect probabilities.',
    'Inputs are relative to a validated or known-good material, mould and machine baseline.',
    'Temperature values are offsets from that baseline, not universal setpoints.',
    'Use measured process and part evidence to confirm a mechanism before making production changes.'
  ].forEach(text=>list.appendChild(node('li','',text)));
  details.append(summary,list);output.appendChild(details);
}
function enhanceStructure(){
  const root=document.getElementById('simulator');if(!root)return;
  makeIntro(root);
  const form=root.querySelector('.form-card');
  const output=root.querySelector('.output-panel');
  if(form){
    const eyebrow=form.querySelector(':scope > .eyebrow');if(eyebrow)eyebrow.textContent='Engineer process setup';
    const title=form.querySelector(':scope > h2');if(title)title.textContent='Change one process condition at a time';
    if(!form.querySelector('#mmSimSetupHelp')){
      const help=node('p','muted','Use the validated baseline as zero context. The controls show direction and sensitivity; they do not prescribe machine setpoints.');help.id='mmSimSetupHelp';
      title?.insertAdjacentElement('afterend',help);
    }
    demoteChallenge(form);groupInputs(form);
    const buttons=Array.from(form.querySelectorAll('.hero-buttons button'));
    for(const button of buttons){
      if(button.textContent.trim()==='Balanced example')button.textContent='Load balanced example';
      if(button.textContent.trim()==='Unstable example')button.textContent='Load unstable example';
    }
  }
  if(output){
    const eyebrow=output.querySelector(':scope > .eyebrow');if(eyebrow)eyebrow.textContent='Engineering readout';
    const title=output.querySelector(':scope > h2');if(title)title.textContent='What the model is flagging';
    if(!output.querySelector('#mmSimOutputScope')){
      const scope=node('p','muted','Advisory model output. Read the strongest signal first, then confirm it with real evidence before changing a production process.');scope.id='mmSimOutputScope';
      title?.insertAdjacentElement('afterend',scope);
    }
    const risk=output.querySelector('#riskList');if(risk){risk.setAttribute('aria-live','polite');risk.setAttribute('aria-atomic','true')}
    movePartVisual(output);engineeringDetail(output);
  }
}
function band(score){return score<30?'low model signal':score<55?'watch':'strong model signal'}
function enhanceResult(){
  const root=document.getElementById('simulator');if(!root)return;
  const output=root.querySelector('.output-panel');const riskList=root.querySelector('#riskList');if(!output||!riskList)return;
  const rows=Array.from(riskList.querySelectorAll('.risk')).map(row=>{
    const name=row.querySelector(':scope > span')?.textContent?.trim()||'';
    const value=Number.parseFloat(row.querySelector(':scope > b')?.textContent||'');
    if(!name||!Number.isFinite(value))return null;
    const score=Math.max(0,Math.min(100,Math.round(value)));
    const valueEl=row.querySelector(':scope > b');if(valueEl)valueEl.textContent=`${score} / 100`;
    row.setAttribute('aria-label',`${name}: advisory training indicator ${score} out of 100, ${band(score)}`);
    return {name,score};
  }).filter(Boolean);
  if(!rows.length)return;
  rows.sort((a,b)=>b.score-a.score);
  const top=rows[0];
  let primary=output.querySelector('#mmSimPrimaryFinding');
  if(!primary){primary=node('div','callout');primary.id='mmSimPrimaryFinding';primary.setAttribute('role','status');primary.setAttribute('aria-live','polite');riskList.insertAdjacentElement('beforebegin',primary)}
  primary.textContent=top.score<30
    ?`Primary finding: no dominant advisory signal in this simplified model. Highest indicator is ${top.name} at ${top.score}/100 (${band(top.score)}).`
    :`Primary watch: ${top.name} · ${top.score}/100 (${band(top.score)}). This is a model indicator, not a probability.`;
  const advice=root.querySelector('#simAdvice');
  if(advice){advice.replaceChildren(node('b','', 'What to verify next'),document.createElement('br'),document.createTextNode(VERIFY[top.name]||'Compare the changed condition with the known-good cycle and collect measured evidence before making another change.'))}
}
function renderWrapped(){const result=baseRender.apply(this,arguments);enhanceStructure();enhanceResult();return result}
function updateWrapped(){const result=baseUpdate.apply(this,arguments);enhanceResult();return result}
window.renderSimulator=renderWrapped;
window.updateSimulator=updateWrapped;
if(window.MM_RUNTIME_V2?.registerModule)window.MM_RUNTIME_V2.registerModule('engineer-simulator-ui',{version:VERSION,type:'simulator-presentation',scope:'advisory-only'});
if(document.getElementById('simulator')?.children.length){enhanceStructure();enhanceResult()}
window.MM_ENGINEER_SIMULATOR_UI=Object.freeze({version:VERSION,enhance(){enhanceStructure();enhanceResult()}});
})();
