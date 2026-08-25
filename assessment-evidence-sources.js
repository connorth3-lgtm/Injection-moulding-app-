/* MouldMaster assessment evidence sources — 2026-08-25.1 */
(function(){
'use strict';
const SOURCES={
 'autodesk-fill-pack':{name:'Autodesk Moldflow — injection / fill + pack process settings',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Analyses/files/molding-processes/injection-molding/Process-settings/MoldflowInsight_CLC_Analyses_molding_processes_injection_molding_Process_settings_Process_Settings_Wizard_1st_html.html'},
 'autodesk-packing':{name:'Autodesk Moldflow — packing guidance',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/view/MOLDFLOW/2013/ENU/caas.html?url=caas%2Fvhelp%2Fhelp-dev-autodesk-com%2Fv%2FSimulation-Moldflow%2Fenu%2F2013%2FHelp%2F3Insight-360%2F3927-Process-3927%2F3933-Profiles3933%2F3945-Packing-3945.html'},
 'autodesk-cooling':{name:'Autodesk Moldflow — cooling stage',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Ref-Materials/files/glossary-of-terminology/MoldflowInsight_CLC_Ref_Materials_glossary_of_terminology_Cooling_stage_html.html'},
 'autodesk-clamp':{name:'Autodesk Moldflow — clamp force result',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Results/files/Fill-or-flow-results/MoldflowInsight_CLC_Results_Fill_or_flow_results_Clamp_force_result_html.html'},
 'covestro-drying':{name:'Covestro — Drying for injection moulding',authority:'Covestro',kind:'resin-supplier technical guidance',url:'https://solutions.covestro.com/-/media/covestro/solution-center/whitepapers/injection-molding-of-high-quality-molded-parts-drying.pdf'},
 'iso-15512':{name:'ISO 15512:2019 — Plastics — Determination of water content',authority:'ISO',kind:'standard',url:'https://www.iso.org/standard/73834.html'},
 'iso-1133':{name:'ISO 1133-1:2022 — MFR/MVR',authority:'ISO',kind:'standard',url:'https://www.iso.org/standard/83905.html'},
 'iso-20430':{name:'ISO 20430:2020 — injection moulding machine safety requirements',authority:'ISO',kind:'standard',url:'https://www.iso.org/standard/68000.html'},
 'zhao-2022':{name:'Zhao et al. (2022) — injection-moulding shrinkage/warpage review',authority:'peer-reviewed research',kind:'research',url:'https://pubmed.ncbi.nlm.nih.gov/35194289/'},
 'trotta-2021':{name:'Trotta et al. (2021) — injection-moulding rheology and high-shear behaviour',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1016/j.polymertesting.2021.107068'},
 'jansen-1998':{name:'Jansen, Pantani & Titomanlio — holding time / gate-freeze evidence',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1002/pen.10186'},
 'liew-2022':{name:'Liew et al. (2022) — real-time moulding sensing and quality monitoring',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/s22134792'},
 'tsou-2023':{name:'Tsou et al. (2023) — oil/nozzle/cavity pressure correlation',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1515/ipp-2022-4281'},
 'araujo-2023':{name:'Araújo et al. (2023) — in-cavity pressure for failure diagnosis',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1007/s00170-023-11100-1'},
 'hotrunner-2024':{name:'Polymers (2024) — hot-runner thermal-control evidence',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/polym16081057'},
 'nist-capability':{name:'NIST/SEMATECH — Process capability',authority:'NIST',kind:'technical reference',url:'https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm'},
 'nist-doe':{name:'NIST/SEMATECH — Experimental design',authority:'NIST',kind:'technical reference',url:'https://www.itl.nist.gov/div898/handbook/pri/section1/pri13.htm'},
 'nist-handbook':{name:'NIST/SEMATECH Engineering Statistics Handbook',authority:'NIST',kind:'technical reference',url:'https://www.itl.nist.gov/div898/handbook/'}
};
function hash(s){let h=2166136261;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619)}return('00000000'+(h>>>0).toString(16)).slice(-8)}
function direct(reference,url){const u=String(url||'').trim();if(!/^https:\/\//i.test(u))return null;const known=Object.entries(SOURCES).find(([,s])=>s.url===u);if(known)return {id:known[0],...known[1]};return {id:'direct-'+hash(u),name:String(reference||'Direct cited source'),authority:'question-linked source',kind:u.startsWith('https://doi.org/')?'research':'direct source',url:u}}
function inferred(text){const t=String(text||'').toLowerCase(),ids=[];const add=(...x)=>x.forEach(id=>{if(SOURCES[id]&&!ids.includes(id))ids.push(id)});
 if(/capabil|\bcpk\b|\bcp\b|\bppk\b|\bpp\b|measurement|gauge|sampling/.test(t))add('nist-capability','nist-handbook');
 if(/\bdoe\b|experiment|randomis|randomiz|blocking|factor|interaction|confirmation run|one.factor/.test(t))add('nist-doe');
 if(/moisture|drying|dryer|hygroscopic|humid|splay|silver streak/.test(t))add('covestro-drying','iso-15512');
 if(/mfr|mvr|rheolog|viscos|shear|flow length|polypropylene grade/.test(t))add('trotta-2021','iso-1133');
 if(/cavity pressure|pressure trace|sensor|signal acquisition|pressure.time|pressure area/.test(t))add('araujo-2023','liew-2022','tsou-2023');
 if(/check.ring|non.return|cushion|shot delivery|shot-delivery/.test(t))add('liew-2022');
 if(/cool|warpage|shrink|ejection temperature|water.line|thermal balance|mould temperature|mold temperature/.test(t))add('zhao-2022','autodesk-cooling');
 if(/pack|hold|gate seal|gate.freeze|sink/.test(t))add('jansen-1998','autodesk-packing');
 if(/clamp|projected area|flash|parting.line/.test(t))add('autodesk-clamp','zhao-2022');
 if(/hot.runner|hot runner|heater duty|valve.gate|valve gate|manifold/.test(t))add('hotrunner-2024','zhao-2022');
 if(/residence|degrad|black speck|purge|thermal history/.test(t))add('trotta-2021');
 if(/v\/p|transfer|fill|short shot|pressure loss|runner|gate|vent|burn|weld|jet|flow front|mould|mold|tooling/.test(t))add('autodesk-fill-pack','zhao-2022');
 if(/setpoint|actual|machine transfer|receiving machine|different machine|process transfer|fill time/.test(t))add('liew-2022','autodesk-fill-pack');
 if(/guard|interlock|lockout|isolation|safety|robot|danger zone|emergency stop/.test(t))add('iso-20430');
 if(!ids.length)add('autodesk-fill-pack','zhao-2022');
 return ids.map(id=>({id,...SOURCES[id]})).slice(0,4)
}
window.MM_EVIDENCE_SOURCES={version:'2026.08.25.1',sources:SOURCES,direct,inferred,hash};
})();
