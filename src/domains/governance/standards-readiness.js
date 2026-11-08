/* MouldMaster standards and readiness — governed read-only support. */
(function(){
'use strict';
if(window.MM_STANDARDS_READINESS)return;
const VERSION='2026.11.08.2';
const QMS='./src/domains/quality/data/quality-management-iso9001-v1.json';
const NZQA='./src/domains/learning/book-data/nzqa-education-readiness-v1.json';
const COURSE_PACKS='./src/domains/learning/book-data/education-course-packs-v1.json';
const EDUCATION_DATA=Object.freeze({
  "schema": 1,
  "id": "mouldmaster-regional-education-pathways",
  "version": "2026.11.08.2",
  "checked": "2026-11-08",
  "status": "provisional-study-support-crosswalk",
  "purpose": "Give learners in New Zealand, the United Kingdom's four nations, and India a source-linked study pathway through the same MouldMaster Book and app topics.",
  "claimBoundary": "Use this provisional map for study and formative practice. Level labels belong to their named framework: equal or similar numbers do not mean equivalent awards, credit transfer, mutual recognition or portability. Approved providers and workplaces control credits, assessment, hours, competence sign-off and machine-operation authority.",
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
      "status": "Current record · none currently offering",
      "level": "NZQCF Level 3",
      "duration": "95–120 credits; programme duration is provider-set",
      "scopeNote": "The qualification includes an optional Injection Moulding strand. The MouldMaster mapping uses the existing NZQA readiness contract and Book chapter map as study context. NZQA currently lists no organisations offering this qualification; its next review is 31 December 2026. Confirm enrolment availability and the current programme with a provider before relying on this route.",
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
        "NZQA currently lists no organisations offering this qualification; confirm current provider and enrolment availability. The next NZQA review is 31 December 2026.",
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
      "id": "nz-nzqa-4402",
      "region": "nz",
      "nation": "New Zealand",
      "title": "New Zealand Certificate in Plastics Processing (Level 4)",
      "frameworkRef": "NZQA qualification 4402 · Injection Moulding strand",
      "status": "Current record · none currently offering",
      "level": "NZQCF Level 4",
      "duration": "125–130 credits across the qualification strands",
      "scopeNote": "Technician-level study for people working in plastics processing. The Book links cover quality assurance, process management, advanced materials, fault diagnosis and continuous improvement. NZQA currently lists no organisations offering this qualification; its next review is 31 December 2026. Confirm enrolment availability and the current programme with a provider before relying on this route.",
      "studyOutcomes": [
        "Compare process and quality evidence against a documented baseline and explain what a measurement can establish.",
        "Explain how material behaviour, machine capability and mould conditions can affect the process window.",
        "Propose a controlled investigation for a plant fault and state the evidence required before any workplace change.",
        "Describe how a repeatable investigation can support a documented improvement and a handover."
      ],
      "bookChapterIds": [
        "material-families",
        "shot-utilisation",
        "process-baseline",
        "process-window",
        "documentation",
        "process-monitoring",
        "capability",
        "doe",
        "complex-diagnostics"
      ],
      "practiceActivityIds": [
        "process-record",
        "quality-plan",
        "defect-ledger",
        "handover"
      ],
      "formalRequirements": [
        "NZQA currently lists no organisations offering this qualification; confirm current provider and enrolment availability. The next NZQA review is 31 December 2026.",
        "The provider selects and assesses the programme and its Injection Moulding strand.",
        "Practical setup, fault correction, quality assurance and improvement evidence must meet the provider and workplace requirements."
      ],
      "source": {
        "title": "NZQA: Qualification 4402",
        "url": "https://www.nzqa.govt.nz/nzqf/search/viewQualification.do?selectedItemKey=4402"
      }
    },
    {
      "id": "uk-england-st1328",
      "region": "uk",
      "nation": "England",
      "title": "Polymer processing technician",
      "frameworkRef": "Skills England apprenticeship standard ST1328, version 1.0",
      "status": "Approved for delivery",
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
        "capability",
        "diagnostic-method",
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
        "An employer, training provider, and approved end-point assessment organisation control the apprenticeship and end-point assessment.",
        "The end-point assessment includes a test, an observation with questions, and an interview supported by a portfolio.",
        "MouldMaster does not supply the apprenticeship hours, portfolio sign-off, or end-point assessment."
      ],
      "source": {
        "title": "Skills England: ST1328 Polymer processing technician",
        "url": "https://skillsengland.education.gov.uk/apprenticeships/st1328-v1-0?view=standard"
      },
      "additionalSources": [
        {
          "title": "Skills England: ST1328 end-point assessment plan",
          "url": "https://skillsengland.education.gov.uk/apprenticeships/st1328-v1-0?view=epa"
        }
      ]
    },
    {
      "id": "uk-scotland-gp42-gp43",
      "region": "uk",
      "nation": "Scotland",
      "title": "SVQ in Scientific, Technical and Formulation Processing",
      "frameworkRef": "SCQF Level 5 code GP42 22 and Level 6 code GP43 23",
      "status": "Modern Apprenticeship framework listed by Skills Development Scotland",
      "level": "SCQF Levels 5 and 6",
      "duration": "Workplace/provider arrangement; confirm the current award structure with the centre",
      "scopeNote": "This wider processing framework includes transferable process-operation, quality, safety and troubleshooting skills. Ask the training centre which SVQ units apply to an injection moulding role.",
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
        "title": "Skills Development Scotland: Scientific, Technical and Formulation Processing Modern Apprenticeship",
        "url": "https://www.apprenticeships.scot/modern-apprenticeships/scientific-technical-and-formulation-processing/individual/"
      },
      "additionalSources": [
        {
          "title": "Qualifications Scotland accreditation decision list, 2026-10-27",
          "url": "https://accreditation.qualifications.gov.scot/accreditation/About_Us/Accreditation_Coordination_Group/decision_lists/2026/October/27_October_2026_"
        }
      ]
    },
    {
      "id": "uk-wales-framework",
      "region": "uk",
      "nation": "Wales",
      "title": "Polymer Processing Operations apprenticeships",
      "frameworkRef": "Welsh Polymer Processing Operations · Foundation Apprenticeship and Apprenticeship",
      "status": "Qualifications Wales lists both certificates as available. Confirm the framework and local intake with the provider.",
      "level": "Levels 2 and 3",
      "duration": "Provider and pathway dependent",
      "scopeNote": "The Welsh provider describes a workplace route for polymer and polymer-composite operations. Level 2 study can support safety, machine-based production, sampling and inspection. Level 3 study can support diagnosis, process improvement and routine servicing where the chosen units cover them.",
      "studyOutcomes": [
        "Explain safe work, the production cycle and the evidence needed before starting or stopping a process.",
        "Plan how to document inspection and sampling against the authorised specification.",
        "For Level 3, compare competing explanations of a process fault and outline the evidence needed to test them.",
        "Practise clear handover and check which Essential Skills Wales requirements apply to the chosen pathway."
      ],
      "bookChapterIds": [
        "cycle",
        "safety-foundations",
        "machine-anatomy",
        "material-families",
        "process-baseline",
        "documentation",
        "capability",
        "process-monitoring",
        "diagnostic-method",
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
        "The Welsh provider confirms the current framework issue, qualifications, unit choices and intake.",
        "Workplace evidence, practical and written assessments, and applicable Essential Skills Wales requirements are provider-controlled."
      ],
      "source": {
        "title": "Grŵp Llandrillo Menai: Polymer Processing Operations workplace apprenticeship",
        "url": "https://www.gllm.ac.uk/courses/certificate-in-polymer-operations-available-as-part-of-a-workplace-foundation-apprenticeship-framework-polymer-processing-operations-wales"
      },
      "additionalSources": [
        {
          "title": "Medr: Welsh apprenticeship frameworks and provider requirements",
          "url": "https://www.medr.cymru/en/apprenticeships/"
        },
        {
          "title": "Qualifications Wales: qualification register and current exports",
          "url": "https://www.qiw.wales/export"
        },
        {
          "title": "Apprenticeship Certificates Wales: published framework reference FR04316",
          "url": "https://acwcerts.co.uk/web/wp-content/uploads/2018/07/ACW-Polymer-Processing-Operations-FR04316.pdf"
        }
      ]
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
        "capability",
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
      "id": "india-cipet-amo-im",
      "region": "india",
      "nation": "India",
      "title": "Assistant Machine Operator – Injection Moulding (AMO-IM)",
      "frameworkRef": "NCVET / NQR code QG-03-CP-04130-2025-V2-CIPET · NQR 14257",
      "status": "Approved 2025-05-26; valid to 2028-05-25 in the NQR record",
      "level": "NCrF / NSQF Level 3",
      "duration": "480 hours · confirm the theory/employability category split with CIPET",
      "scopeNote": "Entry-level injection moulding study for an assistant role working under an operator or supervisor. NQR lists progression to Machine Operator in the injection moulding industry.",
      "studyOutcomes": [
        "Explain the production plan, work instructions, materials, mould identity and safe preparation checks.",
        "Describe how an assistant supports machine setup, runs, monitoring and basic troubleshooting under operator guidance.",
        "Use an approved reference and basic measuring method to check finished parts and report defects.",
        "Practise 5S, record handling, employability and clear escalation without substituting an app exercise for workplace authorisation."
      ],
      "bookChapterIds": [
        "what-injection-moulding-is",
        "cycle",
        "safety-foundations",
        "machine-anatomy",
        "mould-anatomy",
        "material-families",
        "process-baseline",
        "process-monitoring",
        "documentation",
        "diagnostic-method",
        "capability",
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
          "title": "Basic concepts, job requirements and process know-how",
          "hours": 90,
          "delivery": {
            "Theory": 30,
            "Practical": 60
          }
        },
        {
          "code": "CPC/N0215",
          "title": "Assist injection moulding operations, monitoring and troubleshooting",
          "hours": 180,
          "delivery": {
            "Theory": 50,
            "Practical": 130
          }
        },
        {
          "code": "CPC/N0216",
          "title": "Basic quality checks against an approved product",
          "hours": 90,
          "delivery": {
            "Theory": 20,
            "Practical": 70
          }
        },
        {
          "code": "CPC/N0411",
          "title": "Basic workplace health, safety and 5S",
          "hours": 30,
          "delivery": {
            "Theory": 10,
            "Practical": 20
          }
        },
        {
          "code": "CPC/N0219",
          "title": "Office-suite basics",
          "hours": 30,
          "delivery": {
            "Theory": 10,
            "Practical": 20
          }
        },
        {
          "code": "DGT/VSQ/N0101",
          "title": "Employability skills",
          "hours": 30,
          "delivery": {
            "Employability": 30
          }
        },
        {
          "code": "OJT",
          "title": "Mandatory on-the-job training",
          "hours": 30,
          "delivery": {
            "On-the-job training": 30
          }
        }
      ],
      "formalRequirements": [
        "NQR entry routes include Grade 10 pass without experience, Grade 8 with a two-year NTC/NAC, Grade 9 with 1.5 years relevant experience, or Grade 8 with three years relevant experience. CIPET confirms eligibility for the intake.",
        "The NQR page classifies the 480 hours as 120 theory, 300 practical, 30 employability and 30 OJT. The linked qualification-file module table totals 150 theory (including the 30-hour employability module), 300 practical and 30 OJT. The total remains 480 hours; CIPET confirms the controlled delivery schedule and category labels.",
        "The 300 practical hours and 30 mandatory OJT hours require provider-organised, supervised delivery. Book reading and MouldMaster practice do not count toward those hours.",
        "CIPET and its approved assessors control formal training, evidence, assessment and certification. MouldMaster completion does not award NCrF credits or authorize machine operation."
      ],
      "source": {
        "title": "National Qualification Register: Assistant Machine Operator – Injection Moulding (NQR 14257)",
        "url": "https://www.nqr.gov.in/qualifications/14257"
      },
      "additionalSources": [
        {
          "title": "CIPET qualification file: Assistant Machine Operator – Injection Moulding",
          "url": "https://www.nqr.gov.in/qualification/file/STT_Qualification_File_AMO-IM.pdf"
        },
        {
          "title": "CIPET: NSQF-aligned qualifications and registration",
          "url": "https://sdcipet.in/NSQFCourses.aspx"
        }
      ]
    },
    {
      "id": "india-cipet-mo-im",
      "region": "india",
      "nation": "India",
      "title": "Machine Operator – Injection Molding (MO-IM)",
      "frameworkRef": "NCVET / NQR code QG-3.5-CP-04117-2025-V2-CIPET",
      "status": "Approved 2025-05-26; next review date 2028-05-25 in the qualification file",
      "level": "NCrF / NSQF Level 3.5",
      "duration": "600 hours · 180 theory, 30 employability, 360 practical and 30 mandatory on-the-job training",
      "scopeNote": "This operator qualification covers job and process basics, injection operations and troubleshooting, finished-part inspection, workplace health and safety, 5S, office software, employability, entrepreneurship and on-the-job training.",
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
        "capability",
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
          "hours": 90,
          "delivery": {
            "Theory": 30,
            "Practical": 60
          }
        },
        {
          "code": "CPC/N0221",
          "title": "Injection moulding operations, process monitoring, and troubleshooting",
          "hours": 270,
          "delivery": {
            "Theory": 90,
            "Practical": 180
          }
        },
        {
          "code": "CPC/N0222",
          "title": "Finished-product quality check and inspection",
          "hours": 90,
          "delivery": {
            "Theory": 30,
            "Practical": 60
          }
        },
        {
          "code": "CPC/N0411",
          "title": "Workplace health and safety, 5S",
          "hours": 30,
          "delivery": {
            "Theory": 10,
            "Practical": 20
          }
        },
        {
          "code": "CPC/N0223",
          "title": "Entrepreneurship in Injection Moulding",
          "hours": 30,
          "delivery": {
            "Theory": 10,
            "Practical": 20
          }
        },
        {
          "code": "CPC/N0219",
          "title": "MS Office / open-source office suite basics",
          "hours": 30,
          "delivery": {
            "Theory": 10,
            "Practical": 20
          }
        },
        {
          "code": "DGT/VSQ/N0101",
          "title": "Employability Skills",
          "hours": 30,
          "delivery": {
            "Employability": 30
          }
        },
        {
          "code": "OJT",
          "title": "Mandatory on-the-job training",
          "hours": 30,
          "delivery": {
            "On-the-job training": 30
          }
        }
      ],
      "formalRequirements": [
        "A training provider and awarding/assessment arrangements must deliver the official curriculum and assess its practical criteria.",
        "The 360 practical hours and 30 mandatory OJT hours are external training requirements; Book reading or app activities do not count toward them.",
        "The training centre selects the delivery language. The India workbook includes draft Hindi study support."
      ],
      "source": {
        "title": "National Qualification Register: CIPET Machine Operator – Injection Molding",
        "url": "https://www.nqr.gov.in/qualifications/14350"
      },
      "additionalSources": [
        {
          "title": "CIPET: NSQF-aligned qualifications and registration",
          "url": "https://sdcipet.in/NSQFCourses.aspx"
        }
      ]
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
.mm-readiness-view{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;overflow-wrap:anywhere}.mm-readiness-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
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
 return '<article class="mm-readiness-card"><span class="eyebrow">New Zealand education readiness</span><h3>NZQA readiness — preparation, not approval</h3>'+
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
function moduleHours(module){
 return Object.entries(module.delivery||{}).map(([category,hours])=>`${category} ${hours} h`).join(' · ');
}
function modulesHtml(p){
 if(!p.modules?.length)return '';
 return `<details><summary>Official qualification modules and hours</summary><ul>${p.modules.map(module=>
  `<li><b>${esc(module.code)}</b> · <span>${esc(module.title)} (${esc(module.hours)} h)</span><br>${esc(moduleHours(module))}</li>`).join('')}</ul></details>`;
}
const coverageLabels={
 mapped:'Mapped study',
 supplement:'Workbook supplement',
 workplace:'Workplace evidence',
 provider:'Provider to complete'
};
function courseData(contract){
 if(contract?.schema!==1||contract.id!=='mouldmaster-education-course-packs'||contract.version!==VERSION||
    contract.status!=='draft-provider-review'||!contract.boundary||!Array.isArray(contract.forms)||
    !contract.forms.every(form=>form?.title&&Array.isArray(form.fields))||!Array.isArray(contract.providerChecklist))return null;
 const isExercise=exercise=>exercise?.title&&exercise.context&&Array.isArray(exercise.reading)&&
  Array.isArray(exercise.questions)&&exercise.questions.every(question=>question?.prompt&&question.feedback);
 if(!Object.values(contract.exercises||{}).every(exercise=>isExercise(exercise)&&(!exercise.hi||isExercise(exercise.hi))))return null;
 const complete=EDUCATION_DATA.pathways.every(({id})=>{
  const pack=contract.packs?.[id];
  return pack?.framework&&pack.scope&&Array.isArray(pack.rows)&&Array.isArray(pack.delivery)&&Array.isArray(pack.sourceIds)&&
   pack.rows.every(row=>Array.isArray(row?.refs)&&Array.isArray(row.book)&&Array.isArray(row.lessons)&&Object.hasOwn(coverageLabels,row.coverage)&&
    (!row.exercise||Object.hasOwn(contract.exercises||{},row.exercise)))&&
   pack.sourceIds.every(id=>contract.sources?.[id]?.title&&/^https:\/\//.test(contract.sources[id].url))&&
   (!pack.assessmentMethods||(Array.isArray(pack.assessmentMethods)&&pack.assessmentMethods.every(method=>
    method?.title&&method.planning&&Array.isArray(method.refs))))&&
   (!pack.practical||(Array.isArray(pack.practical)&&pack.practical.every(guide=>guide?.unit&&guide.title&&
    Array.isArray(guide.range)&&Array.isArray(guide.criteria)&&guide.criteria.every(item=>item?.ref&&item.observation))));
 });
 return complete?contract:null;
}
function moduleButton(id){
 return `<button type="button" class="ghost" data-education-book-module="${esc(id)}">${esc(titleFor(id))}</button>`;
}
function lessonTitle(id){return window.MM_DATA?.lessons?.find(lesson=>lesson.id===id)?.title||`Lesson ${id}`;}
function list(values){return `<ul>${values.map(value=>`<li>${esc(value)}</li>`).join('')}</ul>`;}
function exerciseText({context,reading,questions},answerLabel='Check your reasoning'){
 return `<p>${esc(context)}</p>${reading.map(paragraph=>`<p>${esc(paragraph)}</p>`).join('')}
  <ol>${questions.map(({prompt,feedback})=>`<li><p>${esc(prompt)}</p><details><summary>${esc(answerLabel)}</summary><p>${esc(feedback)}</p></details></li>`).join('')}</ol>`;
}
function exerciseHtml(id,exercise){
 return `<details data-education-exercise="${esc(id)}"><summary>${esc(exercise.title)}</summary>
  ${exerciseText(exercise)}
  ${exercise.hi?`<details lang="hi"><summary>${esc(exercise.hi.title)}</summary>${exerciseText(exercise.hi,'उत्तर और कारण देखें')}</details>`:''}
 </details>`;
}
function courseSources(p,pack){
 return [p.source,...(p.additionalSources||[]),...pack.sourceIds.map(id=>data.courses.sources[id])]
  .filter((source,index,all)=>all.findIndex(other=>other.url===source.url)===index);
}
function exerciseIds(pack){return [...new Set(pack.rows.map(row=>row.exercise).filter(Boolean))];}
function courseHtml(p){
 if(!data.courses)return '<p class="muted">Course and assessment packs are unavailable. Reconnect and reopen the app to load the complete release.</p>';
 const {boundary,exercises,forms,providerChecklist}=data.courses,pack=data.courses.packs[p.id];
 const rows=pack.rows.map(row=>`<li>
  <h5>${esc(row.title)}</h5>
  <p><b>${esc(row.refs.join(', '))}</b> · ${esc(coverageLabels[row.coverage])}</p>
  <div class="mm-readiness-badges">${row.book.map(moduleButton).join('')}
   ${row.lessons.map(id=>`<button type="button" class="ghost" data-education-lesson="${esc(id)}">Lesson ${esc(id)} · ${esc(lessonTitle(id))}</button>`).join('')}</div>
  ${row.exercise?`<button type="button" class="ghost" data-education-workbook="${esc(row.exercise)}">Practice · ${esc(exercises[row.exercise].title)}</button>`:''}
  <p><b>Evidence to discuss with the assessor</b> · ${esc(row.evidence)}</p>
 </li>`).join('');
 const practical=(pack.practical||[]).map(guide=>`<details data-education-practical="${esc(guide.unit)}"><summary>${esc(guide.title)}</summary>
  <p>${esc(guide.entry)}</p>${list(guide.range)}
  <ol>${guide.criteria.map(({ref,observation})=>`<li><b>${esc(ref)}</b> · ${esc(observation)}</li>`).join('')}</ol>
 </details>`).join('');
 return `<details data-education-course="${esc(p.id)}"><summary>Course and assessment pack</summary>
  <p><b>Draft for provider review</b> · ${esc(pack.framework)}</p><p>${esc(pack.scope)}</p>
  <p class="mm-readiness-boundary">${esc(boundary)}</p>
  <details><summary>Study and evidence map · ${pack.rows.length} groups</summary><ul>${rows}</ul></details>
  <details><summary>Delivery and training records</summary>${list(pack.delivery)}</details>
  ${pack.assessmentMethods?`<details><summary>End-point assessment methods</summary><ul>${pack.assessmentMethods.map(method=>
   `<li><h5>${esc(method.title)}</h5><p>${esc(method.planning)}</p><p><b>${esc(method.refs.join(', '))}</b></p></li>`).join('')}</ul></details>`:''}
  <h4>Practice workbooks</h4>${exerciseIds(pack).map(id=>exerciseHtml(id,exercises[id])).join('')}
  ${practical}
  <details><summary>Provider review and blank records</summary>${list(providerChecklist)}
   <p>Record formal decisions in the provider's authorised system. The download contains blank templates for ${esc(forms.map(form=>form.title.toLowerCase()).join(', '))}.</p>
   <button type="button" class="secondary" data-education-download="${esc(p.id)}">Download draft assessor pack</button>
  </details>
  <h4>Course sources</h4><ul>${courseSources(p,pack).map(({title,url})=>
   `<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a></li>`).join('')}</ul>
 </details>`;
}
function downloadCoursePack(id){
 const pathway=EDUCATION_DATA.pathways.find(item=>item.id===id),courses=data?.courses;
 if(!pathway||!courses)return;
 const pack=courses.packs[id],lines=[`# ${pathway.title}`,'','**Draft for provider review**','',pack.framework,'',pack.scope,'',courses.boundary,'','## Delivery'];
 pack.delivery.forEach(text=>lines.push(`- ${text}`));
 if(pathway.modules?.length){
  lines.push('','### Qualification modules and hours');
  pathway.modules.forEach(module=>lines.push(`- ${module.code} · ${module.title} (${module.hours} h) · ${moduleHours(module)}`));
 }
 if(pack.assessmentMethods){
  lines.push('','## End-point assessment methods');
  pack.assessmentMethods.forEach(method=>lines.push('',`### ${method.title}`,'',method.planning,'',method.refs.join(', ')));
 }
 lines.push('','## Study and evidence map');
 pack.rows.forEach(row=>{
  lines.push('',`### ${row.refs.join(', ')} · ${row.title}`,coverageLabels[row.coverage]);
  if(row.book.length)lines.push(`Book modules · ${row.book.map(titleFor).join(', ')}`);
  if(row.lessons.length)lines.push(`App lessons · ${row.lessons.map(lesson=>`${lesson} ${lessonTitle(lesson)}`).join(', ')}`);
  if(row.exercise)lines.push(`Practice · ${courses.exercises[row.exercise].title}`);
  lines.push(row.evidence,'Evidence reference __________________','Decision and rationale __________________');
 });
 for(const guide of pack.practical||[]){
  lines.push('',`## ${guide.title}`,guide.entry);
  guide.range.forEach(text=>lines.push(`- ${text}`));
  guide.criteria.forEach(({ref,observation})=>lines.push('',`- ${ref} · ${observation}`,'  - Context, evidence reference and decision __________________'));
 }
 lines.push('','## Formative workbooks');
 for(const exerciseId of exerciseIds(pack)){
  const exercise=courses.exercises[exerciseId];
  for(const workbook of [exercise,exercise.hi].filter(Boolean)){
   lines.push('',`### ${workbook.title}`,'',workbook.context,'',workbook.reading.join('\n\n'),'');
   workbook.questions.forEach(({prompt,feedback},index)=>lines.push(`${index+1}. ${prompt}`,`   - ${feedback}`));
  }
 }
 lines.push('','## Provider review');
 courses.providerChecklist.forEach(text=>lines.push(`- [ ] ${text}`));
 courses.forms.forEach(({title,fields})=>{
  lines.push('',`### ${title}`);
  fields.forEach(field=>lines.push(`- ${field} __________________`));
 });
 lines.push('','## Sources',`MouldMaster pack ${courses.version}, sources checked ${courses.checked}`);
 courseSources(pathway,pack).forEach(({title,url})=>lines.push(`- [${title}](${url})`));
 const url=URL.createObjectURL(new Blob([lines.join('\n')+'\n'],{type:'text/markdown;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download=`mouldmaster-${id}-assessor-draft.md`;
 document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),0);
}
function pathwayHtml(e,p){
 const chapters=p.bookChapterIds.map(moduleButton).join('');
 const outcomes=(p.studyOutcomes||[]).map(x=>'<li>'+esc(x)+'</li>').join('');
 const gates=(p.formalRequirements||[]).map(x=>'<li>'+esc(x)+'</li>').join('');
 const sourceLinks=[p.source,...(p.additionalSources||[])].map(({title,url})=>
  `<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a></li>`).join('');
 return `<article class="mm-readiness-card" data-education-pathway="${esc(p.id)}">
  <span class="eyebrow">${esc(p.nation)} · ${esc(p.frameworkRef)}</span><h3>${esc(p.title)}</h3>
  <div class="mm-readiness-badges"><span class="mm-readiness-badge">${esc(p.level)}</span><span class="mm-readiness-badge">${esc(p.status)}</span><span class="mm-readiness-badge">${esc(p.duration)}</span></div>
  <p>${esc(p.scopeNote)}</p>${modulesHtml(p)}
  <h4>What to study</h4><ul>${outcomes}</ul>
  <h4>Open mapped Book modules</h4><div class="mm-readiness-badges">${chapters}</div>
  <h4>Formative practice</h4><ul>${activitiesHtml(e,p)}</ul>
  <button type="button" class="ghost" data-education-practice>Open Practice in the app</button>
  ${courseHtml(p)}
  <h4>Provider or workplace requirements</h4><ul>${gates}</ul>
  <h4>Official sources</h4><ul>${sourceLinks}</ul>
 </article>`;
}
function educationHtml(e){
 const tabs=e.regionTabs.map(({id,label})=>
  `<button type="button" class="ghost" data-education-region="${esc(id)}" aria-controls="mmEducationPathways" aria-pressed="${id===activeRegion}">${esc(label)}</button>`).join('');
 return `<section class="card">
  <span class="eyebrow">Framework sources checked ${esc(e.checked)}</span><h2>Regional study pathways</h2>
  <p>Choose a region to see Book readings, app practice and provider requirements. The UK has separate pathways for each nation.</p>
  <p class="mm-readiness-boundary">${esc(e.claimBoundary)}</p>
  <div class="mm-readiness-badges" role="group" aria-label="Choose education pathway region">${tabs}</div>
 </section><section id="mmEducationPathways" class="mm-readiness-grid" aria-label="Study pathways in the selected region"></section>`;
}
function renderEducationRegion(){
 for(const button of view.querySelectorAll('[data-education-region]')){
  const selected=button.dataset.educationRegion===activeRegion;
  button.setAttribute('aria-pressed',String(selected));
  button.classList.toggle('secondary',selected);
  button.classList.toggle('ghost',!selected);
 }
 const education=data.education;
 view.querySelector('#mmEducationPathways').innerHTML=education.pathways.filter(p=>p.region===activeRegion)
  .map(p=>pathwayHtml(education,p)).join('');
}
function ensureView(){
 if(view)return view;
 style();const main=document.querySelector('#mainContent,.main,main');if(!main)return null;
 view=document.createElement('section');view.id='mmStandardsReadinessView';view.className='view hidden mm-readiness-view';view.innerHTML='<section class="card"><span class="eyebrow">Governed support layer</span><h2>Standards & readiness</h2><p>Loading current governed support contracts…</p></section>';
 view.addEventListener('click',event=>{
  const regionButton=event.target.closest('[data-education-region]');
  if(regionButton){
   activeRegion=regionButton.dataset.educationRegion;
   renderEducationRegion();
   return;
  }
  const moduleButton=event.target.closest('[data-education-book-module]');
  if(moduleButton){
   void window.MMBook?.openChapter(moduleButton.dataset.educationBookModule);
   return;
  }
  const lessonButton=event.target.closest('[data-education-lesson]');
  if(lessonButton){
   window.goLesson?.(Number(lessonButton.dataset.educationLesson));
   window.switchView?.('lesson');
   return;
  }
  const workbookButton=event.target.closest('[data-education-workbook]');
  if(workbookButton){
   const workbook=[...workbookButton.closest('[data-education-course]').querySelectorAll('[data-education-exercise]')]
    .find(item=>item.dataset.educationExercise===workbookButton.dataset.educationWorkbook);
   if(workbook){workbook.open=true;workbook.querySelector('summary').focus();}
   return;
  }
  const download=event.target.closest('[data-education-download]');
  if(download){downloadCoursePack(download.dataset.educationDownload);return;}
  if(event.target.closest('[data-education-practice]'))window.switchView?.('scenarios');
 });
 main.appendChild(view);return view;
}
function render(){
 const root=ensureView();if(!root||!data)return;
 root.innerHTML='<section class="card"><span class="eyebrow">Governed support layer</span><h2>Standards & readiness</h2><p>Use these surfaces to understand evidence and provider-readiness boundaries. They do not create certification, accreditation, consent, competence or production authority.</p></section>'+
 educationHtml(data.education)+'<section class="mm-readiness-grid">'+qmsHtml(data.qms)+nzqaHtml(data.nzqa)+'</section>';
 renderEducationRegion();
}
function open(region,courseId){
 if(EDUCATION_DATA.regionTabs.some(tab=>tab.id===region))activeRegion=region;
 const root=ensureView();if(!root)return;
 window.MMBook?.prepareRouteExit?.('standards-readiness');
 render();document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));root.classList.remove('hidden');
 const title=document.getElementById('pageTitle'),sub=document.getElementById('pageSubtitle');if(title)title.textContent='Standards & readiness';if(sub)sub.textContent='New Zealand, UK nation-specific, and India study pathways';
 window.MM_APP_SHELL?.navigation?.setCustomActive?.('standards-readiness','more');
 root.closest('.main')?.scrollTo({top:0,behavior:'instant'});
 window.scrollTo({top:0,behavior:'instant'});
 const heading=root.querySelector('h2');
 if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
 const course=[...root.querySelectorAll('[data-education-course]')].find(item=>item.dataset.educationCourse===courseId);
 if(course){course.open=true;course.querySelector('summary').focus();}
}
function install(){
 const shell=window.MM_APP_SHELL;if(!shell?.navigation?.register)return false;
 if(!navDispose)navDispose=shell.navigation.register({id:'standards-readiness',label:'Standards & readiness',icon:'§',description:'ISO 9001 support and NZQA provider-readiness boundaries.',order:55,group:'progress',mobileGroup:'more',action:()=>open()});
 return true;
}
function mountBookPathwayLink(){
 const guide=document.querySelector('#mmBookView .mm-book-contents-guide');
 if(!data||!guide||guide.querySelector('[data-mm-book-education-pathways]'))return;
 const link=document.createElement('button');
 link.type='button';
 link.className='ghost';
 link.dataset.mmBookEducationPathways='1';
 link.textContent='Regional study pathways: NZ, UK and India';
 link.addEventListener('click',()=>open());
 guide.querySelector('summary').after(link);
 if(data.courses){
  const supplements=document.createElement('details');
  supplements.className='mm-book-reader-guide mm-reading-guide';
  supplements.dataset.mmBookEducationSupplements='1';
  supplements.innerHTML=`<summary>Course workbooks and practice</summary><p>${esc(data.courses.boundary)}</p>
   <ul>${EDUCATION_DATA.pathways.map(pathway=>`<li><button type="button" class="ghost" data-education-course-link="${esc(pathway.id)}">${esc(pathway.nation)} · ${esc(pathway.level)}</button></li>`).join('')}</ul>
   ${Object.entries(data.courses.exercises).map(([id,exercise])=>exerciseHtml(id,exercise)).join('')}`;
  supplements.addEventListener('click',event=>{
   const button=event.target.closest('[data-education-course-link]');
   if(!button)return;
   const pathway=EDUCATION_DATA.pathways.find(item=>item.id===button.dataset.educationCourseLink);
   if(pathway)open(pathway.region,pathway.id);
  });
  link.after(supplements);
 }
}
async function init(){
 ensureView();
 try{
  const [qms,nzqa,courses]=await Promise.all([getJson(QMS),getJson(NZQA),getJson(COURSE_PACKS).then(courseData).catch(()=>null)]);
  if(qms?.id!=='mouldmaster-iso9001-qms-support'||nzqa?.id!=='mouldmaster-nzqa-education-readiness'||EDUCATION_DATA?.id!=='mouldmaster-regional-education-pathways')throw new Error('readiness contract identity mismatch');
  data=Object.freeze({qms,nzqa,courses,education:EDUCATION_DATA});render();mountBookPathwayLink();
 }catch(e){if(view)view.innerHTML='<section class="card"><h2>Standards & readiness unavailable</h2><p>The governed support contracts could not be verified or loaded. No compliance or approval status should be inferred.</p></section>';console.error('[MouldMaster readiness]',e);}
 install();
}
window.addEventListener('mm:book-manifest-ready',mountBookPathwayLink);
if(!install())window.addEventListener('mm:domains-ready',install,{once:true});
window.MM_STANDARDS_READINESS=Object.freeze({version:VERSION,open,getData:()=>data});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
