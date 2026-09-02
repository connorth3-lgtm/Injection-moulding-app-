'use strict';
const assert=require('assert');
const stats=require('./process-statistics-v2.js');

function close(a,b,tol=1e-9){assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`)}

const s=stats.summary([1,2,'',null,3],5);
assert.strictEqual(s.n,3);
assert.strictEqual(s.missing,2);
close(s.mean,2);

const ac=stats.lag1Autocorrelation([1,2,3,4,5,6,7,8]);
assert.ok(ac.r>.99,'monotonic series should show strong positive lag-1 autocorrelation');
assert.strictEqual(ac.strength,'strong');
assert.ok(ac.warning);

const rules=stats.spcRunRules([0,0,0,0,0,0,0,4],0,1);
assert.ok(rules.flags.includes('1-beyond-3sigma'));
const sameSide=stats.spcRunRules([1,1,1,1,1,1,1,1],0,1);
assert.ok(sameSide.flags.includes('8-same-side'));
const trend=stats.spcRunRules([1,2,3,4,5,6],3.5,1);
assert.ok(trend.flags.includes('6-trend'));
const twoOfThree=stats.spcRunRules([2.2,2.4,0],0,1);
assert.ok(twoOfThree.flags.includes('2-of-3-beyond-2sigma'));
const fourOfFive=stats.spcRunRules([1.2,1.3,1.4,1.5,0],0,1);
assert.ok(fourOfFive.flags.includes('4-of-5-beyond-1sigma'));

const diff=stats.meanDifference([1,2,3,4,5],[3,4,5,6,7]);
close(diff.difference,2);
assert.ok(Array.isArray(diff.ci95)&&diff.ci95.length===2);
assert.ok(diff.effectSize>1);

const rows=[];
for(let i=0;i<8;i++)rows.push({machine:i<4?'M1':'M2',mould:i<4?'T1':'T2',material_grade:i<4?'A':'B',job:i<4?'J1':'J2',cavity:i%2?'2':'1',pressure:i+(i%2?2:0)});
const strata=stats.stratify(rows,'pressure');
for(const dim of ['machine','mould','material','job']){
  assert.ok(strata[dim],`${dim} stratification missing`);
  assert.strictEqual(strata[dim].groupCount,2);
}
const cavity=stats.cavityVariance(rows,'pressure');
assert.strictEqual(cavity.available,true);
assert.strictEqual(cavity.cavityCount,2);
assert.ok(Number.isFinite(cavity.withinVariance));
assert.ok(Number.isFinite(cavity.betweenVariance));

const diag=stats.channelDiagnostics(rows,'pressure',{centre:3,sigma:1});
assert.ok(diag.spc.flags.length>0);
assert.ok(diag.stratification.machine);
assert.strictEqual(diag.cavityVariance.available,true);

const windowRows=[];
for(let i=0;i<20;i++)windowRows.push({machine:'M1',mould:'T1',material_grade:'A',job:'J1',cavity:String(i%2+1),pressure:i<10?10+(i%2):15+(i%2)});
const wd=stats.windowDiagnostics(windowRows,'pressure',10,10);
assert.strictEqual(wd.nBefore,10);
assert.strictEqual(wd.nAfter,10);
assert.ok(wd.difference>4);
assert.ok(wd.effectSize>5);
assert.ok(wd.after.spc.flags.length>0);
assert.ok(wd.sampleBalance===1);

const markup=stats.panelMarkup('windows',{changes:[{channel:'pressure',meaning:'Cavity pressure',advancedStatistics:wd}]});
assert.ok(markup.includes('Advanced statistical checks'));
assert.ok(markup.includes('Lag-1 r'));
assert.ok(markup.includes('SPC screens'));
assert.ok(markup.includes('Cavity B/W'));
assert.ok(markup.includes('95% approx CI'));
assert.ok(markup.includes('not specification limits'));

console.log('Advanced process statistics QA passed: missingness, approximate uncertainty/effect size, lag-1 autocorrelation, five run-rule screens, machine/mould/material/job stratification, cavity variance decomposition and UI boundaries verified.');
