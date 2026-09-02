/* MouldMaster contextual research evidence engine — 2026.09.02.1 */
(function(){
'use strict';
const VERSION='2026.09.02.1';

const MECHANISMS=[
  {
    id:'ejection-demoulding-physics',
    title:'Ejection and demoulding physics',
    status:'promoted',
    aliases:['ejection','demoulding','demolding','eject force','ejector drag','release force','sticking','release'],
    signals:['ejection force','part surface temperature','mould surface temperature','dimension','drag score'],
    outcomes:['part damage','release quality','dimension'],
    contexts:{materials:['thermoplastics','PLA'],process:['injection moulding'],tooling:['textured surface','coated insert','microstructure'],sensors:['force','temperature']},
    claim:'Release load can change with thermal state, shrinkage, surface interaction, draft, texture and mould condition; increasing eject force can mask the mechanism rather than resolve it.',
    supports:['ejection or release force changes with local thermal/surface condition','part damage or dimensional response moves with release load'],
    weakens:['independent release-force and thermal measurements remain stable while the defect changes','the apparent trend disappears after measurement-system verification'],
    alternatives:['measurement-system variation','mechanical alignment or actuator fault','part geometry/draft change'],
    nextEvidence:'Measure actual release force and local thermal condition, then compare the physical part outcome before and after a controlled correction.',
    recovery:'Release force and the linked physical-quality response should move back toward the known-good baseline together.',
    limitation:'Published PLA, microstructured-insert and coating studies are application-specific and do not create universal eject-force, coating, lubricant or draft limits.',
    sourceIds:['doi:10.3311/PPme.18246','doi:10.3390/mi12060636']
  },
  {
    id:'residual-stress-birefringence',
    title:'Residual stress and birefringence',
    status:'promoted',
    aliases:['residual stress','birefringence','optical stress','polarised stress','polarized stress'],
    signals:['cavity pressure','packing pressure history','mould temperature','melt temperature'],
    outcomes:['birefringence','optical distortion','residual stress','dimension'],
    contexts:{materials:['COC','PC','amorphous thermoplastic'],process:['injection moulding','precision optics'],tooling:['optical mould','coated mould'],sensors:['cavity pressure','optical measurement']},
    claim:'Residual stress can remain when dimensions and appearance appear acceptable; pressure and thermal history can influence optical stress response.',
    supports:['birefringence or residual-stress measurement changes with pressure/thermal history','optical outcome changes while ordinary visual inspection appears acceptable'],
    weakens:['independent optical-stress measurement is unchanged across the suspected process shift'],
    alternatives:['material lot optical-property variation','measurement/conditioning variation','mould-surface or coating change'],
    nextEvidence:'Measure optical stress/birefringence alongside pressure and thermal history rather than relying on appearance alone.',
    recovery:'Optical-stress response should return toward the validated reference after the relevant pressure/thermal mechanism is corrected.',
    limitation:'Optical COC/PC materials, sensor positions, coatings and lens geometries are application-specific; no tested pressure or temperature is universal.',
    sourceIds:['doi:10.1002/pen.70492','doi:10.1002/pen.70647']
  },
  {
    id:'weld-line-mechanical-strength',
    title:'Weld-line mechanical strength versus appearance',
    status:'promoted',
    aliases:['weld line','weld-line','knit line','meld line','flow front meeting'],
    signals:['melt temperature','mould temperature','pressure history','flow-front condition'],
    outcomes:['tensile strength','fatigue strength','impact strength','appearance'],
    contexts:{materials:['PP','PA','glass-fibre reinforced thermoplastic'],process:['injection moulding'],tooling:['multi-gate','obstacle flow'],sensors:['temperature','pressure']},
    claim:'Cosmetic weld-line visibility is not a reliable proxy for structural weld-line strength; physical qualification is required when strength matters.',
    supports:['mechanical strength changes at weld location under controlled process/material conditions','appearance and mechanical response do not move one-to-one'],
    weakens:['location-specific mechanical testing shows no meaningful separation from the validated reference'],
    alternatives:['bulk material degradation','fibre-orientation change','specimen/measurement variation'],
    nextEvidence:'Confirm weld location and test the required mechanical property under the actual material, geometry and loading condition.',
    recovery:'The required mechanical outcome should recover, not merely the cosmetic appearance.',
    limitation:'Published geometries, reinforcement levels and loading programmes are application-specific; no universal weld-strength reduction or setting is implied.',
    sourceIds:['doi:10.1016/j.icheatmasstransfer.2011.11.012','doi:10.1016/j.polymertesting.2025.109035']
  },
  {
    id:'fibre-breakage-retained-length',
    title:'Fibre breakage and retained fibre length',
    status:'promoted',
    aliases:['fibre breakage','fiber breakage','retained fibre','retained fiber','fibre length','fiber length','long fibre','long fiber'],
    signals:['plasticising history','screw/mixing history','shear history'],
    outcomes:['retained fibre length','strength','stiffness','anisotropy'],
    contexts:{materials:['long-fibre PP','GF/PP','fibre reinforced thermoplastic'],process:['injection moulding','direct fibre feeding'],tooling:[],sensors:[]},
    claim:'Plasticising and mixing history can shorten reinforcement fibres and change physical properties; orientation alone does not describe reinforced-part behaviour.',
    supports:['retained fibre-length distribution moves with processing history','mechanical response moves consistently with retained fibre morphology'],
    weakens:['independent fibre-length measurement is unchanged despite the suspected process-history shift'],
    alternatives:['fibre orientation redistribution','feedstock lot variation','moisture or thermal degradation'],
    nextEvidence:'Measure retained fibre-length distribution and a physical property response while preserving material-lot and process-history identity.',
    recovery:'Retained fibre morphology and the linked mechanical response should recover together after the causal process history is corrected.',
    limitation:'Feedstock architecture, fibre type/length, screw/nozzle/tool geometry and processing history are application-specific.',
    sourceIds:['doi:10.1002/pc.27232','doi:10.1002/app.70427']
  },
  {
    id:'runner-gate-multicavity-imbalance',
    title:'Runner, gate and multicavity imbalance',
    status:'promoted',
    aliases:['multicavity','multi-cavity','runner imbalance','gate imbalance','cavity imbalance','rheological imbalance'],
    signals:['cavity pressure','fill time','cavity fill response','gate response'],
    outcomes:['cavity-specific mass','cavity-specific dimension','cavity-specific quality'],
    contexts:{materials:['thermoplastics'],process:['multi-cavity injection moulding'],tooling:['runner','gate','multicavity mould'],sensors:['cavity pressure','in-mould sensor']},
    claim:'Geometric balance does not guarantee rheological balance; machine averages can conceal cavity-specific fill and quality differences.',
    supports:['cavity-resolved pressure/fill signatures separate','cavity-specific physical outcomes separate consistently'],
    weakens:['cavity-resolved measurements remain statistically equivalent while the quality issue moves independently'],
    alternatives:['cavity-specific cooling variation','local venting/tool wear','measurement/cavity identification error'],
    nextEvidence:'Preserve cavity identity and compare cavity-specific pressure/fill response with cavity-specific physical quality.',
    recovery:'The affected cavity response and physical quality should converge toward the known-good cavity baseline after correction.',
    limitation:'Balance is mould-, runner-, gate-, material- and thermal-state specific; no universal gate/runner dimensions or balance limits are implied.',
    sourceIds:['doi:10.3390/polym16202874','doi:10.3390/s23031735']
  },
  {
    id:'hot-runner-actual-behaviour',
    title:'Hot-runner actual thermal and mechanical behaviour',
    status:'promoted',
    aliases:['hot runner','hot-runner','valve gate','sequential valve','heater duty','manifold','gate delay'],
    signals:['heater duty','zone actual temperature','valve actual timing','cavity pressure','melt-front detection'],
    outcomes:['cavity fill','part mass','local quality'],
    contexts:{materials:['thermoplastics'],process:['hot-runner injection moulding','sequential valve gating'],tooling:['hot runner','valve gate','manifold'],sensors:['temperature','cavity pressure','melt-front detector','actuation verification']},
    claim:'Displayed temperature or commanded valve timing may not equal actual thermal/mechanical response at the manifold, nozzle, gate or cavity.',
    supports:['command-to-actual valve timing differs','heater demand changes while displayed temperature remains relatively stable','local cavity response separates with the hot-runner actual'],
    weakens:['independent actual actuation/thermal measurements track commands normally while cavity response changes independently'],
    alternatives:['cavity sensor fault','local gate wear/obstruction','material viscosity shift'],
    nextEvidence:'Measure or infer the actual valve/thermal response and compare it with cavity-specific filling evidence rather than relying on displayed commands alone.',
    recovery:'Actual actuation/thermal behaviour and cavity response should return toward the validated baseline together.',
    limitation:'Hot-runner architecture, controller, material and tool thermal state are system-specific; no universal delay, pressure or temperature is implied.',
    sourceIds:['doi:10.1002/app.22371','doi:10.1016/j.jmapro.2024.07.095']
  },
  {
    id:'liquid-silicone-rubber',
    title:'Liquid silicone rubber cure and crosslinking behaviour',
    status:'promoted',
    aliases:['liquid silicone','LSR','crosslinking','cross-linking','cure state','silicone moulding','silicone molding'],
    signals:['cavity pressure','cavity temperature','cure history','mould temperature'],
    outcomes:['mechanical strength','cure state','part quality'],
    contexts:{materials:['LSR','liquid silicone rubber'],process:['LSR injection moulding'],tooling:['hot mould'],sensors:['cavity pressure','temperature']},
    claim:'LSR has thermoset cure/crosslinking behaviour with measurable cavity-pressure/thermal signatures and must not be treated as ordinary thermoplastic injection moulding.',
    supports:['cavity pressure/thermal response changes with cure history','physical mechanical/cure outcome moves consistently'],
    weakens:['validated cure-state and physical outcome measurements remain unchanged across the suspected condition'],
    alternatives:['meter/mix ratio variation','material batch chemistry','temperature measurement error'],
    nextEvidence:'Measure cure-relevant pressure/temperature history and a physical cure/mechanical outcome using LSR-specific controls.',
    recovery:'Cure signal and physical outcome should return toward the qualified LSR reference together.',
    limitation:'Formulation, cure system, mould temperature and optical/medical requirements are application-specific.',
    sourceIds:['doi:10.1002/app.53381','doi:10.7735/ksmte.2014.23.2.206']
  },
  {
    id:'fluid-assisted-moulding',
    title:'Gas, water and projectile-assisted moulding',
    status:'promoted',
    aliases:['gas assisted','gas-assisted','water assisted','water-assisted','projectile assisted','projectile-assisted','residual wall'],
    signals:['assist pressure','assist timing','penetration signal','ultrasonic wall measurement'],
    outcomes:['residual wall thickness','void','surface quality','cooling response'],
    contexts:{materials:['thermoplastics'],process:['gas-assisted moulding','water-assisted moulding','projectile-assisted moulding'],tooling:['hollow-part tooling'],sensors:['ultrasonic','pressure']},
    claim:'Assisted moulding introduces penetration, residual-wall and cooling mechanisms that require process-family-specific physical evidence.',
    supports:['assist-medium history moves with penetration/residual-wall outcome','physical wall/cooling/surface outcome changes coherently'],
    weakens:['direct wall/penetration measurement stays unchanged while the suspected defect changes'],
    alternatives:['melt-temperature/viscosity shift','geometry or flow restriction','measurement-location variation'],
    nextEvidence:'Measure the process-family-specific assist history and the resulting physical penetration/residual-wall outcome.',
    recovery:'Physical penetration/wall outcome should recover with the relevant assist mechanism.',
    limitation:'Water, gas and projectile-assisted processes differ physically and must not be collapsed into one recipe.',
    sourceIds:['doi:10.1155/2015/161938','doi:10.1002/pen.20832']
  },
  {
    id:'moisture-drying-degradation',
    title:'Moisture, drying and process-induced degradation',
    status:'promoted',
    aliases:['moisture','drying','hydrolysis','dryer','splay','silver streak','material degradation','residual moisture'],
    signals:['measured moisture','drying history','residence time','melt temperature','plasticising history'],
    outcomes:['appearance','impact strength','rheology','part quality'],
    contexts:{materials:['hygroscopic thermoplastic','PC','PA','TPU'],process:['injection moulding','material drying'],tooling:[],sensors:['moisture measurement','temperature']},
    claim:'Dryer setpoint is not material moisture at point of use; measured moisture and thermal/residence history can alter rheology and physical quality.',
    supports:['measured material moisture moves with physical quality/rheology','drying interruption or thermal history coincides with the change'],
    weakens:['independent material-moisture measurement and material-state checks remain within the qualified reference while the defect changes'],
    alternatives:['venting/air entrapment','contamination','machine thermal-control issue'],
    nextEvidence:'Measure actual material moisture/state at the relevant point and preserve grade-specific drying/transfer history before changing moulding settings.',
    recovery:'Measured material condition and the linked physical-quality response should recover together.',
    limitation:'Moisture sensitivity and safe drying conditions are resin/grade-specific; supplier data and approved procedures control production limits.',
    sourceIds:['doi:10.3390/app12031410','doi:10.37358/MP.20.1.5311']
  },
  {
    id:'recyclate-process-variability',
    title:'Recyclate and process variability',
    status:'promoted',
    aliases:['recyclate','recycled','PCR','post-consumer','reprocessed','regrind','lot variability'],
    signals:['cavity pressure','screw pressure','fill time','MFR','MVR','material lot'],
    outcomes:['part mass','mechanical property','warpage','quality'],
    contexts:{materials:['recycled PP','recyclate','PCR thermoplastic'],process:['injection moulding'],tooling:['multicavity','hot runner'],sensors:['cavity pressure','screw pressure']},
    claim:'Recyclate source, contamination, degradation and prior processing can change measured moulding response and physical properties even when nominal resin identity looks similar.',
    supports:['material lot/property evidence changes with fill/pressure response','physical quality or property outcome moves consistently with material state'],
    weakens:['material characterization and lot identity remain stable while the process response changes independently'],
    alternatives:['machine transfer/capability drift','tool thermal condition','measurement-system change'],
    nextEvidence:'Preserve lot/reprocessing history and compare material characterization with actual machine/cavity response and physical quality.',
    recovery:'Material/process response should return toward its validated material-specific baseline after the causal material/process issue is corrected.',
    limitation:'Recycled-content, pressure, temperature, residence time, MFR/MVR and properties are not universal acceptance limits.',
    sourceIds:['doi:10.1016/j.jprocont.2026.103725','doi:10.1002/pen.26689']
  },
  {
    id:'surface-replication-release',
    title:'Surface replication, texture, adhesion and release',
    status:'promoted',
    aliases:['surface replication','texture replication','microtexture','micro-texture','surface adhesion','release texture'],
    signals:['cavity surface temperature','cavity pressure','thermal history'],
    outcomes:['replication quality','surface fidelity','release quality'],
    contexts:{materials:['PMMA','thermoplastics'],process:['variothermal injection moulding','micro-feature moulding'],tooling:['micro-texture','microfluidic feature'],sensors:['surface temperature','cavity pressure']},
    claim:'Surface replication and release depend on local thermal/pressure history, feature scale, polymer and tool surface, so appearance assumptions alone are insufficient.',
    supports:['measured feature replication changes with local thermal/pressure history','release response changes with measured surface/interface condition'],
    weakens:['metrology shows stable feature replication and interface condition while the suspected defect changes'],
    alternatives:['surface contamination','tool wear/damage','measurement/metrology variation'],
    nextEvidence:'Use physical surface metrology plus local pressure/temperature history when replication or release matters.',
    recovery:'Measured replication/release quality should return toward the qualified reference along with the local process response.',
    limitation:'Feature scale, polymer, tool surface and variothermal settings are application-specific.',
    sourceIds:['doi:10.1016/j.jmapro.2019.04.010','doi:10.1002/pen.24772']
  },
  {
    id:'injection-compression-precision-optics',
    title:'Injection-compression and precision optical moulding',
    status:'promoted',
    aliases:['injection compression','injection-compression','precision optics','optical lens','lens moulding','lens molding'],
    signals:['compression history','pressure history','temperature history'],
    outcomes:['birefringence','optical path difference','dimension','imaging quality'],
    contexts:{materials:['PC','PS','optical polymer'],process:['injection-compression moulding','precision optics'],tooling:['lens mould','optical mould'],sensors:['optical metrology','pressure']},
    claim:'Injection-compression history can materially affect residual birefringence, dimensional and optical performance; precision optics needs direct optical/stress metrology.',
    supports:['optical path/birefringence/dimensional outcomes move with compression history','physical optical performance improves when the relevant process history is corrected'],
    weakens:['direct optical/stress metrology remains unchanged across the suspected process shift'],
    alternatives:['material optical-property lot change','tool surface/coating change','optical measurement variation'],
    nextEvidence:'Measure optical/stress and dimensional outcomes alongside the actual compression/pressure history.',
    recovery:'Optical/stress and dimensional responses should return toward the qualified reference together.',
    limitation:'Polymer, lens geometry, compression gap/timing and optical acceptance criteria are application-specific.',
    sourceIds:['doi:10.1002/pat.6166','doi:10.1002/pen.23429']
  }
];

const SOURCE_META={
 'doi:10.3311/PPme.18246':{role:'primary-measured-study',quality:'high'},
 'doi:10.3390/mi12060636':{role:'primary-measured-study',quality:'high'},
 'doi:10.1002/pen.70492':{role:'primary-measured-study',quality:'high'},
 'doi:10.1002/pen.70647':{role:'primary-measured-study',quality:'high'},
 'doi:10.1016/j.icheatmasstransfer.2011.11.012':{role:'primary-measured-study',quality:'high'},
 'doi:10.1016/j.polymertesting.2025.109035':{role:'primary-measured-study',quality:'high'},
 'doi:10.1002/pc.27232':{role:'primary-measured-study',quality:'high'},
 'doi:10.1002/app.70427':{role:'primary-measured-study',quality:'high'},
 'doi:10.3390/polym16202874':{role:'primary-measured-study',quality:'high'},
 'doi:10.3390/s23031735':{role:'primary-measured-study',quality:'high'},
 'doi:10.1002/app.22371':{role:'primary-measured-study',quality:'high'},
 'doi:10.1016/j.jmapro.2024.07.095':{role:'primary-measured-study',quality:'high'},
 'doi:10.1002/app.53381':{role:'primary-measured-study',quality:'high'},
 'doi:10.7735/ksmte.2014.23.2.206':{role:'primary-measured-study',quality:'high'},
 'doi:10.1155/2015/161938':{role:'primary-measured-study',quality:'high'},
 'doi:10.1002/pen.20832':{role:'primary-measured-study',quality:'high'},
 'doi:10.3390/app12031410':{role:'primary-measured-study',quality:'high'},
 'doi:10.37358/MP.20.1.5311':{role:'primary-measured-study',quality:'high'},
 'doi:10.1016/j.jprocont.2026.103725':{role:'primary-measured-study',quality:'high'},
 'doi:10.1002/pen.26689':{role:'primary-measured-study',quality:'high'},
 'doi:10.1016/j.jmapro.2019.04.010':{role:'primary-measured-study',quality:'high'},
 'doi:10.1002/pen.24772':{role:'primary-measured-study',quality:'high'},
 'doi:10.1002/pat.6166':{role:'primary-measured-study',quality:'high'},
 'doi:10.1002/pen.23429':{role:'primary-measured-study',quality:'high'}
};

const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const arr=v=>Array.isArray(v)?v:(v==null?[]:[v]);
const uniq=a=>[...new Set(a.filter(Boolean))];
function contains(text,needle){const t=norm(text),n=norm(needle);return !!n&&t.includes(n)}
function overlap(values,candidates){
  const a=arr(values).map(norm).filter(Boolean),b=arr(candidates).map(norm).filter(Boolean);
  if(!a.length||!b.length)return {matches:[],score:null};
  const matches=[];for(const x of a)for(const y of b)if(x.includes(y)||y.includes(x))matches.push(x.length<=y.length?x:y);
  return {matches:uniq(matches),score:Math.min(1,uniq(matches).length/Math.max(1,Math.min(a.length,b.length)))};
}
function contextFrom(input){
  if(typeof input==='string')return {text:input};
  const x=input&&typeof input==='object'?input:{};
  return {
    text:[x.text,...arr(x.symptoms),...arr(x.signals),...arr(x.outcomes),...arr(x.notes)].join(' '),
    materials:arr(x.materials||x.material||x.materialFamily),
    process:arr(x.process||x.processFamily),
    tooling:arr(x.tooling||x.tool||x.mould||x.mold),
    sensors:arr(x.sensors||x.sensor),
    signals:arr(x.signals),
    outcomes:arr(x.outcomes)
  };
}
function textScore(m,text){
  const needles=[m.title,...m.aliases,...m.signals,...m.outcomes];let score=0,hits=[];
  for(const n of needles)if(contains(text,n)){score+=n.split(/\s+/).length>1?2:1;hits.push(n)}
  return {score,hits:uniq(hits)};
}
function applicability(m,input){
  const c=contextFrom(input),parts={};let weighted=0,total=0;
  const defs=[['materials',3],['process',3],['tooling',2],['sensors',2],['signals',3],['outcomes',3]];
  for(const [key,w] of defs){const o=overlap(c[key],m.contexts?.[key]||m[key]);parts[key]=o;if(o.score!=null){weighted+=o.score*w;total+=w}}
  const score=total?weighted/total:null;
  const label=score==null?'unknown':score>=.72?'high':score>=.38?'moderate':'low';
  return {score,label,parts,reason:score==null?'Not enough structured case context to judge applicability.':`${label[0].toUpperCase()+label.slice(1)} applicability from available material/process/tool/signal/outcome overlap.`};
}
function retrieve(input,limit=5){
  const c=contextFrom(input),rows=MECHANISMS.map(m=>{const t=textScore(m,c.text),a=applicability(m,c);const appBoost=a.score==null?0:a.score*5;return {mechanism:m,textScore:t.score,textHits:t.hits,applicability:a,rank:t.score+appBoost}})
    .filter(x=>x.textScore>0||x.applicability.score>0)
    .sort((a,b)=>b.rank-a.rank||b.textScore-a.textScore)
    .slice(0,limit);
  return rows.map(x=>({
    id:x.mechanism.id,title:x.mechanism.title,status:x.mechanism.status,evidenceQuality:'high',applicability:x.applicability,
    whyMatched:x.textHits,claim:x.mechanism.claim,supports:x.mechanism.supports,weakens:x.mechanism.weakens,alternatives:x.mechanism.alternatives,
    nextEvidence:x.mechanism.nextEvidence,recovery:x.mechanism.recovery,limitation:x.mechanism.limitation,sources:x.mechanism.sourceIds.map(id=>({id,...SOURCE_META[id]})),rank:x.rank
  }));
}
function verificationPlan(input,mechanismId){
  const m=MECHANISMS.find(x=>x.id===mechanismId)||retrieve(input,1)[0]&&MECHANISMS.find(x=>x.id===retrieve(input,1)[0].id);
  if(!m)return null;const a=applicability(m,input);
  return {mechanismId:m.id,title:m.title,evidenceState:m.status,evidenceQuality:'high',applicability:a,
    hypothesis:m.claim,observe:uniq([...m.signals,...m.outcomes]),supportingPattern:m.supports,weakeningPattern:m.weakens,alternativeExplanations:m.alternatives,
    strongestNextCheck:m.nextEvidence,recoveryCriterion:m.recovery,boundary:m.limitation,
    safety:'Keep the test inside the validated process envelope and applicable machine/material/tool/site safety procedures. Research evidence does not authorize a new setpoint or limit.'};
}
function sourceCoverage(){
  return {version:VERSION,mechanisms:MECHANISMS.length,promoted:MECHANISMS.filter(x=>x.status==='promoted').length,primaryMeasuredLinks:uniq(MECHANISMS.flatMap(x=>x.sourceIds)).length};
}

window.MM_RESEARCH_EVIDENCE={version:VERSION,mechanisms:MECHANISMS,retrieve,applicability,verificationPlan,sourceCoverage,scope:'Contextual decision support. Evidence quality and case applicability are deliberately separate. Local measured evidence, validated process limits, supplier/machine documentation, approved site procedures and applicable safety controls remain authoritative for production decisions.'};
})();
