/* MouldMaster evidence maturity deep dive — 2026.08.26.2 */
(function(){
'use strict';
const VERSION='2026.08.26.2';
const REVIEWED='2026-08-26';
const REVIEW_BY='2026-11-26';
const E=window.MM_EVIDENCE_SOURCES;
if(!E)throw new Error('assessment-evidence-sources.js must load before evidence maturity deep dive');
const uniq=(arr,key='url')=>{const out=[];for(const x of arr||[]){if(!x||!x[key]||out.some(y=>y[key]===x[key]))continue;out.push(x)}return out};
const slug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,96);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

/* Independent evidence families added to improve triangulation rather than source-count inflation. */
const EXTRA_SOURCES={
 'nrv-wear-2023':{name:'Ma et al. (2023) — non-return valve wear and moulded-weight consistency',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1002/pen.26246'},
 'energy-review-2017':{name:'Zhang et al. (2017) — injection-moulding energy consumption review',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/en10111768'},
 'hotrunner-manifold-2023':{name:'Jung & Kim (2023) — hot-runner manifold thermal deformation and leak risk',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/mi14071337'},
 'overmould-2023':{name:'Miao et al. (2023) — overmoulding parameters and interface bond strength',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/polym15132879'},
 'thermal-degradation-1990':{name:'Injection-rate and melt-temperature effects on polypropylene degradation',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1016/0141-3910(90)90052-9'},
 'delrin-pom-molding':{name:'Delrin — Acetal Homopolymer Thermoplastic Resin Molding Guide',authority:'Delrin',kind:'resin-supplier technical guidance',url:'https://www.delrin.com/wp-content/uploads/2024/11/Delrin-Technical-Molding-Guide-NA-FNL.pdf'},
 'autodesk-clamp-modeling':{name:'Autodesk Moldflow — accurate clamp-force prediction modelling',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/cloudhelp/2019/ENU/MoldflowInsight-Modelprep/files/GUID-5C97629F-C5C5-4A6D-BD2A-55FE6A4A5EE2.htm'},
 'hse-ppis4':{name:'HSE PPIS4(rev1) — Safety at injection moulding machines',authority:'UK HSE',kind:'regulator guidance',url:'https://www.hse.gov.uk/pubns/ppis4.pdf'},
 'osha-injection-etool':{name:'OSHA Injection Molding eTool',authority:'US OSHA',kind:'regulator guidance',url:'https://www.osha.gov/etools/machine-guarding/plastics-machinery/horizontal-injection-molding-machines'},
 'worksafe-safe-machinery':{name:'WorkSafe New Zealand — Safe use of machinery',authority:'WorkSafe New Zealand',kind:'regulator guidance',url:'https://www.worksafe.govt.nz/topic-and-industry/machinery/safe-use-of-machinery/'},
 'doe-micro-2013':{name:'Optimisation of Micro Injection Moulding Process through Design of Experiments',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1016/j.procir.2013.09.052'},
 'adoe-2024':{name:'Kariminejad et al. (2024) — adaptive DOE for industrial injection moulding',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1038/s41598-024-80405-2'},
 'pbt-basf-guide':{name:'BASF — Ultradur PBT processing and hydrolysis guidance',authority:'BASF',kind:'resin-supplier technical guidance',url:'https://www.basf.com/dam/jcr%3A317242e5-51ed-3fa4-a7c8-c2849c92c8d2/basf/www/cn/documents/en/chinaplas/Ultradur_brochure.pdf'},
 'pbt-celanese':{name:'Celanese — Crastin/Celanex PBT family guidance',authority:'Celanese',kind:'resin-supplier product guidance',url:'https://www.celanese.com/products/crastin-celanex-pbt-pulybutylene-terephtalate'},
 'tpu-lubrizol-drying':{name:'Lubrizol — TPU Drying Guide',authority:'Lubrizol',kind:'resin-supplier technical guidance',url:'https://www.lubrizol.com/-/media/Lubrizol/Health/Literature/TPU-Drying-Guide.pdf'},
 'pmma-plexiglas':{name:'PLEXIGLAS — injection-moulding processing guidance',authority:'Roehm / PLEXIGLAS',kind:'resin-supplier technical guidance',url:'https://www.plexiglas-polymers.com/en/frequently-asked-questions/articles/processing-on-injection-molding-machines'},
 'pmma-autodesk':{name:'Autodesk Moldflow — PMMA material processing background',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Materials/files/materials-for-inj-molding/part-materials/thermoplastics-materials/MoldflowInsight_CLC_Materials_materials_for_inj_molding_part_materials_thermoplastics_materials_PMMA_materials_html.html'},
 'peek-victrex':{name:'VICTREX — PEEK injection moulding processing guide',authority:'Victrex',kind:'resin-supplier technical guidance',url:'https://www.victrex.com/-/media/downloads/technical-guides/victrex_injection-molding-brochure_jan2022.pdf'},
 'lcp-celanese':{name:'Celanese — Vectra LCP moulding guidelines',authority:'Celanese',kind:'resin-supplier technical guidance',url:'https://www.celanese.com/-/media/Engineered%20Materials/Files/Product%20Technical%20Guides/LCP-001_VectraLCPprecMoldTG_AM_0613.pdf'},
 'pcabs-covestro':{name:'Covestro — Bayblend T85 XF PC+ABS grade data',authority:'Covestro',kind:'resin-supplier grade data',url:'https://solutions.covestro.com/-/media/covestro/solution-center/products/datasheets/imported/bayblend/bayblend-t85-xf_en_56968621-00003130-18266741.pdf'},
 'tritan-eastman':{name:'Eastman — Tritan copolyester drying and injection-moulding guidance',authority:'Eastman',kind:'resin-supplier technical guidance',url:'https://www.eastman.com/content/dam/eastman/corporate/en/literature/t/trsmed244.pdf'},
 'pps-celanese':{name:'Celanese — Fortron PPS family and processing',authority:'Celanese',kind:'resin-supplier product guidance',url:'https://www.celanese.com/en/products/fortron-polyphenylene-sulfide'},
 'psychometric-item-2024':{name:'Rezigalla et al. (2024) — distractor efficiency, item difficulty and discrimination',authority:'peer-reviewed assessment research',kind:'research',url:'https://doi.org/10.1186/s12909-024-05433-y'},
 'psychometric-kr20-2023':{name:'Ntumi et al. (2023) — KR-20, item difficulty and discrimination',authority:'peer-reviewed assessment research',kind:'research',url:'https://doi.org/10.34293/education.v11i3.6081'},
 'microcellular-mechanics-2022':{name:'Microcellular morphology and mechanical-response evidence',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/polym14163352'}
};
Object.assign(E.sources,EXTRA_SOURCES);
const baseInferred=E.inferred.bind(E);
function add(out,id){const s=E.sources[id];if(s&&!out.some(x=>x.url===s.url))out.push({id,...s})}
function authorityKey(s){return String(s?.authority||'').toLowerCase().replace(/peer-reviewed .*/,'peer-reviewed research').replace(/\s*\/.*$/,'').trim()}
E.inferred=function(text){
 const t=String(text||'').toLowerCase(),out=baseInferred(text).map(x=>({...x}));
 if(/check.?ring|non.?return|shot delivery|cushion/.test(t)){add(out,'nrv-wear-2023');add(out,'autodesk-fill-pack')}
 if(/clamp|projected area|platen|tie.?bar/.test(t)){add(out,'autodesk-clamp-modeling');add(out,'iso-20430')}
 if(/residence|degrad|black speck|purge|thermal history|standstill|shutdown/.test(t)){add(out,'thermal-degradation-1990');add(out,'basf-troubleshooter')}
 if(/\bdoe\b|factor|interaction|blocking|confirmation run|experiment|response surface|randomis|randomiz/.test(t)){add(out,'doe-micro-2013');add(out,'adoe-2024');add(out,'nist-doe')}
 if(/energy|kwh|specific energy|heater.*pump|tcu duty|energy per/.test(t)){add(out,'energy-review-2017');add(out,'euromap-60')}
 if(/hot.?runner|heater duty|manifold|thermal zone/.test(t)){add(out,'hotrunner-manifold-2023');add(out,'hotrunner-2024')}
 if(/overmould|overmold|bond strength|interface temperature|peel strength/.test(t)){add(out,'overmould-2023');add(out,'overmould-2020')}
 if(/\bpom\b|acetal|formaldehyde|polyoxymethylene|pvc contamination/.test(t)){add(out,'delrin-pom-molding');add(out,'celanese-pom-processing')}
 if(/\bpbt\b|polybutylene terephthalate|polyester hydrolysis/.test(t)){add(out,'pbt-basf-guide');add(out,'pbt-celanese');add(out,'iso-15512')}
 if(/\btpu\b|thermoplastic polyurethane/.test(t)){add(out,'tpu-lubrizol-drying');add(out,'iso-15512')}
 if(/\bpmma\b|acrylic|plexiglas/.test(t)){add(out,'pmma-plexiglas');add(out,'pmma-autodesk')}
 if(/\bpeek\b|polyetheretherketone/.test(t)){add(out,'peek-victrex');add(out,'autodesk-fill-pack')}
 if(/\blcp\b|liquid crystal polymer/.test(t)){add(out,'lcp-celanese');add(out,'zhao-2022')}
 if(/pc.?abs|bayblend|cycoloy/.test(t)){add(out,'pcabs-covestro');add(out,'covestro-drying')}
 if(/\bpps\b|polyphenylene sulfide/.test(t)){add(out,'pps-celanese');add(out,'autodesk-fill-pack')}
 if(/psychometric|item difficulty|discrimination|distractor|kr.?20|reliability/.test(t)){add(out,'psychometric-item-2024');add(out,'psychometric-kr20-2023')}
 if(/\buk\b|united kingdom|puwer|coshh|\bhse\b|great britain/.test(t)){add(out,'hse-ppis4');add(out,'iso-20430')}
 if(/\bus\b|united states|\bosha\b/.test(t)){add(out,'osha-injection-etool');add(out,'iso-20430')}
 if(/\bnz\b|new zealand|worksafe|hswa|pcbu/.test(t)){add(out,'worksafe-safe-machinery');add(out,'iso-20430')}
 if(/guard|interlock|lockout|isolation|danger zone|emergency stop|safety/.test(t)){add(out,'iso-20430');add(out,'hse-ppis4')}
 const diverse=[],seenAuth=new Set();
 for(const s of out){const a=authorityKey(s);if(a&&!seenAuth.has(a)){diverse.push(s);seenAuth.add(a)}}
 for(const s of out)if(!diverse.some(x=>x.url===s.url))diverse.push(s);
 return diverse.slice(0,8)
};
E.version='2026.08.26.2';
E.independencePolicy={version:VERSION,minimumDistinctUrls:2,minimumAuthorityFamilies:2,reviewed:REVIEWED,reviewBy:REVIEW_BY};

/* Extended material practice: intentionally outside the formal 157-keyed approval bank. */
const MATERIAL_PRACTICE=[
 {id:'pbt-hydrolysis',title:'PBT: dry-looking pellets can still be too wet to melt safely',level:'Intermediate',materials:['PBT'],sourceIds:['pbt-basf-guide','iso-15512'],focus:'Polyester hydrolysis and moisture verification',steps:[
  ['Observe','A PBT connector lot loses impact performance while the moulding appearance is mostly acceptable. Which evidence matters first?','Verify actual material moisture and handling history because hydrolysis can reduce molecular weight without an obvious cosmetic warning','Increase clamp force','Polish the cavity','Increase hold time'],
  ['Best next test','What is the strongest next check?','Use the approved moisture method and compare the result with the exact grade requirement and drying/transfer history','Judge dryness from pellet appearance','Raise melt temperature','Use the previous PC drying recipe'],
  ['Controlled response','If excessive moisture is confirmed, what should happen?','Restore the grade-specific closed drying/handling path, verify moisture, then reassess properties and process response','Tune packing until the impact result returns','Blend in more colour','Ignore it if dimensions pass'],
  ['Explain','Why is this case important?','Polyester hydrolysis can damage molecular weight and properties, so appearance alone is not proof of material integrity','PBT never needs drying','Every PBT grade has one universal moisture limit','Impact resistance is controlled only by mould temperature'] ]},
 {id:'pet-vs-copolyester',title:'PET and copolyester: family labels do not define one thermal history',level:'Advanced',materials:['PET','Copolyester'],sourceIds:['tritan-eastman','iso-15512'],focus:'Drying, hydrolysis and crystallinity differences',steps:[
  ['Observe','Two polyester jobs share a dryer but have different supplier instructions. What is the first principle?','Treat the exact grade documentation as controlling because polyester family members can differ in drying and crystallisation behaviour','Use one PET recipe for both','Choose the hotter recipe','Ignore drying if parts are clear'],
  ['Best next test','What should be compared before the changeover?','Exact grade identity, moisture requirement, dryer/transfer capability and the part property target','Only barrel setpoints','Only mould temperature','Only cycle time'],
  ['Controlled response','If the material changes from engineering PET to amorphous copolyester, what is the controlled response?','Rebuild the material-handling and thermal plan from the new grade data rather than carrying the old process across','Keep every setting identical','Increase clamp tonnage','Use part colour as the acceptance criterion'],
  ['Explain','What is the learning point?','Polyester chemistry and grade formulation affect hydrolysis and crystallisation, so family names are not production recipes','PET and copolyester are identical','Crystallinity never affects dimensions','Drying can be inferred from dryer temperature alone'] ]},
 {id:'tpu-moisture-reabsorption',title:'TPU: drying is a system, not a timer',level:'Intermediate',materials:['TPU'],sourceIds:['tpu-lubrizol-drying','iso-15512'],focus:'Moisture, reabsorption and property loss',steps:[
  ['Observe','TPU was dried, then sat in an open hopper during a humid interruption. Which uncertainty matters most?','The moisture state of the resin actually entering the screw after re-exposure','Clamp force','Robot speed','Gate vestige'],
  ['Best next test','What is the best next test?','Measure/verify material moisture and inspect the closed transfer path instead of trusting elapsed dryer time','Increase injection speed','Lower cooling time','Add more back pressure'],
  ['Controlled response','If reabsorption is confirmed, what is the right response?','Restore the supplier-approved drying and protected transfer path, then verify moisture before judging the process','Keep moulding until splay reduces','Increase melt temperature','Open the hopper more often'],
  ['Explain','Why can visual recovery be insufficient?','Moisture can reduce TPU molecular weight and properties even when defects are subtle','TPU moisture affects appearance only','Hardness proves moisture level','All TPEs share the same drying rule'] ]},
 {id:'pmma-optical-stress',title:'PMMA: optical quality needs material and stress evidence',level:'Advanced',materials:['PMMA'],sourceIds:['pmma-plexiglas','pmma-autodesk'],focus:'Optical defects, moisture and moulded-in stress',steps:[
  ['Observe','A clear PMMA lens has intermittent haze and later stress cracking. What should not be assumed?','That one cosmetic symptom proves a single cause; moisture, thermal history and moulded-in stress need separate evidence','That clamp force is too low','That all haze is contamination','That annealing always fixes the moulding process'],
  ['Best next test','Which study is strongest?','Verify material condition, actual melt/mould thermal state and a controlled stress/optical response before changing multiple variables','Raise injection pressure only','Increase screw speed only','Shorten cooling until haze disappears'],
  ['Controlled response','If parts improve after material verification but still crack under the relevant load, what next?','Investigate filling/packing/cooling stress history and geometry rather than continuing to change drying','Dry indefinitely','Increase clamp force','Accept the part because clarity passed'],
  ['Explain','What is the core lesson?','Transparent parts can expose several mechanisms at once; optical appearance and structural stress need separate validation','PMMA is not moisture sensitive','Clear parts cannot contain residual stress','Surface polish controls every defect'] ]},
 {id:'peek-crystallinity-capability',title:'PEEK: machine capability and crystallinity belong in the same decision',level:'Advanced',materials:['PEEK'],sourceIds:['peek-victrex','zhao-2022'],focus:'High-temperature capability, cleanliness and crystallinity',steps:[
  ['Observe','A machine can reach the controller setpoints for PEEK, but tool heating uniformity and melt-path cleanliness are unverified. What is the strongest concern?','A displayed setpoint is not proof the machine/tool system can deliver the required clean and uniform thermal state','PEEK only needs more injection pressure','High temperature automatically ensures crystallinity','Clamp force is the only capability check'],
  ['Best next test','What should be verified before a process study?','Machine/tool temperature capability, actual thermal uniformity, material cleanliness and exact grade requirements','Only shot size','Only mould-open speed','Only part colour'],
  ['Controlled response','If mould-temperature uniformity is poor, what is the controlled response?','Correct/validate the thermal system before drawing conclusions about PEEK material behaviour','Compensate with more hold pressure','Reduce every cycle phase','Ignore it if part mass is stable'],
  ['Explain','Why is PEEK a useful advanced case?','Its high-temperature semi-crystalline process makes equipment capability and actual thermal state part of material validation','PEEK can only be compression moulded','Crystallinity is unrelated to cooling','All high-temperature polymers use identical tooling'] ]},
 {id:'pps-contamination-wear',title:'PPS: low moisture uptake does not remove wear and contamination questions',level:'Advanced',materials:['PPS'],sourceIds:['pps-celanese','iso-20430'],focus:'High-temperature reinforced processing and equipment condition',steps:[
  ['Observe','A glass/mineral-filled PPS job shows black inclusions after a long campaign. What evidence should be separated?','Material contamination/thermal history from screw-barrel/tool wear and stagnant melt-path deposits','Only moisture','Only clamp force','Only robot timing'],
  ['Best next test','What is the strongest investigation?','Inspect material identity/cleanliness plus melt-path and tooling condition using the approved high-temperature shutdown/inspection procedure','Increase temperature to burn deposits away','Bypass guards to look into the nozzle','Increase hold pressure'],
  ['Controlled response','If abrasive wear is confirmed, what is the correct response principle?','Correct the equipment condition and revalidate the process rather than masking delivery drift with settings','Increase screw speed permanently','Ignore wear until the machine fails','Use more regrind'],
  ['Explain','What does the case teach?','A material can have low moisture uptake yet still demand material-specific thermal, wear and contamination controls','Drying is the only material-control topic','Filled PPS is non-abrasive','Machine condition never affects shot repeatability'] ]},
 {id:'lcp-orientation',title:'LCP: easy flow can hide extreme orientation',level:'Advanced',materials:['LCP'],sourceIds:['lcp-celanese','zhao-2022'],focus:'Thin-wall filling, orientation and anisotropy',steps:[
  ['Observe','A thin LCP connector fills easily but has direction-dependent strength and warp. Which clue matters most?','The material can develop strong flow orientation, so easy filling does not mean isotropic properties','Low viscosity guarantees isotropy','Clamp force controls fibre direction','Only moisture can create directional properties'],
  ['Best next test','What should be mapped?','Flow/gate direction, weld locations, thickness transitions and directional mechanical/dimensional response','Only cycle time','Only barrel rear-zone temperature','Only ejector stroke'],
  ['Controlled response','If the weak direction aligns with a weld/orientation feature, what should be studied next?','Gate/tool design and flow-front meeting/orientation before global process compensation','Raise clamp tonnage','Increase cooling equally everywhere','Change measurement direction until it passes'],
  ['Explain','What is the educational point?','Very high flowability can coexist with strong anisotropy, so geometry and flow history still control performance','LCP behaves like unfilled amorphous resin','Thin walls eliminate orientation','High shear always improves toughness'] ]},
 {id:'pcabs-grade-identity',title:'PC/ABS: blend name is not a grade specification',level:'Intermediate',materials:['PC/ABS'],sourceIds:['pcabs-covestro','covestro-drying'],focus:'Blend grade identity, moisture and property balance',steps:[
  ['Observe','A supplier changes from one PC/ABS grade to another with a different flow/flame-performance package. What is the first action?','Treat it as a new exact grade requiring documentation review and controlled equivalence validation','Keep the old process because both labels say PC/ABS','Increase injection pressure','Assume the flame rating is unchanged'],
  ['Best next test','What belongs in the comparison?','Grade datasheets, moisture/handling requirements, rheology, shrinkage and required product properties','Only colour','Only shot size','Only mould temperature'],
  ['Controlled response','If mouldability looks similar but a required property differs, what should happen?','The material/process change remains unvalidated until the product requirement is demonstrated','Approve from appearance','Increase hold pressure','Average old and new data'],
  ['Explain','What is the core lesson?','Polymer-blend family names do not guarantee equivalent flow, drying or end-use properties','Every PC/ABS grade is interchangeable','MFR proves all properties','Blend identity is optional'] ]},
 {id:'hdpe-lot-shrink',title:'HDPE: low moisture uptake does not mean low process sensitivity',level:'Intermediate',materials:['HDPE'],sourceIds:['iso-1133','zhao-2022'],focus:'Crystallinity, shrinkage and lot rheology',steps:[
  ['Observe','An HDPE lot change keeps appearance acceptable but shifts dimensions and fill pressure. What should be checked first?','Material lot rheology/density information together with process and cooling evidence','Dryer dew point only','Clamp force only','Robot speed only'],
  ['Best next test','What is a useful controlled comparison?','Compare defined rheology/material data and in-mould response at the same validated conditions before retuning','Change five settings at once','Use colour as a proxy for viscosity','Assume all HDPE grades shrink identically'],
  ['Controlled response','If rheology changed but quality can be restored, what is still required?','Document and validate the new material/process combination against dimensional and performance requirements','Treat the lot as identical','Hide the change in the setup sheet','Ignore cavity balance'],
  ['Explain','What is the learning point?','Low moisture uptake does not remove crystallinity, rheology and cooling effects on dimensional behaviour','HDPE has no shrinkage','Drying is the only material variable','Pressure alone defines crystallinity'] ]},
 {id:'tpe-overmould-compatibility',title:'TPE overmoulding: softness does not prove adhesion compatibility',level:'Advanced',materials:['TPE','Substrate'],sourceIds:['overmould-2023','overmould-2020'],focus:'Interface thermal history and material compatibility',steps:[
  ['Observe','A soft TPE overmould looks good but peel strength is poor on one substrate grade. What should be separated?','Material-pair compatibility from local interface thermal/flow history','Clamp force from robot timing','Part colour from cycle time','Dryer temperature from ejector speed'],
  ['Best next test','What is the strongest next study?','Verify the exact material pair, surface condition and controlled interface temperature/flow history with mechanical bond testing','Increase clamp force','Judge adhesion by appearance','Shorten cooling only'],
  ['Controlled response','If a different substrate grade restores bond while process conditions are unchanged, what is the correct conclusion?','Material identity/compatibility is a causal factor that belongs in the validated specification','All TPEs bond to all substrates','The process was never relevant','Peel testing is unnecessary'],
  ['Explain','Why is this useful?','Overmould quality is an interface system problem: chemistry, surface and process history all matter','Softness predicts adhesion','Higher injection pressure guarantees bonding','A cosmetic pass proves structural bond'] ]}
];
function normalisePractice(){return MATERIAL_PRACTICE.map(l=>({...l,steps:l.steps.map(s=>({stage:s[0],question:s[1],choices:s.slice(2).map((text,i)=>({text,correct:i===0,feedback:i===0?'Correct. This choice tests the mechanism with the strongest evidence.':'Not the strongest evidence-first response for this scenario.'}))}))}))}
const PRACTICE_LABS=normalisePractice();
window.MM_MATERIAL_PRACTICE_EXTENSIONS={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,labs:PRACTICE_LABS,scope:'Extended scenario-specific practice; not part of the formal 157 keyed approval bank and not a universal production recipe.'};

/* Deterministic synthetic process data: values are illustrative and deliberately not production setpoints. */
function rng(seed){let x=(seed>>>0)||1;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}}
function noise(r,scale){return (r()-0.5)*2*scale}
const DATASET_DEFS=[
 {id:'check-ring-leakage',title:'Shot-delivery drift from non-return-valve leakage',kind:'machine',sourceIds:['nrv-wear-2023','liew-2022'],signals:{partMass_g:[12.4,-0.34,12.4],cushion_mm:[4.8,1.5,4.8],peakInj_MPa:[82,4,82],fill_s:[0.78,0.03,0.78]},fault:'Delivered shot becomes less repeatable while recovery remains broadly stable.'},
 {id:'cooling-restriction',title:'Cooling-circuit restriction and local warpage',kind:'tooling',sourceIds:['autodesk-cooling','zhao-2022'],signals:{flow_Lmin:[8.2,-2.5,8.2],returnTemp_C:[28,7,28],ejectTemp_C:[54,9,54],warpage_mm:[0.34,0.46,0.34]},fault:'A restricted circuit increases thermal imbalance and dimensional response.'},
 {id:'gate-seal-study',title:'Gate-seal mass plateau study',kind:'scientific-moulding',sourceIds:['jansen-1998','autodesk-packing'],signals:{hold_s:[1.0,2.2,3.0],partMass_g:[19.8,0.55,20.35],cavityArea_MPas:[118,24,142],sinkScore:[3.2,-1.4,1.8]},fault:'Mass and pressure-area response approach a plateau as useful gate transmission ends.'},
 {id:'material-moisture-pc',title:'PC moisture interruption and recovery',kind:'material',sourceIds:['covestro-drying','iso-15512'],signals:{moisture_pct:[0.012,0.055,0.012],splayScore:[0.4,4.3,0.4],impactIndex:[100,-18,100],partMass_g:[15.2,0.05,15.2]},fault:'Material handling interruption changes actual moisture before process settings move.'},
 {id:'hot-runner-zone-drift',title:'Hot-runner heater-duty drift before temperature display moves',kind:'tooling',sourceIds:['hotrunner-2024','hotrunner-manifold-2023'],signals:{heaterDuty_pct:[42,24,42],displayTemp_C:[250,1.2,250],cavityMass_g:[8.6,-0.22,8.6],branchPressure_MPa:[58,7,58]},fault:'Heater duty rises while displayed temperature stays deceptively stable.'},
 {id:'valve-gate-timing',title:'Sequential valve-gate timing separation',kind:'tooling',sourceIds:['autodesk-valve-gate','hotrunner-2024'],signals:{gateDelay_ms:[140,65,140],cavity1Fill_ms:[420,3,420],cavity2Fill_ms:[425,48,425],balance_pct:[1.2,8.5,1.2]},fault:'A local timing change separates cavity signatures without a global recipe change.'},
 {id:'local-flash-tooling',title:'One-cavity flash after tool service',kind:'tooling',sourceIds:['autodesk-flash','autodesk-clamp-modeling'],signals:{clamp_kN:[1850,5,1850],cavityPeak_MPa:[62,2,62],flashWidth_mm:[0.02,0.18,0.02],partMass_g:[14.0,0.16,14.0]},fault:'Local flash changes while global clamp behaviour remains stable.'},
 {id:'energy-base-load',title:'Energy per accepted part rises with stable moulding phases',kind:'machine',sourceIds:['euromap-60','energy-review-2017'],signals:{cycle_s:[24.0,0.08,24.0],qualityPass_pct:[99.4,-0.2,99.4],energy_kWh:[0.42,0.12,0.42],heaterDuty_pct:[36,16,36]},fault:'Specific energy rises while process quality/cycle remain stable, pointing to machine/auxiliary load.'},
 {id:'measurement-noise',title:'Measurement-system noise masquerading as dimensional drift',kind:'quality',sourceIds:['nist-handbook','nist-capability'],signals:{trueDim_mm:[25.00,0.00,25.00],measuredDim_mm:[25.00,0.00,25.00],gageSD_mm:[0.015,0.06,0.015],partMass_g:[10.5,0.02,10.5]},fault:'Measurement spread increases while independent process signals remain stable.'},
 {id:'recycled-pp-lot',title:'Recycled PP lot-to-lot rheology shift',kind:'material',sourceIds:['krantz-rpp-2024','iso-1133'],signals:{mfr_g10min:[12.0,2.4,12.3],fillPressure_MPa:[74,-7,73],fill_s:[0.82,-0.05,0.81],warpage_mm:[0.28,0.12,0.29]},fault:'A lot change alters rheology and in-mould response despite a similar nominal material description.'},
 {id:'machine-transfer',title:'Machine transfer: same setpoint, different actual response',kind:'machine',sourceIds:['liew-2022','tsou-2023'],signals:{velocitySet_mm_s:[80,0,80],actualPeak_mm_s:[79,8,80],transferPos_mm:[11.2,-0.7,11.2],partMass_g:[18.1,0.32,18.1]},fault:'A receiving machine reproduces setpoints but not the same actual motion/pressure response.'},
 {id:'cavity-pack-area',title:'Stable peak pressure but changed pressure-time area',kind:'sensor',sourceIds:['araujo-2023','liew-2022'],signals:{peakCavity_MPa:[48,0.8,48],pressureArea_MPas:[126,-18,126],dimension_mm:[40.00,-0.10,40.00],hold_s:[2.4,-0.35,2.4]},fault:'A single peak hides a meaningful change in the full pressure history.'},
 {id:'screw-barrel-wear',title:'Screw/barrel wear and plasticising consistency',kind:'machine',sourceIds:['nrv-wear-2023','liew-2022'],signals:{recovery_s:[4.4,1.1,4.4],meltTemp_C:[235,7,235],shotMass_g:[22.0,-0.30,22.0],backPressure_MPa:[5.5,0.6,5.5]},fault:'Plasticising time/thermal response drift together rather than a purely cavity-side defect.'},
 {id:'ejector-drag',title:'Ejector drag after local cooling imbalance',kind:'tooling',sourceIds:['autodesk-cooling','zhao-2022'],signals:{ejectForce_pct:[42,26,42],surfaceTemp_C:[47,8,47],dragScore:[0.5,3.2,0.5],dimension_mm:[30.00,0.09,30.00]},fault:'Part release load rises with local temperature/geometry response.'}
];
function generateDataset(def,index){
 const r=rng(1000+index*137),rows=[],phases=[['baseline',0],['fault',1],['recovery',2]],cycles=24;
 for(const [phase,p] of phases)for(let i=1;i<=cycles;i++){
   const row={phase,cycle:i};
   for(const [name,v] of Object.entries(def.signals)){
     const base=+v[0],delta=+v[1],recovery=+v[2];
     let target=p===0?base:p===1?base+delta:recovery;
     if(def.id==='measurement-noise'&&name==='measuredDim_mm')target=25+noise(r,p===1?0.06:0.015);
     else target+=noise(r,Math.max(Math.abs(delta)*0.06,Math.abs(base)*0.002,0.002));
     row[name]=+target.toFixed(4);
   }
   rows.push(row);
 }
 return {...def,synthetic:true,rows,phaseCounts:{baseline:cycles,fault:cycles,recovery:cycles},educationBoundary:'Synthetic training data only; values illustrate signal relationships and are not universal production setpoints.'}
}
const DATASETS=DATASET_DEFS.map(generateDataset);
function csv(ds){const keys=['phase','cycle',...Object.keys(ds.signals)],lines=[keys.join(',')];for(const row of ds.rows)lines.push(keys.map(k=>row[k]).join(','));return lines.join('\n')+'\n'}
window.MM_PROCESS_EVIDENCE_DATASETS={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,datasets:DATASETS,byId:id=>DATASETS.find(x=>x.id===id)||null,toCsv:id=>{const d=DATASETS.find(x=>x.id===id);return d?csv(d):''},scope:'Deterministic synthetic training data; not plant data and not a production recipe.'};

/* Reference-entry traceability: stable IDs, per-entry evidence links and review metadata. */
const SECTION_FALLBACKS={
 materials:['iso-1133','trotta-2021','covestro-drying'],defects:['basf-troubleshooter','autodesk-fill-pack','zhao-2022'],signals:['liew-2022','araujo-2023','tsou-2023'],tooling:['autodesk-fill-pack','zhao-2022','iso-20430'],machine:['liew-2022','iso-20430','nrv-wear-2023'],quality:['nist-handbook','nist-capability','adoe-2024'],safety:['iso-20430','hse-ppis4','osha-injection-etool','worksafe-safe-machinery'],troubleshooting:['basf-troubleshooter','autodesk-fill-pack','araujo-2023'],glossary:['nist-handbook','autodesk-fill-pack']
};
function referenceEntries(){
 const R=window.MM_REFERENCE_DATA||{},out=[];
 for(const [section,value] of Object.entries(R)){
  if(!Array.isArray(value))continue;
  for(let i=0;i<value.length;i++){
    const item=value[i];if(!item||typeof item!=='object')continue;
    const label=item.name||item.term||item.title;if(!label)continue;
    out.push({section,index:i,label,item,id:`ref:${section}:${slug(label)}`});
  }
 }
 return out
}
function traceSources(row){
 const text=[row.label,row.section,...Object.values(row.item).filter(x=>typeof x==='string')].join(' '),mapped=E.inferred(text).map(x=>({...x}));
 for(const id of SECTION_FALLBACKS[row.section]||[])add(mapped,id);
 if(mapped.length<2){add(mapped,'nist-handbook');add(mapped,'autodesk-fill-pack');add(mapped,'iso-20430')}
 const diverse=[],seen=new Set();for(const s of mapped){const a=authorityKey(s);if(a&&!seen.has(a)){diverse.push(s);seen.add(a)}}for(const s of mapped)if(!diverse.some(x=>x.url===s.url))diverse.push(s);
 return uniq(diverse).slice(0,6)
}
function referenceAudit(){const records=referenceEntries().map(row=>{const sources=traceSources(row),authorities=new Set(sources.map(authorityKey).filter(Boolean));return {...row,sources,sourceIds:sources.map(s=>s.id),authorityFamilies:[...authorities],status:sources.length>=2&&authorities.size>=2?'strong':sources.length>=2?'supported':'weak',reviewedOn:REVIEWED,reviewBy:REVIEW_BY}});const counts={strong:0,supported:0,weak:0};records.forEach(r=>counts[r.status]++);return {version:VERSION,total:records.length,counts,records}}
window.MM_REFERENCE_TRACEABILITY={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,audit:referenceAudit,record:id=>referenceAudit().records.find(x=>x.id===id)||null};

/* Cohort psychometrics. No network transport; callers must deliberately supply de-identified attempt data. */
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:0}
function variance(a){if(a.length<2)return 0;const m=mean(a);return a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1)}
function correlation(a,b){if(a.length!==b.length||a.length<3)return 0;const ma=mean(a),mb=mean(b),num=a.reduce((s,x,i)=>s+(x-ma)*(b[i]-mb),0),den=Math.sqrt(a.reduce((s,x)=>s+(x-ma)**2,0)*b.reduce((s,x)=>s+(x-mb)**2,0));return den?num/den:0}
function percentile(a,p){if(!a.length)return null;const x=a.slice().sort((m,n)=>m-n),pos=(x.length-1)*p,lo=Math.floor(pos),hi=Math.ceil(pos);return lo===hi?x[lo]:x[lo]+(x[hi]-x[lo])*(pos-lo)}
function psychometricAnalyse(attempts){
 const rows=Array.isArray(attempts)?attempts:[],byLearner=new Map(),byItem=new Map();
 for(const a of rows){if(!a||!a.learnerId||!a.itemId)continue;const score=a.correct?1:0;if(!byLearner.has(a.learnerId))byLearner.set(a.learnerId,[]);byLearner.get(a.learnerId).push({itemId:a.itemId,score});if(!byItem.has(a.itemId))byItem.set(a.itemId,[]);byItem.get(a.itemId).push({...a,score})}
 const totals=Object.fromEntries([...byLearner].map(([id,x])=>[id,x.reduce((s,r)=>s+r.score,0)]));
 const items=[];
 for(const [itemId,x] of byItem){const scores=x.map(r=>r.score),difficulty=mean(scores),rest=x.map(r=>totals[r.learnerId]-r.score),disc=correlation(scores,rest),times=x.map(r=>+r.responseMs||0).filter(v=>v>0),sel={};for(const r of x)if(r.selected!=null)sel[r.selected]=(sel[r.selected]||0)+1;const n=x.length,nonFunctional=Object.entries(sel).filter(([,c])=>c/n<0.05).map(([k])=>k);items.push({itemId,n,difficulty:+difficulty.toFixed(4),discrimination:+disc.toFixed(4),medianResponseMs:times.length?Math.round(percentile(times,.5)):null,selections:sel,nonFunctionalDistractors:nonFunctional})}
 const learners=[...byLearner.keys()],itemIds=[...byItem.keys()],k=itemIds.length,learnerScores=learners.map(id=>totals[id]),pq=itemIds.map(id=>{const p=mean(byItem.get(id).map(r=>r.score));return p*(1-p)}),scoreVar=variance(learnerScores),kr20=(k>1&&scoreVar>0)?k/(k-1)*(1-pq.reduce((a,b)=>a+b,0)/scoreVar):null;
 return {version:VERSION,learners:learners.length,attempts:rows.length,itemCount:k,kr20:kr20==null?null:+kr20.toFixed(4),items,policy:'Empirical item statistics support human review; they do not automatically invalidate a technically correct question.'}
}
function syntheticPsychometricBenchmark(){const r=rng(90210),attempts=[],learners=240,items=30;for(let l=0;l<learners;l++){const ability=(l/(learners-1))*2-1+noise(r,.25);for(let i=0;i<items;i++){const diff=-0.8+(i/(items-1))*1.6,p=1/(1+Math.exp(-(ability-diff)*1.7)),correct=r()<p,selected=correct?'correct':String(Math.floor(r()*3));attempts.push({learnerId:`L${l+1}`,itemId:`B${i+1}`,correct,selected,responseMs:clamp(42000+(diff-ability)*9000+noise(r,7000),8000,120000)})}}return psychometricAnalyse(attempts)}
window.MM_ASSESSMENT_PSYCHOMETRICS={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,analyse:psychometricAnalyse,benchmark:syntheticPsychometricBenchmark,sourceIds:['psychometric-item-2024','psychometric-kr20-2023'],privacy:'No cohort data are uploaded by this module. Analysis runs only on data explicitly supplied to it.'};

/* Minimal phone-friendly data-lab UI, injected without changing the audited core. */
function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
function ensureDataLabHost(){let host=document.getElementById('processDataLabs');if(host)return host;host=document.createElement('section');host.id='processDataLabs';host.className='page';host.hidden=true;(document.querySelector('.main')||document.querySelector('main')||document.body)?.appendChild(host);return host}
function renderDataLab(id){const host=ensureDataLabHost(),d=DATASETS.find(x=>x.id===id)||DATASETS[0];if(!host||!d)return;const keys=Object.keys(d.signals),rows=d.rows.slice(0,12),sources=d.sourceIds.map(x=>E.sources[x]).filter(Boolean);host.hidden=false;host.innerHTML=`<div class="card"><span class="eyebrow">Synthetic evidence dataset</span><h2>${esc(d.title)}</h2><p>${esc(d.fault)}</p><p class="muted">${esc(d.educationBoundary)}</p><div style="overflow:auto"><table><thead><tr><th>phase</th><th>cycle</th>${keys.map(k=>`<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.phase)}</td><td>${r.cycle}</td>${keys.map(k=>`<td>${esc(r[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p><b>Evidence:</b> ${sources.map(s=>`<a class="standard-link" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>`).join(' · ')}</p><button type="button" data-mm-dataset-download="${esc(d.id)}">Download CSV</button></div>`;host.querySelector('[data-mm-dataset-download]')?.addEventListener('click',()=>{const blob=new Blob([csv(d)],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`mouldmaster-${d.id}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)})}
function installDataLauncher(){if(document.querySelector('[data-mm-process-data-launcher]'))return;const btn=document.createElement('button');btn.type='button';btn.dataset.mmProcessDataLauncher='1';btn.className='ghost';btn.textContent='Process data labs';btn.addEventListener('click',()=>renderDataLab(DATASETS[0].id));const targets=[...document.querySelectorAll('nav,.more-menu,#more,.sidebar')];(targets[targets.length-1]||document.body)?.appendChild(btn)}
function startUi(){try{installDataLauncher()}catch(_){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startUi);else startUi();

window.MM_EVIDENCE_MATURITY={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,extraSources:EXTRA_SOURCES,materialPractice:PRACTICE_LABS,datasets:DATASETS,referenceAudit,psychometricAnalyse};
})();
