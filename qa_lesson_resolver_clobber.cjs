'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=__dirname;
const D={
  lessons:[{id:1,course:3,title:'One'},{id:2,course:3,title:'Two'}],
  courses:[{id:3,lessonIds:[1,2]}]
};
const user={currentLesson:2,completed:[1]};
const poisonedGlobal={overwritten:true};

function resolve(file,functionName,{safeCore}={}){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  const fnSource=source.match(new RegExp('function '+functionName+'\\(\\)\\{[\\s\\S]*?\\n\\}'));
  assert.ok(fnSource,'expected '+functionName+'() in '+file);
  const run=new Function('D','user','currentLesson','mmCoreSafeLesson',fnSource[0]+';return '+functionName+'()');
  return run(D,user,poisonedGlobal,safeCore);
}
for(const [file,name] of [
  ['learning-experience.js','context'],
  ['src/domains/runtime-packs/learning-process-diagnostics-runtime-pack.js','context'],
  ['primary-learning-practice-hubs.js','lessonContext']
]){
  const backup=resolve(file,name);
  assert.equal(backup.lesson.id,2,file+': clobbered global must not break lesson lookup');
  assert.equal(backup.course.id,3);
  const preferred=resolve(file,name,{safeCore:()=>D.lessons[0]});
  assert.equal(preferred.lesson.id,1,file+': canonical core resolver should take precedence');
}
console.log('Clobbered currentLesson global regression passed in learning source, generated pack and Learn/Practice hub.');
