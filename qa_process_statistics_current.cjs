'use strict';
const assert=require('assert');
const stats=require('./src/domains/process/process-statistics.js');
function close(a,b,tol=1e-9){assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`)}

const s=stats.summary([1,2,'',null,3],5);
assert.strictEqual(s.n,3);assert.strictEqual(s.missing,2);close(s.mean,2);

const ac=stats.lag1Autocorrelation([1,2,3,4,5,6,7,8]);
assert.ok(ac.r>.99);assert.strictEqual(ac.strength,'strong');assert.ok(ac.warning);
const gapAc=stats.lag1Autocorrelation([1,2,null,100,101]);
assert.strictEqual(gapAc.nPairs,2,'missing values must break lag pairs rather than bridge them');

const rules=stats.spcRunRules([0,0,0,0,0,0,0,4],0,1);assert.ok(rules.flags.includes('1-beyond-3sigma'));
assert.ok(stats.spcRunRules([1,1,1,1,1,1,1,1],0,1).flags.includes('8-same-side'));
assert.ok(stats.spcRunRules([1,2,3,4,5,6],3.5,1).flags.includes('6-trend'));
assert.ok(stats.spcRunRules([2.2,2.4,0],0,1).flags.includes('2-of-3-beyond-2sigma'));
assert.ok(stats.spcRunRules([1.2,1.3,1.4,1.5,0],0,1).flags.includes('4-of-5-beyond-1sigma'));
assert.ok(stats.spcRunRules([1,0,1,0,1,0,1,0,1,0,1,0,1,0],0.5,0.25).flags.includes('14-alternating'));
assert.ok(!stats.spcRunRules([1,1,1,1,null,1,1,1,1],0,1).flags.includes('8-same-side'),'missing values must break run-rule sequences');

const diff=stats.meanDifference([1,2,3,4,5],[3,4,5,6,7]);close(diff.difference,2);assert.ok(Array.isArray(diff.ci95));assert.ok(diff.effectSize>1);
const rows=[];for(let i=0;i<8;i++)rows.push({machine:i<4?'M1':'M2',mould:i<4?'T1':'T2',material_grade:i<4?'A':'B',job:i<4?'J1':'J2',cavity:i%2?'2':'1',fill_time_s:i+(i%2?2:0)});
const strata=stats.stratify(rows,'fill_time_s');for(const d of ['machine','mould','material','job'])assert.strictEqual(strata[d].groupCount,2);
const cavity=stats.cavityVariance(rows,'fill_time_s');assert.strictEqual(cavity.available,true);assert.strictEqual(cavity.cavityCount,2);assert.ok(Number.isFinite(cavity.withinVariance));

const resolvedRegistry={resolve:(name,opt)=>({status:opt.confirmed?'resolved':'review-required',canonicalId:name,unit:'s',role:'derived',actualness:'actual',reason:opt.confirmed?'confirmed':'confirmation required'})};
const diag=stats.channelDiagnostics(rows,'fill_time_s',{signalRegistry:resolvedRegistry,confirmed:true,centre:3,sigma:1});
assert.strictEqual(diag.engineeringEvidenceReady,true);assert.ok(diag.spc.flags.length>0);assert.strictEqual(diag.cavityVariance.available,true);
const unresolved=stats.channelDiagnostics(rows,'fill_time_s',{signalRegistry:resolvedRegistry,confirmed:false});assert.strictEqual(unresolved.engineeringEvidenceReady,false);
const unknown=stats.channelDiagnostics(rows,'unknown_signal');assert.strictEqual(unknown.engineeringEvidenceReady,false);assert.strictEqual(unknown.semantics.status,'review-required');

const windowRows=[];for(let i=0;i<20;i++)windowRows.push({machine:'M1',mould:'T1',material_grade:'A',job:'J1',cavity:String(i%2+1),fill_time_s:i<10?10+(i%2):15+(i%2)});
const wd=stats.windowDiagnostics(windowRows,'fill_time_s',10,10,{signalRegistry:resolvedRegistry,confirmed:true});
assert.strictEqual(wd.nBefore,10);assert.strictEqual(wd.nAfter,10);assert.ok(wd.difference>4);assert.ok(wd.effectSize>5);assert.strictEqual(wd.sampleBalance,1);assert.strictEqual(wd.before.engineeringEvidenceReady,true);

for(const phrase of ['not specification limits','automatic production-change authority'])assert.ok(stats.boundary.includes(phrase));
console.log('Current process statistics QA passed: missingness-safe lag/run sequences, six SPC attention screens, approximate effect uncertainty, four-way stratification, cavity decomposition and fail-closed canonical signal semantics verified.');
