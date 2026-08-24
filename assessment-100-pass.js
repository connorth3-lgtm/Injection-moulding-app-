/* MouldMaster 100-pass data and assessment audit metadata — 2026-08-24 */
(function(){
'use strict';
const D=window.MM_DATA;
if(!D)throw new Error('MouldMaster core data must load before assessment audit metadata');
D.assessmentQA=D.assessmentQA||{};
D.assessmentQA.reviewed='24 August 2026';
D.assessmentQA.auditVersion='100-pass full data and assessment audit';
D.assessmentQA.scope='12 courses, 120 lessons, 12 core defect records, 30 technical exam items, 27 UK/US/NZ regional safety/compliance items, 16 scenario drills, answer keys, rationales, distractor feedback, source links, option shuffling, certification logic and release shipping integrity.';
D.assessmentQA.deepAudit={
  passCount:100,
  auditDate:'24 August 2026',
  technicalQuestions:30,
  regionalQuestions:27,
  totalExamQuestions:57,
  baseScenarios:8,
  addedScenarios:8,
  scenarioDrills:16,
  rules:[
    'One defensible best answer per exam item.',
    'Every regional exam item remains safety-critical.',
    'Runtime option shuffling must preserve the keyed correct answer and its feedback.',
    'A certificate requires at least 80% overall and zero wrong safety-critical regional answers.',
    'Wrong options are assessment distractors, not production or safety instructions.',
    'No assessment teaches a universal resin or machine setpoint as a production rule.',
    'Technical rationales must state mechanism/evidence rather than trial-and-error recipes.',
    'Jurisdiction-specific items must cite the governing regulator, legislation or standards source.',
    'Current law and future commencement dates must be kept separate.',
    'Reference/research layers must not alter live exam questions or answer keys.'
  ],
  sourceStatus:{
    iso20430:'ISO 20430:2020 is published and at ISO stage 90.93 (confirmed; systematic review closed in 2025).',
    bsi20430:'BS EN ISO 20430:2020 is listed by BSI as Current, Under Review.',
    b151:'PLASTICS lists ANSI/PLASTICS B151.1-2017 as published and an active project being reviewed to align with ISO 20430.',
    nzAmendment:'New Zealand Health and Safety at Work Amendment Act 2026 was assented on 9 July 2026 and section 2 sets commencement for 1 April 2027.'
  }
};
D.assessmentQA.passes100='Executable checks are maintained in qa_100_pass.py and documented in sources/ASSESSMENT_AND_DATA_100_PASS_AUDIT.md.';
window.MM_ASSESSMENT_AUDIT_100={version:'2026-08-24',passCount:100,examQuestions:57,scenarioDrills:16};
})();
