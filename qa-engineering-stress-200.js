/* Deterministic 200-case stress/property QA for engineering-calculation-engine.js */
'use strict';
const assert=require('assert'),C=require('./engineering-calculation-engine.js');
let assertions=0;
const ok=(v,m)=>{assert.ok(v,m);assertions++};
const eq=(a,b,m)=>{assert.strictEqual(a,b,m);assertions++};
const near=(a,b,e=1e-8,m='')=>{assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=e*Math.max(1,Math.abs(b)),`${m} ${a} != ${b}`);assertions++};
let seed=0x5EEDC0DE>>>0;
const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
const r=(a,b)=>a+(b-a)*rnd(),ri=(a,b)=>Math.floor(r(a,b+1));
for(let i=0;i<200;i++){
  const cavities=ri(1,16),partArea=r(50,25000),runnerArea=r(0,2500),otherArea=r(0,1000);
  const area=C.projectedArea({partAreaMm2:partArea,cavityCount:cavities,runnerAreaMm2:runnerArea,otherPressurisedAreaMm2:otherArea});
  near(area.outputs.projectedAreaMm2.value,partArea*cavities+runnerArea+otherArea,1e-10,'area');

  const p=r(15,120),reserve=r(1,1.35);
  const clamp=C.clampForce({projectedAreaMm2:area.outputs.projectedAreaMm2,effectiveCavityPressureMpa:{value:p,origin:C.ORIGINS.MEASURED,domain:C.PRESSURE_DOMAINS.CAVITY},reserveFactor:reserve});
  near(clamp.outputs.requiredClampN.value,area.outputs.projectedAreaMm2.value*p*reserve,1e-10,'clamp');
  near(clamp.outputs.requiredClampKn.value*1000,clamp.outputs.requiredClampN.value,1e-10,'kN');
  ok(clamp.outputs.requiredClampN.confidence>=0&&clamp.outputs.requiredClampN.confidence<=1,'confidence');

  const hyd=r(2,25),ratio=r(5,18);
  const spec=C.pressureConvert({pressure:{value:hyd,origin:C.ORIGINS.OEM_SPEC,domain:C.PRESSURE_DOMAINS.HYDRAULIC},fromDomain:C.PRESSURE_DOMAINS.HYDRAULIC,toDomain:C.PRESSURE_DOMAINS.SPECIFIC_PLASTIC,intensificationRatio:ratio});
  const back=C.pressureConvert({pressure:spec.outputs.pressure,fromDomain:C.PRESSURE_DOMAINS.SPECIFIC_PLASTIC,toDomain:C.PRESSURE_DOMAINS.HYDRAULIC,intensificationRatio:ratio});
  near(back.outputs.pressure.value,hyd,1e-10,'pressure round trip');

  const partV=r(0.2,250),partM=r(0.2,500),coldV=r(0,30),coldM=r(0,50),hotV=r(0,80),hotM=r(0,100);
  const shot=C.recurringShot({partVolumeCm3:partV,partMassG:partM,cavityCount:cavities,coldRunnerVolumeCm3:coldV,coldRunnerMassG:coldM,hotRunnerInventoryCm3:hotV,hotRunnerInventoryMassG:hotM});
  near(shot.outputs.recurringShotVolumeCm3.value,partV*cavities+coldV,1e-10,'shot volume');
  near(shot.outputs.recurringShotMassG.value,partM*cavities+coldM,1e-10,'shot mass');
  eq(shot.outputs.hotRunnerInventoryCm3,hotV);
  ok(shot.warnings.some(x=>x.code==='HOT_RUNNER_INVENTORY_EXCLUDED'),'hot runner warning');

  const d=r(15,120),cush=r(0,12);
  const stroke=C.screwStroke({shotVolumeCm3:shot.outputs.recurringShotVolumeCm3.value,screwDiameterMm:d,targetCushionMm:cush});
  near(stroke.outputs.injectionStrokeMm.value,shot.outputs.recurringShotVolumeCm3.value*1000/(Math.PI*d*d/4),1e-10,'stroke');
  near(stroke.outputs.requiredMeteringStrokeMm.value,stroke.outputs.injectionStrokeMm.value+cush,1e-10,'metering');

  const fillT=r(0.05,10);
  const flow=C.fillRate({fillVolumeCm3:shot.outputs.recurringShotVolumeCm3.value,fillTimeS:fillT,screwDiameterMm:d});
  near(flow.outputs.volumetricFlowCm3S.value,shot.outputs.recurringShotVolumeCm3.value/fillT,1e-10,'flow');
  near(flow.outputs.screwVelocityMmS.value,flow.outputs.volumetricFlowCm3S.value*1000/(Math.PI*d*d/4),1e-10,'screw velocity');

  const cycle=r(4,120);
  const kg=C.plasticisingThroughput({shotMassG:shot.outputs.recurringShotMassG.value,cycleTimeS:cycle});
  near(kg.outputs.requiredKgH.value,shot.outputs.recurringShotMassG.value*3.6/cycle,1e-10,'throughput');

  const inv=r(50,4000);
  const residence=C.residenceTime({heatedInventoryMassG:inv,shotMassG:shot.outputs.recurringShotMassG.value,cycleTimeS:cycle,hotRunnerInventoryMassG:hotM});
  near(residence.outputs.totalHeatedSystemAverageResidenceMin.value,(inv+hotM)/(shot.outputs.recurringShotMassG.value/cycle)/60,1e-10,'residence');

  const thick=r(.5,8),alpha=r(.04,.2),wall=r(15,120),eject=wall+r(15,90),melt=eject+r(40,220);
  const cool1=C.coolingTime({governingThicknessMm:thick,thermalDiffusivityMm2S:alpha,meltTemperatureC:melt,moldWallTemperatureC:wall,ejectionTemperatureC:eject});
  const cool2=C.coolingTime({governingThicknessMm:thick*2,thermalDiffusivityMm2S:alpha,meltTemperatureC:melt,moldWallTemperatureC:wall,ejectionTemperatureC:eject});
  near(cool2.outputs.theoreticalCoolingTimeS.value/cool1.outputs.theoreticalCoolingTimeS.value,4,1e-10,'cooling thickness squared');

  const close=r(0,5),fill=r(0,5),hold=r(0,20),recovery=r(0,30),cool=r(0,40),open=r(0,5),ejectT=r(0,5),handling=r(0,10),other=r(0,5);
  const cyc=C.cycleTime({moldCloseS:close,fillS:fill,holdS:hold,recoveryS:recovery,coolingFromEndFillS:cool,moldOpenS:open,ejectS:ejectT,handlingS:handling,otherS:other});
  near(cyc.outputs.cycleTimeS.value,close+fill+Math.max(cool,hold+recovery)+open+ejectT+handling+other,1e-10,'cycle overlap');

  const target=r(1,1000),shrink=r(0,5);
  const tool=C.shrinkageToolDimension({targetPartDimensionMm:target,shrinkagePercent:shrink});
  near(tool.outputs.mouldDimensionMm.value*(1-shrink/100),target,1e-10,'shrink inverse');

  const partVol=r(1,100),runnerCommon=r(0,20),runnerPer=r(0,5),shotCap=r(partVol*4+runnerCommon,partVol*30+runnerCommon);
  const partProj=r(50,5000),areaCommon=r(0,1000),areaRunner=r(0,300),cavityP=r(20,100),rf=r(1,1.25),clampCap=r(1000,20000);
  const flowCap=ri(2,30),plastCap=ri(2,30),fitCap=ri(2,30);
  const mx=C.maxCavities({shotAllowableVolumeCm3:shotCap,partVolumeCm3:partVol,runnerCommonVolumeCm3:runnerCommon,runnerPerCavityVolumeCm3:runnerPer,clampAllowableKn:clampCap,effectiveCavityPressureMpa:{value:cavityP,origin:C.ORIGINS.ESTIMATED,domain:C.PRESSURE_DOMAINS.CAVITY},reserveFactor:rf,partProjectedAreaMm2:partProj,areaCommonMm2:areaCommon,areaRunnerPerCavityMm2:areaRunner,flowMaxCavities:flowCap,plasticisingMaxCavities:plastCap,mouldFitMaxCavities:fitCap});
  const mins=mx.outputs.constraints.map(x=>x.max);
  eq(mx.outputs.candidateMaxCavities.value,Math.min(...mins));
  eq(mx.status,mx.outputs.candidateMaxCavities.value<1?C.STATUS.FAIL:C.STATUS.PASS_VERIFIED);

  const lim=r(1,1000),actual=r(0,lim*.85);
  const chk=C.evaluateCheck('random-max',actual,lim,{direction:'max',nearLimitFraction:.9,evidenceConfidence:.95});
  eq(chk.status,C.STATUS.PASS_VERIFIED);
  ok(Number.isFinite(chk.utilisation),'finite utilisation');
}
assert.throws(()=>C.clampForce({projectedAreaMm2:100,effectiveCavityPressureMpa:{value:40,origin:C.ORIGINS.MEASURED}}),/explicit CAVITY domain/i);assertions++;
assert.throws(()=>C.clampForce({projectedAreaMm2:100,effectiveCavityPressureMpa:40,reserveFactor:NaN}),/finite/i);assertions++;
assert.throws(()=>C.pressureConvert({pressure:10,fromDomain:'FOO',toDomain:'FOO'}),/unknown pressure domain/i);assertions++;
assert.throws(()=>C.pressureConvert({pressure:{value:10,domain:C.PRESSURE_DOMAINS.CAVITY},fromDomain:C.PRESSURE_DOMAINS.HYDRAULIC,toDomain:C.PRESSURE_DOMAINS.SPECIFIC_PLASTIC,intensificationRatio:10}),/does not match/i);assertions++;
assert.throws(()=>C.recurringShot({partMassG:10,hotRunnerInventoryMassG:'bad'}),/finite/i);assertions++;
assert.throws(()=>C.evaluateCheck('bad-direction',1,2,{direction:'sideways'}),/direction/i);assertions++;
assert.throws(()=>C.evaluateCheck('bad-confidence',1,2,{evidenceConfidence:1.2}),/between 0 and 1/i);assertions++;
const zero=C.evaluateCheck('zero-capacity',0,0,{direction:'max'});eq(zero.utilisation,0);eq(zero.status,C.STATUS.PASS_VERIFIED);
const nonCriticalFail=C.machineSuitability({checks:[C.evaluateCheck('optional',11,10,{critical:false})]});eq(nonCriticalFail.status,C.STATUS.WARNING);
const noCavity=C.maxCavities({shotAllowableVolumeCm3:5,partVolumeCm3:10});eq(noCavity.outputs.candidateMaxCavities.value,0);eq(noCavity.status,C.STATUS.FAIL);ok(noCavity.warnings.some(x=>x.code==='NO_FEASIBLE_CAVITY'),'zero cavity warning');
const thinCoverage=C.maxCavities({flowMaxCavities:8,plasticisingMaxCavities:9,mouldFitMaxCavities:10});eq(thinCoverage.status,C.STATUS.PASS_PROVISIONAL);ok(thinCoverage.warnings.some(x=>x.code==='CAVITY_CONSTRAINT_COVERAGE'),'coverage warning');
const calibrated=C.pressureConvert({pressure:{value:10,domain:C.PRESSURE_DOMAINS.HYDRAULIC},fromDomain:C.PRESSURE_DOMAINS.HYDRAULIC,toDomain:C.PRESSURE_DOMAINS.SPECIFIC_PLASTIC,intensificationRatio:10,calibrationFactor:12});ok(calibrated.warnings.some(x=>x.code==='CALIBRATION_OVERRIDES_GEOMETRIC_RATIO'),'calibration warning');
console.log(`qa-engineering-stress-200: PASS — 200 deterministic cases, ${assertions} assertions, seed 0x5EEDC0DE`);
