'use strict';

// Behavioural regression checks against the actual Mission Control source,
// rather than source-text markers. Uses an isolated VM and fake device storage.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'src/domains/shell/mission-control.js'),'utf8');
const profileKey='mouldmasterProDB';
const scopedKey=id=>'mm_mission_control_v1::t'+id;

function harness(){
  const memory=new Map(),boundActions=[],listeners=new Map();
  const track=(owner,type,handler)=>{const key=owner+':'+type;if(!listeners.has(key))listeners.set(key,[]);listeners.get(key).push(handler)};
  const storage={
    getItem:key=>memory.has(key)?memory.get(key):null,
    setItem:(key,value)=>memory.set(key,String(value)),
    removeItem:key=>memory.delete(key)
  };
  let host=null;
  const document={
    readyState:'loading',addEventListener(type,handler){track('document',type,handler)},
    getElementById:id=>id==='mmMissionControl'?host:null,
    body:{dataset:{},classList:{toggle(){}}}
  };
  const window={
    addEventListener(type,handler){track('window',type,handler)},dispatchEvent(){},
    MM_LEARNER_SCOPE:{
      tokenFor:id=>'t'+id,
      storageKey:(prefix,token)=>prefix+token
    }
  };
  const context={
    window,document,localStorage:storage,
    CustomEvent:class CustomEvent{constructor(name,options){this.type=name;this.detail=options?.detail}},
    setTimeout:()=>1,clearTimeout(){},requestAnimationFrame(){},
    prompt:()=>null,console
  };
  function select(id){
    storage.setItem(profileKey,JSON.stringify({
      activeUser:id,
      users:{A:{id:'A'},B:{id:'B'}}
    }));
  }
  function read(id){
    const raw=storage.getItem(scopedKey(id));
    return raw?JSON.parse(raw):null;
  }
  function attachHost(){
    host={
      innerHTML:'',
      querySelector(){return null},
      querySelectorAll(selector){
        if(selector!=='[data-mm-mc-evidence-remove]')return [];
        return [...this.innerHTML.matchAll(/data-mm-mc-evidence-remove="([^"]+)"/g)]
          .map(row=>({
            dataset:{mmMcEvidenceRemove:row[1]},
            addEventListener(type,handler){
              if(type==='click')boundActions.push({id:row[1],handler});
            }
          }));
      }
    };
    return host;
  }
  function start(){vm.runInNewContext(source,context,{filename:'mission-control.js'});return window.MM_MISSION_CONTROL}
  const fireEvent=(owner,type)=>{for(const fn of listeners.get(owner+':'+type)||[])fn()};
  return {memory,storage,select,read,attachHost,start,boundActions,fireEvent};
}

// Stale buttons must neither copy A's evidence to B nor delete B's records.
{
  const h=harness();h.select('A');
  const api=h.start();
  api.startMission({title:'Learner A private work'});
  api.addEvidence({kind:'measured',text:'A-only confidential measurement'});
  api.addEvidence({kind:'note',text:'A-only context'});
  const before=h.read('A');
  const host=h.attachHost();api.toggleDrawer(true);
  const stale=h.boundActions.find(action=>action.id===before.evidence[0].id);
  assert.ok(stale,'evidence delete button must be bound');
  h.select('B');h.fireEvent('window','focus');
  assert.ok(!host.innerHTML.includes('Learner A private work'),'old learner mission must not remain visible after a profile switch');
  assert.ok(!host.innerHTML.includes('A-only confidential measurement'),'old learner evidence must not remain on screen');
  stale.handler();
  assert.equal(h.read('B'),null,'stale A button must not write A state to learner B');
  assert.equal(h.read('A').evidence.length,2,'A evidence must remain intact');
  api.startMission({title:'Learner B new work'});
  api.addEvidence({kind:'note',text:'B-only context'});
  assert.equal(h.read('B').evidence.length,1);
  assert.equal(h.read('B').evidence[0].text,'B-only context');
  h.select('A');api.setMode('technician');
  assert.equal(h.read('A').evidence.length,2,'A state remains restorable');
}

// Ownership must be checked before the FIRST hydration tick after startup.
{
  const h=harness();h.select('A');
  h.storage.setItem(scopedKey('A'),JSON.stringify({
    mode:'learner',mission:{title:'A stored work'},
    evidence:[{id:'private-a',text:'Private A',kind:'measured',at:'2026-10-08T00:00:00.000Z'}]
  }));
  const api=h.start();
  h.select('B');api.setMode('engineer');
  assert.equal(h.read('B').evidence.length,0,'startup must not assign initial A storage to B');
  assert.equal(h.read('B').mission,null);
  assert.equal(h.read('A').evidence[0].text,'Private A');
}

// Public state snapshots must not expose the previous learner before any UI event.
{
  const h=harness();h.select('A');const api=h.start();
  api.startMission({title:'Private A snapshot'});
  api.addEvidence({kind:'note',text:'Private A evidence'});
  h.select('B');
  const next=api.state();
  assert.equal(next.mission,null,'B must not read the previous learner mission');
  assert.equal(next.evidence.length,0,'B must not read the previous learner evidence');
  assert.equal(h.read('B'),null,'read-only state access must not write new profile data');
  assert.equal(h.read('A').evidence[0].text,'Private A evidence');
}

// Corrupt and untrusted evidence rows are discarded/normalised before render.
{
  const h=harness();h.select('A');
  h.storage.setItem(scopedKey('A'),JSON.stringify({
    mission:{title:'Review restored data'},
    evidence:[null,12,[],{}, {id:'ok',kind:'measured',text:'Valid',at:'invalid time'},
      {id:'ok2',kind:'unexpected',text:'Second',at:'2026-10-08T00:00:00Z'}]
  }));
  const api=h.start();
  api.setMode('engineer');
  const snapshot=api.state();
  assert.equal(snapshot.evidence.length,2);
  assert.equal(snapshot.evidence[0].text,'Valid');
  assert.equal(snapshot.evidence[0].at,'');
  assert.equal(snapshot.evidence[1].kind,'note');
  const host=h.attachHost();
  assert.doesNotThrow(()=>api.toggleDrawer(true));
  assert.match(host.innerHTML,/Time unavailable/);
}

// Genuine unscoped work begun during bootstrap may still be saved when the
// first learner identity becomes available; it must not be silently lost.
{
  const h=harness();const api=h.start();
  api.startMission({title:'Started before sign-in'});
  h.select('A');api.setMode('learner');
  assert.equal(h.read('A').mission.title,'Started before sign-in');
}

// Valid, in-profile controls must still support ordinary evidence deletion.
{
  const h=harness();h.select('A');const api=h.start();
  api.startMission({title:'Safe deletion'});
  api.addEvidence({kind:'note',text:'Delete me'});
  api.addEvidence({kind:'note',text:'Keep me'});
  const toRemove=h.read('A').evidence[0].id;
  h.attachHost();api.toggleDrawer(true);
  const action=h.boundActions.find(x=>x.id===toRemove);
  assert.ok(action);
  action.handler();
  assert.equal(h.read('A').evidence.length,1);
  assert.equal(h.read('A').evidence[0].text,'Keep me');
}
console.log('Mission Control isolation QA passed: profile switches, stale-view privacy, first hydration, corrupt restoration, unscoped work and same-profile deletion.');
