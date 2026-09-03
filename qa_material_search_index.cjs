'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const context={window:{},console};
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/domains/materials/material-search-index.js','utf8'),context,{filename:'material-search-index.js'});
const api=context.window.MM_MATERIAL_SEARCH;
assert(api&&typeof api.searchPage==='function','material search API missing');

const grades=Array.from({length:135},(_,i)=>({
  id:`mat-example-${String(i+1).padStart(3,'0')}`,
  manufacturer:{id:i<70?'mfr-alpha':'mfr-beta',name:i<70?'Alpha Polymers':'Beta Resins'},
  brand:i%2===0?'ToughForm':'FlowForm',
  grade:`G-${i+1}`,
  aliases:i===5?['hero grade']:[],
  polymer:{family:i%3===0?'POM':'PC/ABS'},
  identity:{variantId:i%10===0?'GF20':''},
}));
api._buildForTest(grades);

(async()=>{
  const first=await api.searchPage('',{page:1,pageSize:25});
  assert.strictEqual(first.total,135);
  assert.strictEqual(first.items.length,25);
  assert.strictEqual(first.pageCount,6);
  assert.strictEqual(first.hasNext,true);
  assert.strictEqual(first.hasPrevious,false);

  const last=await api.searchPage('',{page:6,pageSize:25});
  assert.strictEqual(last.items.length,10);
  assert.strictEqual(last.hasNext,false);
  assert.strictEqual(last.hasPrevious,true);

  const filtered=await api.searchPage('alpha pc abs',{manufacturerId:'mfr-alpha',pageSize:100});
  assert(filtered.total>0&&filtered.items.every(x=>x.manufacturer.id==='mfr-alpha'&&x.polymer.family==='PC/ABS'));

  const alias=await api.searchPage('hero grade');
  assert.deepStrictEqual(alias.items.map(x=>x.id),['mat-example-006']);

  console.log(`MouldMaster material search QA passed (${first.total} indexed fixtures, ${first.pageCount} pages).`);
})().catch(err=>{console.error(err);process.exitCode=1});
