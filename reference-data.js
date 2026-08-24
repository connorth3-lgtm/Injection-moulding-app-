/* MouldMaster Reference Data Pack — 2026.08.24.1 */
(function(){
'use strict';

const DATA={
  version:'2026.08.24.1',
  note:'Reference data are learning aids, not universal production setpoints. Verify the exact resin grade, supplier data, machine and mould documentation, approved site procedures, and applicable safety requirements before making production changes.',
  materials:[
    {name:'Polypropylene (PP)',family:'Semi-crystalline polyolefin',traits:['low density','good chemical resistance','fatigue resistance','significant mould shrinkage'],watch:['thermal balance and cooling strongly affect shrinkage/warpage','grade stiffness and impact performance vary widely','some filled grades are abrasive'],verify:'Exact grade datasheet, filler/reinforcement level, shrinkage guidance and approved processing window.'},
    {name:'High-density polyethylene (HDPE)',family:'Semi-crystalline polyolefin',traits:['tough','chemical resistant','low moisture uptake','high shrinkage compared with many amorphous polymers'],watch:['warpage can reflect uneven cooling and orientation','long flow paths can magnify pressure loss','density and molecular-weight distribution affect behaviour'],verify:'Grade-specific rheology, shrinkage and dimensional expectations.'},
    {name:'ABS',family:'Amorphous styrenic',traits:['good impact balance','good surface appearance','dimensionally more predictable than high-shrink crystalline resins'],watch:['moisture/contamination can affect appearance','overheating or excessive residence can discolour material','surface finish is sensitive to flow and venting'],verify:'Supplier drying guidance where applicable, colour/additive limits and thermal history.'},
    {name:'Polycarbonate (PC)',family:'Amorphous engineering thermoplastic',traits:['high toughness','good dimensional stability','transparent grades available'],watch:['moisture-sensitive grades require controlled handling','high melt viscosity can increase pressure demand','thermal degradation can cause colour/appearance changes'],verify:'Grade-specific drying/moisture target, residence-time limits and mould-temperature guidance.'},
    {name:'PA6 / PA66 (Nylon)',family:'Semi-crystalline polyamide',traits:['strong','wear resistant','reinforced grades common','properties strongly influenced by absorbed moisture'],watch:['moisture before moulding can cause degradation or appearance issues','post-mould moisture conditioning changes dimensions/properties','glass-filled grades increase wear and anisotropy'],verify:'Exact polymer/grade, reinforcement, drying method, moisture specification and conditioning requirements.'},
    {name:'PBT',family:'Semi-crystalline polyester',traits:['good electrical properties','good chemical resistance','dimensionally useful in reinforced grades'],watch:['hydrolysis risk when processed with excessive moisture','glass-filled grades can show orientation-driven warpage','surface quality depends on fill/venting/thermal balance'],verify:'Supplier moisture/drying specification, reinforcement level and dimensional data.'},
    {name:'PET',family:'Semi-crystalline polyester',traits:['good strength','barrier applications common','crystallisation behaviour depends on grade and thermal history'],watch:['moisture control is critical for molecular-weight retention','crystallisation and cooling affect dimensions and appearance','recycled content can change viscosity/colour'],verify:'Intrinsic-viscosity/grade information, drying method, recycled-content rules and application-specific requirements.'},
    {name:'POM / Acetal',family:'Semi-crystalline engineering thermoplastic',traits:['low friction','good dimensional repeatability','good fatigue performance'],watch:['thermal abuse can cause decomposition','incompatible contamination is a serious processing concern','shrinkage and orientation still require balanced cooling'],verify:'Supplier safety/processing guidance, contamination controls and grade-specific shrinkage.'},
    {name:'PMMA / Acrylic',family:'Amorphous acrylic',traits:['high optical clarity','good weatherability','good surface quality'],watch:['surface defects and flow marks are highly visible','moisture can affect appearance in some grades','scratch sensitivity requires handling control'],verify:'Optical-grade handling, drying if specified, surface requirements and contamination controls.'},
    {name:'TPU',family:'Thermoplastic elastomer',traits:['elastic','abrasion resistant','wide hardness range'],watch:['many grades are moisture sensitive','soft grades can feed/recover differently from rigid pellets','release and ejection can dominate cycle stability'],verify:'Hardness, chemistry family, moisture requirement, release guidance and approved residence limits.'},
    {name:'PPS',family:'High-temperature semi-crystalline engineering polymer',traits:['chemical resistant','dimensionally stable in reinforced grades','high-temperature capability'],watch:['filled grades are often abrasive','tooling and machine wear controls matter','venting and thermal management remain important'],verify:'Reinforcement, corrosion/wear requirements, supplier processing envelope and part-performance specification.'},
    {name:'PEEK',family:'High-performance semi-crystalline polymer',traits:['high-temperature capability','chemical resistance','high mechanical performance'],watch:['requires equipment and tooling suitable for high processing temperatures','crystallinity strongly affects properties','material cost makes purge/startup discipline important'],verify:'Grade-specific supplier processing instructions, machine capability, tooling temperature capability and validated quality plan.'}
  ],
  defects:[
    {name:'Short shot',evidence:'Incomplete fill or unfilled extremities.',check:['fill pattern and flow restriction','actual fill time and pressure demand','material condition and thermal actuals','venting at end-of-fill locations'],avoid:'Do not assume injection speed alone is the cause.'},
    {name:'Flash',evidence:'Excess material at parting lines, inserts, vents or shutoffs.',check:['exact flash location','tool seating/parting-line condition','clamp performance and actual cavity pressure demand','local damage, wear or contamination'],avoid:'Do not use clamp force to hide a damaged shutoff without investigation.'},
    {name:'Sink marks',evidence:'Local surface depressions, often over thick sections or ribs.',check:['local section thickness','gate effectiveness and gate-seal evidence','packing response and part mass','local cooling balance'],avoid:'Do not extend hold time blindly after the gate has stopped transmitting useful pressure.'},
    {name:'Warpage',evidence:'Part shape departs from intended geometry after moulding.',check:['mould temperature balance','cooling circuit condition','orientation and fibre direction','packing balance and ejection condition'],avoid:'Treat warpage as a multi-factor dimensional response, not a single-setting defect.'},
    {name:'Burn / dieseling',evidence:'Dark, scorched or degraded area, often near trapped gas/end of fill.',check:['defect location relative to end of fill','vent condition and gas escape path','local fill velocity/compression of trapped air','material degradation evidence'],avoid:'Do not bypass guarding or open a running mould to inspect vents.'},
    {name:'Splay / silver streaks',evidence:'Silver or pale streaking on the surface.',check:['material moisture and handling history','contamination or volatiles','thermal degradation/residence evidence','decompression or air entrainment where relevant'],avoid:'Do not apply one generic drying recipe across resin families.'},
    {name:'Weld / knit line weakness',evidence:'Visible or weak line where flow fronts meet.',check:['flow-front location and geometry','venting at the meeting point','material/thermal condition','local pressure and orientation'],avoid:'Appearance alone does not prove mechanical acceptability.'},
    {name:'Jetting',evidence:'Snake-like or folded flow trace from a gate.',check:['gate direction and local geometry','initial flow-front behaviour','fill profile and local impingement','material viscosity/thermal condition'],avoid:'Do not change several fill variables at once; confirm the flow mechanism.'},
    {name:'Delamination',evidence:'Layer-like separation or flaking surface.',check:['material compatibility/contamination','masterbatch or additive compatibility','moisture/volatile history','excessive shear or degraded material evidence'],avoid:'Do not regrind suspect mixed material back into production until identity is controlled.'},
    {name:'Black specks',evidence:'Dark inclusions or degraded particles.',check:['purge history and dead spots','residence/thermal history','contamination routes','screw/barrel/nozzle/hot-runner condition'],avoid:'Do not simply increase temperature to clear degraded material.'},
    {name:'Voids / internal bubbles',evidence:'Internal cavities not open to the surface.',check:['section thickness and solidification pattern','packing effectiveness before gate seal','material volatiles/moisture evidence','part sectioning or non-destructive evidence'],avoid:'Do not confuse vacuum voids with gas bubbles without examining the mechanism.'},
    {name:'Gloss variation',evidence:'Uneven surface reflectivity across the part or between shots.',check:['mould surface and contamination','local mould temperature','flow-front speed/pressure at the surface','material/additive/colour consistency'],avoid:'Cosmetic variation can be local even when machine settings are global.'},
    {name:'Stringing / drool',evidence:'Material strings or leaks from nozzle/gate between cycles.',check:['nozzle/hot-runner thermal condition','material viscosity and degradation','decompression strategy if applicable','gate/nozzle shutoff condition'],avoid:'Do not compensate indefinitely for a leaking mechanical shutoff with process changes.'},
    {name:'Ejection marks / sticking',evidence:'Scuffing, whitening, pin marks, drag or difficult release.',check:['draft and texture','local cooling/part rigidity','ejector condition and alignment','packing level and release geometry'],avoid:'Robot force is not a substitute for safe, reliable part release.'}
  ],
  signals:[
    {name:'Fill time',meaning:'Time required for the controlled filling phase.',use:'Trend repeatability and compare with pressure/transfer evidence.',drift:'A change can indicate viscosity, thermal, flow restriction, machine response or profile changes.'},
    {name:'Peak injection pressure',meaning:'Maximum pressure demand observed during filling.',use:'Compare pressure demand at similar fill conditions.',drift:'Higher demand can reflect colder/more viscous material, restriction, venting effects or changed flow rate.'},
    {name:'Transfer position',meaning:'Screw position at velocity-to-pressure transfer.',use:'Track shot delivery and consistency of the filled volume at transfer.',drift:'Movement can indicate delivery variation, check-ring behaviour or changed material compressibility.'},
    {name:'Cushion',meaning:'Material/screw position remaining after packing.',use:'Trend with part mass, transfer and pressure.',drift:'Variation can reveal unstable shot delivery or non-return-valve behaviour.'},
    {name:'Recovery time',meaning:'Time required to plasticise/meter the next shot.',use:'Trend feed, plasticising and cooling overlap.',drift:'Changes can point to feed, material, screw speed, back pressure or thermal condition.'},
    {name:'Screw recovery position',meaning:'Metered shot position before injection.',use:'Confirm shot-size repeatability.',drift:'Unexpected variation should be investigated before compensating elsewhere.'},
    {name:'Melt temperature actual',meaning:'Measured melt temperature using an approved method.',use:'Validate thermal state rather than assuming barrel setpoints equal melt condition.',drift:'Can reflect residence, shear, heater performance or measurement method.'},
    {name:'Mould-surface temperature',meaning:'Temperature at relevant cavity/core surfaces.',use:'Check thermal balance and repeatability.',drift:'Can affect fill, surface, shrinkage, warpage, ejection and cycle stability.'},
    {name:'Cooling-water supply/return',meaning:'Thermal-fluid temperatures entering/leaving a circuit.',use:'Use with flow information to diagnose cooling-system changes.',drift:'Temperature alone does not prove adequate flow or correct circuit connection.'},
    {name:'Part mass',meaning:'Mass of a defined part/shot sample.',use:'Simple response for filling/packing consistency when measurement is controlled.',drift:'Can correlate with transfer, packing, leakage, cavity balance or material variation.'},
    {name:'Cycle phase times',meaning:'Fill, hold, cooling, recovery and mould-motion durations.',use:'Identify which phase changed when total cycle time moves.',drift:'A stable total can still hide compensating phase changes.'},
    {name:'Clamp force actual',meaning:'Measured/estimated force used to keep the mould closed.',use:'Compare with validated mould/process requirements.',drift:'Must not be treated as a substitute for fixing flash-causing tooling damage.'},
    {name:'Cavity pressure',meaning:'Pressure measured inside the mould when cavity sensors are available.',use:'Connect machine events to local filling, transfer, packing and gate-seal behaviour.',drift:'Interpret by sensor location, calibration and the event being measured.'},
    {name:'Hydraulic / plastic pressure relationship',meaning:'Machine-specific relationship between hydraulic pressure and plastic pressure.',use:'Translate controller values only with the machine documentation and intensification ratio where applicable.',drift:'Never assume values transfer directly between different machine designs.'},
    {name:'Dryer dew point / air condition',meaning:'Condition of drying air for systems where it is relevant.',use:'Use alongside temperature, airflow, residence time and material moisture measurement.',drift:'A good displayed dew point alone does not prove dry resin at the hopper outlet.'},
    {name:'Reject pattern by cavity/time',meaning:'Where and when defects occur across cavities and production time.',use:'Separate local tooling causes from machine/material/system causes.',drift:'Patterns are often more diagnostic than the overall reject percentage.'}
  ],
  glossary:[
    ['Back pressure','Resistance applied during screw recovery to influence plasticising and melt preparation.'],
    ['Cavity balance','Similarity of filling/packing response between cavities in a multi-cavity mould.'],
    ['Cavity pressure','Pressure measured within the mould cavity using a suitable sensor.'],
    ['Check ring / non-return valve','Screw-tip device intended to limit reverse melt flow during injection.'],
    ['Clamp force','Force keeping mould halves closed against cavity pressure.'],
    ['Cooling time','Defined cycle interval allocated to solidification before opening/ejection.'],
    ['Cushion','Screw position/material reserve remaining after the packing phase.'],
    ['Decompression','Controlled screw movement used on some processes to reduce nozzle pressure after recovery.'],
    ['DOE','Design of experiments: structured method for estimating factor effects and interactions.'],
    ['Draft','Taper that assists release of a moulded feature from the tool.'],
    ['Fill time','Elapsed time for the controlled cavity-filling phase.'],
    ['Fountain flow','Typical advancing flow pattern where material near the centre moves forward and turns toward the mould wall.'],
    ['Gate freeze / gate seal','Point at which useful pressure transmission through the gate has effectively stopped.'],
    ['Hold / pack','Pressure-controlled phase used after transfer to compensate shrinkage while pressure can still be transmitted.'],
    ['Hot runner','Heated runner system intended to keep polymer molten between machine nozzle and gate.'],
    ['MFR / MVR','Standardised melt-flow test results measured under specified conditions; not a complete moulding rheology curve.'],
    ['Mould shrinkage','Dimensional reduction from mould dimensions to the conditioned moulded part, dependent on material/process/geometry.'],
    ['Orientation','Directional arrangement of polymer chains or fibres created by flow and deformation.'],
    ['Parting line','Interface where mould halves or components separate.'],
    ['Plastic pressure','Pressure on the polymer side of the injection unit; machine conversion from hydraulic values is machine-specific.'],
    ['Residence time','Time material spends in the heated processing system; actual distribution is broader than one simple calculated value.'],
    ['Regrind','Previously processed material mechanically reduced for possible controlled reuse.'],
    ['Shear rate','Rate of deformation in flowing material; strongly influences apparent viscosity of polymer melts.'],
    ['Shear thinning','Decrease in apparent viscosity as shear rate increases, typical of many thermoplastic melts.'],
    ['Shot size','Metered volume/position prepared for injection; controller representation is machine-specific.'],
    ['Sink mark','Local surface depression associated with differential volumetric shrinkage and insufficient local compensation.'],
    ['Transfer','Change from velocity-controlled filling to pressure-controlled packing/holding.'],
    ['Venting','Designed escape path for displaced air/gas from the mould cavity.'],
    ['Viscosity','Resistance to flow; polymer melt viscosity depends on shear rate, temperature, pressure and material history.'],
    ['Warpage','Departure of a moulded part from intended shape due to non-uniform shrinkage, orientation, stress or thermal history.'],
    ['Weld / knit line','Region formed where two advancing flow fronts meet.']
  ]
};

window.MM_REFERENCE_DATA=DATA;

function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));}
function textOf(v){return Array.isArray(v)?v.join(' '):String(v??'');}
function searchable(item){return Object.values(item).map(textOf).join(' ').toLowerCase();}
function ensureUI(){
  if(!document.body||document.getElementById('mmrd-open'))return;
  const style=document.createElement('style');
  style.textContent=`
  #mmrd-open{position:fixed;left:14px;bottom:14px;z-index:2147483000;border:1px solid #41658d;background:#10233d;color:#eef7ff;border-radius:999px;padding:10px 14px;font:700 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.3);cursor:pointer}
  #mmrd-open:focus-visible,.mmrd button:focus-visible,.mmrd input:focus-visible{outline:3px solid #72e6cd;outline-offset:2px}
  .mmrd{position:fixed;inset:0;z-index:2147483001;background:rgba(2,8,18,.84);display:none;align-items:center;justify-content:center;padding:14px;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#eef7ff}
  .mmrd[data-open="1"]{display:flex}.mmrd-panel{width:min(980px,100%);max-height:min(88vh,900px);overflow:hidden;background:#0e1a2c;border:1px solid #304866;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.55);display:flex;flex-direction:column}
  .mmrd-head{padding:18px 18px 12px;border-bottom:1px solid #253a54}.mmrd-title{display:flex;gap:10px;align-items:flex-start;justify-content:space-between}.mmrd-title h2{margin:0;font-size:22px}.mmrd-title p{margin:5px 0 0;color:#a9bdd6;font-size:13px;line-height:1.45}.mmrd-close{border:1px solid #49627e;background:#172941;color:#fff;border-radius:9px;padding:8px 11px;cursor:pointer}
  .mmrd-tools{display:grid;grid-template-columns:minmax(180px,1fr) auto;gap:10px;margin-top:13px}.mmrd-search{width:100%;border:1px solid #3a5471;background:#081423;color:#fff;border-radius:10px;padding:10px 12px}.mmrd-tabs{display:flex;gap:6px;flex-wrap:wrap}.mmrd-tabs button{border:1px solid #3a5471;background:#13243a;color:#dceaff;border-radius:9px;padding:8px 10px;cursor:pointer}.mmrd-tabs button[aria-selected="true"]{background:#1f4d58;border-color:#55d6be;color:#fff}
  .mmrd-body{overflow:auto;padding:14px 18px 20px}.mmrd-count{font-size:12px;color:#9fb5cf;margin:0 0 10px}.mmrd-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px}.mmrd-card{border:1px solid #2b405b;background:#111f32;border-radius:12px;padding:13px}.mmrd-card h3{font-size:15px;margin:0 0 7px}.mmrd-card p{margin:5px 0;color:#c8d7e8;font-size:13px;line-height:1.45}.mmrd-card b{color:#fff}.mmrd-card ul{margin:5px 0 0;padding-left:18px;color:#c8d7e8;font-size:13px;line-height:1.45}.mmrd-note{margin:0 0 12px;padding:10px 12px;border-left:3px solid #55d6be;background:#10283a;color:#dcebf7;font-size:12px;line-height:1.5}.mmrd-empty{padding:24px;text-align:center;color:#9fb5cf}
  @media(max-width:650px){.mmrd{padding:0}.mmrd-panel{height:100%;max-height:none;border-radius:0;border:0}.mmrd-tools{grid-template-columns:1fr}.mmrd-head{padding-top:max(14px,env(safe-area-inset-top))}.mmrd-body{padding-bottom:max(18px,env(safe-area-inset-bottom))}}
  @media(prefers-reduced-motion:reduce){.mmrd *{scroll-behavior:auto!important}}
  `;
  document.head.appendChild(style);

  const open=document.createElement('button');
  open.id='mmrd-open';open.type='button';open.textContent='Reference Data';open.setAttribute('aria-haspopup','dialog');
  const modal=document.createElement('div');
  modal.className='mmrd';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','MouldMaster reference data');modal.dataset.open='0';
  modal.innerHTML=`<section class="mmrd-panel"><div class="mmrd-head"><div class="mmrd-title"><div><h2>Reference Data</h2><p>Search materials, defects, process signals and moulding terminology.</p></div><button class="mmrd-close" type="button" aria-label="Close reference data">Close</button></div><div class="mmrd-tools"><input class="mmrd-search" type="search" placeholder="Search reference data…" aria-label="Search reference data"><div class="mmrd-tabs" role="tablist"></div></div></div><div class="mmrd-body"><p class="mmrd-note">${esc(DATA.note)}</p><p class="mmrd-count"></p><div class="mmrd-grid"></div></div></section>`;
  document.body.append(open,modal);

  const tabs=[['materials','Materials'],['defects','Defects'],['signals','Process signals'],['glossary','Glossary']];
  let active='materials';
  const tabsBox=modal.querySelector('.mmrd-tabs'), search=modal.querySelector('.mmrd-search'), grid=modal.querySelector('.mmrd-grid'), count=modal.querySelector('.mmrd-count');
  for(const [key,label] of tabs){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.key=key;b.setAttribute('role','tab');b.addEventListener('click',()=>{active=key;for(const x of tabsBox.children)x.setAttribute('aria-selected',String(x===b));render();});tabsBox.appendChild(b)}
  tabsBox.firstElementChild.setAttribute('aria-selected','true');

  function card(item){
    if(active==='materials')return `<article class="mmrd-card"><h3>${esc(item.name)}</h3><p><b>Family:</b> ${esc(item.family)}</p><p><b>Traits:</b> ${esc(item.traits.join(', '))}</p><p><b>Watch:</b></p><ul>${item.watch.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p><b>Verify:</b> ${esc(item.verify)}</p></article>`;
    if(active==='defects')return `<article class="mmrd-card"><h3>${esc(item.name)}</h3><p>${esc(item.evidence)}</p><p><b>Check:</b></p><ul>${item.check.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p><b>Avoid:</b> ${esc(item.avoid)}</p></article>`;
    if(active==='signals')return `<article class="mmrd-card"><h3>${esc(item.name)}</h3><p><b>Meaning:</b> ${esc(item.meaning)}</p><p><b>Use:</b> ${esc(item.use)}</p><p><b>Drift:</b> ${esc(item.drift)}</p></article>`;
    return `<article class="mmrd-card"><h3>${esc(item[0])}</h3><p>${esc(item[1])}</p></article>`;
  }
  function render(){
    const q=search.value.trim().toLowerCase();
    const all=DATA[active];
    const rows=all.filter(item=>!q||(Array.isArray(item)?item.join(' '):searchable(item)).toLowerCase().includes(q));
    count.textContent=`${rows.length} of ${all.length} ${tabs.find(x=>x[0]===active)[1].toLowerCase()}`;
    grid.innerHTML=rows.length?rows.map(card).join(''):'<div class="mmrd-empty">No matching reference data.</div>';
  }
  search.addEventListener('input',render);
  const close=()=>{modal.dataset.open='0';open.focus();};
  open.addEventListener('click',()=>{modal.dataset.open='1';render();setTimeout(()=>search.focus(),0)});
  modal.querySelector('.mmrd-close').addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.dataset.open==='1')close()});
  render();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureUI,{once:true});else ensureUI();
})();
