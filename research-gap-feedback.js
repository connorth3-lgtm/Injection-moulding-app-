/* MouldMaster local research-gap feedback — 2026.09.02.1 */
(function(){
'use strict';
const VERSION='2026.09.02.1',KEY='mm_research_gap_feedback_v1',MAX=80;
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}}
function write(rows){try{localStorage.setItem(KEY,JSON.stringify(rows.slice(-MAX)))}catch(_){}}
function add(input){const x=input&&typeof input==='object'?input:{};const allowedReason=['no-match','low-applicability','conflicting-evidence','missing-measurement','unresolved-case'];const reason=allowedReason.includes(x.reason)?x.reason:'unresolved-case';const row={reason,mechanismId:String(x.mechanismId||'').slice(0,80)||null,materialFamily:String(x.materialFamily||'').slice(0,60)||null,processFamily:String(x.processFamily||'').slice(0,60)||null,neededSignal:String(x.neededSignal||'').slice(0,80)||null};const rows=read();rows.push(row);write(rows);return row}
function summary(){const rows=read(),byReason={},byMechanism={},neededSignals={};for(const r of rows){byReason[r.reason]=(byReason[r.reason]||0)+1;if(r.mechanismId)byMechanism[r.mechanismId]=(byMechanism[r.mechanismId]||0)+1;if(r.neededSignal)neededSignals[r.neededSignal]=(neededSignals[r.neededSignal]||0)+1}return {version:VERSION,count:rows.length,byReason,byMechanism,neededSignals,boundary:'Local-only research-gap categories. No free text, raw process data, user identity, exact timestamps or production identifiers are stored.'}}
function clear(){try{localStorage.removeItem(KEY)}catch(_){}}
window.MM_RESEARCH_GAPS={version:VERSION,add,summary,clear};
})();
