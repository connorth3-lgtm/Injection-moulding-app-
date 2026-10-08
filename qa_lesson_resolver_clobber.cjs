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

// Every lesson consumer must remain available with a poisoned global.
for(const [file,func] of [
  ['lesson-simple-experience.js','coreContext'],
  ['src/domains/shell/app-shell-registry.js','shellCurrentLesson'],
  ['learning-analytics.js','lessonId']
]){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  const match=source.match(new RegExp('function '+func+'\\(\\)\\{[\\s\\S]*?\\n\\}'));
  assert.ok(match,'missing '+func+' in '+file);
  const run=new Function('D','user','currentLesson','mmCoreSafeLesson',match[0]+';return '+func+'()');
  const value=run(D,user,poisonedGlobal,undefined);
  assert.equal(func==='lessonId'?value:value.lesson?.id??value?.id,func==='lessonId'?'2':2,file+': valid lesson must remain available');
}

for(const file of [
  'curriculum-integration.js',
  'src/domains/runtime-packs/curriculum-workspace-runtime-pack.js'
]){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  const match=source.match(/const resolvedCurriculumLesson=\(\)=>[\s\S]*?;\n/);
  assert.ok(match,file+': missing protected curriculum resolver');
  const run=new Function('D','user','currentLesson','mmCoreSafeLesson',match[0]+'return resolvedCurriculumLesson()');
  assert.equal(run(D,user,poisonedGlobal,undefined).id,2);
  assert.equal(run(D,user,poisonedGlobal,()=>D.lessons[0]).id,1);
}

for(const file of [
  'learning-experience.js',
  'primary-learning-practice-hubs.js',
  'curriculum-integration.js',
  'lesson-simple-experience.js',
  'learning-analytics.js',
  'training-upgrade.js',
  'src/domains/shell/app-shell-registry.js',
  'src/domains/runtime-packs/learning-process-diagnostics-runtime-pack.js',
  'src/domains/runtime-packs/curriculum-workspace-runtime-pack.js',
  'src/domains/runtime-packs/learning-foundation-runtime-pack.js'
]){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  assert.doesNotMatch(source,/(?<![A-Za-z])currentLesson\(\)/,
    file+': mutable global currentLesson() must not be invoked directly');
}
console.log('Clobbered currentLesson global regression passed in learning source, generated pack and Learn/Practice hub.');
