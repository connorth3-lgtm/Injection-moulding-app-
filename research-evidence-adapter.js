/* MouldMaster shared research evidence adapter — 2026.09.02.1 */
(function(){
'use strict';
const VERSION='2026.09.02.1';
function fromMeasuredEvidence(text,limit=4){const e=window.MM_RESEARCH_EVIDENCE;return e?e.retrieve({text},limit):[]}
function fromDiagnosticCase(ds,guide,limit=4){const signals=Object.keys(ds?.signals||{}),text=[ds?.title,ds?.description,guide?.signal,guide?.diagnosis,guide?.next].filter(Boolean).join(' ');const e=window.MM_RESEARCH_EVIDENCE;return e?e.retrieve({text,signals},limit):[]}
function fromLesson(row,limit=3){const text=[row?.title,row?.courseName,row?.summary,row?.description].filter(Boolean).join(' ');const e=window.MM_RESEARCH_EVIDENCE;return e?e.retrieve({text},limit):[]}
function fromProcessIntake(profile,limit=5){const e=window.MM_RESEARCH_EVIDENCE;if(!e)return[];const p=profile&&typeof profile==='object'?profile:{};return e.retrieve({text:[p.title,p.notes].filter(Boolean).join(' '),materials:[p.material,p.materialFamily].filter(Boolean),process:[p.processFamily].filter(Boolean),tooling:[p.mould,p.mold,p.tool].filter(Boolean),signals:Array.isArray(p.signals)?p.signals:[],outcomes:Array.isArray(p.outcomes)?p.outcomes:[]},limit)}
window.MM_RESEARCH_ADAPTER={version:VERSION,fromMeasuredEvidence,fromDiagnosticCase,fromLesson,fromProcessIntake};
})();
