'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('measured-learning-library.js','utf8');

function response(payload,{ok=true}={}){
  return {ok,async json(){return payload}};
}

async function runScenario(fetchImpl){
  const registrations=[];
  const appended=[];
  const warnings=[];
  const document={
    getElementById(){return null},
    createElement(tag){return {tagName:String(tag).toUpperCase(),dataset:{},addEventListener(){}}},
    head:{appendChild(node){appended.push(node);return node}},
    body:{appendChild(node){appended.push(node);return node}},
    documentElement:{style:{removeProperty(){}}}
  };
  const window={
    MM_APP_SHELL:{
      navigation:{
        register(item){registrations.push(item);return ()=>{const i=registrations.indexOf(item);if(i>=0)registrations.splice(i,1)}},
        setCustomActive(){}
      }
    }
  };
  const context={
    window,
    document,
    fetch:fetchImpl,
    console:{warn(...args){warnings.push(args.join(' '))}},
    Map,
    Set,
    Number,
    String,
    Array,
    Object,
    Math,
    Promise,
    encodeURIComponent
  };
  vm.createContext(context);
  vm.runInContext(source,context,{filename:'measured-learning-library.js'});
  assert.ok(window.MM_MEASURED_LEARNING_LIBRARY,'runtime API should be exported');
  await window.MM_MEASURED_LEARNING_LIBRARY.activationPromise;
  return {window,registrations,appended,warnings};
}

function manifest(caseIds){
  return {
    schemaVersion:1,
    libraryId:'measured-learning-library-v1',
    caseIds,
    boundary:'Only independently reviewed promoted cases are learner-visible.'
  };
}

(async()=>{
  {
    const result=await runScenario(async()=>response(manifest([])));
    assert.equal(result.registrations.length,0,'empty promotion index must not register navigation');
    assert.equal(result.window.MM_MEASURED_LEARNING_LIBRARY.state.activation,'inactive');
    assert.equal(result.appended.filter(x=>x.tagName==='LINK').length,0,'empty promotion index must not load feature CSS');
  }
  {
    const result=await runScenario(async()=>response(manifest(['MLM-003'])));
    assert.equal(result.registrations.length,1,'valid non-empty promotion index should register navigation once');
    assert.equal(result.registrations[0].id,'measured-learning');
    assert.equal(result.window.MM_MEASURED_LEARNING_LIBRARY.state.activation,'active');
    const links=result.appended.filter(x=>x.tagName==='LINK');
    assert.equal(links.length,1,'activation should load one feature stylesheet');
    assert.equal(links[0].href,'./measured-learning-library.css');
  }
  {
    const result=await runScenario(async()=>response(manifest(['MLM-999'])));
    assert.equal(result.registrations.length,0,'out-of-catalogue ID shape must fail closed');
  }
  {
    const result=await runScenario(async()=>response(manifest(['MLM-003','MLM-003'])));
    assert.equal(result.registrations.length,0,'duplicate promoted IDs must fail closed');
  }
  {
    const result=await runScenario(async()=>response({}, {ok:false}));
    assert.equal(result.registrations.length,0,'non-OK promotion response must fail closed');
  }
  {
    const result=await runScenario(async()=>{throw new Error('offline')});
    assert.equal(result.registrations.length,0,'promotion fetch failure must fail closed');
    assert.equal(result.warnings.length,1,'fetch failure should emit one bounded warning');
  }
  console.log('Measured-learning activation gate: 6 scenarios passed');
})().catch(err=>{console.error(err);process.exitCode=1});
