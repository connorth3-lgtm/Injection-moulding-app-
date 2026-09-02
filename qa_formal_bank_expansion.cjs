'use strict';
const fs=require('fs'),vm=require('vm');
function fail(msg){throw new Error(msg)}
const html=fs.readFileSync('MouldMaster_Core_App.html','utf8');
const marker='window.MM_DATA = ';
const start=html.indexOf(marker);if(start<0)fail('MM_DATA marker missing');
const jsonStart=start+marker.length;const end=html.indexOf(';\n\n</script>',jsonStart);if(end<0)fail('MM_DATA end marker missing');
const data=JSON.parse(html.slice(jsonStart,end));
const sandbox={window:{MM_DATA:data},console};sandbox.window.window=sandbox.window;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('assessment-bank-expansion.js','utf8'),sandbox,{filename:'assessment-bank-expansion.js'});
const D=sandbox.window.MM_DATA,meta=sandbox.window.MM_ASSESSMENT_BANK_EXPANSION;if(!meta)fail('expansion runtime missing');
if(meta.addedItems!==60||meta.technicalItems!==90)fail('expansion counts wrong');
const domainRegex={materials:/resin|polymer|material|moisture|dry|viscos|melt|degrad|regrind/i,machine:/machine|screw|cushion|recovery|non-return|setpoint|clamp|controller|pressure limit/i,tooling:/mould|mold|cavity|gate|runner|vent|cooling|parting line|hot-runner|hot runner|tooling/i,process:/fill|pack|hold|transfer|pressure|cycle|flow|shot|residence|process window/i,quality:/quality|dimension|measurement|capability|cpk|doe|experiment|random|block|confidence|effect size|control chart|missing|specification/i,troubleshooting:/troubleshoot|strongest|investigat|drift|defect|flash|splay|burn|warpage|evidence|hypothesis|recovery|weakens|change/i};
for(const level of ['Beginner','Intermediate','Advanced']){
 const rows=D.exams[level]||[];if(rows.length!==30)fail(`${level} expected 30, found ${rows.length}`);
 const stems=rows.map(q=>String(q[0]).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim());if(new Set(stems).size!==30)fail(`${level} duplicate stems`);
 for(const [i,q] of rows.entries()){
  if(!Array.isArray(q[1])||q[1].length!==4||new Set(q[1].map(String)).size!==4)fail(`${level} item ${i} options`);
  if(!Number.isInteger(q[2])||q[2]<0||q[2]>3)fail(`${level} item ${i} key`);
  if(String(q[3]||'').length<45)fail(`${level} item ${i} rationale too weak`);
  if(!String(q[4]||'').trim())fail(`${level} item ${i} reference missing`);
  if(!Array.isArray(q[6])||q[6].length!==4||q[6].some(x=>String(x||'').length<25))fail(`${level} item ${i} option feedback weak`)
 }
 const text=rows.map(q=>q[0]).join(' ');for(const [domain,re] of Object.entries(domainRegex))if(!re.test(text))fail(`${level} missing ${domain} blueprint evidence`)
}
const source=fs.readFileSync('assessment-runtime-v2.js','utf8');
for(const token of ['MIN_BANK_PER_LEVEL=30','pool.length<MIN_BANK_PER_LEVEL','technicalPerExam:7','blueprint:[...BLUEPRINT]','Least-exposed'])if(!source.includes(token))fail(`runtime token missing: ${token}`);
if(/pool\.length!==10|technicalBankPerLevel:10/.test(source))fail('legacy 10-item runtime constraint remains');
console.log('Formal bank expansion QA passed: 90 unique technical items, 30 per level, structure/feedback/reference/blueprint and expanded runtime contract verified.');
