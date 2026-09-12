from pathlib import Path

path=Path('data-integration-runtime.js')
text=path.read_text(encoding='utf-8')
anchor="function ensureStyle(){"
if text.count(anchor)!=1:
    raise SystemExit(f'readiness helper anchor count was {text.count(anchor)}, expected 1')
helper='''function readinessHtml(p){
  const labels=['Import','Validate structure','Privacy preparation','Define semantics','Check coverage','Analyse'];
  if(!p)return `<div class="di-readiness-flow">${labels.map((label,i)=>`<div class="di-readiness-step ${i===0?'current':'locked'}"><b>${i+1} · ${esc(label)}</b><small>${i===0?'Choose a local CSV to begin.':'Waiting for the previous readiness step.'}</small></div>`).join('')}</div><div class="di-empty" style="margin-top:10px">Analysis stays locked until source integrity, privacy preparation and channel semantics are ready.</div>`;
  const issues=p.quality?.issues||[],blocking=issues.filter(x=>x.level==='block'),warnings=issues.filter(x=>x.level==='warn');
  const semanticBlocks=Object.values(p.semantics||{}).filter(s=>(s.blockers||[]).length).length;
  const sourceBlocks=blocking.filter(x=>['prepared-data-review','sequence-review','non-numeric-values'].includes(x.code)).length;
  const privacyRules=Array.isArray(p.rules)?p.rules:[],privacyActions=privacyRules.filter(x=>['drop','alias','keep','quality','category','unit'].includes(x.action)).length;
  const coverageState=sourceBlocks?'blocked':warnings.length?'review':'done';
  const steps=[
    {label:labels[0],state:'done',detail:`${p.summary?.outputRows||0} prepared rows loaded locally.`},
    {label:labels[1],state:sourceBlocks?'blocked':'done',detail:sourceBlocks?`${sourceBlocks} source-integrity blocker${sourceBlocks===1?'':'s'} must be resolved.`:'CSV structure, sequence and retained numeric values passed blocking checks.'},
    {label:labels[2],state:privacyActions?'done':'blocked',detail:privacyActions?`${privacyActions} keep/alias/drop preparation decisions applied locally.`:'Privacy preparation decisions are unavailable.'},
    {label:labels[3],state:semanticBlocks?'blocked':'done',detail:semanticBlocks?`${semanticBlocks} channel${semanticBlocks===1?'':'s'} still need meaning, role, unit or sampling basis.`:'All retained numeric channels have resolved semantics.'},
    {label:labels[4],state:coverageState,detail:sourceBlocks?'Coverage cannot be trusted until source blockers are resolved.':warnings.length?`${warnings.length} coverage/variation warning${warnings.length===1?'':'s'} to review; warnings do not unlock blocked semantics.`:'No blocking coverage or variation issue detected.'},
    {label:labels[5],state:p.quality?.analysisReady?'ready':'locked',detail:p.quality?.analysisReady?'Analysis-ready: baseline and process-intelligence tools may be used.':`${blocking.length} blocker${blocking.length===1?'':'s'} keep analysis locked.`}
  ];
  return `<div class="di-readiness-flow">${steps.map((step,i)=>`<div class="di-readiness-step ${esc(step.state)}"><b>${i+1} · ${esc(step.label)}</b><small>${esc(step.detail)}</small></div>`).join('')}</div><div class="di-kpis"><div class="di-kpi"><b>${p.summary?.outputRows||0}</b><small>rows</small></div><div class="di-kpi"><b>${p.summary?.keptNumeric||0}</b><small>numeric channels</small></div><div class="di-kpi"><b>${p.quality?.blockingCount||0}</b><small>blockers</small></div><div class="di-kpi"><b>${p.quality?.analysisReady?'READY':'BLOCKED'}</b><small>analysis state</small></div></div>${issuesHtml(p)}`;
}
'''
text=text.replace(anchor,helper+anchor,1)
old=".di-hero,.di-panel{padding:18px}.di-actions{display:flex;gap:8px;flex-wrap:wrap}.di-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.di-note"
new=".di-hero,.di-panel{padding:18px}.di-actions{display:flex;gap:8px;flex-wrap:wrap}.di-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.di-readiness-flow{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;margin:10px 0}.di-readiness-step{padding:9px;border:1px solid #304b69;border-radius:9px;background:#0e1d31;min-height:78px}.di-readiness-step b{display:block;font-size:11px;margin-bottom:5px}.di-readiness-step small{display:block;color:var(--muted);line-height:1.35}.di-readiness-step.done,.di-readiness-step.ready{border-color:#355a55;background:#102824}.di-readiness-step.review{border-color:#786129;background:#2a2414}.di-readiness-step.blocked{border-color:#7b3e4a;background:#2b171d}.di-readiness-step.locked{opacity:.72}.di-readiness-step.current{border-color:#4f78a7;background:#10243a}.di-note"
if text.count(old)!=1:
    raise SystemExit(f'readiness CSS anchor count was {text.count(old)}, expected 1')
text=text.replace(old,new,1)
old_media="@media(max-width:1100px){.di-sem-row{grid-template-columns:1fr 1fr 1fr}.di-grid{grid-template-columns:1fr}}@media(max-width:650px){.di-kpis,.di-meta,.di-sem-row{grid-template-columns:1fr}.di-actions button,.di-actions label{width:100%}}"
new_media="@media(max-width:1100px){.di-sem-row{grid-template-columns:1fr 1fr 1fr}.di-grid{grid-template-columns:1fr}.di-readiness-flow{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:650px){.di-kpis,.di-meta,.di-sem-row,.di-readiness-flow{grid-template-columns:1fr}.di-actions button,.di-actions label{width:100%}.di-readiness-step{min-height:0}}"
if text.count(old_media)!=1:
    raise SystemExit(f'readiness media anchor count was {text.count(old_media)}, expected 1')
text=text.replace(old_media,new_media,1)
old_ready="<section class=\"card di-panel\"><h3>Readiness</h3>${prepared?`<div class=\"di-kpis\"><div class=\"di-kpi\"><b>${prepared.summary.outputRows}</b><small>rows</small></div><div class=\"di-kpi\"><b>${prepared.summary.keptNumeric}</b><small>numeric channels</small></div><div class=\"di-kpi\"><b>${prepared.quality.blockingCount}</b><small>blockers</small></div><div class=\"di-kpi\"><b>${ready?'READY':'BLOCKED'}</b><small>analysis state</small></div></div>${issuesHtml(prepared)}`:'<div class=\"di-empty\">Choose a CSV. MouldMaster will strip/alias sensitive fields, profile numeric channels and require semantic declarations before process intelligence.</div>'}</section>"
new_ready="<section class=\"card di-panel\"><h3>Data readiness</h3>${readinessHtml(prepared)}</section>"
if text.count(old_ready)!=1:
    raise SystemExit(f'readiness panel anchor count was {text.count(old_ready)}, expected 1')
text=text.replace(old_ready,new_ready,1)
path.write_text(text,encoding='utf-8')

qa=Path('qa_data_integration.py')
q=qa.read_text(encoding='utf-8')
marker='        "current-data-manifest.json",\n'
insertion=marker+'        "function readinessHtml(p)",\n        "Validate structure",\n        "Privacy preparation",\n        "Define semantics",\n        "Check coverage",\n        "Analysis-ready: baseline and process-intelligence tools may be used.",\n'
if q.count(marker)!=1:
    raise SystemExit(f'QA marker count was {q.count(marker)}, expected 1')
qa.write_text(q.replace(marker,insertion,1),encoding='utf-8')
