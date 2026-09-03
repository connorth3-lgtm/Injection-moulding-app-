'use strict';

const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const ROOT=path.resolve(__dirname,'..');
const INDEX=path.join(ROOT,'index.html');
const CORE=path.join(ROOT,'MouldMaster_Core_App.html');
const MANIFEST=path.join(ROOT,'runtime-domain-manifest.json');

function fail(message){console.error(`Style CSP generation failed: ${message}`);process.exit(1)}
function read(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8')}
function sha256(source){return `'sha256-${crypto.createHash('sha256').update(source,'utf8').digest('base64')}'`}

function readLiteral(source,start){
  const quote=source[start];
  if(!['\'', '"', '`'].includes(quote))fail(`expected JavaScript string literal at offset ${start}`);
  let escaped=false;
  for(let i=start+1;i<source.length;i++){
    const ch=source[i];
    if(escaped){escaped=false;continue}
    if(ch==='\\'){escaped=true;continue}
    if(quote==='`'&&ch==='$'&&source[i+1]==='{')fail('runtime-created style text must be static; template interpolation was found');
    if(ch===quote){
      const literal=source.slice(start,i+1);
      let value;
      try{value=vm.runInNewContext(literal,Object.create(null),{timeout:100})}catch(error){fail(`could not decode style literal: ${error.message}`)}
      if(typeof value!=='string')fail('style text literal did not decode to a string');
      return{literal,value,end:i+1};
    }
  }
  fail('unterminated JavaScript style literal');
}

function styleElementTexts(source,rel){
  const create=/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:document|d)\.createElement\(\s*(['"])style\2\s*\)/g;
  const matches=[...source.matchAll(create)];
  const texts=[];
  for(let i=0;i<matches.length;i++){
    const match=matches[i];
    const variable=match[1].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const start=(match.index||0)+match[0].length;
    const end=i+1<matches.length?(matches[i+1].index||source.length):source.length;
    const segment=source.slice(start,end);
    const assign=new RegExp(`\\b${variable}\\s*\\.\\s*textContent\\s*=\\s*`);
    const assignment=assign.exec(segment);
    if(!assignment)fail(`${rel}: style element ${match[1]} has no static textContent assignment before the next style element`);
    const literalStart=start+assignment.index+assignment[0].length;
    texts.push(readLiteral(source,literalStart).value);
  }
  return{created:matches.length,texts};
}

function runtimeSources(index){
  const rels=new Set();
  const body=/\['(\.\/[^']+\.js)'\s*,\s*'<script/g;
  for(const match of index.matchAll(body))rels.add(match[1].replace(/^\.\//,''));
  const delegated=index.match(/const\s+DOMAIN_DELEGATED_ASSETS=\[([^\]]*)\]/);
  if(delegated)for(const match of delegated[1].matchAll(/['"](\.\/[^'"]+\.js)['"]/g))rels.add(match[1].replace(/^\.\//,''));
  const manifest=JSON.parse(fs.readFileSync(MANIFEST,'utf8'));
  for(const asset of [...(manifest.assets||[]),...(manifest.dataAssets||[])])if(typeof asset==='string'&&asset.endsWith('.js'))rels.add(asset.replace(/^\.\//,''));
  const coreDir=path.join(ROOT,'src/core-runtime');
  for(const name of fs.readdirSync(coreDir))if(/^core-inline-\d{3}\.js$/.test(name))rels.add(`src/core-runtime/${name}`);
  return[...rels].sort();
}

function expectedHashes(){
  const core=fs.readFileSync(CORE,'utf8');
  const styleBlocks=[...core.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)].map(match=>match[1]);
  if(!styleBlocks.length)fail('frozen core has no style blocks to hash');
  const index=fs.readFileSync(INDEX,'utf8');
  const sources=runtimeSources(index);
  let created=0;
  const runtimeStyles=[];
  for(const rel of sources){
    const full=path.join(ROOT,rel);
    if(!fs.existsSync(full))fail(`runtime source missing: ${rel}`);
    const result=styleElementTexts(fs.readFileSync(full,'utf8'),rel);
    created+=result.created;
    runtimeStyles.push(...result.texts);
  }
  if(created!==runtimeStyles.length)fail(`runtime style extraction drifted: ${created} created / ${runtimeStyles.length} extracted`);
  const hashes=[...new Set([...styleBlocks,...runtimeStyles].map(sha256))].sort();
  return{hashes,coreStyleBlocks:styleBlocks.length,runtimeStyleElements:created,sources};
}

function directive(hashes){return `style-src 'self' ${hashes.join(' ')}; style-src-attr 'none';`}
function rewriteIndex(index,expected){
  const next=index.replace(/style-src 'self'[^;]*;(?:\s*style-src-attr\s+[^;]*;)?/,directive(expected.hashes));
  if(next===index&&!index.includes(directive(expected.hashes)))fail('index style-src directive shape was not recognised');
  return next;
}

const check=process.argv.includes('--check');
const expected=expectedHashes();
const index=fs.readFileSync(INDEX,'utf8');
const next=rewriteIndex(index,expected);
if(check){
  if(index!==next)fail('index.html style CSP hash allowlist is stale; run node tools/generate_style_csp.cjs');
  if(index.includes("style-src 'self' 'unsafe-inline'"))fail('style-src still contains unsafe-inline');
  if(!index.includes("style-src-attr 'none'"))fail('style-src-attr is not none');
}else{
  fs.writeFileSync(INDEX,next,'utf8');
}
console.log(`Style CSP ${check?'check':'generation'} passed: ${expected.coreStyleBlocks} frozen-core style blocks + ${expected.runtimeStyleElements} runtime-created style elements -> ${expected.hashes.length} unique SHA-256 hashes; style-src-attr none.`);
