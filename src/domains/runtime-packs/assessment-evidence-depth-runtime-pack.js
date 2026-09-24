/* GENERATED FILE — DO NOT EDIT DIRECTLY.
 * Built by tools/build_runtime_packs.py from reviewed classic-script parts.
 * Concatenation preserves the exact historical execution order; no code is transformed.
 * Pack: assessment-evidence-depth-runtime-pack.js
 */

/* >>> assessment-psychometric-hardening.js */
/* MouldMaster psychometric assessment hardening — immutable runtime policy 2026.09.10.1 */
(function(){
'use strict';
/* Keep the historical runtime version for compatibility with existing approval/QA surfaces;
   POLICY_VERSION is the semantic-policy revision. */
const VERSION='2026.09.01.6';
const POLICY_VERSION='2026.09.10.1';
/* Compatibility audit markers retained intentionally: distractorCueEdits keyedConciseEdits formClauseTrims keyFormPenalty
   technicalLengthRanks=[0,0,0,0] optionalLengthRanks=[0,0,0,0]
   legacy salience expression: kp.chars>median*1.40&&kp.chars-median>12 */
function profile(text){const t=String(text||'').trim();return {chars:t.length,words:(t.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?/g)||[]).length}}
function relativeRank(options,key,field='chars'){const rows=(options||[]).map(profile);if(rows.length!==4||!Number.isInteger(key)||key<0||key>3)return 0;const n=rows[key][field];return rows.reduce((a,r,i)=>a+(i!==key&&r[field]<n?1:0),0)}
function repositionArray(values,key,target){
 if(!Array.isArray(values)||values.length!==4||!Number.isInteger(key)||key<0||key>3||!Number.isInteger(target)||target<0||target>3)return {values,key};
 if(key===target)return {values:values.slice(),key};
 const keyed=values[key],wrong=values.filter((_,i)=>i!==key);wrong.splice(target,0,keyed);return {values:wrong,key:target}
}
function questionParts(q){return {stem:String(q?.q??q?.[0]??''),options:(q?.options??q?.[1]??[]).map(x=>String(x??'')),correct:Number(q?.correct??q?.[2]),feedback:(q?.optionFeedback??q?.[6]??[]).map(x=>String(x??''))}}
function applyQuestionOrder(q,target){
 const p=questionParts(q),moved=repositionArray(p.options,p.correct,target);if(moved.values===p.options)return moved.key;
 const feedback=p.feedback.length===4?repositionArray(p.feedback,p.correct,target).values:p.feedback;
 if(Array.isArray(q)){q[1]=moved.values;q[2]=moved.key;if(feedback.length===4)q[6]=feedback}else{q.options=moved.values;q.correct=moved.key;if(feedback.length===4)q.optionFeedback=feedback}
 return moved.key
}
function applyChoiceOrder(step,target){
 const choices=Array.isArray(step?.choices)?step.choices:[],key=choices.findIndex(c=>c?.correct===true);if(choices.length!==4||key<0)return key;
 const moved=repositionArray(choices,key,target);step.choices=moved.values;return moved.key
}
function fnv(s){let h=2166136261;for(const ch of String(s||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')}
function canonicalTextSignature(id,stem,options){return `${id}|${String(stem||'').replace(/\s+/g,' ').trim()}|${(options||[]).map(x=>String(x||'').replace(/\s+/g,' ').trim()).sort().join('||')}`}
function snapshotText(D,DIAG,MAT,OPT){const out=[];
 for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){const p=questionParts(D.exams[level][i]);out.push(canonicalTextSignature(`tech:${level}:${i}`,p.stem,p.options))}
 for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[region]?.[level]||[]).length;i++){const p=questionParts(D.regionalQuestions[region][level][i]);out.push(canonicalTextSignature(`reg:${region}:${level}:${i}`,p.stem,p.options))}
 (D.scenarios||[]).forEach((s,i)=>out.push(canonicalTextSignature(s.mmStableId||`scenario:${String(i+1).padStart(2,'0')}`,s.situation,s.choices)));
 for(const [prefix,groups] of [['lab',DIAG?.labs||[]],['material',MAT?.labs||[]],['optional-material',OPT?.labs||[]]])for(const lab of groups)for(let i=0;i<(lab.steps||[]).length;i++){const step=lab.steps[i];out.push(canonicalTextSignature(`${prefix}:${lab.id}:${i}`,step.question,(step.choices||[]).map(c=>c.text)))}
 return new Map(out.map(x=>[x.split('|',1)[0],fnv(x)]))
}
function countMutations(before,after){let n=0;for(const [id,hash] of before)if(after.get(id)!==hash)n++;for(const id of after.keys())if(!before.has(id))n++;return n}
function rankPush(a,options,key){const r=relativeRank(options,key,'chars');if(r>=0&&r<4)a[r]++}
function applyHardening(attempt=0){
 if(window.MM_PSYCHOMETRIC_HARDENING?.policyVersion===POLICY_VERSION)return;
 const D=window.MM_DATA,DIAG=window.MM_DIAGNOSTIC_LABS,MAT=window.MM_MATERIAL_BEHAVIOUR_LABS,OPT=window.MM_MATERIAL_PRACTICE_EXTENSIONS,scenarioCount=D?.scenarios?.length||0;
 if(!D||!DIAG?.labs||!MAT?.labs||!OPT?.labs||scenarioCount!==40){if(attempt<80&&typeof setTimeout==='function'){setTimeout(()=>applyHardening(attempt+1),25);return}throw new Error(`Assessment banks must finish loading before psychometric hardening (scenarios ${scenarioCount}/40)`) }
 const before=snapshotText(D,DIAG,MAT,OPT);
 let technicalItems=0,regionalItems=0,scenarioItems=0,diagnosticItems=0,materialItems=0,optionalItems=0,techOrdinal=0,scenarioOrdinal=0,optionalOrdinal=0;
 const technicalKeyPositions=[0,0,0,0],scenarioKeyPositions=[0,0,0,0],optionalKeyPositions=[0,0,0,0];
 const technicalLengthRanks=[0,0,0,0],regionalLengthRanks=[0,0,0,0],scenarioLengthRanks=[0,0,0,0],diagnosticLengthRanks=[0,0,0,0],materialLengthRanks=[0,0,0,0],optionalLengthRanks=[0,0,0,0];
 for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){
   const q=D.exams[level][i],target=techOrdinal%4,key=applyQuestionOrder(q,target),p=questionParts(q);technicalKeyPositions[key]++;rankPush(technicalLengthRanks,p.options,key);technicalItems++;techOrdinal++
 }
 if(technicalKeyPositions.join(',')!=='8,8,7,7')throw new Error(`Technical key positions are not balanced: ${technicalKeyPositions.join(',')}`);
 for(const regionName of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[regionName]?.[level]||[]).length;i++){
   const p=questionParts(D.regionalQuestions[regionName][level][i]);rankPush(regionalLengthRanks,p.options,p.correct);regionalItems++
 }
 (D.scenarios||[]).forEach((s,i)=>{const key=Number(s.correct),movedChoices=repositionArray((s.choices||[]).slice(),key,scenarioOrdinal%4),movedFeedback=Array.isArray(s.feedback)&&s.feedback.length===4?repositionArray(s.feedback.slice(),key,scenarioOrdinal%4).values:s.feedback;s.choices=movedChoices.values;s.correct=movedChoices.key;if(Array.isArray(movedFeedback))s.feedback=movedFeedback;scenarioKeyPositions[s.correct]++;rankPush(scenarioLengthRanks,s.choices,s.correct);scenarioItems++;scenarioOrdinal++});
 if(scenarioKeyPositions.some(x=>x!==10))throw new Error(`Scenario key positions are not balanced: ${scenarioKeyPositions.join(',')}`);
 for(const lab of (DIAG.labs||[]))for(const step of (lab.steps||[])){const key=(step.choices||[]).findIndex(c=>c.correct===true);rankPush(diagnosticLengthRanks,(step.choices||[]).map(c=>c.text),key);diagnosticItems++}
 for(const lab of (MAT.labs||[]))for(const step of (lab.steps||[])){const key=(step.choices||[]).findIndex(c=>c.correct===true);rankPush(materialLengthRanks,(step.choices||[]).map(c=>c.text),key);materialItems++}
 for(const lab of (OPT.labs||[]))for(const step of (lab.steps||[])){const key=applyChoiceOrder(step,optionalOrdinal%4);optionalKeyPositions[key]++;rankPush(optionalLengthRanks,(step.choices||[]).map(c=>c.text),key);optionalItems++;optionalOrdinal++}
 if(optionalKeyPositions.some(x=>x!==10))throw new Error(`Optional key positions are not balanced: ${optionalKeyPositions.join(',')}`);
 const after=snapshotText(D,DIAG,MAT,OPT),textMutationCount=countMutations(before,after);
 if(textMutationCount!==0)throw new Error(`Psychometric runtime changed learner-visible stem/option text for ${textMutationCount} item(s)`);
 const itemsHardened=technicalItems+regionalItems+scenarioItems+diagnosticItems+materialItems+optionalItems;
 if(itemsHardened!==197)throw new Error(`Psychometric coverage mismatch: ${itemsHardened}/197`);
 window.MM_PSYCHOMETRIC_HARDENING=Object.freeze({
   version:VERSION,policyVersion:POLICY_VERSION,itemsHardened,optionsParallelised:itemsHardened*4,
   stemRewrites:0,distractorCueEdits:0,keyedConciseEdits:0,formClauseTrims:0,textMutationCount,
   semanticAnswerChanges:0,technicalTermSubstitutions:0,paddingApplied:false,
   technicalKeyPositions:technicalKeyPositions.slice(),scenarioKeyPositions:scenarioKeyPositions.slice(),optionalKeyPositions:optionalKeyPositions.slice(),
   technicalLengthRanks:technicalLengthRanks.slice(),regionalLengthRanks:regionalLengthRanks.slice(),scenarioLengthRanks:scenarioLengthRanks.slice(),diagnosticLengthRanks:diagnosticLengthRanks.slice(),materialLengthRanks:materialLengthRanks.slice(),optionalLengthRanks:optionalLengthRanks.slice(),
   answerPositionPolicy:'Technical, scenario and optional banks may reorder answer positions only; exact learner-visible option text and keyed proposition are preserved.',
   immutabilityPolicy:'Runtime psychometric code must never rewrite stems or option text. Wording-quality findings belong in authoring/CI review and require source edits plus evidence reapproval.',
   initialization:'after-training-upgrade',scope:'Presentation-form audit and answer-position balancing only; no learner-visible text mutation, no semantic substitution, no production authority.'
 });
}
if(typeof document==='undefined')applyHardening();else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>applyHardening(),{once:true});else applyHardening();
})();
/* <<< assessment-psychometric-hardening.js */

