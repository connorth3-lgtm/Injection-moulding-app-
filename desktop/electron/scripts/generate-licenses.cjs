'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const LOCK=JSON.parse(fs.readFileSync(path.join(ROOT,'package-lock.json'),'utf8'));
const out=[];
for(const [pkgPath,meta] of Object.entries(LOCK.packages||{})){
  if(!pkgPath||!pkgPath.startsWith('node_modules/'))continue;
  const name=pkgPath.replace(/^node_modules\//,'');
  out.push({name,version:meta.version||null,license:meta.license||'UNKNOWN',resolved:meta.resolved||null,integrity:meta.integrity||null});
}
out.sort((a,b)=>a.name.localeCompare(b.name)||String(a.version).localeCompare(String(b.version)));
const target=path.join(ROOT,'generated','dependency-licenses.json');
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target,JSON.stringify({schema:1,source:'package-lock.json',count:out.length,packages:out},null,2)+'\n');
const unknown=out.filter(x=>x.license==='UNKNOWN');
console.log(`Wrote ${target} for ${out.length} locked packages (${unknown.length} licence fields unknown in lockfile)`);
if(unknown.length)console.warn('Unknown licence metadata must be checked from upstream package sources before public redistribution:',unknown.map(x=>`${x.name}@${x.version}`).join(', '));
