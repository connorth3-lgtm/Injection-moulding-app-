'use strict';
const fs=require('fs'),path=require('path');
const out=path.resolve(__dirname,'..','generated','signing-status.json');
const required=process.env.MM_REQUIRE_WINDOWS_SIGNING==='1';
const certificateConfigured=!!(process.env.CSC_LINK||process.env.WIN_CSC_LINK);
const passwordConfigured=!!(process.env.CSC_KEY_PASSWORD||process.env.WIN_CSC_KEY_PASSWORD);
const configured=certificateConfigured&&passwordConfigured;
const status={schema:1,platform:'windows',required,configured,certificateConfigured,passwordConfigured,sourceCommit:process.env.GITHUB_SHA||null,policy:required?'Signing is mandatory for this build.':'PR/development build may be unsigned; production distribution should set MM_REQUIRE_WINDOWS_SIGNING=1 and provide the signing certificate through the CI secret store.',generatedAt:new Date().toISOString()};
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(status,null,2)+'\n');
console.log(`Windows signing status: ${configured?'configured':'not configured'}${required?' (required)':' (not required)'}`);
if(required&&!configured){console.error('Windows signing is required but CSC_LINK/CSC_KEY_PASSWORD are not configured.');process.exit(2)}
