/* MouldMaster standards and readiness — governed read-only support. */
(function(){
'use strict';
if(window.MM_STANDARDS_READINESS)return;
const VERSION='2026.11.07.1';
const QMS='./src/domains/quality/data/quality-management-iso9001-v1.json';
const NZQA='./src/domains/learning/book-data/nzqa-education-readiness-v1.json';
const EDUCATION_DATA=Object.freeze({
  "schema": 1,
  "id": "mouldmaster-regional-education-pathways",
  "version": "2026.11.07.1",
  "checked": "2026-11-07",
  "status": "provisional-study-support-crosswalk",
  "purpose": "Give learners in New Zealand, the United Kingdom's four nations, and India a source-linked study pathway through the same MouldMaster Book and app topics.",
  "claimBoundary": "This editorial crosswalk supports study only. It does not establish formal equivalence, award qualifications or credits, satisfy required training hours, assess workplace competence, provide consent to assess, or grant authority to operate machinery.",
  "localisation": "MouldMaster's interface and Book remain in English. The cited CIPET qualification file records Hindi as an additional language for its qualification and model curriculum.",
  "regionTabs": [
    {
      "id": "nz",
      "label": "New Zealand"
    },
    {
      "id": "uk",
      "label": "United Kingdom"
    },
    {
      "id": "india",
      "label": "India"
    }
  ],
  "practiceActivities": [
    {
      "id": "process-record",
      "title": "Build a process-record worksheet",
      "description": "Use a fictional case to separate target values from actual readings, note material and mould identity, describe a controlled change, and state who must approve it. Do not copy the example as a live recipe."
    },
    {
      "id": "quality-plan",
      "title": "Plan a quality check",
      "description": "From a fictional drawing and specification, list the characteristic, measuring method, sample source, record, and escalation trigger. Use the supplied specification for limits and sampling."
    },
    {
      "id": "safety-5s",
      "title": "Complete a safety and 5S observation",
      "description": "Review a photo or simulated work-area case, identify hazards and housekeeping issues, and write the safe stop-and-escalate action. This activity does not authorise machine operation or intervention."
    },
    {
      "id": "defect-ledger",
      "title": "Write a defect hypothesis ledger",
      "description": "List at least two plausible causes, the evidence that would distinguish them, the safe next check, and the condition that requires escalation."
    },
    {
      "id": "handover",
      "title": "Prepare a shift handover",
      "description": "Summarise fictional production status, material and tooling identity, quality checks, open issues, and next authorised actions without inventing process limits."
    }
  ],
  "pathways": [
    {
      "id": "nz-nzqa-4401",
      "region": "nz",
      "nation": "New Zealand",
      "title": "New Zealand Certificate in Plastics Processing (Level 3)",
      "frameworkRef": "NZQA qualification 4401 · optional Injection Moulding strand",
      "status": "Current qualification reference (checked 2026-11-07)",
      "level": "NZQF Level 3",
      "duration": "95–120 credits; programme duration is provider-set",
      "scopeNote": "The qualification includes an optional Injection Moulding strand. The MouldMaster mapping uses the existing NZQA readiness contract and Book chapter map as study context.",
      "studyOutcomes": [
        "Explain safe injection moulding work, production instructions, and operating boundaries.",
        "Relate polymer and mould conditions to process behaviour using the current grade, machine, and site evidence.",
        "Interpret process monitoring, quality records, and defect evidence.",
        "Recognise where tooling setup, routine service, assessment, and workplace competence require an authorised provider or employer."
      ],
      "bookChapterIds": [
        "what-injection-moulding-is",
        "cycle",
        "safety-foundations",
        "material-families",
        "plasticising-unit",
        "process-baseline",
        "process-window",
        "documentation",
        "diagnostic-method",
        "process-monitoring",
        "capability",
        "complex-diagnostics"
      ],
      "practiceActivityIds": [
        "process-record",
        "quality-plan",
        "safety-5s",
        "defect-ledger",
        "handover"
      ],
      "formalRequirements": [
        "Provider-selected programme design, delivery, assessment, moderation, and workplace evidence.",
        "Any standards assessment requires the provider's current NZQA consent and moderation arrangements.",
        "MouldMaster completion does not award NZQA credits or show workplace competence."
      ],
      "source": {
        "title": "NZQA: Qualification 4401",
        "url": "https://www.nzqa.govt.nz/nzqf/search/viewQualification.do?selectedItemKey=4401"
      }
    },
    {
      "id": "uk-england-st1328",
      "region": "uk",
      "nation": "England",
      "title": "Polymer processing technician",
      "frameworkRef": "Skills England apprenticeship standard ST1328, version 1.0",
      "status": "Approved for delivery (checked 2026-11-07)",
      "level": "Level 3",
      "duration": "Typically 36 months training, a 3-month assessment period, and 626 minimum hours for compliance",
      "scopeNote": "This occupational standard covers polymer processing technologies including injection moulding. It covers preparation, process monitoring, quality, records, maintenance, troubleshooting, and continuous improvement; it is not an injection-moulding-only curriculum.",
      "studyOutcomes": [
        "Prepare equipment and materials from a work instruction and identify safe limits.",
        "Explain how to run and monitor a polymer process without substituting generic examples for controlled settings.",
        "Plan quality checks, traceability records, housekeeping, and waste handling.",
        "Use evidence to describe routine maintenance, process trials, troubleshooting, and escalation."
      ],
      "bookChapterIds": [
        "what-injection-moulding-is",
        "cycle",
        "safety-foundations",
        "machine-anatomy",
        "material-families",
        "process-baseline",
        "process-monitoring",
        "documentation",
        "quality-plan",
        "diagnostic-method",
        "process-window",
        "capability"
      ],
      "practiceActivityIds": [
        "process-record",
        "quality-plan",
        "safety-5s",
        "defect-ledger",
        "handover"
      ],
      "formalRequirements": [
        "An employer, training provider, and approved end-point assessment organisation control the apprenticeship and end-point assessment.",
        "The standard's independent assessment includes workplace observation, an interview supported by a portfolio, and a test.",
        "MouldMaster does not supply the apprenticeship hours, portfolio sign-off, or end-point assessment."
      ],
      "source": {
        "title": "Skills England: ST1328 Polymer processing technician",
        "url": "https://skillsengland.education.gov.uk/apprenticeship-standards/st1328?view=standard"
      }
    },
    {
      "id": "uk-scotland-gp42-gp43",
      "region": "uk",
      "nation": "Scotland",
      "title": "SVQ in Scientific, Technical and Formulation Processing",
      "frameworkRef": "SCQF Level 5 code GP42 22 and Level 6 code GP43 23",
      "status": "Listed as accredited through 2028-11-30 in the Qualifications Scotland accreditation decision list dated 2026-10-27",
      "level": "SCQF Levels 5 and 6",
      "duration": "Workplace/provider arrangement; confirm the current award structure with the centre",
      "scopeNote": "This is a broad processing qualification, not an injection-moulding-specific award. MouldMaster's mapping is limited to transferable process knowledge and evidence practices.",
      "studyOutcomes": [
        "Explain process steps, equipment, materials, monitoring, and safe work.",
        "Record process observations and quality evidence clearly.",
        "Use a structured troubleshooting approach and communicate workplace handovers.",
        "Identify which learning requires the current SVQ units and workplace evidence."
      ],
      "bookChapterIds": [
        "what-injection-moulding-is",
        "cycle",
        "safety-foundations",
        "machine-anatomy",
        "material-families",
        "process-baseline",
        "process-monitoring",
        "documentation",
        "diagnostic-method",
        "capability"
      ],
      "practiceActivityIds": [
        "process-record",
        "quality-plan",
        "safety-5s",
        "defect-ledger",
        "handover"
      ],
      "formalRequirements": [
        "The awarding body's current SVQ units, an approved centre, and workplace competence evidence govern achievement.",
        "The qualification is broader than injection moulding; providers must confirm how its current units relate to the learner's role.",
        "MouldMaster does not confer SCQF credit or an SVQ."
      ],
      "source": {
        "title": "Qualifications Scotland accreditation decision list, 2026-10-27",
        "url": "https://accreditation.qualifications.gov.scot/accreditation/About_Us/Accreditation_Coordination_Group/decision_lists/2026/October/27_October_2026_"
      }
    },
    {
      "id": "uk-wales-framework",
      "region": "uk",
      "nation": "Wales",
      "title": "Welsh Apprenticeship Framework pathway",
      "frameworkRef": "Provider/employer-selected framework under SASW",
      "status": "Generic Welsh framework structure mapped; a plastics-specific framework crosswalk was not verified in this review",
      "level": "Framework-dependent",
      "duration": "Framework and pathway dependent",
      "scopeNote": "Welsh frameworks combine occupation-specific competence and technical knowledge qualifications, with Essential Skills Wales qualifications where applicable. This map supports general study themes only; the learner's provider must choose the applicable approved framework and pathway.",
      "studyOutcomes": [
        "Use the Book to build polymer-processing background knowledge and safe evidence habits.",
        "Connect Book topics to the occupational competence and technical knowledge qualifications selected by the provider.",
        "Identify applicable communication, numeracy, and digital requirements from the chosen Welsh framework."
      ],
      "bookChapterIds": [
        "what-injection-moulding-is",
        "cycle",
        "safety-foundations",
        "material-families",
        "process-baseline",
        "process-monitoring",
        "documentation",
        "diagnostic-method",
        "quality-plan"
      ],
      "practiceActivityIds": [
        "process-record",
        "quality-plan",
        "safety-5s",
        "defect-ledger",
        "handover"
      ],
      "formalRequirements": [
        "The employer and provider must confirm the current Welsh framework, occupation-specific pathway, qualifications, and Essential Skills Wales requirements.",
        "No plastics-specific Welsh apprenticeship equivalence is claimed by this MouldMaster mapping.",
        "MouldMaster does not issue a Welsh apprenticeship completion certificate or regulated qualification."
      ],
      "source": {
        "title": "Welsh Government: Apprenticeship frameworks",
        "url": "https://www.gov.wales/apprenticeship-frameworks"
      }
    },
    {
      "id": "uk-northern-ireland-framework-348",
      "region": "uk",
      "nation": "Northern Ireland",
      "title": "Polymer processing operations apprenticeship framework",
      "frameworkRef": "Framework No. 348, Issue 6 (August 2025)",
      "status": "Framework No. 348 Issue 6 (08/25) shown on the current nidirect framework page",
      "level": "Level 3",
      "duration": "Agreed by the apprentice, training contractor, and employer",
      "scopeNote": "This is a polymer-processing framework with competence and knowledge components. Its practical competence is workplace-based and commonly assessed by portfolio and observation.",
      "studyOutcomes": [
        "Explain polymer-processing operations, safe work, and quality requirements.",
        "Prepare evidence and questions for workplace competence development.",
        "Use Book topics to support understanding of injection moulding within the wider polymer-processing role.",
        "Identify required essential skills and employment-related responsibilities from the framework."
      ],
      "bookChapterIds": [
        "what-injection-moulding-is",
        "cycle",
        "safety-foundations",
        "machine-anatomy",
        "material-families",
        "process-baseline",
        "process-monitoring",
        "documentation",
        "diagnostic-method",
        "quality-plan",
        "process-window"
      ],
      "practiceActivityIds": [
        "process-record",
        "quality-plan",
        "safety-5s",
        "defect-ledger",
        "handover"
      ],
      "formalRequirements": [
        "Both the specified competence-based and knowledge-based qualifications are required.",
        "Mandatory essential skills include application of number and communication at Level 2 and Digital ICT at Level 1, with the Level 2 option described by the framework.",
        "The apprentice must be employed from day one; provider-controlled workplace assessment and certification remain external."
      ],
      "source": {
        "title": "nidirect: Polymer processing operations Level 3 apprenticeship framework",
        "url": "https://www.nidirect.gov.uk/articles/polymer-processing-operations-level-3-apprenticeship-framework"
      }
    },
    {
      "id": "india-cipet-mo-im",
      "region": "india",
      "nation": "India",
      "title": "Machine Operator – Injection Molding (MO-IM)",
      "frameworkRef": "NCVET / NQR code QG-3.5-CP-04117-2025-V2-CIPET",
      "status": "Approved 2025-05-26; next review date 2028-05-25 in the qualification file",
      "level": "NCrF / NSQF Level 3.5",
      "duration": "600 hours: 210 theory, 360 practical, and 30 mandatory on-the-job training",
      "scopeNote": "This is the most injection-moulding-specific reference in the regional map. Its listed modules cover job/process basics, injection operations and troubleshooting, finished-product inspection, workplace health and safety/5S, office software, employability, entrepreneurship, and OJT.",
      "studyOutcomes": [
        "Explain production instructions, material and mould readiness, and safe work.",
        "Describe injection moulding operations, process monitoring, troubleshooting, and escalation.",
        "Plan inspection of finished products against an approved reference.",
        "Prepare for the practical training and OJT that the qualification requires."
      ],
      "bookChapterIds": [
        "what-injection-moulding-is",
        "cycle",
        "safety-foundations",
        "machine-anatomy",
        "mould-anatomy",
        "material-families",
        "plasticising-unit",
        "process-baseline",
        "process-monitoring",
        "documentation",
        "diagnostic-method",
        "quality-plan",
        "dimensional-stability"
      ],
      "practiceActivityIds": [
        "process-record",
        "quality-plan",
        "safety-5s",
        "defect-ledger",
        "handover"
      ],
      "modules": [
        {
          "code": "CPC/N0214",
          "title": "Basic concepts, job requirements, and process know-how",
          "hours": 90
        },
        {
          "code": "CPC/N0221",
          "title": "Injection moulding operations, process monitoring, and troubleshooting",
          "hours": 270
        },
        {
          "code": "CPC/N0222",
          "title": "Finished-product quality check and inspection",
          "hours": 90
        },
        {
          "code": "CPC/N0411",
          "title": "Workplace health and safety, 5S",
          "hours": 30
        },
        {
          "code": "CPC/N0223",
          "title": "Entrepreneurship in Injection Moulding",
          "hours": 30
        },
        {
          "code": "CPC/N0219",
          "title": "MS Office / open-source office suite basics",
          "hours": 30
        },
        {
          "code": "DGT/VSQ/N0101",
          "title": "Employability Skills",
          "hours": 30
        },
        {
          "code": "OJT",
          "title": "Mandatory on-the-job training",
          "hours": 30
        }
      ],
      "formalRequirements": [
        "A training provider and awarding/assessment arrangements must deliver the official curriculum and assess its practical criteria.",
        "The 360 practical hours and 30 mandatory OJT hours are external training requirements; Book reading or app activities do not count toward them.",
        "The qualification file names Hindi as an additional language for its qualification/model curriculum; MouldMaster content is currently English."
      ],
      "source": {
        "title": "National Qualification Register: CIPET MO-IM qualification file",
        "url": "https://www.nqr.gov.in/public/qualification/file/STT_Qualification_File_MO-IM.pdf"
      }
    }
  ]
});
let data=null,view=null,navDispose=null,activeRegion='nz';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function getJson(url){const r=await fetch(url,{cache:'no-store',credentials:'same-origin'});if(!r.ok)throw new Error(url+' unavailable ('+r.status+')');return r.json();}
function titleFor(id){return String(id||'').split('-').map(x=>x?x[0].toUpperCase()+x.slice(1):'').join(' ');}
function style(){
 if(document.getElementById('mm-standards-readiness-style'))return;
 const s=document.createElement('style');s.id='mm-standards-readiness-style';s.textContent=`
.mm-readiness-view{display:grid;gap:14px}.mm-readiness-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.mm-readiness-card{border:1px solid #304b69;border-radius:14px;background:#0e1d31;padding:16px}.mm-readiness-card h3{margin:.25rem 0 .5rem}
.mm-readiness-card h4{margin:1rem 0 .35rem}.mm-readiness-card ul{margin:.4rem 0 .8rem;padding-left:1.2rem}.mm-readiness-card li{margin:.3rem 0}
.mm-readiness-boundary{border-left:4px solid var(--accent);padding:10px 12px;background:#10243d;border-radius:8px;line-height:1.45}
.mm-readiness-table{width:100%;border-collapse:collapse;font-size:.92rem}.mm-readiness-table th,.mm-readiness-table td{border-bottom:1px solid #29415d;padding:8px;text-align:left;vertical-align:top}
.mm-readiness-badges{display:flex;gap:7px;flex-wrap:wrap}.mm-readiness-badge{border:1px solid #3a5876;border-radius:999px;padding:4px 8px;font-size:.78rem}
@media(max-width:760px){.mm-readiness-grid{grid-template-columns:1fr}.mm-readiness-card{padding:14px}.mm-readiness-table{font-size:.84rem}}
`;document.head.appendChild(s);
}
function qmsHtml(q){
 const current=(q.standards||[]).find(x=>x.role==='current-published-requirements-basis');
 const vocab=(q.standards||[]).find(x=>x.role==='current-terminology-basis');
 return '<article class="mm-readiness-card"><span class="eyebrow">Quality management support</span><h3>ISO 9001 support — evidence, not certification</h3>'+
 '<p>MouldMaster supports evidence discipline and learning relevant to a QMS. It does <b>not</b> establish organisational conformity, certification, accreditation or auditor approval.</p>'+
 '<div class="mm-readiness-badges"><span class="mm-readiness-badge">'+esc(current?.title||'Current requirements basis unavailable')+'</span><span class="mm-readiness-badge">'+esc(vocab?.title||'Vocabulary basis unavailable')+'</span></div>'+
 '<h4>Clause-to-feature support</h4><table class="mm-readiness-table"><thead><tr><th>Clause</th><th>Theme</th><th>Support</th></tr></thead><tbody>'+(q.supportMap||[]).map(r=>'<tr><th scope="row">'+esc(r.clause)+'</th><td>'+esc(r.theme)+'</td><td>'+esc(r.supportLevel)+'</td></tr>').join('')+'</tbody></table>'+
 '<h4>Evidence templates</h4><ul>'+(q.recordTemplates||[]).map(t=>'<li><b>'+esc(t.title)+'</b> — '+esc(t.purpose)+'</li>').join('')+'</ul>'+
 ((q.packagingExamples||[]).length?'<h4>Real packaging example</h4>'+q.packagingExamples.map(x=>'<section class="mm-readiness-boundary"><b>'+esc(x.title)+'</b><p>'+esc(x.interpretation)+'</p><p><b>Observed:</b> '+esc(x.observedMaterialIdentity?.brand||'Unknown brand')+' · '+esc(x.observedMaterialIdentity?.polymerFamily||'Unknown polymer')+' · exact grade '+esc(x.observedMaterialIdentity?.exactGradeStatus||'unresolved')+'.</p><p><b>Verification:</b> '+esc(x.currentCertificateStatus||x.verificationState||'not independently verified')+'.</p><ul>'+(x.boundaries||[]).map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul></section>').join(''):'')+
 '<div class="mm-readiness-boundary"><b>Boundary:</b> use a licensed copy of ISO 9001 for requirement text. MouldMaster paraphrases support themes and does not replace an organisation’s controlled QMS, competent auditor or certification body.</div></article>';
}
function nzqaHtml(n){
 const current=n.currentInjectionMouldingStandards||[],expired=n.expiredStandardsNotForCurrentAssessmentMapping||[];
 const gates=n.gates||[];
 return '<article class="mm-readiness-card"><span class="eyebrow">New Zealand education readiness</span><h3>NZQA preparation — not approval</h3>'+
 '<p>The governed NZQA mapping covers <b>'+esc((n.chapterMap||[]).length)+'</b> Book modules and '+esc((n.learningOutcomes||[]).length)+' draft learning outcomes. It is a provider-readiness aid, not an NZQA result.</p>'+
 '<h4>Current Injection Moulding context</h4><div class="mm-readiness-badges">'+current.map(x=>'<span class="mm-readiness-badge">US '+esc(x.id)+' · CMR '+esc(x.cmr||'external')+'</span>').join('')+'</div>'+
 '<h4>Expired / excluded from current assessment mapping</h4><p>'+expired.map(esc).join(', ')+'</p>'+
 '<h4>External gates</h4><ul>'+gates.map(g=>'<li><b>'+esc(g.id)+'</b> — '+esc(g.status)+': '+esc(g.label||g.description||'provider-controlled gate')+'</li>').join('')+'</ul>'+
 '<div class="mm-readiness-boundary"><b>Boundary:</b> app learning is formative. Provider ownership, final level/credits, approved summative assessment, consent to assess, moderation, workplace evidence, learner administration and NZQA approval/accreditation remain external.</div></article>';
}
function activitiesHtml(e,p){
 const byId=new Map((e.practiceActivities||[]).map(x=>[x.id,x]));
 return (p.practiceActivityIds||[]).map(id=>byId.get(id)).filter(Boolean).map(x=>'<li><b>'+esc(x.title)+'</b> — '+esc(x.description)+'</li>').join('');
}
function modulesHtml(p){
 if(!(p.modules||[]).length)return '';
 return '<details><summary>Official qualification modules and hours</summary><ul>'+p.modules.map(m=>'<li><b>'+esc(m.code)+'</b> — '+esc(m.title)+' ('+esc(m.hours)+' h)</li>').join('')+'</ul></details>';
}
function pathwayHtml(e,p){
 const chapters=(p.bookChapterIds||[]).map(id=>'<button type="button" class="ghost" data-book-chapter="'+esc(id)+'">'+esc(titleFor(id))+'</button>').join('');
 const outcomes=(p.studyOutcomes||[]).map(x=>'<li>'+esc(x)+'</li>').join('');
 const gates=(p.formalRequirements||[]).map(x=>'<li>'+esc(x)+'</li>').join('');
 const url=String(p.source?.url||'');
 const sourceLink=url.indexOf('https://')===0?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Open official source: '+esc(p.source.title||'framework reference')+'</a>':'';
 return '<article class="mm-readiness-card"><span class="eyebrow">'+esc(p.nation)+' · '+esc(p.frameworkRef)+'</span><h3>'+esc(p.title)+'</h3>'+
 '<div class="mm-readiness-badges"><span class="mm-readiness-badge">'+esc(p.level)+'</span><span class="mm-readiness-badge">'+esc(p.status)+'</span><span class="mm-readiness-badge">'+esc(p.duration)+'</span></div>'+
 '<p>'+esc(p.scopeNote)+'</p>'+modulesHtml(p)+
 '<h4>Study outcomes this Book can support</h4><ul>'+outcomes+'</ul>'+
 '<h4>Open mapped Book modules</h4><div class="mm-readiness-badges">'+chapters+'</div>'+
 '<h4>Practice in the app</h4><ul>'+activitiesHtml(e,p)+'</ul>'+
 '<h4>Still needs the relevant provider or workplace</h4><ul>'+gates+'</ul>'+
 '<p>'+sourceLink+'</p></article>';
}
function educationHtml(e){
 const selected=(e.regionTabs||[]).find(x=>x.id===activeRegion)||e.regionTabs?.[0];
 const tabs=(e.regionTabs||[]).map(x=>'<button type="button" class="ghost" data-region="'+esc(x.id)+'" aria-pressed="'+(x.id===activeRegion?'true':'false')+'">'+esc(x.label)+'</button>').join('');
 const pathways=(e.pathways||[]).filter(p=>p.region===(selected?.id||'nz'));
 return '<section class="card"><span class="eyebrow">Regional study pathways · checked '+esc(e.checked)+'</span><h2>Study injection moulding in your framework context</h2>'+
 '<p>Choose a region to see the official framework context, Book modules, app practice, and external assessment requirements. UK routes are separated by nation.</p>'+
 '<div class="mm-readiness-boundary"><b>Study-support mapping only.</b> This crosswalk is provisional and is not formal qualification equivalence, accreditation, credit, provider consent, assessed competence, or authority to operate a machine.</div>'+
 '<div class="mm-readiness-badges" role="group" aria-label="Choose education pathway region">'+tabs+'</div></section>'+
 '<section class="mm-readiness-grid">'+pathways.map(p=>pathwayHtml(e,p)).join('')+'</section>';
}
function ensureView(){
 if(view)return view;
 style();const main=document.querySelector('#mainContent,.main,main');if(!main)return null;
 view=document.createElement('section');view.id='mmStandardsReadinessView';view.className='view hidden mm-readiness-view';view.innerHTML='<section class="card"><span class="eyebrow">Governed support layer</span><h2>Standards & readiness</h2><p>Loading current governed support contracts…</p></section>';
 view.addEventListener('click',function(event){
  const regionButton=event.target?.closest?.('[data-region]');
  if(regionButton){activeRegion=regionButton.dataset.region||'nz';render();return;}
  const chapterButton=event.target?.closest?.('[data-book-chapter]');
  if(chapterButton){window.MMBook?.openChapter?.(chapterButton.dataset.bookChapter);return;}
 });
 main.appendChild(view);return view;
}
function render(){
 const root=ensureView();if(!root||!data)return;
 root.innerHTML='<section class="card"><span class="eyebrow">Governed support layer</span><h2>Standards & readiness</h2><p>Use these surfaces to understand evidence and provider-readiness boundaries. They do not create certification, accreditation, consent, competence or production authority.</p></section>'+
 educationHtml(data.education)+'<section class="mm-readiness-grid">'+qmsHtml(data.qms)+nzqaHtml(data.nzqa)+'</section>';
}
function open(region){
 if(region&&['nz','uk','india'].includes(region))activeRegion=region;
 const root=ensureView();if(!root)return;
 render();document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));root.classList.remove('hidden');
 const title=document.getElementById('pageTitle'),sub=document.getElementById('pageSubtitle');if(title)title.textContent='Standards & readiness';if(sub)sub.textContent='New Zealand, UK nation-specific, and India study pathways';
 window.MM_APP_SHELL?.navigation?.setCustomActive?.('standards-readiness','more');
}
function install(){
 const shell=window.MM_APP_SHELL;if(!shell?.navigation?.register)return false;
 if(!navDispose)navDispose=shell.navigation.register({id:'standards-readiness',label:'Standards & readiness',icon:'§',description:'ISO 9001 support and NZ, UK, and India education pathway maps.',order:55,group:'progress',mobileGroup:'more',action:()=>open()});
 return true;
}
function mountBookPathwayCard(){
 const hero=document.querySelector('#mmBookView [data-mm-book-hero]');
 if(!hero||hero.querySelector('#mm-book-pathway-card'))return false;
 const card=document.createElement('section');card.id='mm-book-pathway-card';card.className='mm-book-pathway-card';
 card.innerHTML='<span class="eyebrow">Regional study pathways</span><h3>Use this Book with NZ, UK, and India study routes</h3><p>Open a nation-aware map to see related Book modules, app practice, and the parts that require a provider or workplace.</p><div class="mm-readiness-badges"></div>';
 const actions=card.querySelector('.mm-book-pathway-actions');
 [['nz','New Zealand'],['uk','United Kingdom'],['india','India']].forEach(item=>{
  const button=document.createElement('button');button.type='button';button.className='ghost';button.dataset.openRegion=item[0];button.textContent=item[1];
  button.addEventListener('click',function(){
   activeRegion=item[0];
   const navButton=document.querySelector('#nav [data-mm-registry-nav="standards-readiness"]');
   if(navButton)navButton.click();else open(item[0]);
  });
  actions.appendChild(button);
 });
 hero.appendChild(card);return true;
}
async function init(){
 ensureView();
 try{
  const [qms,nzqa]=await Promise.all([getJson(QMS),getJson(NZQA)]);
  if(qms?.id!=='mouldmaster-iso9001-qms-support'||nzqa?.id!=='mouldmaster-nzqa-education-readiness'||EDUCATION_DATA?.id!=='mouldmaster-regional-education-pathways')throw new Error('readiness contract identity mismatch');
  data=Object.freeze({qms,nzqa,education:EDUCATION_DATA});render();mountBookPathwayCard();
 }catch(e){if(view)view.innerHTML='<section class="card"><h2>Standards & readiness unavailable</h2><p>The governed support contracts could not be verified or loaded. No compliance or approval status should be inferred.</p></section>';console.error('[MouldMaster readiness]',e);}
 install();
}
window.addEventListener('mm:book-manifest-ready',mountBookPathwayCard);
if(!install())window.addEventListener('mm:domains-ready',install,{once:true});
window.MM_STANDARDS_READINESS=Object.freeze({version:VERSION,open,getData:()=>data});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();