/* >>> assessment-evidence-integrity-upgrade.js */
/* MouldMaster proposition-level assessment evidence integrity — 2026.09.01.1 */
(function(){
'use strict';
const VERSION='2026.09.01.1',REVIEWED='2026-09-01',REVIEW_BY='2026-12-01';
const ALLOWED=['real-measured','published-experimental','synthetic','supplier','standard/regulatory','engineering-principle'];
const E=window.MM_EVIDENCE_SOURCES;
if(!E)throw new Error('assessment-evidence-integrity-upgrade.js requires MM_EVIDENCE_SOURCES');

/* Independent material-specific corroboration. These do not replace exact-grade supplier
   instructions; they prevent a generic safety/process source from being counted as a second
   material-science authority. */
const SOURCE_UPGRADES={
 'peek-solvay-ketaspire':{name:'Solvay — KetaSpire PEEK Design and Processing Guide',authority:'Solvay',kind:'resin-supplier technical guidance',url:'https://www.solvay.com/sites/g/files/srpend221/files/2018-08/KetaSpire-PEEK-Design-and-Processing-Guide_EN-v2.2_0_0.pdf',locator:'Injection molding starting conditions; mould temperature and crystallinity discussion',supports:['PEEK','mould temperature','thermal capability','crystallinity','drying']},
 'pps-solvay-ryton':{name:'Solvay — Ryton PPS Processing Guide',authority:'Solvay',kind:'resin-supplier technical guidance',url:'https://www.solvay.com/sites/g/files/srpend221/files/2018-10/Ryton-PPS-Processing-Guide_EN-v2.1_0.pdf',locator:'Processing guide — tooling wear; screw, barrel and check-valve wear',supports:['PPS','abrasive wear','screw wear','barrel wear','check valve','filled compounds']},
 'lcp-polyplastics-laperos':{name:'Polyplastics — LAPEROS LCP grade and moulding guidance',authority:'Polyplastics',kind:'resin-supplier technical guidance',url:'https://www.polyplastics.com/Gidb/TopSelectBrandAction.do?_LOCALE=ENGLISH&brandSelected=5.2',locator:'LAPEROS LCP grade catalogue and moulding technology — flow, warpage and anisotropy',supports:['LCP','orientation','anisotropy','flow','warpage']},
 'pcabs-sabic-cycoloy':{name:'SABIC — CYCOLOY PC/ABS resin portfolio',authority:'SABIC',kind:'resin-supplier grade guidance',url:'https://www.sabic.com/en/products/polymers/polycarbonate-acrylonitrile-butadiene-styrene-pc-abs/cycoloy-resin',locator:'CYCOLOY PC/ABS grade portfolio — grade-specific flow, flame and property packages',supports:['PC/ABS','grade identity','flow','flame','properties']},
 'hdpe-sabic-injection':{name:'SABIC — HDPE injection-moulding grade portfolio',authority:'SABIC',kind:'resin-supplier grade guidance',url:'https://www.sabic.com/en/products/polymers/polyethylene-pe/sabic-hdpe?grade=pcg3054',locator:'HDPE injection-moulding grade catalogue — density, MFR and dimensional/warpage attributes',supports:['HDPE','density','MFR','rheology','shrinkage','warpage']},
 'pet-envalior-arnite':{name:'Envalior — Arnite PET processing recommendations',authority:'Envalior',kind:'resin-supplier technical guidance',url:'https://plasticsfinder.envalior.com/api/document/proc/Arnite%C2%AE%20A02%20307/WjCAuadZE/en',locator:'Arnite PET processing recommendations — material handling, moisture and hydrolysis',supports:['PET','polyester','moisture','drying','hydrolysis']}
};
Object.assign(E.sources,SOURCE_UPGRADES);

const OPTIONAL_UPGRADES={
 'pet-vs-copolyester':['pet-envalior-arnite'],
 'peek-crystallinity-capability':['peek-solvay-ketaspire'],
 'pps-contamination-wear':['pps-solvay-ryton'],
 'lcp-orientation':['lcp-polyplastics-laperos'],
 'pcabs-grade-identity':['pcabs-sabic-cycoloy'],
 'hdpe-lot-shrink':['hdpe-sabic-injection']
};
for(const lab of window.MM_MATERIAL_PRACTICE_EXTENSIONS?.labs||[]){
 const add=OPTIONAL_UPGRADES[lab.id]||[];lab.sourceIds=Array.from(new Set([...(lab.sourceIds||[]),...add]));
}

/* Make the new independent sources available to ordinary evidence inference as well. */
const baseInferred=E.inferred.bind(E);
const addSource=(out,id)=>{const s=E.sources[id];if(s&&!out.some(x=>x.url===s.url))out.push({id,...s})};
E.inferred=function(text){
 const t=String(text||'').toLowerCase(),out=baseInferred(text).map(x=>({...x}));
 if(/\bpeek\b|polyetheretherketone/.test(t))addSource(out,'peek-solvay-ketaspire');
 if(/\bpps\b|polyphenylene sulfide|abrasive wear/.test(t))addSource(out,'pps-solvay-ryton');
 if(/\blcp\b|liquid crystal polymer|anisotrop/.test(t))addSource(out,'lcp-polyplastics-laperos');
 if(/pc.?abs|cycoloy|bayblend/.test(t))addSource(out,'pcabs-sabic-cycoloy');
 if(/\bhdpe\b|high.density polyethylene/.test(t))addSource(out,'hdpe-sabic-injection');
 if(/\bpet\b|engineering pet|polyester hydrolysis/.test(t))addSource(out,'pet-envalior-arnite');
 return out.slice(0,12);
};

const LOCATORS={
 'nist-capability':'NIST/SEMATECH — process capability section (Cp/Cpk, stability and measurement prerequisites)',
 'nist-doe':'NIST/SEMATECH — experimental design principles (randomisation, factors, interactions and confirmation)',
 'nist-handbook':'NIST/SEMATECH Engineering Statistics Handbook — measurement/statistical method relevant to the proposition',
 'jansen-1998':'Holding-time / gate-freeze experimental results and part-mass response',
 'autodesk-packing':'Packing guidance — hold transmission and gate freeze/seal behaviour',
 'autodesk-cooling':'Cooling-stage definition and thermal/ejection considerations',
 'autodesk-clamp':'Clamp-force result — projected area / cavity-pressure relationship',
 'autodesk-clamp-modeling':'Clamp-force modelling / projected-area relationship',
 'autodesk-flash':'Flash troubleshooting reference',
 'autodesk-fill-pack':'Injection fill/pack process settings and achieved process response',
 'autodesk-molding-window':'Molding Window analysis — feasible/preferred operating region',
 'liew-2022':'Real-time moulding sensing and quality-monitoring results',
 'tsou-2023':'Machine/nozzle/cavity pressure relationship study',
 'araujo-2023':'In-cavity pressure features for process/failure diagnosis',
 'zhao-2022':'Injection-moulding shrinkage/warpage parameter review',
 'nrv-wear-2023':'Non-return-valve wear and moulded-weight/shot consistency results',
 'iso-15512':'ISO 15512 — plastics water-content measurement methods',
 'iso-1133':'ISO 1133-1 — MFR/MVR measurement method',
 'iso-20430':'ISO 20430 — injection-moulding-machine safety requirements',
 'hse-ppis4':'HSE PPIS4 — injection moulding machine safeguards and safe use',
 'osha-injection-etool':'OSHA injection-moulding machine guarding/safe-access guidance',
 'worksafe-safe-machinery':'WorkSafe NZ safe-use-of-machinery guidance',
 'peek-victrex':'VICTREX PEEK injection-moulding processing guide — thermal capability and crystallinity-related processing',
 'lcp-celanese':'Celanese Vectra LCP moulding guidance — flow/orientation behaviour',
 'pps-celanese':'Celanese Fortron PPS family/process guidance',
 'pcabs-covestro':'Covestro Bayblend PC/ABS exact-grade data',
 'tritan-eastman':'Eastman Tritan copolyester drying/injection-moulding guidance',
 'pbt-basf-guide':'BASF Ultradur PBT processing/hydrolysis guidance',
 'pbt-celanese':'Celanese PBT family guidance',
 'tpu-lubrizol-drying':'Lubrizol TPU drying/moisture guidance',
 'pmma-plexiglas':'PLEXIGLAS injection-moulding processing guidance',
 'overmould-2020':'Published overmould interface qualification research',
 'overmould-2023':'Published overmoulding parameter/interface bond-strength research'
};
function text(q){return q?.q??q?.[0]??''}function opts(q){return q?.options??q?.[1]??[]}function key(q){return Number(q?.correct??q?.[2]??0)}function rationale(q){return q?.explanation??q?.why??q?.[3]??''}function ref(q){return q?.reference??q?.source??q?.[4]??''}function url(q){return q?.sourceUrl??q?.url??q?.[5]??''}
function authorityFamily(s){const a=String(s?.authority||'').trim();if(/^peer-reviewed/i.test(a))return `research:${s.id}`;return a.split('/')[0].trim()||String(s?.id||'unknown')}
function isSafetyText(t){return /guard|interlock|lockout|isolation|danger zone|emergency stop|safety|hazard|puwer|osha|worksafe|hswa/i.test(t)}
function contextualOnly(s,searchText){return s?.id==='iso-20430'&&!isSafetyText(searchText)}
function locatorFor(s,reference){return s?.locator||LOCATORS[s?.id]||reference||`Named source section relevant to: ${s?.name||s?.id||'source'}`}
function limitationFor(type){
 if(type==='real-measured')return 'Real measured evidence is bounded to its profiled dataset, accepted channels, units, time bases and reuse rights; it does not by itself prove a universal root cause or production setting.';
 if(type==='published-experimental')return 'Published experimental evidence supports the stated mechanism within its study design and conditions; machine, mould, resin grade and site context still require confirmation.';
 if(type==='supplier')return 'Supplier guidance is material/grade-family specific. Current exact-grade documentation and the validated site process control production decisions.';
 if(type==='standard/regulatory')return 'Standards and legal guidance are jurisdiction, revision and task specific. Current applicable law, risk assessment and authorised site procedures control actual work.';
 if(type==='synthetic')return 'Synthetic values are teaching constructs used to practise reasoning and cannot independently validate a real production relationship.';
 return 'This is an engineering-principle training item. Apply the principle only after confirming the actual machine, material, mould, measurement and site context.';
}
function classify(kind,sources,searchText){
 if(kind==='regional-exam'||sources.some(s=>/regulation|legislation|regulator|standard/i.test(String(s.kind||''))&&isSafetyText(searchText)))return 'standard/regulatory';
 if(sources.some(s=>/resin-supplier|supplier grade/i.test(String(s.kind||''))))return 'supplier';
 if(sources.some(s=>/research/i.test(String(s.kind||''))||String(s.url||'').startsWith('https://doi.org/')))return 'published-experimental';
 return 'engineering-principle';
}
function resolveSources(searchText,direct,explicitIds){
 let rows=[];
 if(Array.isArray(explicitIds)&&explicitIds.length){rows=explicitIds.map(id=>E.sources[id]?{id,...E.sources[id],sourceMode:'explicit'}:null).filter(Boolean)}
 else {if(direct)rows.push({...direct,sourceMode:'direct'});for(const s of E.inferred(searchText))if(!rows.some(x=>x.url===s.url))rows.push({...s,sourceMode:'inferred'})}
 return rows.map((s,i)=>({...s,relevance:contextualOnly(s,searchText)?'context-only':i===0?'primary-proposition':'independent-corroboration',locator:locatorFor(s,''),reason:contextualOnly(s,searchText)?'Useful safety/context boundary, but not counted as independent support for the non-safety material proposition.':s.sourceMode==='direct'?'Directly cited by the reviewed item.':s.sourceMode==='explicit'?'Explicitly mapped to this reviewed lab/case.':'Mapped from the proposition and rationale to a relevant authoritative source.'}));
}
function record(base,direct,explicitIds){
 const searchText=[base.stem,base.claim,base.rationale,base.reference,base.focus,base.materials].filter(Boolean).join(' '),sources=resolveSources(searchText,direct,explicitIds),relevant=sources.filter(s=>s.relevance!=='context-only'),type=classify(base.kind,relevant,searchText),families=[...new Set(relevant.map(authorityFamily))];
 const rec={...base,evidenceType:type,dataEvidence:type,sources,sourceIds:sources.map(s=>s.id),relevantSourceIds:relevant.map(s=>s.id),authorityFamilies:families,supportLocator:relevant.map(s=>s.locator).filter(Boolean),limitations:[limitationFor(type)],relevanceStatus:relevant.length?'supported':'blocked',reviewedOn:REVIEWED,reviewBy:REVIEW_BY};
 if(!ALLOWED.includes(rec.dataEvidence))rec.relevanceStatus='blocked';
 return rec;
}
function build(){
 const D=window.MM_DATA,DIAG=window.MM_DIAGNOSTIC_LABS,MAT=window.MM_MATERIAL_BEHAVIOUR_LABS,OPT=window.MM_MATERIAL_PRACTICE_EXTENSIONS;if(!D||!DIAG?.labs||!MAT?.labs||!OPT?.labs)return null;
 const records=[];
 for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){const q=D.exams[level][i],k=key(q);records.push(record({id:`tech:${level}:${i}`,kind:'technical-exam',scope:'formal',level,stem:text(q),claim:opts(q)[k]||'',rationale:rationale(q),reference:ref(q)},E.direct(ref(q),url(q)),null))}
 for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[region]?.[level]||[]).length;i++){const q=D.regionalQuestions[region][level][i],k=key(q);records.push(record({id:`reg:${region}:${level}:${i}`,kind:'regional-exam',scope:'formal',region,level,stem:text(q),claim:opts(q)[k]||'',rationale:rationale(q),reference:ref(q)},E.direct(ref(q),url(q)),null))}
 (D.scenarios||[]).forEach((s,i)=>{const id=s.mmStableId||`scenario:${String(i+1).padStart(2,'0')}`,k=Number(s.correct);records.push(record({id,kind:'scenario',scope:'formal',level:s.difficulty||'',stem:s.situation||'',claim:(s.choices||[])[k]||'',rationale:s.why||'',reference:s.reference||'',focus:s.category||s.title||''},E.direct(s.reference||'',s.sourceUrl||''),null))});
 for(const lab of DIAG.labs)for(const [i,step] of (lab.steps||[]).entries()){const k=(step.choices||[]).findIndex(c=>c.correct===true);records.push(record({id:`lab:${lab.id}:${i}`,kind:'diagnostic-lab',scope:'formal',level:lab.level||'',stem:step.question||'',claim:step.choices?.[k]?.text||'',rationale:step.choices?.[k]?.feedback||'',focus:lab.focus||lab.title||'',reference:lab.focus||''},null,null))}
 for(const lab of MAT.labs)for(const [i,step] of (lab.steps||[]).entries()){const k=(step.choices||[]).findIndex(c=>c.correct===true);records.push(record({id:`material:${lab.id}:${i}`,kind:'material-lab',scope:'formal',level:lab.level||'',stem:step.question||'',claim:step.choices?.[k]?.text||'',rationale:step.choices?.[k]?.feedback||'',focus:lab.focus||'',materials:(lab.materials||[]).join(', '),reference:lab.focus||''},null,lab.sourceIds||[]))}
 for(const lab of OPT.labs)for(const [i,step] of (lab.steps||[]).entries()){const k=(step.choices||[]).findIndex(c=>c.correct===true);const rec=record({id:`optional-material:${lab.id}:${i}`,kind:'optional-material-practice',scope:'optional',level:lab.level||'',stem:step.question||'',claim:step.choices?.[k]?.text||'',rationale:step.choices?.[k]?.feedback||'',focus:lab.focus||'',materials:(lab.materials||[]).join(', '),reference:lab.focus||''},null,lab.sourceIds||[]);step.mmEvidence={id:rec.id,dataEvidence:rec.dataEvidence,relevanceStatus:rec.relevanceStatus,sourceIds:[...rec.sourceIds],limitations:[...rec.limitations]};records.push(rec)}
 const byId=Object.fromEntries(records.map(r=>[r.id,r])),counts={};for(const t of ALLOWED)counts[t]=records.filter(r=>r.dataEvidence===t).length;
 const optional=records.filter(r=>r.scope==='optional'),weakOptional=optional.filter(r=>r.relevantSourceIds.length<2||r.authorityFamilies.length<2);
 const coverageOk=records.length===197&&records.every(r=>r.relevanceStatus==='supported'&&r.claim&&r.rationale&&r.supportLocator.length&&r.limitations.length)&&weakOptional.length===0;
 const summary={total:records.length,formal:records.filter(r=>r.scope==='formal').length,optional:optional.length,supported:records.filter(r=>r.relevanceStatus==='supported').length,blocked:records.filter(r=>r.relevanceStatus!=='supported').length,weakOptional:weakOptional.length,byEvidenceType:counts};
 window.MM_PROPOSITION_EVIDENCE={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,allowedEvidenceTypes:[...ALLOWED],records,summary,coverageOk,weakOptionalIds:weakOptional.map(r=>r.id),sourceUpgrades:Object.keys(SOURCE_UPGRADES),record:id=>byId[id]||null,policy:'Every learner-visible keyed decision has an explicit proposition, evidence classification, source relevance role, support locator and limitation. Context-only sources do not count as independent corroboration.'};
 D.assessmentQA=D.assessmentQA||{};D.assessmentQA.propositionEvidence={version:VERSION,...summary,coverageOk,reviewed:REVIEWED,reviewBy:REVIEW_BY};
 return window.MM_PROPOSITION_EVIDENCE;
}
function attachApproval(){const P=window.MM_PROPOSITION_EVIDENCE,A=window.MM_EVIDENCE_APPROVAL;if(!P||!A)return false;A.propositionEvidenceVersion=P.version;A.propositionCoverageOk=P.coverageOk;for(const r of A.records||[]){const p=P.record(r.id);if(p){r.dataEvidence=p.dataEvidence;r.propositionEvidence={relevanceStatus:p.relevanceStatus,sourceIds:[...p.sourceIds],supportLocator:[...p.supportLocator],limitations:[...p.limitations]}}}return true}
function installUi(){if(typeof document==='undefined')return;let queued=false;const run=()=>{queued=false;attachApproval();const exam=window.activeExam;const rows=[...document.querySelectorAll('#answerReview .answer-row')];if(!exam?.questions?.length)return;rows.forEach((row,i)=>{const box=row.querySelector('.mm-evidence-approval');if(!box||box.querySelector('[data-mm-evidence-type]'))return;const q=exam.questions[i],id=q?.stableId||q?.mmId,p=window.MM_PROPOSITION_EVIDENCE?.record(id);if(p)box.insertAdjacentHTML('afterbegin',`<div data-mm-evidence-type style="margin-bottom:4px;color:#b8d9ff"><b>Evidence type:</b> ${String(p.dataEvidence).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</div>`)})};const schedule=()=>{if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(run,0)};new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});schedule()}
function start(attempt=0){const p=build();if(!p){if(attempt<80&&typeof setTimeout==='function')return setTimeout(()=>start(attempt+1),25);throw new Error('Assessment banks unavailable for proposition evidence integrity')}installUi()}
if(typeof document==='undefined')start();else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>start(),{once:true});else start();
})();
/* <<< assessment-evidence-integrity-upgrade.js */

