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
