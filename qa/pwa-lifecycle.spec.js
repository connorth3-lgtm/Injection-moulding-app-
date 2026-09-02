const {test,expect}=require('@playwright/test');
const BASE='http://127.0.0.1:4173/index.html';
async function standalone(page){await page.addInitScript(()=>{const native=window.matchMedia.bind(window);window.matchMedia=q=>q==='(display-mode: standalone)'?{matches:true,media:q,onchange:null,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},dispatchEvent(){return false}}:native(q);const user={id:'pwa-qa',name:'PWA QA',role:'learner',completed:[],bookmarks:[],notes:{},examScores:{},certificates:[],currentLesson:1,lastSeen:new Date().toISOString(),onboardingDone:true,experience:'Beginner',goal:'Learn the full process',dailyMinutes:15,region:'ALL'};localStorage.setItem('mouldmasterProDB',JSON.stringify({activeUser:'pwa-qa',users:{'pwa-qa':user}}))})}
async function loadScript(page,src){await page.evaluate(src=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=()=>resolve(true);script.onerror=()=>reject(new Error(`Failed to load ${src}`));document.head.appendChild(script)}),src)}
test('installed PWA atomically caches the integrated core and recovers offline/online',async({page,context})=>{
 await standalone(page);await page.goto(BASE,{waitUntil:'load'});
 await page.waitForFunction(()=>navigator.serviceWorker?.controller||false,{timeout:30000}).catch(async()=>{await page.reload({waitUntil:'load'});await page.waitForFunction(()=>navigator.serviceWorker?.controller||false,{timeout:30000})});
 const cached=await page.evaluate(async()=>{const keys=await caches.keys(),key=keys.find(k=>k.startsWith('mouldmaster-static-'));if(!key)return{key:null,missing:['cache']};const cache=await caches.open(key),targets=['./index.html','./assessment-bank-expansion.js','./app-integration-v3.js','./assessment-runtime-v2.js','./privacy.html'];const missing=[];for(const t of targets)if(!await cache.match(t))missing.push(t);return{key,missing}});
 expect(cached.key).toBeTruthy();expect(cached.missing).toEqual([]);
 await page.waitForFunction(()=>window.MM_ASSESSMENT_BANK_EXPANSION?.technicalItems===90&&window.MM_APP_INTEGRATION?.version);
 await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('#mmStartupFailure')).toHaveCount(0);await page.waitForFunction(()=>window.MM_ASSESSMENT_BANK_EXPANSION?.technicalItems===90&&window.MM_APP_INTEGRATION?.version,{timeout:30000});await expect(page.getByRole('button',{name:/Diagnose a moulding problem/i})).toBeVisible();
 await context.setOffline(false);await page.reload({waitUntil:'load'});await page.waitForFunction(()=>window.MM_APP_INTEGRATION?.assessmentAudit?.().ok===true,{timeout:30000});
});

test('app-wide integration keeps cohort imports aggregate and process missingness honest',async({page})=>{
 // Exercise the exact production data/integration modules on a neutral same-origin
 // page. Full app-shell and installed/offline lifecycle remain covered above.
 await page.goto('http://127.0.0.1:4173/privacy.html',{waitUntil:'load'});
 await loadScript(page,'./data-integration-runtime.js');
 await loadScript(page,'./app-integration-v3.js');
 await page.waitForFunction(()=>window.MM_APP_INTEGRATION?.version&&window.MM_CONNECTED_PROCESS_DATA?.intelligence?.__mmEvidenceEnhanced===true,{timeout:30000});
 const result=await page.evaluate(async()=>{
   const payload={schema:1,generatedAt:new Date().toISOString(),privacy:'Anonymous aggregate report: no learner tokens, names, answer text, notes or event timestamps are exported.',anonymousProfiles:5,thresholds:{minimumProfiles:5,minimumAttempts:12},items:[{mechanismId:'ejection-demoulding',stage:'evidence',anonymousProfiles:5,attempts:12,correct:9,successRate:.75,averageDurationSec:18,topMisconception:{reason:'command-vs-actual',count:2},discrimination:.25,difficultyQuality:'in-range',calibratedChallenge:'standard'}]};
   const clean=window.MM_APP_INTEGRATION.importCohort(payload);
   let maliciousRejected=false;
   try{window.MM_APP_INTEGRATION.importCohort({...payload,items:[{...payload.items[0],learnerToken:'should-not-import'}]})}catch(_){maliciousRejected=true}
   const semantics={x:{column:'x',role:'actual',kind:'direct-measurement',blockers:[],unit:'MPa',meaning:'Measured pressure',canonical_quantity:'pressure'}};
   const rows=[{x:1},{x:''},{x:null},{x:'  '},{x:3}];
   const summary=window.MM_CONNECTED_PROCESS_DATA.intelligence.summarizeRows(rows,semantics).x;
   const windows=window.MM_CONNECTED_PROCESS_DATA.intelligence.compareWindows([{x:1},{x:''},{x:3},{x:null},{x:5}],semantics,2,4);
   const referenceCleaned=await new Promise((resolve,reject)=>{const req=indexedDB.open('mouldmaster-process-data-v1',1);req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,tx=db.transaction('caseLinks','readwrite');tx.objectStore('caseLinks').put({caseId:'audit-case',datasetId:'audit-dataset',machine:'M1'});tx.oncomplete=async()=>{db.close();await window.MM_CONNECTED_PROCESS_DATA.storage.deleteDataset('audit-dataset');const verify=indexedDB.open('mouldmaster-process-data-v1',1);verify.onerror=()=>reject(verify.error);verify.onsuccess=()=>{const vdb=verify.result,vtx=vdb.transaction('caseLinks','readonly'),get=vtx.objectStore('caseLinks').get('audit-case');get.onsuccess=()=>{const value=get.result;vdb.close();resolve(value?.datasetId===null&&value?.machine==='M1')};get.onerror=()=>{vdb.close();reject(get.error)}}};tx.onerror=()=>{db.close();reject(tx.error)}}});
   return{cleanProfiles:clean.anonymousProfiles,cleanItems:clean.items.length,maliciousRejected,summary,window:windows.changes[0]?.uncertainty||null,referenceCleaned};
 });
 expect(result.cleanProfiles).toBe(5);expect(result.cleanItems).toBe(1);expect(result.maliciousRejected).toBe(true);
 expect(result.summary.n).toBe(2);expect(result.summary.mean).toBe(2);expect(result.summary.missing).toBe(3);expect(result.summary.missingRate).toBeCloseTo(.6,8);
 expect(result.window.sampleSizeBefore).toBe(1);expect(result.window.sampleSizeAfter).toBe(2);expect(result.window.missingBefore).toBe(1);expect(result.window.missingAfter).toBe(1);expect(result.referenceCleaned).toBe(true);
 await expect(page.getByText(/do not imply deletion of the separate device\/site process workspace/i)).toBeVisible();
});
