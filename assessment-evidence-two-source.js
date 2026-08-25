/* MouldMaster assessment evidence second-source hardening — 2026-08-26.1 */
(function(){
'use strict';
const E=window.MM_EVIDENCE_SOURCES;
if(!E)throw new Error('assessment-evidence-sources.js must load before second-source hardening');
const EXTRA={
 'nrv-wear-2023':{name:'Ma et al. (2023) — non-return valve wear and moulded-weight consistency',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1002/pen.26246'},
 'energy-review-2017':{name:'Zhang et al. (2017) — energy consumption in injection moulding',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/en10111768'},
 'hotrunner-manifold-2023':{name:'Jung & Kim (2023) — hot-runner manifold thermal deformation and leak risk',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/mi14071337'},
 'overmould-2023':{name:'Miao et al. (2023) — injection-overmoulding parameters and interface bond strength',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/polym15132879'},
 'thermal-degradation-1990':{name:'Injection-rate and melt-temperature effects on polypropylene degradation',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1016/0141-3910(90)90052-9'},
 'delrin-pom-molding':{name:'Delrin — Acetal Homopolymer Thermoplastic Resin Molding Guide',authority:'Delrin',kind:'resin-supplier technical guidance',url:'https://www.delrin.com/wp-content/uploads/2024/11/Delrin-Technical-Molding-Guide-NA-FNL.pdf'},
 'autodesk-clamp-modeling':{name:'Autodesk Moldflow — modeling for accurate clamp-force prediction',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/cloudhelp/2019/ENU/MoldflowInsight-Modelprep/files/GUID-5C97629F-C5C5-4A6D-BD2A-55FE6A4A5EE2.htm'},
 'hse-ppis4':{name:'HSE PPIS4(rev1) — Safety at injection moulding machines',authority:'UK HSE',kind:'regulator guidance',url:'https://www.hse.gov.uk/pubns/ppis4.pdf'},
 'osha-injection-etool':{name:'OSHA Injection Molding eTool',authority:'US OSHA',kind:'regulator guidance',url:'https://www.osha.gov/etools/machine-guarding/plastics-machinery/horizontal-injection-molding-machines'},
 'worksafe-safe-machinery':{name:'WorkSafe New Zealand — Safe use of machinery',authority:'WorkSafe New Zealand',kind:'regulator guidance',url:'https://www.worksafe.govt.nz/topic-and-industry/machinery/safe-use-of-machinery/'}
};
Object.assign(E.sources,EXTRA);
const baseInferred=E.inferred.bind(E);
function add(out,id){const s=E.sources[id];if(s&&!out.some(x=>x.url===s.url))out.push({id,...s})}
function inferred(text){
 const t=String(text||'').toLowerCase(),out=baseInferred(text).map(s=>({...s}));
 if(/check.ring|check ring|non.return|non-return|cushion|shot delivery|shot-delivery/.test(t))add(out,'nrv-wear-2023');
 if(/\bdoe\b|experiment|randomis|randomiz|blocking|factor|interaction|confirmation run|one.factor|confound/.test(t))add(out,'nist-handbook');
 if(/energy|kwh|specific energy|heater\/pump|heater.*pump|tcu duty|auxiliary energy|energy per/.test(t))add(out,'energy-review-2017');
 if(/hot.runner|hot runner|heater duty|manifold|hot-runner leak|hot runner leak/.test(t))add(out,'hotrunner-manifold-2023');
 if(/overmould|overmold|insert temperature|interface temperature|bond strength|peel strength|interface thermal/.test(t))add(out,'overmould-2023');
 if(/model drift|quality model|prediction error|training.domain|domain coverage|ground truth|vision model|model output/.test(t))add(out,'liew-2022');
 if(/\bpom\b|acetal|formaldehyde|polyoxymethylene|pvc contamination/.test(t))add(out,'delrin-pom-molding');
 if(/residence|degrad|black speck|purge|thermal history|long shutdown|standstill/.test(t))add(out,'thermal-degradation-1990');
 if(/clamp|projected area/.test(t))add(out,'autodesk-clamp-modeling');
 if(/\buk\b|united kingdom|puwer|coshh|\bhse\b|great britain/.test(t)){add(out,'hse-ppis4');add(out,'iso-20430')}
 if(/\bus\b|united states|\bosha\b/.test(t)){add(out,'osha-injection-etool');add(out,'iso-20430')}
 if(/\bnz\b|new zealand|worksafe|hswa|pcbu/.test(t)){add(out,'worksafe-safe-machinery');add(out,'iso-20430')}
 if(/guard|interlock|lockout|isolation|safety|danger zone|emergency stop/.test(t)){add(out,'iso-20430');add(out,'hse-ppis4')}
 return out.slice(0,6)
}
E.inferred=inferred;
E.version='2026.08.26.1';
E.secondSourcePolicy={version:'2026.08.26.1',minimumDistinctSources:2,extraSourceIds:Object.keys(EXTRA)};
})();
