'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const readText=rel=>fs.readFileSync(path.join(__dirname,rel),'utf8');
const readJson=rel=>JSON.parse(readText(rel));
global.document={readyState:'loading',addEventListener(){},getElementById(){return null},querySelector(){return null}};
global.window={addEventListener(){}};
global.requestAnimationFrame=()=>{};
require('./src/domains/engineering/virtual-apprenticeship.js');
const va=window.MM_VIRTUAL_APPRENTICESHIP;
const adapter=require('./src/experimental/new1-virtual-factory-case-one.js');
const lab=require('./src/experimental/new1-academy-core.js');
const factoryData=readJson('data/new1-factory-evidence-v1.json');
const book=readJson('data/book-manifest-v1.json');
const crosswalk=readJson('data/book-curriculum-crosswalk-v1.json');
assert.equal(va.cases.length,6);
assert.equal(va.cases[1].id,'VA-02');
assert.deepEqual(lab.pathways.map(x=>x.id),['operator','setter','technician','troubleshooter','engineer']);
assert.equal(lab.pathways.every(x=>x.caseIds.every(id=>lab.caseIds.includes(id))),true);
assert.equal(factoryData.notMeasured,true);
assert.equal(factoryData.notAcceptanceLimit,true);
const factory=lab.validateFactoryEvidence(factoryData);
assert.equal(factory.shots.length,20);
assert.equal(factory.compare('baseline').length,4);
assert.ok(factory.compare('fault')[3].changeFromBaseline<-1,'Only cavity 4 should become meaningfully lighter');
assert.ok(factory.compare('recovery')[3].changeFromBaseline>-.5,'Authored recovery should return toward the reference');
for(let c=0;c<3;c++)assert.ok(Math.abs(factory.compare('fault')[c].changeFromBaseline)<.2,'Other cavities remain near baseline');
const incomplete=structuredClone(factoryData);
incomplete.shots[5].cavities.pop();
assert.throws(()=>lab.validateFactoryEvidence(incomplete),/cavity identity/);
const disorder=structuredClone(factoryData);
disorder.shots[0].shot=10;
assert.throws(()=>lab.validateFactoryEvidence(disorder),/shot/);
const index=lab.knowledgeIndex(book,crosswalk);
assert.equal(index.chapters,46,'No newly invented Book chapters may be counted');
assert.equal(index.forCase('VA-02').length,4);
assert.equal(index.chapter('multi-cavity').id,'multi-cavity');
assert.equal(index.chapter('multi-cavity').state,'source-review','Unreviewed Book source must not be elevated');
assert.equal(index.chapter('missing'),null);
assert.ok(index.search('cavity').length>0);
// Reject missing/forged crosswalk metadata instead of rendering an incomplete
// path as if an Academy lesson or Book chapter had been verified.
const missingChapter=structuredClone(crosswalk);
missingChapter.chapterMappings.pop();
assert.throws(()=>lab.knowledgeIndex(book,missingChapter),/every governed chapter/);
const renamedChapter=structuredClone(crosswalk);
renamedChapter.chapterMappings[0].chapterId='unreviewed-fake-module';
assert.throws(()=>lab.knowledgeIndex(book,renamedChapter),/identity|membership/);
const reorderedChapters=structuredClone(crosswalk);
[reorderedChapters.chapterMappings[0],reorderedChapters.chapterMappings[1]]=
 [reorderedChapters.chapterMappings[1],reorderedChapters.chapterMappings[0]];
assert.throws(()=>lab.knowledgeIndex(book,reorderedChapters),/order/);
const forgedCourse=structuredClone(crosswalk);
forgedCourse.chapterMappings[0].courseNames=['Unreviewed invented Academy course'];
assert.throws(()=>lab.knowledgeIndex(book,forgedCourse),/unknown courses/);
const duplicateCourse=structuredClone(crosswalk);
duplicateCourse.chapterMappings[0].courseNames.push(duplicateCourse.chapterMappings[0].courseNames[0]);
assert.throws(()=>lab.knowledgeIndex(book,duplicateCourse),/duplicate/);
const missingThemes=structuredClone(crosswalk);
missingThemes.chapterMappings[0].themes=[];
assert.throws(()=>lab.knowledgeIndex(book,missingThemes),/thematic/);
const mislabelledLevel=structuredClone(crosswalk);
mislabelledLevel.mappingLevel='lesson-level-equivalence';
assert.throws(()=>lab.knowledgeIndex(book,mislabelledLevel),/course-level/);
// Public result arrays must not poison the private index or source manifest.
const original=index.chapter('multi-cavity');
const fromCase=index.forCase('VA-02')[0];
fromCase.courses.push('Invented');
fromCase.themes.push('Invented');
fromCase.sourceIds.push('Invented');
fromCase.claimClasses.push('Invented');
const direct=index.chapter('multi-cavity');
direct.courses.length=0;
direct.claimClasses.length=0;
const searched=index.search('multi-cavity')[0];
searched.themes.length=0;
assert.deepEqual(index.chapter('multi-cavity'),original,'lookup must isolate all nested arrays');
assert.deepEqual(index.forCase('VA-02')[0],original,'case-specific lookup must remain immutable by callers');
assert.equal(index.search('multi-cavity')[0].themes.length,original.themes.length);

