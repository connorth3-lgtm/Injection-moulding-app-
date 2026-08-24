'use strict';
const fs=require('fs');
const path=require('path');
const {spawnSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..');
const npm=process.platform==='win32'?'npm.cmd':'npm';
const result=spawnSync(npm,['sbom','--sbom-format','cyclonedx'],{cwd:ROOT,encoding:'utf8',maxBuffer:32*1024*1024});
if(result.status!==0){process.stderr.write(result.stderr||'npm sbom failed\n');process.exit(result.status||1)}
const out=path.join(ROOT,'generated','sbom.cdx.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,result.stdout.endsWith('\n')?result.stdout:result.stdout+'\n');
console.log(`Wrote ${out}`);