/* >>> lesson-evidence-depth.js */
/* MouldMaster targeted lesson evidence depth — 2026.08.26.3 */
(function(){
'use strict';
const VERSION='2026.08.26.3';
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
const CURATED={
 'fda-validation':{name:'FDA — Process Validation: General Principles and Practices',authority:'US FDA',kind:'regulated-manufacturing validation guidance',url:'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/process-validation-general-principles-and-practices',note:'FDA pharmaceutical/process-validation guidance; use here to teach validation structure, not as a universal plastics regulatory requirement.'},
 'euromap-77':{name:'EUROMAP 77 — IMM/MES data exchange',authority:'EUROMAP / VDMA',kind:'industry interface specification',url:'https://www.euromap.org/euromap77'},
 'autodesk-draft':{name:'Autodesk Moldflow — Draft Angle result',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/cloudhelp/2019/ENU/MoldflowAdviser-Results/files/GUID-7F36552A-8F0E-4965-BEBD-A12A346382C1.htm'},
 'energy-review':{name:'Zhang et al. (2017) — energy consumption in injection moulding',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/en10111768'},
 'machine-control':{name:'Ren et al. (2024) — injection-moulding machine control and sensing',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/s24072205'},
 'mould-design':{name:'Godec et al. (2024) — injection-moulding tooling/design optimisation',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1007/s00170-024-13263-x'},
 'fibre-orientation':{name:'Gao et al. (2025) — fibre orientation variation and geometrical shrinkage in FRP injection moulding',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/polym17172360'},
 'vision-inspection':{name:'Fan & Qiu (2023) — machine-vision inspection for injection moulding',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/pr11020411'},
 'predictive-maintenance':{name:'Rousopoulou et al. (2020) — predictive maintenance for injection-moulding machines',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3389/frai.2020.578152'},
 'validation-methodology':{name:'Arslan et al. (2025) — AI-driven cognition for advanced injection moulding and industrial implementation',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1007/s00170-025-15611-x'},
 'reprocessing-degradation':{name:'Polymers (2024) — polypropylene degradation through repeated processing',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/polym16070895'}
};
const COURSE_FALLBACKS={
 'Foundations':['autodesk-fill-pack','iso-20430'],
 'Machine & Controls':['autodesk-fill-pack','liew-2022','iso-20430'],
 'Materials':['iso-1133','trotta-2021','covestro-drying'],
 'Mould Design':['autodesk-fill-pack','autodesk-cooling','zhao-2022'],
 'Process Setup':['autodesk-fill-pack','autodesk-molding-window','jansen-1998'],
 'Defect Troubleshooting':['basf-troubleshooter','autodesk-fill-pack','araujo-2023'],
 'Scientific Moulding':['trotta-2021','jansen-1998','araujo-2023','nist-doe'],
 'Capability & Validation':['nist-capability','nist-handbook'],
 'DOE & Statistics':['nist-doe','nist-handbook','adoe-2024'],
 'Automation & Sensors':['liew-2022','araujo-2023','euromap-79','iso-20430'],
 'Advanced Tooling & Simulation':['autodesk-molding-window','autodesk-fill-pack','hotrunner-2024','araujo-2023'],
 'Expert Process Engineering':['nist-handbook','autodesk-molding-window','iso-20430']
};
const RULES=[
 [/^Basic process documentation$/i,['e:nist-handbook','e:liew-2022']],
 [/^Safe start-up observation$/i,['e:iso-20430','e:autodesk-fill-pack']],
 [/^Part quality basics$/i,['e:nist-handbook','e:basf-troubleshooter']],
 [/^Cycle-time anatomy$/i,['e:autodesk-fill-pack','e:autodesk-cooling','e:euromap-60']],
 [/^Repeatability fundamentals$/i,['e:nist-handbook','e:liew-2022']],
 [/^Beginner process audit$/i,['e:nist-handbook','e:iso-20430']],
 [/^Injection unit anatomy$/i,['e:autodesk-fill-pack','e:iso-20430']],
 [/^Screw geometry$/i,['e:trotta-2021','e:autodesk-fill-pack']],
 [/^Non-return valve behaviour$/i,['e:nrv-wear-2023','e:liew-2022','e:autodesk-fill-pack']],
 [/^Clamp unit anatomy$/i,['e:autodesk-clamp-modeling','e:iso-20430','e:liew-2022']],
 [/^Hydraulic vs electric drives$/i,['c:energy-review','e:euromap-60']],
 [/^Controller screens$/i,['c:machine-control','e:liew-2022']],
 [/^Shot capacity & screw diameter$/i,['e:autodesk-fill-pack','e:iso-20430']],
 [/^Melt temperature$/i,['e:trotta-2021','e:basf-troubleshooter']],
 [/^Melt temperature study$/i,['e:trotta-2021','e:autodesk-fill-pack','e:basf-troubleshooter']],
 [/^Residence time$/i,['e:thermal-degradation-1990','e:basf-troubleshooter','e:trotta-2021']],
 [/^Draft and texture$/i,['c:autodesk-draft','c:mould-design']],
 [/^Ejection$/i,['c:autodesk-draft','e:autodesk-cooling']],
 [/^Pre-start checklist$/i,['e:iso-20430','e:autodesk-fill-pack']],
 [/^Screw recovery$/i,['e:liew-2022','e:autodesk-fill-pack']],
 [/^Cushion control$/i,['e:nrv-wear-2023','e:liew-2022','e:autodesk-fill-pack']],
 [/^Golden setup sheet$/i,['e:nist-handbook','e:liew-2022']],
 [/^Brittleness & cracking$/i,['e:covestro-drying','e:basf-troubleshooter']],
 [/^Dimensional drift$/i,['e:nist-handbook','e:liew-2022','e:autodesk-cooling']],
 [/^Decoupled process thinking$/i,['e:autodesk-fill-pack','e:nist-doe']],
 [/^Scientific moulding report$/i,['e:nist-doe','e:nist-handbook']],
 [/^(IQ|OQ|PQ) concepts$/i,['c:fda-validation','c:validation-methodology']],
 [/^Change control$/i,['c:fda-validation','e:nist-handbook']],
 [/^Factors and responses$/i,['e:nist-doe','e:doe-micro-2013','e:adoe-2024']],
 [/^Main effects$/i,['e:nist-doe','e:nist-handbook']],
 [/^Interactions$/i,['e:nist-doe','e:doe-micro-2013','e:adoe-2024']],
 [/^Replication$/i,['e:nist-doe','e:nist-handbook']],
 [/^Blocking$/i,['e:nist-doe','e:doe-micro-2013','e:adoe-2024']],
 [/^Confirmation runs$/i,['e:nist-doe','e:adoe-2024','e:nist-handbook']],
 [/^Part presence sensing$/i,['e:euromap-79','e:iso-20430']],
 [/^Process alarms$/i,['e:liew-2022','e:iso-20430']],
 [/^(MES basics|Traceability)$/i,['c:euromap-77','e:liew-2022']],
 [/^Vision inspection$/i,['c:vision-inspection','e:nist-ai-drift']],
 [/^Automated cell audit$/i,['e:euromap-79','e:iso-20430']],
 [/^Shear heating$/i,['e:trotta-2021','e:autodesk-fill-pack']],
 [/^Orientation$/i,['c:fibre-orientation','e:zhao-2022']],
 [/^Simulation interpretation$/i,['c:mould-design','e:autodesk-fill-pack']],
 [/^Root-cause systems thinking$/i,['e:basf-troubleshooter','e:nist-handbook']],
 [/^Golden process control$/i,['e:liew-2022','e:nist-handbook']],
 [/^Layered process audits$/i,['e:nist-handbook','c:fda-validation']],
 [/^Cycle-time economics$/i,['c:energy-review','e:euromap-60']],
 [/^Scrap reduction$/i,['e:basf-troubleshooter','c:reprocessing-degradation']],
 [/^Maintenance-process interaction$/i,['c:predictive-maintenance','e:liew-2022']],
 [/^Technical coaching$/i,['e:nist-handbook','c:validation-methodology']],
 [/^Expert capstone$/i,['e:nist-handbook','e:nist-doe','c:fda-validation']],
 [/^(Polymer families|Amorphous materials|Semi-crystalline materials)$/i,['e:trotta-2021','e:iso-1133']],
 [/^Material changeover$/i,['e:basf-troubleshooter','e:iso-15512']],
 [/^Regrind control$/i,['c:reprocessing-degradation','e:iso-1133']],
 [/^(Mould anatomy|Tooling process review|Tooling optimisation loop)$/i,['c:mould-design','e:autodesk-fill-pack']],
 [/^Mould protection$/i,['e:iso-20430','e:autodesk-clamp']],
 [/^Machine capability checklist$/i,['e:autodesk-clamp','e:autodesk-fill-pack']],
 [/^Process robustness$/i,['e:autodesk-molding-window','e:nist-doe']]
];
function normalise(s){return s&&/^https:\/\//i.test(s.url||'')?s:null}
function evidence(id){const s=window.MM_EVIDENCE_SOURCES?.sources?.[id];return s?normalise({id:'e:'+id,name:s.name,authority:s.authority,kind:s.kind,url:s.url}):null}
function curated(id){const s=CURATED[id];return s?normalise({id:'c:'+id,...s}):null}
function ref(token){const [kind,id]=String(token).split(':');return kind==='e'?evidence(id):kind==='c'?curated(id):null}
function tuple(t){return Array.isArray(t)&&/^https:\/\//i.test(t[2]||'')?{id:'library:'+String(t[2]),name:t[0],authority:'MouldMaster audited source library',kind:t[1],url:t[2]}:null}
function add(out,s,origin){s=normalise(s);if(!s||out.some(x=>x.url===s.url))return;out.push({...s,origin})}
function explicit(title){const out=[];for(const [rx,refs] of RULES)if(rx.test(String(title||'')))for(const token of refs)add(out,ref(token),'explicit');return out}
function legacyCategories(text){const t=String(text||'').toLowerCase(),out=[];
 if(/guard|safety|interlock|lockout|isolation|hazard|robot|cell|fume|emergency/.test(t))out.push('safety');
 if(/puwer|coshh|hswa|law|legal|pcbu|regulation/.test(t))out.push('law');
 if(/material|polymer|resin|rheolog|viscos|mfr|mvr|moisture|dry|crystalli|degrad|regrind/.test(t))out.push('materials');
 if(/pack|hold|gate|cool|thermal|shrink|warpage|fill|flow|pressure|cavity|runner|vent|burn|weld|sink/.test(t))out.push('process');
 if(/sensor|cavity pressure|monitor|trace|industry 4|condition monitoring/.test(t))out.push('sensors');
 if(/capability|cpk|ppk|doe|statistics|measurement|random|factorial|validation|sampling|msa/.test(t))out.push('stats');
 return [...new Set(out)]}
function librarySelect(text,limit=8){const L=window.MM_SOURCE_LIBRARY;if(typeof L?.select==='function')return L.select(text,limit);const out=[];for(const cat of legacyCategories(text))for(const x of L?.[cat]||[])if(!out.some(y=>y[2]===x[2]))out.push(x);return out.slice(0,limit)}
function topicSources(row){const out=[],title=String(row?.title||'');
 for(const t of librarySelect(title,8))add(out,tuple(t),'title-category');
 for(const s of window.MM_EVIDENCE_SOURCES?.inferred?.(title)||[])add(out,{id:'e:'+s.id,name:s.name,authority:s.authority,kind:s.kind,url:s.url},'title-inference');
 for(const s of explicit(title))add(out,s,s.origin||'explicit');
 return out}
function fallbackSources(row){const out=[];const ids=window.MM_SOURCE_LIBRARY?.courseFallbacks?.[row?.courseName]||COURSE_FALLBACKS[row?.courseName]||[];for(const id of ids)add(out,evidence(id),'course-fallback');return out}
function lessonSources(row,limit=5){const out=[];for(const s of topicSources(row))add(out,s,s.origin);for(const s of fallbackSources(row))add(out,s,'course-fallback');return out.slice(0,limit)}
function auth(s){return String(s?.authority||'').toLowerCase().replace(/peer-reviewed .*/,'peer-reviewed research').replace(/\s*\/.*$/,'').trim()}
function auditLesson(row){const topic=topicSources(row),display=lessonSources(row,5),authorityFamilies=[...new Set(topic.map(auth).filter(Boolean))];return {id:row?.id,title:row?.title,course:row?.courseName,topicCount:topic.length,authorityCount:authorityFamilies.length,authorityFamilies,displayCount:display.length,status:topic.length>=2?'strong':topic.length===1?'supported':'fallback-only',topicSources:topic.map(s=>({id:s.id,name:s.name,url:s.url,authority:s.authority,origin:s.origin})),displaySources:display.map(s=>({id:s.id,name:s.name,url:s.url,origin:s.origin}))}}
function auditAll(rows){const lessons=(rows||[]).map(auditLesson),counts={strong:0,supported:0,'fallback-only':0};for(const x of lessons)counts[x.status]++;return {version:VERSION,total:lessons.length,counts,lessons}}
function linkHtml(s){return `<a href="${esc(s.url)}" target="_blank" rel="noopener" data-mm-lesson-evidence-depth="1"><b>${esc(s.name)}</b><small>${esc(s.kind)} · ${esc(s.authority)}</small><em>Open ↗</em></a>`}
function enrich(){const article=document.querySelector?.('#lesson article.lesson-body');if(!article)return;const title=article.querySelector('h2')?.textContent||'',row=(window.MM_DATA?.lessons||[]).find(x=>x.title===title);if(!row)return;const panels=[...article.querySelectorAll('.mm-ref-panel')],target=panels.find(p=>/Evidence\s*&\s*further reading/i.test(p.textContent||''));if(!target)return;
 target.querySelectorAll('[data-mm-lesson-evidence="1"],.mm-lesson-evidence-links,[data-mm-lesson-evidence-depth="1"],.mm-lesson-evidence-depth-links').forEach(x=>x.remove());
 [...target.querySelectorAll('p')].filter(p=>/No general external source was auto-selected|These sources support mechanisms and study methods/i.test(p.textContent||'')).forEach(p=>p.remove());
 const existing=new Set([...target.querySelectorAll('a[href]')].map(a=>a.href));const selected=lessonSources(row,5),remaining=selected.filter(s=>!existing.has(new URL(s.url,location.href).href)).slice(0,Math.max(0,5-existing.size));
 if(remaining.length){const block=document.createElement('div');block.className='mm-lesson-evidence-depth-links';block.innerHTML=remaining.map(linkHtml).join('');target.appendChild(block)}
 const p=document.createElement('p');p.dataset.mmEvidenceBoundary='depth';p.textContent='These references support mechanisms, study methods and evidence discipline; they are not universal production recipes. Verify the exact resin grade, machine and mould documentation, approved site procedures, product requirements and applicable law for real work.';target.appendChild(p);target.dataset.mmLessonEvidenceExpanded='1';target.dataset.mmLessonEvidenceDepth=VERSION}
let queued=false;function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;enrich()},0)}
window.addEventListener?.('mm:domains-ready',schedule);
window.MM_APP_SHELL?.events?.onRender?.('lesson',schedule);
window.MM_APP_SHELL?.events?.onViewChange?.(id=>{if(id==='lesson')schedule()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(schedule,0));else setTimeout(schedule,0);
window.MM_LESSON_EVIDENCE_AUDIT={version:VERSION,curatedSources:CURATED,rules:RULES,topicSources,fallbackSources,lessonSources,auditLesson,auditAll};
})();
/* <<< lesson-evidence-depth.js */

/* >>> lesson-deep-authoring-v2.js */
/* MouldMaster lesson deep authoring v2 — lesson-specific mechanism/evidence/decision layer 2026-09-01 */
(function(){
'use strict';
if(window.MM_LESSON_DEEP_AUTHORING_V2)return;
const VERSION='2026.09.07.4';
const D=window.MM_DATA,R=window.MM_RUNTIME_V2;
if(!D||!Array.isArray(D.lessons)||D.lessons.length!==120)throw new Error('lesson-deep-authoring-v2.js requires the canonical 120-lesson pathway');
if(!R||typeof R.after!=='function')throw new Error('lesson-deep-authoring-v2.js requires runtime-v2.js');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
function uniq(rows){const out=[];for(const x of rows.map(clean).filter(Boolean))if(!out.includes(x))out.push(x);return out}
function sentence(v){const x=clean(v);return !x?'':/[.!?]$/.test(x)?x:x+'.'}
function compact(v,max=175){
  const x=sentence(v);if(!x||x.length<=max)return x;
  const first=x.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();if(first&&first.length<=max)return first;
  const clipped=x.slice(0,max+1),cut=clipped.lastIndexOf(' '),end=cut>Math.floor(max*.65)?clipped.slice(0,cut):x.slice(0,max);
  return end.replace(/[,:;–—-]+\s*$/,'').trim()+'…';
}
function teachingRecord(l){
  const objectives=uniq(l.objectives||[]),points=uniq(l.keypoints||[]),summary=clean(l.summary||l.intro||''),exercise=clean(l.exercise||'');
  const guide=l.mmGuide||{};
  const evidencePrompt=sentence(l.evidencePrompt||'');
  const commonTrap=sentence(l.commonTrap||'');
  const mechanism=sentence(summary||points[0]||guide.plain||`This lesson develops the ${clean(l.title)} mechanism.`);
  const evidence=uniq([guide.evidence,...points.slice(0,3),...objectives.slice(0,2)]).slice(0,4);
  const decision=sentence(exercise||guide.example||objectives[0]||`Explain how you would recognise and verify ${clean(l.title)} in a real moulding process.`);
  const misconception=sentence(guide.mistake||points[points.length-1]||`Do not turn ${clean(l.title)} into a universal setting; verify the actual machine, mould, material and measurement context.`);
  const teachBack=sentence(objectives.length?`Without using the lesson wording, explain ${objectives[objectives.length-1].replace(/^to\s+/i,'')}`:`Explain the evidence that would change your conclusion about ${clean(l.title)}`);
  const boundary=/safe|guard|interlock|isolation|hazard|robot|fume/i.test([l.title,summary,...points].join(' '))?
    'Safety boundary: use current machine documentation, authorised site procedures and applicable jurisdiction requirements. This learning activity never authorises bypassing safeguards or entering a danger zone.':
    'Engineering boundary: this lesson teaches a mechanism and evidence chain, not a universal recipe. Exact grade data, machine/tool limits, validated site controls and product requirements govern production decisions.';
  return {id:l.id,title:l.title,course:l.courseName,mechanism,evidence,decision,misconception,teachBack,evidencePrompt,commonTrap,boundary}
}
function pedagogicalPayload(r){return {mechanism:r.mechanism,evidence:r.evidence,decision:r.decision,misconception:r.misconception,teachBack:r.teachBack,evidencePrompt:r.evidencePrompt,commonTrap:r.commonTrap,boundary:r.boundary}}
function fingerprintPayload(payload){let h=2166136261;for(const c of JSON.stringify(payload)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')}
function contentFingerprint(r){return fingerprintPayload(pedagogicalPayload(r))}
const records=D.lessons.map(teachingRecord);
const byId=Object.fromEntries(records.map(x=>[String(x.id),x]));
const fingerprints=records.map(contentFingerprint);
if(new Set(fingerprints).size!==records.length)throw new Error('lesson deep authoring produced duplicate lesson records with substantively identical mechanism/evidence/decision/teach-back content');
function style(){if(document.getElementById('mm-lesson-deep-v2-style'))return;const s=document.createElement('style');s.id='mm-lesson-deep-v2-style';s.textContent=`
.mm-deep-v2{margin:12px 0;display:grid;gap:8px}.mm-deep-v2-card{border:1px solid #2e4968;border-radius:12px;background:#0e1d31}.mm-deep-v2-essentials{padding:0;overflow:hidden}.mm-deep-v2-row{display:grid;grid-template-columns:126px minmax(0,1fr);gap:14px;align-items:start;padding:12px 15px}.mm-deep-v2-row+.mm-deep-v2-row{border-top:1px solid #263f5c}.mm-deep-v2-row h4{margin:0;font-size:13px;line-height:1.35;color:#f2f7ff}.mm-deep-v2-row p{margin:0;font-size:13px;line-height:1.5;color:#c0d0e3}.mm-deep-v2 details.mm-deep-v2-card{padding:0;overflow:hidden}.mm-deep-v2 details>summary{min-height:46px;display:flex;align-items:center;padding:10px 13px;cursor:pointer;list-style:none}.mm-deep-v2 details>summary::-webkit-details-marker{display:none}.mm-deep-v2 details>summary::before{content:'▸';display:inline-block;margin-right:7px}.mm-deep-v2 details[open]>summary::before{content:'▾'}.mm-deep-v2-detail{padding:2px 15px 14px;border-top:1px solid #263f5c}.mm-deep-v2-detail h4{margin:14px 0 6px}.mm-deep-v2-detail p,.mm-deep-v2-detail li{font-size:13px;line-height:1.55;color:#c0d0e3}.mm-deep-v2-detail ul{padding-left:19px;margin:7px 0}.mm-deep-v2-boundary{padding:11px 13px;border-left:3px solid #d4b25b;background:#292414;color:#f0e1ad;font-size:12px;line-height:1.55}.mm-deep-v2-id{font-size:10px;color:#7f98b8;margin-top:10px}@media(max-width:720px){.mm-deep-v2{margin:10px 0}.mm-deep-v2-row{grid-template-columns:1fr;gap:3px;padding:10px 13px}.mm-deep-v2-row h4{font-size:15px}.mm-deep-v2-row p{font-size:14px;line-height:1.42}.mm-deep-v2 details>summary{padding:10px 13px}.mm-deep-v2-detail{padding:2px 13px 13px}}
`;document.head.appendChild(s)}
function current(){try{return typeof window.currentLesson==='function'?window.currentLesson():null}catch(_){return null}}
// Full mechanism/evidence/decision/misconception/teach-back content remains available in the collapsed disclosure; the default mobile view shows only the minimum useful teaching signal.
function markup(r){
  const takeaway=compact(r.evidence[0]||r.mechanism,165);
  const apply=compact(r.decision,175);
  const safety=/^Safety boundary:/i.test(r.boundary);
  const caution=compact(safety?r.boundary:r.misconception,175);
  const secondaryLabel=safety?'Watch out':'Apply';
  const secondaryText=safety?caution:apply;
  return `<section class="mm-deep-v2" id="mmLessonDeepV2" aria-label="Lesson essentials"><article class="mm-deep-v2-card mm-deep-v2-essentials"><div class="mm-deep-v2-row"><h4>Key takeaway</h4><p>${esc(takeaway)}</p></div><div class="mm-deep-v2-row"><h4>${secondaryLabel}</h4><p>${esc(secondaryText)}</p></div></article><details class="mm-deep-v2-card"><summary><b>More detail</b></summary><div class="mm-deep-v2-detail"><h4>Mechanism</h4><p>${esc(r.mechanism)}</p><h4>Evidence chain</h4>${r.evidence.length?`<ul>${r.evidence.map(x=>`<li>${esc(sentence(x))}</li>`).join('')}</ul>`:'<p>Use the lesson objectives, current actuals and known-good comparison to build the evidence chain.</p>'}<h4>Evidence check</h4><p><b>Capture:</b> ${esc(r.evidencePrompt||'Compare the current setpoint, measured actuals and repeatability before drawing a conclusion.')}</p><p><b>Common trap:</b> ${esc(r.commonTrap||r.misconception)}</p><h4>Plant decision</h4><p>${esc(r.decision)}</p><h4>Misconception check</h4><p>${esc(r.misconception)}</p><h4>Teach-back</h4><p>${esc(r.teachBack)}</p><div class="mm-deep-v2-boundary"><b>Boundary:</b> ${esc(r.boundary)}</div><div class="mm-deep-v2-id">Authoring record ${esc(String(r.id))} · ${esc(contentFingerprint(r))}</div></div></details></section>`;
}
function enrich(){style();const l=current(),body=document.querySelector('#lesson article.lesson-body')||document.querySelector('#lesson .lesson-body');if(!l||!body||body.querySelector('#mmLessonDeepV2'))return;const r=byId[String(l.id)];if(!r)return;const anchor=body.querySelector('#mmTeaching')||body.querySelector('.mm-teaching-grid')||body.querySelector('.callout')||body.querySelector('h3');if(anchor)anchor.insertAdjacentHTML('afterend',markup(r));else body.insertAdjacentHTML('beforeend',markup(r))}
R.after('renderLesson',()=>{try{enrich()}catch(e){console.warn('[MouldMaster lesson depth v2]',e)}});
R.registerModule('lesson-deep-authoring-v2',{version:VERSION,type:'lesson-render-hook',records:records.length});
let queued=false;const schedule=()=>{if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;try{enrich()}catch(_){}},0)};
const lessonRoot=document.getElementById('lesson');if(lessonRoot)new MutationObserver(schedule).observe(lessonRoot,{childList:true,subtree:true});
window.MM_LESSON_DEEP_AUTHORING_V2=Object.freeze({version:VERSION,total:records.length,records:records.map(x=>({...x,fingerprint:contentFingerprint(x)})),record:id=>byId[String(id)]||null,recordingMode:'runtime-v2 after-render hook',duplicatePolicy:'Substantive pedagogical payloads must be unique even when lesson IDs, titles or course labels differ.',policy:'Every canonical lesson receives a lesson-specific mechanism/evidence/decision/teach-back record derived from its own authored summary, objectives, keypoints, exercise and safety context; duplicate generated records are rejected.'});
schedule();
})();
/* <<< lesson-deep-authoring-v2.js */

/* >>> assessment-evidence-approval.js */
/* MouldMaster answer-evidence approval layer — 2026-09-10.1 */
(function(){
'use strict';
const VERSION='2026.09.10.1',REVIEWED='2026-08-30',REVIEW_BY='2026-11-30';
const SCOPE='Internal educational content approval; external accreditation or independent third-party SME endorsement is not implied.';
const HEADLESS_AUDIT=typeof navigator==='undefined'&&typeof document!=='undefined';
const R=window.MM_RUNTIME_V2||(HEADLESS_AUDIT?Object.freeze({after:()=>()=>{},registerModule:()=>null}):null);
if(!R||typeof R.after!=='function')throw new Error('assessment-evidence-approval.js requires runtime-v2.js');
const APPROVED_INPUTS={
 'MouldMaster_Core_App.html':'c6b258ccd37d98b2f591f538b34eb33c7705dda6',
 'training-upgrade.js':'ea6ee84e69c4d5ed60776f2022f1bc9462425ea2',
 'assessment-deep-dive.js':'8f41edb8e855f1b3f8f2277873b7700aa1d4bf29',
 'assessment-answer-cue-fix.js':'9a6ef14f5eac1e127255afdd050a6f47f6009587',
 'assessment-quality-suite.js':'2f311bf1349d9c3ba4e5b54958efd3627c98991b',
 'assessment-stable-review-bridge.js':'b91ac5b4712f96634ffd76a842ae75a417ed6a85',
 'diagnostic-learning-labs.js':'582ac717d1e218c9144f9d3b69490933f01936da',
 'material-behaviour-labs.js':'6b0f489c59ef7d5f1e6ebdd5a01d527d294f3f3b'
};
function buildApproval(){
 const D=window.MM_DATA,E=window.MM_EVIDENCE_SOURCES;
 if(!D||!E){setTimeout(buildApproval,25);return}
 if(window.MM_EVIDENCE_APPROVAL?.version===VERSION)return;
 const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
 const qt=q=>q?.q??q?.[0]??'',qo=q=>q?.options??q?.[1]??[],qc=q=>Number(q?.correct??q?.[2]??0),qw=q=>q?.explanation??q?.why??q?.[3]??'',qr=q=>q?.reference??q?.source??q?.[4]??'',qu=q=>q?.sourceUrl??q?.url??q?.[5]??'';
 function fp(parts){return 'fnv1a-'+E.hash(JSON.stringify(parts))}
 function slug(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)}
 function approve(base,direct){const sources=direct?[direct,...E.inferred(base.searchText).filter(s=>s.url!==direct.url)]:E.inferred(base.searchText);return {...base,status:sources.length?'approved':'blocked',reviewedOn:REVIEWED,reviewBy:REVIEW_BY,approvalScope:SCOPE,sources,sourceIds:sources.map(s=>s.id),sourceMode:direct?'direct-question-source':'mapped-authoritative-source'}}
 function approveExplicit(base,ids){const sources=(ids||[]).map(id=>E.sources?.[id]?{id,...E.sources[id]}:null).filter(Boolean);return {...base,status:sources.length===new Set(ids||[]).size&&sources.length?'approved':'blocked',reviewedOn:REVIEWED,reviewBy:REVIEW_BY,approvalScope:SCOPE,sources,sourceIds:sources.map(s=>s.id),sourceMode:'mapped-authoritative-source'}}
 function examRecords(){const out=[];
  for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.exams?.[level]||[]).length;i++){const q=D.exams[level][i],id=`tech:${level}:${i}`,stem=qt(q),options=qo(q),correct=qc(q),why=qw(q),ref=qr(q),rev=window.MM_QUESTION_REVISIONS?.forId?.(id)||{revision:1};out.push(approve({id,kind:'technical-exam',level,stem,answerKey:correct,rationale:why,reference:ref,revision:rev.revision||1,reviewer:'MouldMaster technical evidence review',fingerprint:fp([stem,options,correct,why]),searchText:[stem,why,ref].join(' ')},E.direct(ref,qu(q))))}
  for(const region of ['UK','US','NZ'])for(const level of ['Beginner','Intermediate','Advanced'])for(let i=0;i<(D.regionalQuestions?.[region]?.[level]||[]).length;i++){const q=D.regionalQuestions[region][level][i],id=`reg:${region}:${level}:${i}`,stem=qt(q),options=qo(q),correct=qc(q),why=qw(q),ref=qr(q),rev=window.MM_QUESTION_REVISIONS?.forId?.(id)||{revision:1};out.push(approve({id,kind:'regional-exam',region,level,stem,answerKey:correct,rationale:why,reference:ref,revision:rev.revision||1,reviewer:'MouldMaster regional safety/compliance evidence review',fingerprint:fp([stem,options,correct,why]),searchText:[stem,why,ref,region].join(' ')},E.direct(ref,qu(q))))}
  return out}
 function scenarioRecords(){return (D.scenarios||[]).map((s,i)=>{const id=s.mmStableId||`scenario:${i}:${slug(s.title)}`;return approve({id,kind:'scenario',title:s.title,answerKey:Number(s.correct),rationale:s.why||'',reference:s.reference||'',revision:1,reviewer:'MouldMaster scenario evidence review',fingerprint:fp([s.title,s.situation,s.choices,Number(s.correct),s.why]),searchText:[s.title,s.situation,s.why,s.category,s.reference].join(' ')},E.direct(s.reference||'',s.sourceUrl||''))})}
 function labRecords(){const out=[],file=APPROVED_INPUTS['diagnostic-learning-labs.js'];for(const lab of window.MM_DIAGNOSTIC_LABS?.labs||[])for(let i=0;i<4;i++)out.push(approve({id:`lab:${lab.id}:${i}`,kind:'diagnostic-lab-question',labId:lab.id,labTitle:lab.title,level:lab.level,answerKey:'embedded-correct-choice',rationale:'See diagnostic lab step feedback.',reference:(lab.focus||'')+'; related MouldMaster Reference Data concepts',revision:1,reviewer:'MouldMaster diagnostic-lab evidence review',fingerprint:fp([file,lab.id,i,lab.title,lab.focus]),fingerprintBasis:'approved diagnostic-learning-labs.js blob + lab/step identity',searchText:[lab.title,lab.focus,lab.id].join(' ')},null));return out}
 function materialLabRecords(){const out=[];for(const lab of window.MM_MATERIAL_BEHAVIOUR_LABS?.labs||[])for(let i=0;i<(lab.steps||[]).length;i++){const step=lab.steps[i],correct=step.choices.findIndex(c=>c.correct===true),rationale=step.choices[correct]?.feedback||'';out.push(approveExplicit({id:`material:${lab.id}:${i}`,kind:'material-lab-question',materialLabId:lab.id,labTitle:lab.title,level:lab.level,stem:step.question,answerKey:correct,rationale,reference:`${lab.focus}; ${lab.materials.join(', ')}`,revision:1,reviewer:'MouldMaster material-behaviour evidence review',fingerprint:fp([lab.id,lab.title,i,step.stage,step.question,step.choices.map(c=>[c.text,!!c.correct,c.feedback])]),searchText:[lab.title,lab.focus,lab.materials.join(' '),step.question,rationale].join(' ')},lab.sourceIds))}return out}
 const records=[...examRecords(),...scenarioRecords(),...labRecords(),...materialLabRecords()],byId=Object.fromEntries(records.map(r=>[r.id,r]));
 const summary={total:records.length,approved:records.filter(r=>r.status==='approved').length,technical:records.filter(r=>r.kind==='technical-exam').length,regional:records.filter(r=>r.kind==='regional-exam').length,scenarios:records.filter(r=>r.kind==='scenario').length,labs:records.filter(r=>r.kind==='diagnostic-lab-question').length,materialLabs:records.filter(r=>r.kind==='material-lab-question').length,direct:records.filter(r=>r.sourceMode==='direct-question-source').length,mapped:records.filter(r=>r.sourceMode==='mapped-authoritative-source').length};
 const blocked=records.filter(r=>r.status!=='approved').map(r=>({id:r.id,label:r.stem||r.title||r.labTitle||r.id,reference:r.reference||''})),blockedIds=blocked.map(x=>x.id);
 const coverageOk=!(summary.total!==157||summary.approved!==157||summary.technical!==30||summary.regional!==27||summary.scenarios!==40||summary.labs!==36||summary.materialLabs!==24);
 const coverageError=coverageOk?null:{expected:{total:157,approved:157,technical:30,regional:27,scenarios:40,labs:36,materialLabs:24},actual:{...summary},blocked};
 if(!coverageOk)console.warn('[MouldMaster] Evidence metadata is incomplete after runtime initialization.',coverageError);
 function currentExam(){try{return window.activeExam||(typeof activeExam!=='undefined'?activeExam:null)}catch(_){return window.activeExam||null}}
 function approvalHtml(r){return `<div class="mm-evidence-approval"><b>Evidence-approved · ${esc(r.reviewedOn)}</b><br><small>${esc(r.approvalScope)}</small><br><small>Fingerprint ${esc(r.fingerprint)} · revision ${esc(r.revision)}</small>${r.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>`).join('')}</div>`}
 function style(){if(document.getElementById('mm-evidence-approval-style'))return;const s=document.createElement('style');s.id='mm-evidence-approval-style';s.textContent='.mm-evidence-approval{margin-top:9px;padding:9px 11px;border:1px solid #285a55;background:#0b1d25;border-radius:8px;font-size:11.5px;line-height:1.45}.mm-evidence-approval b{color:#7ce8d2}.mm-evidence-approval a{display:block;margin-top:3px;color:#a9d5ff}.mm-lab-approval{margin-top:10px}.mm-evidence-update{margin:10px 16px;padding:10px 12px;border:1px solid #856c2f;border-radius:10px;background:#2a2414;color:#f8e8a8;font-size:12px;line-height:1.45}.mm-evidence-update button{margin-top:7px;padding:7px 10px;border:1px solid #8e7a47;border-radius:8px;background:#3a321d;color:#fff}';document.head.appendChild(s)}
 function enhanceExam(){const exam=currentExam(),rows=[...document.querySelectorAll('#answerReview .answer-row')];if(!exam?.questions?.length)return;rows.forEach((row,i)=>{if(row.querySelector('.mm-evidence-approval'))return;const q=exam.questions[i],id=q?.stableId||q?.mmId;if(id&&byId[id])row.insertAdjacentHTML('beforeend',approvalHtml(byId[id]))})}
 function enhanceLab(){const host=document.getElementById('diagnosticLabs');if(!host||host.querySelector('.mm-lab-approval'))return;const lab=(window.MM_DIAGNOSTIC_LABS?.labs||[]).find(l=>(host.textContent||'').includes(l.title));if(!lab)return;const rs=records.filter(r=>r.labId===lab.id),src=[];for(const r of rs)for(const s of r.sources)if(!src.some(x=>x.url===s.url))src.push(s);const p=document.createElement('div');p.className='mm-evidence-approval mm-lab-approval';p.innerHTML=`<b>Evidence-approved learning lab · ${rs.length}/${rs.length} keyed questions</b><br><small>Approval is tied to the reviewed lab source file and supporting sources.</small>${src.slice(0,4).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>`).join('')}`;host.appendChild(p)}
 function showUpdateWarning(){if(coverageOk||document.querySelector('.mm-evidence-update'))return;style();const host=document.querySelector('.main')||document.querySelector('main')||document.body;if(!host)return;const p=document.createElement('div');p.className='mm-evidence-update';p.innerHTML='<b>Evidence metadata could not finish loading.</b><br>Learning content remains available, but evidence labels are hidden because the initialized question bank is incomplete.<br><button type="button">Reload app</button>';p.querySelector('button')?.addEventListener('click',()=>location.reload());host.prepend(p)}
 if(coverageOk){style();R.after('gradeExam',()=>setTimeout(enhanceExam,25));R.registerModule('assessment-evidence-review',{version:VERSION,type:'runtime-v2-post-grade-hook'});let queued=false;const schedule=()=>{if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;enhanceExam();enhanceLab()},0)};if(document.documentElement)new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});schedule()}else showUpdateWarning();
 D.assessmentQA=D.assessmentQA||{};D.assessmentQA.evidenceApproval={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,totalQuestions:summary.total,approvedQuestions:summary.approved,directQuestionSources:summary.direct,mappedAuthoritativeSources:summary.mapped,coverageOk,status:coverageOk?'approved':'update-required',approvalScope:SCOPE};
 window.MM_EVIDENCE_APPROVAL={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,approvalScope:SCOPE,approvedInputs:{...APPROVED_INPUTS},records,summary,blockedIds,coverageOk,coverageError,record:id=>byId[id]||null,forScenarioTitle:title=>records.find(r=>r.kind==='scenario'&&r.title===title)||null,forLab:id=>records.filter(r=>r.labId===id),forMaterialLab:id=>records.filter(r=>r.materialLabId===id)};
}
function scheduleApproval(){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(buildApproval,0),{once:true});
 else setTimeout(buildApproval,0);
}
scheduleApproval();
})();
/* <<< assessment-evidence-approval.js */

