/* MouldMaster South Korea material + grade identity extension — 2026.09.03.1 */
(function(g){'use strict';
const VERSION='2026.09.03.1';
const D=(typeof module!=='undefined'&&module.exports)?require('./material-elastomer-rubber-extension.js'):g.MM_MATERIAL_ENGINEERING_DB;
if(!D)throw new Error('material-korea-grade-extension.js requires material-elastomer-rubber-extension.js');
if(D.koreaGradeExtension?.version===VERSION){if(typeof module!=='undefined'&&module.exports)module.exports=D;return}
const PRIMARY=D.sourceLevels.PRIMARY;
const PROCESS=D.processModels||{THERMOPLASTIC:'THERMOPLASTIC'};
const family={id:'PK',name:'Aliphatic polyketone (PK / POKETONE)',existingInReferenceDatabase:false};
if(!D.families.some(x=>x.id===family.id))D.families.push(family);
const pkGrade=Object.freeze({id:'HYOSUNG-POKETONE-M330F',familyId:'PK',supplier:'Hyosung Chemical',grade:'POKETONE M330F',polymer:'Aliphatic polyketone',densityGcm3:null,flow:null,drying:{required:null,tempC:null,timeH:null,schedule:null,maxMoisturePct:null,notes:null},injection:{meltC:null,moldC:null,barrelC:null,nozzleC:null,screwPeripheralMS:null,shotToCylinderPct:null,notes:'Supplier identifies POKETONE as available in multiple injection-moulding grades. Exact grade processing setpoints remain null until the exact current TDS is retained field-by-field.'},shrinkage:{parallelPct:null,normalPct:null,rangePct:null,notes:null},processModel:PROCESS.THERMOPLASTIC||'THERMOPLASTIC',source:{publisher:'Hyosung Chemical',title:'HYOSUNG POKETONE grade portfolio and datasheets',url:'https://www.poketone.com/en/polyketone/datasheet.do',level:PRIMARY,country:'KR'},confidence:'HIGH',notes:'M330F is a current high-flow POKETONE grade listed by Hyosung. Identity and application evidence are primary-source; unsupported numeric process settings remain null.'});
if(!D.grades.some(x=>x.id===pkGrade.id))D.grades.push(pkGrade);
if(!Array.isArray(D.selectionCatalog))D.selectionCatalog=[];
if(!D.selectionCatalog.some(x=>x.id==='PK'))D.selectionCatalog.push(Object.freeze({id:'PK',name:'Polyketone / POKETONE-type','familyId':'PK',tier:'SPECIALTY'}));
if(!Array.isArray(D.gradeIdentities))D.gradeIdentities=[];
const I=(familyId,supplier,grade,source,title,application='INJECTION_OR_MOULDING')=>Object.freeze({familyId,supplier,grade,country:'KR',application,source:{publisher:supplier,title,url:source,level:PRIMARY,country:'KR'},evidenceType:'COMMERCIAL_GRADE_IDENTITY',processDataAuthority:false});
const src={
 kumhoAbs:'https://www.kkpc.com/eng/product/library/libraryList/?PRODUCT_CATEGORIZE_SEQ=2&PRODUCT_SEQ=14',
 kumhoSan:'https://www.kkpc.com/eng/product/syntheticResins/productDetail/?seq=15',
 kolonPom:'https://www.kolonenp.com/en/sub/product-table.php?page=6',
 kolonPbt:'https://www.kolonenp.com/en/sub/product-table.php',
 kolonPa6:'https://www.kolonenp.com/en/sub/product-table.php?page=3',
 kolonPa66:'https://www.kolonenp.com/en/sub/product-table.php?page=5',
 skGreen:'https://www.skchemicals.com/en/products/SKYGREEN.aspx',
 hyosungPk:'https://www.poketone.com/en/polyketone/datasheet.do'
};
const identities=[
 ...['ABS 710F','ABS 745HM','ABS 750HC','ABS 750F','ABS EF780','ABS EF750','ABS 780C','ABS 750U','ABS 780FU','HFA 710NT'].map(x=>I('ABS','Kumho Petrochemical',x,src.kumhoAbs,'Kumho ABS current product archive')),
 ...['SAN 310NTR','SAN 310CTR','SAN 330NI','SAN 335NT','SAN 330EF','SAN 340EF','SAN 300NA','SAN 320NA','SAN 326NA','SAN 350NA','SAN 350HW','HSAN 600NA','APH 1550F'].map(x=>I('SAN','Kumho Petrochemical',x,src.kumhoSan,'Kumho SAN product table')),
 ...['K100HSLO','K900','K700LO2','K500LO','K500HSLO','K500HS','K100LO','K100','K300','K300EW','K500','K700','K300LO','TF304','WR303','WR701LO','UR305','GF702','K100HS','K700LO'].map(x=>I('POM','KOLON ENP','KOCETAL '+x,src.kolonPom,'KOLON KOCETAL POM property table')),
 ...['KP211','KP212G30V0','KP213G15SIBL','KP213G30','KP213G15HIBL','KP212G15V0BL','KP212G30V0S','KP213G15','KP213G15HI','KP213G30BL','KP270EX','KP270EXC','KP270','KP211DC','KP212G15V0','KP212V0','KP213G30SB3','KP213HIBL'].map(x=>I('PBT','KOLON ENP','SPESIN '+x,src.kolonPbt,'KOLON SPESIN PBT property table')),
 ...['KN173HI4HSBL','KN153HB40BL','KN133HRF','KN133G30','KN173HI3R','KN163HI','KN135G33BLHS','KN133G35LH','KN133G30BLL','KN133G20','KN133G15HSBL','KN133G15','KN1322V0','KN171','KN136','KN111'].map(x=>I('PA','KOLON ENP','KOPA PA6 '+x,src.kolonPa6,'KOLON KOPA PA6 property table')),
 ...['KN333HI5','KN333G35HS','KN333G30HI','KN333G35CRBK','KN333G30','KN333HB38BL','KN333NW','KN333HS','KN333HRN','KN333G45','KN333G30CRN','KN333G15HI','KN332G30V0BK','KN332G30V0','KN3321G15V0BL','KN3311'].map(x=>I('PA','KOLON ENP','KOPA PA66 '+x,src.kolonPa66,'KOLON KOPA PA66 property table')),
 ...['KN200','PN100','PN200','PN300','PN400','J2003','JN100','JN200','JN200K','S2008'].map(x=>I('COPOLYESTER','SK chemicals','SKYGREEN '+x,src.skGreen,'SKYGREEN current grade portfolio','SUPPLIER_PORTFOLIO_VERIFY_PROCESS_ROUTE')),
 ...['M330F','M330F-S','M630F','M710F','M730F','M130F','M410F-S','M33FG3A','M33FG4A','M33FG6A','M33FG8A','M33FG6B','M33FM2A-WH1','M41FX0A-WH1','M33FG9A','M730R','M41FG6A','M13FG6A','M13FG9A','M71FR2A','M71FR2B'].map(x=>I('PK','Hyosung Chemical','POKETONE '+x,src.hyosungPk,'Hyosung POKETONE current grade and certification table'))
];
for(const x of identities){if(!D.gradeIdentities.some(y=>y.familyId===x.familyId&&y.supplier===x.supplier&&y.grade===x.grade))D.gradeIdentities.push(x)}
D.koreaSupplierRegistry=Object.freeze([
 {supplier:'LG Chem',country:'KR',familyIds:['ABS','ASA','PC','PCABS','PP','POE','PVC','PPS','SPS'],brands:['LUPOY','LUPOS','LUPOL','LUSEP','LUCENE']},
 {supplier:'LOTTE Chemical',country:'KR',familyIds:['ABS','ASA','PC','PCABS','PCPET','PCPBT','PPA','PCT','PBT','PPS','PP','TPE'],brands:['starex','INFINO','POPELEN','SUPRAN','LOTTMER']},
 {supplier:'KOLON ENP',country:'KR',familyIds:['POM','PA','PBT','TPCET','PPS'],brands:['KOCETAL','KOPA','SPESIN','KOPEL','KOPPS']},
 {supplier:'Samyang Corporation',country:'KR',familyIds:['PC','PCABS','PBT','PET','TPCET','PP','ABS','HIPS','PMMA','PA','PPEPS','PPS','PLA'],brands:['TRIREX','TRILOY','TRIBIT','TRIPET','TRIEL','TRILEN','TRIBS','TRIHIP','TRIMMA','TRAMID','TRIPPE','TRIPPS','TRIPLA']},
 {supplier:'SK chemicals',country:'KR',familyIds:['COPOLYESTER','PET','PCT','TPCET'],brands:['SKYGREEN','ECOZEN','CLARO','SKYPET','SKYPURA','SKYPEL']},
 {supplier:'Hyosung Chemical',country:'KR',familyIds:['PP','PK'],brands:['TOPILENE','POKETONE']},
 {supplier:'DL Chemical / PolyMirae',country:'KR',familyIds:['HDPE','LLDPE','PP','POE'],brands:['D.XPOLY','D.FINE','Moplen','Adstif']},
 {supplier:'Kumho Petrochemical',country:'KR',familyIds:['ABS','SAN','PS','HIPS','NBR','SBR','SEBS'],brands:['KUMHO ABS','KUMHO SAN']},
 {supplier:'Hanwha Solutions Chemical',country:'KR',familyIds:['PVC','CPVC','LDPE','LLDPE','EVA'],brands:['PVC','CPVC','EVA']}
]);
function koreaGradeAudit(){
 const errors=[],familyIds=new Set(D.families.map(x=>x.id)),seen=new Set();
 for(const x of D.gradeIdentities){const k=x.familyId+'|'+x.supplier+'|'+x.grade;if(seen.has(k))errors.push('duplicate identity '+k);seen.add(k);if(!familyIds.has(x.familyId))errors.push('unknown family '+x.familyId);if(x.country!=='KR')errors.push('non-KR identity '+k);if(!/^https:\/\//.test(x.source?.url||''))errors.push('invalid source '+k);if(x.processDataAuthority!==false)errors.push('identity promoted to process authority '+k)}
 const counts={};for(const x of D.gradeIdentities)counts[x.familyId]=(counts[x.familyId]||0)+1;
 for(const id of ['ABS','SAN','POM','PBT','PA','COPOLYESTER','PK'])if((counts[id]||0)<10)errors.push(id+' has fewer than 10 Korean sourced grade identities');
 return {version:VERSION,identityCount:D.gradeIdentities.length,koreanSupplierCount:D.koreaSupplierRegistry.length,familyCount:D.families.length,gradeCount:D.grades.length,selectionCount:D.selectionCatalog.length,counts,errors};
}
D.koreaGradeAudit=koreaGradeAudit;
D.koreaGradeExtension={version:VERSION,policy:'Commercial grade identities are source-backed navigation/coverage evidence only. They never inherit or authorize processing setpoints. Exact-grade TDS/revision remains required for process data.',familiesWithTenPlus:['ABS','SAN','POM','PBT','PA','COPOLYESTER','PK']};
if(typeof module!=='undefined'&&module.exports)module.exports=D;g.MM_MATERIAL_ENGINEERING_DB=D;g.MM_KOREA_GRADE_EXTENSION=D.koreaGradeExtension;
})(typeof window!=='undefined'?window:globalThis);