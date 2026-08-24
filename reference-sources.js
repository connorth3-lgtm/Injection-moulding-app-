/* MouldMaster Reference Source Browser — 2026.08.24.1 */
(function(){
'use strict';

const EXTRA={
 tooling:[
  ['Autodesk Moldflow — Gate location','Background on gate location and filling-pattern effects.','https://help.autodesk.com/view/MFIA/2024/ENU/?guid=GUID-1B2EE66F-2CE9-4D8B-90F2-574CB1323C95'],
  ['Autodesk Moldflow — Venting','Background on air traps, gas escape and venting during filling.','https://help.autodesk.com/view/MFIA/2024/ENU/?guid=GUID-0DFCC678-6C19-4DA5-B87D-ED3BECE9FD45'],
  ['Autodesk Moldflow — Weld lines','Flow-front meeting and weld-line formation background.','https://help.autodesk.com/view/MFIA/2024/ENU/?guid=GUID-D3A8237E-C17D-407C-A0A6-825A8DFA382E'],
  ['Autodesk Moldflow — Warpage','Simulation background on differential shrinkage, orientation and warpage.','https://help.autodesk.com/view/MFIA/2024/ENU/?guid=GUID-9E539E26-4147-45C4-A465-A6F54C7406B2'],
  ['Autodesk Moldflow — Cooling system','Cooling-channel and mould-temperature analysis background.','https://help.autodesk.com/view/MFIA/2024/ENU/?guid=GUID-78801D59-60CE-4B82-A3D6-66FB2D15C54A']
 ],
 machine:[
  ['ISO 20430:2020','Safety requirements for injection moulding machines and machine/tool interfaces.','https://www.iso.org/standard/68000.html'],
  ['HSE PPIS4(rev1)','Safety at injection moulding machines, including guarding and access.','https://www.hse.gov.uk/pubns/ppis4.pdf'],
  ['OSHA Injection Molding eTool','Machine components, hazards, guarding and safe operation context.','https://www.osha.gov/etools/machine-guarding/plastics-machinery/horizontal-injection-molding-machines'],
  ['Kistler — Cavity pressure monitoring','Technical background on cavity-pressure measurement and process monitoring.','https://www.kistler.com/INT/en/cavity-pressure-sensors-for-injection-molding/C00000006'],
  ['RJG — Scientific molding resources','Technical learning resources on process development, cavity pressure and machine-independent thinking.','https://rjginc.com/resources/']
 ],
 quality:[
  ['NIST Engineering Statistics Handbook','SPC, capability, measurement and DOE reference.','https://www.itl.nist.gov/div898/handbook/'],
  ['NIST — Process capability','Capability indices, assumptions and interpretation prerequisites.','https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm'],
  ['NIST — Control charts','Statistical process monitoring and control-chart background.','https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc3.htm'],
  ['NIST — Measurement process characterization','Measurement-system and uncertainty concepts.','https://www.itl.nist.gov/div898/handbook/mpc/mpc.htm'],
  ['NIST — Experimental design','DOE principles including randomisation, blocking and interactions.','https://www.itl.nist.gov/div898/handbook/pri/section1/pri13.htm'],
  ['ISO 22514-2:2026','Process capability and performance for time-dependent process models.','https://www.iso.org/standard/88883.html'],
  ['ISO 22514-7:2021','Capability of measurement processes. Confirm current edition/status before formal contractual use.','https://www.iso.org/standard/80624.html']
 ],
 polymers:[
  ['ISO 1133-1:2022','MFR/MVR determination for thermoplastics under specified test conditions.','https://www.iso.org/standard/83905.html'],
  ['ASTM D1238','Melt flow rates of thermoplastics by extrusion plastometer.','https://store.astm.org/standards/d1238'],
  ['ISO 294-1:2017','General principles for injection moulding thermoplastic test specimens.','https://www.iso.org/standard/67036.html'],
  ['Trotta et al. (2021), Polymer Testing','Injection-moulding rheology and high-shear behaviour.','https://doi.org/10.1016/j.polymertesting.2021.107068'],
  ['Hu et al. (2022), Polymers','Cooling-rate effects on polypropylene crystallisation.','https://doi.org/10.3390/polym14173646'],
  ['Covestro — Drying for injection moulding','Manufacturer technical background on drying and moisture-sensitive polymers.','https://solutions.covestro.com/-/media/covestro/solution-center/whitepapers/injection-molding-of-high-quality-molded-parts-drying.pdf']
 ],
 defects:[
  ['Zhao et al. (2022)','Review of shrinkage, warpage and interacting injection-moulding process parameters.','https://pubmed.ncbi.nlm.nih.gov/35194289/'],
  ['Autodesk Moldflow — Cooling stage','Cooling, heat removal and solidification background.','https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Ref-Materials/files/glossary-of-terminology/MoldflowInsight_CLC_Ref_Materials_glossary_of_terminology_Cooling_stage_html.html'],
  ['Autodesk Moldflow — Packing guidance','Packing, holding and gate-freeze background.','https://help.autodesk.com/view/MOLDFLOW/2013/ENU/caas.html?url=caas%2Fvhelp%2Fhelp-dev-autodesk-com%2Fv%2FSimulation-Moldflow%2Fenu%2F2013%2FHelp%2F3Insight-360%2F3927-Process-3927%2F3933-Profiles3933%2F3945-Packing-3945.html'],
  ['HSE PPIS13(rev1)','Control of fumes during plastics processing; relevant when thermal degradation or fumes are suspected.','https://www.hse.gov.uk/pubns/ppis13.pdf']
 ],
 sensors:[
  ['Araújo et al. (2023)','In-cavity pressure measurement for injection-moulding diagnosis and simulation correlation.','https://link.springer.com/article/10.1007/s00170-023-11100-1'],
  ['Párizs et al. (2023)','Multiple in-mould sensors for quality and process control.','https://pmc.ncbi.nlm.nih.gov/articles/PMC9920048/'],
  ['Kovács et al. (2019)','Review of in-mould sensors for injection moulding and Industry 4.0.','https://pubmed.ncbi.nlm.nih.gov/31443164/'],
  ['Weinert et al. (2023)','Condition monitoring of injection-mould tooling.','https://pmc.ncbi.nlm.nih.gov/articles/PMC9966701/']
 ],
 safety:[
  ['ISO 20430:2020','Injection moulding machine safety requirements.','https://www.iso.org/standard/68000.html'],
  ['HSE — Plastics industry guidance','UK plastics-processing safety guidance index.','https://www.hse.gov.uk/pubns/plasindx.htm'],
  ['HSE PPIS4(rev1)','Safety at injection moulding machines.','https://www.hse.gov.uk/pubns/ppis4.pdf'],
  ['HSE PPIS13(rev1)','Controlling fume during plastics processing.','https://www.hse.gov.uk/pubns/ppis13.pdf'],
  ['OSHA 1910.212','General machine guarding.','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.212'],
  ['OSHA 1910.147','Control of hazardous energy (lockout/tagout).','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147'],
  ['OSHA 1910.1200','Hazard Communication standard.','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1200'],
  ['WorkSafe NZ — Safe use of machinery','NZ machinery risk-management and safeguarding guidance.','https://www.worksafe.govt.nz/topic-and-industry/machinery/safe-use-of-machinery/'],
  ['WorkSafe NZ — Machine lockouts','NZ de-energisation and machine lockout guidance.','https://www.worksafe.govt.nz/topic-and-industry/machinery/keeping-workers-safe-with-machine-lockouts/']
 ],
 law:[
  ['UK — PUWER 1998','Official Provision and Use of Work Equipment Regulations 1998.','https://www.legislation.gov.uk/uksi/1998/2306/contents'],
  ['UK — COSHH 2002','Official Control of Substances Hazardous to Health Regulations 2002.','https://www.legislation.gov.uk/uksi/2002/2677/contents'],
  ['NZ — Health and Safety at Work Act 2015','Official NZ legislation source for PCBU duties and SFAIRP framework.','https://www.legislation.govt.nz/act/public/2015/70/en/latest/']
 ]
};

function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));}
function merge(){
  const base=window.MM_SOURCE_LIBRARY||{};
  const out={};
  for(const [cat,rows] of Object.entries({...base,...EXTRA})){
    const joined=[...(base[cat]||[]),...(EXTRA[cat]||[])];
    const seen=new Set();
    out[cat]=joined.filter(x=>{const k=x[2];if(seen.has(k))return false;seen.add(k);return true});
  }
  return out;
}
function ensure(){
  if(!document.body||document.getElementById('mm-src-open'))return;
  const SOURCES=merge();
  window.MM_REFERENCE_SOURCES=SOURCES;
  const style=document.createElement('style');
  style.textContent=`#mm-src-open{position:fixed;left:14px;bottom:58px;z-index:2147483000;border:1px solid #41658d;background:#13243a;color:#eef7ff;border-radius:999px;padding:10px 14px;font:700 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.3);cursor:pointer}.mmsrc{position:fixed;inset:0;z-index:2147483002;background:rgba(2,8,18,.86);display:none;align-items:center;justify-content:center;padding:14px;color:#eef7ff;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}.mmsrc[data-open="1"]{display:flex}.mmsrc-panel{width:min(980px,100%);max-height:min(88vh,900px);overflow:hidden;background:#0e1a2c;border:1px solid #304866;border-radius:18px;display:flex;flex-direction:column}.mmsrc-head{padding:18px;border-bottom:1px solid #253a54}.mmsrc-top{display:flex;gap:12px;justify-content:space-between;align-items:flex-start}.mmsrc h2{margin:0;font-size:22px}.mmsrc p{color:#b8c9dc;line-height:1.45}.mmsrc-close{border:1px solid #49627e;background:#172941;color:#fff;border-radius:9px;padding:8px 11px;cursor:pointer}.mmsrc-search{width:100%;border:1px solid #3a5471;background:#081423;color:#fff;border-radius:10px;padding:10px 12px;margin-top:12px}.mmsrc-body{overflow:auto;padding:14px 18px 24px}.mmsrc-section{margin:0 0 20px}.mmsrc-section h3{margin:0 0 8px;text-transform:capitalize}.mmsrc-link{display:block;border:1px solid #2b405b;background:#111f32;border-radius:10px;padding:11px 12px;margin:7px 0;color:#eaf4ff;text-decoration:none}.mmsrc-link small{display:block;color:#a9bdd6;margin-top:4px;line-height:1.4}.mmsrc-link em{display:block;color:#72e6cd;margin-top:5px;font-size:12px}.mmsrc-note{border-left:3px solid #55d6be;background:#10283a;padding:10px 12px;font-size:12px}.mmsrc-count{font-size:12px;color:#9fb5cf}.mmsrc button:focus-visible,.mmsrc input:focus-visible,#mm-src-open:focus-visible{outline:3px solid #72e6cd;outline-offset:2px}@media(max-width:650px){.mmsrc{padding:0}.mmsrc-panel{height:100%;max-height:none;border-radius:0;border:0}.mmsrc-head{padding-top:max(14px,env(safe-area-inset-top))}}`;
  document.head.appendChild(style);
  const open=document.createElement('button');open.id='mm-src-open';open.type='button';open.textContent='References';open.setAttribute('aria-haspopup','dialog');
  const modal=document.createElement('div');modal.className='mmsrc';modal.dataset.open='0';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','MouldMaster references');
  modal.innerHTML=`<section class="mmsrc-panel"><header class="mmsrc-head"><div class="mmsrc-top"><div><h2>Authoritative References</h2><p>Full source library supporting the reference database and training explanations.</p></div><button class="mmsrc-close" type="button">Close</button></div><input class="mmsrc-search" type="search" aria-label="Search references" placeholder="Search standards, regulators, research…"></header><div class="mmsrc-body"><p class="mmsrc-note">References support mechanisms, terminology, test methods, safety duties and statistical principles. They do not create universal production setpoints. Supplier grade data, machine/tool documentation, approved procedures and current jurisdictional requirements remain controlling for specific production decisions.</p><p class="mmsrc-count"></p><div class="mmsrc-list"></div></div></section>`;
  document.body.append(open,modal);
  const search=modal.querySelector('.mmsrc-search'), list=modal.querySelector('.mmsrc-list'), count=modal.querySelector('.mmsrc-count');
  function render(){const q=search.value.trim().toLowerCase();let total=0,html='';for(const [cat,rows] of Object.entries(SOURCES)){const matches=rows.filter(x=>!q||x.join(' ').toLowerCase().includes(q));if(!matches.length)continue;total+=matches.length;html+=`<section class="mmsrc-section"><h3>${esc(cat)}</h3>${matches.map(x=>`<a class="mmsrc-link" href="${esc(x[2])}" target="_blank" rel="noopener"><b>${esc(x[0])}</b><small>${esc(x[1])}</small><em>Open source ↗</em></a>`).join('')}</section>`}count.textContent=`${total} reference${total===1?'':'s'} shown`;list.innerHTML=html||'<p>No matching references.</p>'}
  search.addEventListener('input',render);
  const close=()=>{modal.dataset.open='0';open.focus()};open.addEventListener('click',()=>{modal.dataset.open='1';render();setTimeout(()=>search.focus(),0)});modal.querySelector('.mmsrc-close').addEventListener('click',close);modal.addEventListener('click',e=>{if(e.target===modal)close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.dataset.open==='1')close()});render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
})();
