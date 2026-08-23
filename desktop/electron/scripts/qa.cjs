'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..','..','..');
const MAIN=fs.readFileSync(path.join(__dirname,'..','src','main.cjs'),'utf8');
const PKG=JSON.parse(fs.readFileSync(path.join(__dirname,'..','package.json'),'utf8'));
const INTEGRITY=JSON.parse(fs.readFileSync(path.join(__dirname,'..','generated','integrity.json'),'utf8'));
function need(cond,msg){if(!cond)throw new Error(msg)}
need(PKG.license==='Apache-2.0','desktop package must remain Apache-2.0');
need(/^\d+\.\d+\.\d+$/.test(PKG.devDependencies.electron),'Electron version must be exact');
need(/^\d+\.\d+\.\d+$/.test(PKG.devDependencies['electron-builder']),'electron-builder version must be exact');
for(const marker of ['nodeIntegration: false','contextIsolation: true','sandbox: true','webSecurity: true','allowRunningInsecureContent: false','setPermissionRequestHandler','setPermissionCheckHandler','will-attach-webview','setWindowOpenHandler','server.listen(0, \'127.0.0.1\')','SHA-256 verification failed'])need(MAIN.includes(marker),`desktop security marker missing: ${marker}`);
need(INTEGRITY.schema===1,'integrity schema mismatch');
need(Object.keys(INTEGRITY.files||{}).length>=15,'integrity manifest is incomplete');
for(const [name,hash] of Object.entries(INTEGRITY.files)){need(/^[a-f0-9]{64}$/.test(hash),`bad SHA-256 for ${name}`);need(fs.existsSync(path.join(ROOT,name)),`integrity asset missing: ${name}`)}
console.log('MouldMaster open desktop QA passed');
