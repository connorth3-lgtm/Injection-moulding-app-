'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..','..','..');
const OUT=path.resolve(__dirname,'..','generated','integrity.json');
const FILES=['index.html','MouldMaster_Core_App.html','MouldMaster_Academy_App.html','manifest.webmanifest','mouldmaster-192.png','mouldmaster-512.png','version.json','reading-patch.css','reading-patch.js','training-upgrade.js','training-qa-fix.js','pwa-shell.js','source-library.js','reference-data.js','reference-sources.js','service-worker.js','privacy.html','support.html'];
function sha(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}
const version=JSON.parse(fs.readFileSync(path.join(ROOT,'version.json'),'utf8'));
const files={};for(const name of FILES){const f=path.join(ROOT,name);if(!fs.existsSync(f))throw new Error(`Missing required asset: ${name}`);files[name]=sha(f)}
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,JSON.stringify({schema:1,release:version.desktop_release||version.android_release||version.content_version,content_version:version.content_version,generated_from:'repository source tree',files},null,2)+'\n');
console.log(`Wrote ${OUT} with ${FILES.length} SHA-256 entries`);