assert.equal(lab.tutorPlan(null,index,{}).state,'ready-to-practise');
const correct={},wrong={};
for(const step of lab.steps){
 correct[step]=va.cases[1][step].options.find(x=>x[2]===true)[0];
 wrong[step]=va.cases[1][step].options.find(x=>x[2]===false)[0];
}
let writes=0,reads=0,opened='',twin=null;
const storage={
 get(key){reads++;assert.equal(key,'mm_virtual_apprenticeship_v1');return {completed:{'VA-01':{best:4,last:4},'VA-02':{best:3,last:3,level:'developing'}}}},
 set(){writes++;throw Error('No shadow store must be written');}
};
const bridge=adapter.createBridge({
 apprenticeship:va,
 book:{openChapter(id){opened=id;return true}},
 spatial:{open(options){twin=options;return true}},
 runtime:{storage}
});
const app=lab.createAcademy({apprenticeship:va,bookManifest:book,crosswalk,factoryEvidence:factoryData,bridge,storage});
assert.equal(app.openCase(),true);
assert.equal(app.openSpatial(),true);
assert.deepEqual(twin,{caseIndex:1});
assert.equal(app.openChapter('cavity-pressure'),true);
assert.equal(opened,'cavity-pressure');
assert.equal(app.openChapter('invalid-chapter'),false);
assert.equal(app.review({}).state,'incomplete');
const low=app.review(wrong);
assert.equal(low.total,0);
assert.equal(low.gaps.length,4);
assert.equal(app.tutor().bookRecommendations[0].id,'diagnostic-method');
assert.equal(app.tutor().recommendedCase,'VA-02');
const high=app.review(correct);
assert.equal(high.total,4);
assert.deepEqual(high.gaps,[]);
assert.equal(app.tutor().nextCoachingLevel,'advanced');
assert.equal(app.tutor().recommendedCase,'VA-06');
assert.equal(app.pathway().length,5);
assert.ok(app.pathway().some(x=>x.attempted>0));
assert.ok(app.pathway().every(x=>!x.credentialAwarded&&!x.workplaceValidated));
assert.ok(reads>0);
assert.equal(writes,0);
const assignment=app.trainerDraft({
 title:'Four-cavity evidence workshop',level:'technician',
 caseIds:['VA-02','VA-02','VA-03'],instructions:'Choose a test before a correction.'
});
assert.deepEqual(assignment.caseIds,['VA-02','VA-03']);
assert.equal(assignment.includesLearnerData,false);
assert.equal(assignment.accreditation,false);
assert.deepEqual(JSON.parse(app.assignmentExport(assignment)),assignment);
assert.throws(()=>app.trainerDraft({title:'Bad',level:'engineer',caseIds:['VA-02']}),/title/);
assert.throws(()=>app.trainerDraft({title:'Valid work',level:'engineer',caseIds:['VA-99']}),/known/);
assert.throws(()=>app.learnerShare(high,false),/consent/);
assert.throws(()=>app.learnerShare(null,true),/reviewed/);
const shared=app.learnerShare(high,true);
assert.equal(shared.reasoningConsistent,4);
assert.equal(shared.containsLearnerIdentity,false);
assert.equal(shared.containsRawEvidence,false);
assert.equal(shared.workplaceCompetence,false);
assert.ok(!('learnerId' in shared));
assert.throws(()=>lab.createAcademy({apprenticeship:va,bookManifest:book,crosswalk,factoryEvidence:factoryData}),/bridge/);
const ui=readText('src/experimental/new1-academy-workbench.js');
const html=readText('tools/new1-academy-workbench.html');
assert.match(html,/Developer preview only/);
assert.ok(html.includes('../src/experimental/new1-academy-core.js'));
assert.ok(html.includes('../src/domains/engineering/virtual-apprenticeship.js'));
for(const marker of ['academy.assignmentExport','academy.learnerShare','MM_NEW1_ACADEMY','academy.review(state.answers)'])
 assert.ok(ui.includes(marker),'Missing workbench integration: '+marker);
assert.ok(!/\binnerHTML\b/.test(ui),'No injection-prone HTML string rendering');
assert.ok(!/\blocalStorage\b/.test(ui),'Local demo must not read/write real learner records');
assert.ok(!/\bfetch\(['"]https?:/i.test(ui),'No external network fetch');
assert.ok(!/\bWebSocket\b|\bXMLHttpRequest\b/.test(ui),'No automatic trainer synchronisation');
const manifest=readJson('runtime-domain-manifest.json'),sw=readText('service-worker.js'),shell=readText('index.html');
for(const rel of [
 'src/experimental/new1-academy-core.js',
 'src/experimental/new1-academy-workbench.js',
 'data/new1-factory-evidence-v1.json'
]){
 assert.ok(!(manifest.assets||[]).includes('./'+rel));
 assert.ok(!(manifest.dataAssets||[]).includes('./'+rel));
 assert.ok(!sw.includes("'./"+rel+"'"));
 assert.ok(!shell.includes("'./"+rel+"'"));
}
console.log('NEW1 five-pillar academy QA passed: synthetic cavity identity, 46-module Book, canonical VA score, tutor, five learning tracks, trainer consent and public-runtime isolation');
