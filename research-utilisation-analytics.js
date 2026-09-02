/* MouldMaster privacy-preserving research utilisation analytics — 2026.09.02.1 */
(function(){
'use strict';
const VERSION='2026.09.02.1',KEY='mm_research_utilisation_v1',MAX=180;
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}}
function write(rows){try{localStorage.setItem(KEY,JSON.stringify(rows.slice(-MAX)))}catch(_){}}
function record(type,meta){
  const allowed=['evidence_shown','verification_opened','mechanism_selected','no_match'];if(!allowed.includes(type))return;
  const m=meta&&typeof meta==='object'?meta:{};
  const row={type,mechanismId:String(m.mechanismId||'').slice(0,80)||null,applicability:['high','moderate','low','unknown'].includes(m.applicability)?m.applicability:null,surface:String(m.surface||'').slice(0,40)||null};
  const rows=read();rows.push(row);write(rows);
}
function summary(){const rows=read(),byType={},byMechanism={},byApplicability={};for(const r of rows){byType[r.type]=(byType[r.type]||0)+1;if(r.mechanismId)byMechanism[r.mechanismId]=(byMechanism[r.mechanismId]||0)+1;if(r.applicability)byApplicability[r.applicability]=(byApplicability[r.applicability]||0)+1}return {version:VERSION,eventCount:rows.length,byType,byMechanism,byApplicability,boundary:'Local-only bounded counters. No free text, raw process data, user identity, URLs or exact timestamps are stored.'}}
function clear(){try{localStorage.removeItem(KEY)}catch(_){}}
window.MM_RESEARCH_UTILISATION={version:VERSION,record,summary,clear,scope:'Local-only research-use telemetry; bounded categorical events only.'};
})();
