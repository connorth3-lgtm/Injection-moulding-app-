/* Node regression QA for engineering-calculation-engine.js */
'use strict';const assert=require('assert'),C=require('./engineering-calculation-engine.js');
const near=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`);
near(C.clampForce({projectedAreaMm2:27000,effectiveCavityPressureMpa:{value:40,origin:C.ORIGINS.MEASURED,domain:C.PRESSURE_DOMAINS.CAVITY},reserveFactor:1.2}).outputs.requiredClampKn.value,1296);
near(C.screwStroke({shotVolumeCm3:100,screwDiameterMm:40,targetCushionMm:4}).outputs.requiredMeteringStrokeMm.value,83.5774715459,1e-8);
near(C.coolingTime({governingThicknessMm:3,thermalDiffusivityMm2S:.1,meltTemperatureC:230,moldWallTemperatureC:50,ejectionTemperatureC:90}).outputs.theoreticalCoolingTimeS.value,15.9183450622,1e-6);
near(C.plasticisingThroughput({shotMassG:120,cycleTimeS:24}).outputs.requiredKgH.value,18);
near(C.residenceTime({heatedInventoryMassG:450,shotMassG:90,cycleTimeS:30}).outputs.barrelAverageResidenceMin.value,2.5);
near(C.cycleTime({moldCloseS:2,fillS:1,holdS:5,recoveryS:6,coolingFromEndFillS:15,moldOpenS:2,ejectS:2}).outputs.cycleTimeS.value,22);
near(C.shrinkageToolDimension({targetPartDimensionMm:100,shrinkagePercent:1.5}).outputs.mouldDimensionMm.value,101.5228426396,1e-8);
assert.throws(()=>C.clampForce({projectedAreaMm2:100,effectiveCavityPressureMpa:{value:40,domain:C.PRESSURE_DOMAINS.HYDRAULIC}}),/cavity pressure/i);
assert.throws(()=>C.pressureConvert({pressure:10,fromDomain:C.PRESSURE_DOMAINS.SPECIFIC_PLASTIC,toDomain:C.PRESSURE_DOMAINS.CAVITY,intensificationRatio:10}),/cavity pressure/i);
assert.throws(()=>C.coolingTime({governingThicknessMm:3,thermalDiffusivityMm2S:.1,meltTemperatureC:230,moldWallTemperatureC:90,ejectionTemperatureC:80}),/requires melt/i);
const fail=C.machineSuitability({checks:[C.evaluateCheck('flow',130,120)]});assert.equal(fail.status,C.STATUS.FAIL);
assert.equal(Object.keys(C.CONTRACTS).length,13);console.log('qa-engineering: PASS');
