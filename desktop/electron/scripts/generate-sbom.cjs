'use strict';
const fs=require('fs');
const path=require('path');
const {spawnSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..');
const npmCli=process.env.npm_execpath||'';
const command=npmCli?process.execPath:(process.platform==='win32'?'npm.cmd':'npm');
const args=npmCli?[npmCli,'sbom','--sbom-format','cyclonedx']:['sbom','--sbom-format','cyclonedx'];
const result=spawnSync(command,args,{cwd:ROOT,encoding:'utf8',maxBuffer:32*1024*1024});
if(result.error){process.stderr.write(`npm sbom could not start: ${result.error.message}\n`);process.exit(1)}
if(result.status!==0){process.stderr.write(result.stderr||result.stdout||`npm sbom failed with exit code ${result.status}\n`);process.exit(result.status||1)}
const out=path.join(ROOT,'generated','sbom.cdx.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,result.stdout.endsWith('\n')?result.stdout:result.stdout+'\n');
console.log(`Wrote ${out}`);
