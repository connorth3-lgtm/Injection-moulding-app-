/* MouldMaster training data/assessment bridge — 2026.08.23.6 */
(function(){
'use strict';
const REVIEW_KEY='mm_spaced_review_v2', LEGACY_REVIEW='mm_spaced_review_v1', SIGN_KEY='mm_practical_signoff_v1';

function mirror(){try{if(typeof activeExam==='undefined'||!activeExam)return;(activeExam.questions||[]).forEach(q=>{if(!q||typeof q!=='object')return;if(q.why==null)q.why=q.explanation;if(q.source==null)q.source=q.reference;if(q.url==null)q.url=q.sourceUrl;if(q.feedback==null)q.feedback=q.optionFeedback});window.activeExam=activeExam}catch(e){console.warn('[MouldMaster] exam bridge:',e)}}
const baseStart=window.startExam;if(typeof baseStart==='function')window.startExam=function(){const r=baseStart.apply(this,arguments);mirror();setTimeout(mirror,0);return r};

const obj=x=>x&&typeof x==='object'&&!Array.isArray(x), clamp=(n,a,b,d=0)=>Number.isFinite(+n)?Math.max(a,Math.min(b,+n)):d;
function cleanReview(v){const out={items:{}};if(!obj(v)||!obj(v.items))return out;for(const [id,x] of Object.entries(v.items).slice(0,1000)){if(!obj(x))continue;const sid=String(id).slice(0,220);if(!/^(tech|reg|legacy):/.test(sid))continue;out.items[sid]={id:sid,stage:Math.floor(clamp(x.stage,0,5)),due:clamp(x.due,0,4102444800000,Date.now()),wrong:Math.floor(clamp(x.wrong,0,100000)),right:Math.floor(clamp(x.right,0,100000)),last:clamp(x.last,0,4102444800000),confidence:['low','medium','high'].includes(x.confidence)?x.confidence:'medium'}}return out}
function cleanSign(v){const o={checks:{},supervisor:'',date:'',notes:''};if(!obj(v))return o;if(obj(v.checks))for(const [k,b] of Object.entries(v.checks).slice(0,50))o.checks[String(k).slice(0,20)]=b===true;o.supervisor=String(v.supervisor||'').slice(0,160);o.date=String(v.date||'').slice(0,20);o.notes=String(v.notes||'').slice(0,10000);return o}
function read(k,d){try{const x=JSON.parse(localStorage.getItem(k)||'');return obj(x)?x:d}catch(_){return d}}

/* One export contains the strictly validated core DB plus training extras. */
window.exportData=function(){try{const p=JSON.parse(JSON.stringify(db));p.backupFormat='mouldmaster-backup-v2';p.trainingExtras={version:2,spacedReview:cleanReview(read(REVIEW_KEY,{items:{}})),practicalSignoff:cleanSign(read(SIGN_KEY,{}))};const blob=new Blob([JSON.stringify(p,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mouldmaster-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0);window.toast?.('Backup exported with review and sign-off data')}catch(e){alert('Backup could not be created on this device.')}};

/* Atomic import: validate every core learner and all extras before changing any state. */
window.importData=function(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!obj(x)||!obj(x.users)||typeof x.activeUser!=='string'||!x.users[x.activeUser])throw new Error('Invalid backup structure');if(typeof normaliseImportedUser!=='function')throw new Error('Core validator unavailable');const users={};for(const [id,u] of Object.entries(x.users).slice(0,500)){const sid=String(id).slice(0,160);users[sid]=normaliseImportedUser(u,id)}const active=String(x.activeUser).slice(0,160);if(!users[active])throw new Error('Missing active learner');const extras=obj(x.trainingExtras)?x.trainingExtras:{};const cleanR=cleanReview(extras.spacedReview||{items:{}}),cleanS=cleanSign(extras.practicalSignoff||{});const proposed={activeUser:active,users};db=proposed;user=db.users[db.activeUser];localStorage.setItem(REVIEW_KEY,JSON.stringify(cleanR));localStorage.setItem(SIGN_KEY,JSON.stringify(cleanS));localStorage.removeItem(LEGACY_REVIEW);persist();updateGlobalProgress();switchView('profile');window.toast?.('Backup imported and strictly validated')}catch(e){alert('That file is not a valid MouldMaster backup. No existing data was changed.')}};r.readAsText(file)};

/* Confirmed reset clears every MouldMaster-owned training store. */
const baseReset=window.resetData;if(typeof baseReset==='function')window.resetData=function(){const before=localStorage.getItem('mouldmasterProDB');const r=baseReset.apply(this,arguments);setTimeout(()=>{const after=localStorage.getItem('mouldmasterProDB');if(before!==after){localStorage.removeItem(REVIEW_KEY);localStorage.removeItem(LEGACY_REVIEW);localStorage.removeItem(SIGN_KEY);window.activeExam=null}},0);return r};

/* One-time migration: legacy text-keyed review records are intentionally not guessed into stable IDs. */
try{if(!localStorage.getItem(REVIEW_KEY)&&localStorage.getItem(LEGACY_REVIEW))localStorage.setItem(REVIEW_KEY,JSON.stringify({items:{}}))}catch(_){}
})();