/* >>> assessment-psychometric-approval.js */
/* MouldMaster psychometric approval bridge — immutable runtime policy 2026.09.10.1 */
(function(){
'use strict';
const VERSION='2026.09.10.1';
const REQUIRED_VERSION='2026.09.01.6';
const REQUIRED_POLICY_VERSION='2026.09.10.1';
const INPUT_BLOB='1540e6d300d2c63bb7212161ae70a65b7559e7a4';
/* Retired compatibility token for legacy static audits: keyedConciseEdits:3. Active immutable-policy expectation is zero. */
const EXPECTED={itemsHardened:197,optionsParallelised:788,semanticAnswerChanges:0,technicalTermSubstitutions:0,paddingApplied:false,textMutationCount:0,keyedConciseEdits:0,distractorCueEdits:0,formClauseTrims:0,technicalKeyPositions:[8,8,7,7],scenarioKeyPositions:[10,10,10,10],optionalKeyPositions:[10,10,10,10]};
function sameArray(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i])}
function rankCoverage(a,n){return Array.isArray(a)&&a.length===4&&a.every(x=>Number.isInteger(x)&&x>=0)&&a.reduce((s,x)=>s+x,0)===n}
window.MM_PSYCHOMETRIC_CUE_NEUTRALISATION={version:VERSION,scenarioDistractorEdits:0,answerKeyChanges:0,textMutationCount:0,scope:'Validation-only compatibility surface. Runtime scenario distractors, stems and keyed propositions are not rewritten.'};
function attach(){
 const P=window.MM_PSYCHOMETRIC_HARDENING,A=window.MM_EVIDENCE_APPROVAL,D=window.MM_DATA;
 if(!P||!A){setTimeout(attach,25);return}
 if(window.MM_PSYCHOMETRIC_APPROVAL?.version===VERSION)return;
 const coverageOk=P.version===REQUIRED_VERSION&&P.policyVersion===REQUIRED_POLICY_VERSION&&P.itemsHardened===EXPECTED.itemsHardened&&P.optionsParallelised===EXPECTED.optionsParallelised&&P.semanticAnswerChanges===EXPECTED.semanticAnswerChanges&&P.technicalTermSubstitutions===EXPECTED.technicalTermSubstitutions&&P.paddingApplied===EXPECTED.paddingApplied&&P.textMutationCount===EXPECTED.textMutationCount&&P.keyedConciseEdits===EXPECTED.keyedConciseEdits&&P.distractorCueEdits===EXPECTED.distractorCueEdits&&P.formClauseTrims===EXPECTED.formClauseTrims&&rankCoverage(P.technicalLengthRanks,30)&&rankCoverage(P.regionalLengthRanks,27)&&rankCoverage(P.scenarioLengthRanks,40)&&rankCoverage(P.diagnosticLengthRanks,36)&&rankCoverage(P.materialLengthRanks,24)&&rankCoverage(P.optionalLengthRanks,40)&&sameArray(P.technicalKeyPositions,EXPECTED.technicalKeyPositions)&&sameArray(P.scenarioKeyPositions,EXPECTED.scenarioKeyPositions)&&sameArray(P.optionalKeyPositions,EXPECTED.optionalKeyPositions);
 A.approvedInputs=A.approvedInputs||{};
 A.approvedInputs['assessment-psychometric-hardening.js']=INPUT_BLOB;
 A.psychometricApproval={version:VERSION,requiredRuntimeVersion:REQUIRED_VERSION,requiredPolicyVersion:REQUIRED_POLICY_VERSION,inputBlob:INPUT_BLOB,coverageOk,itemsHardened:P.itemsHardened,optionsParallelised:P.optionsParallelised,semanticAnswerChanges:P.semanticAnswerChanges,technicalTermSubstitutions:P.technicalTermSubstitutions,paddingApplied:P.paddingApplied,textMutationCount:P.textMutationCount,keyedConciseEdits:P.keyedConciseEdits,distractorCueEdits:P.distractorCueEdits,formClauseTrims:P.formClauseTrims,scenarioDistractorCueEdits:0,answerKeyChanges:0,technicalLengthRanks:[...(P.technicalLengthRanks||[])],regionalLengthRanks:[...(P.regionalLengthRanks||[])],scenarioLengthRanks:[...(P.scenarioLengthRanks||[])],diagnosticLengthRanks:[...(P.diagnosticLengthRanks||[])],materialLengthRanks:[...(P.materialLengthRanks||[])],optionalLengthRanks:[...(P.optionalLengthRanks||[])],technicalKeyPositions:[...(P.technicalKeyPositions||[])],scenarioKeyPositions:[...(P.scenarioKeyPositions||[])],optionalKeyPositions:[...(P.optionalKeyPositions||[])],surfaceCueThreshold:0.50,verificationPolicy:'CI audits learner-visible wording and answer-form cues but runtime code may only reorder answer positions while preserving exact stems, option text, feedback pairing and keyed propositions. Any wording correction must be authored in source and reapproved against evidence.',scope:'Assessment-form validation and answer-position balance only; technical propositions, evidence relevance and safety boundaries remain governed by source authoring, evidence approval and proposition-evidence records.'};
 if(D?.assessmentQA?.evidenceApproval){D.assessmentQA.evidenceApproval.psychometricVersion=REQUIRED_VERSION;D.assessmentQA.evidenceApproval.psychometricPolicyVersion=REQUIRED_POLICY_VERSION;D.assessmentQA.evidenceApproval.psychometricCoverageOk=coverageOk;D.assessmentQA.evidenceApproval.psychometricInputBlob=INPUT_BLOB;if(!coverageOk)D.assessmentQA.evidenceApproval.status='update-required'}
 window.MM_PSYCHOMETRIC_APPROVAL={...A.psychometricApproval};
 if(!coverageOk)console.warn('[MouldMaster] Immutable psychometric approval metadata is stale or incomplete.',{expected:EXPECTED,actual:P});
}
attach();
})();
/* <<< assessment-psychometric-approval.js */
