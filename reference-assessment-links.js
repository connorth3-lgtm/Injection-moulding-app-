/* MouldMaster assessment-evidence source links — audited 2026-08-24 */
(function(){
'use strict';
const S=window.MM_SOURCE_LIBRARY;
if(!S)throw new Error('MouldMaster source library must load before assessment evidence links');
const add=(key,rows)=>{
  const seen=new Set((S[key]||[]).map(x=>x[2]));
  S[key]=[...(S[key]||[]),...rows.filter(x=>!seen.has(x[2]))];
};

add('law',[
 ['UK PUWER 1998 — Regulation 11','Dangerous parts of machinery: prevention of access or stopping movement before a person enters a danger zone.','https://www.legislation.gov.uk/uksi/1998/2306/regulation/11'],
 ['UK PUWER 1998 — Regulation 19','Isolation from sources of energy.','https://www.legislation.gov.uk/uksi/1998/2306/regulation/19'],
 ['Northern Ireland PUWER 1999','Official Northern Ireland Provision and Use of Work Equipment Regulations 1999.','https://www.legislation.gov.uk/nisr/1999/305/made'],
 ['NZ Health and Safety at Work Amendment Act 2026','Official 2026 amendment Act; commencement provisions must be checked before applying amended duties.','https://www.legislation.govt.nz/act/public/2026/38/en/latest/']
]);

add('safety',[
 ['HSE — PUWER overview','HSE overview of employer duties for safe work equipment under PUWER.','https://www.hse.gov.uk/work-equipment-machinery/puwer-overview.htm'],
 ['HSE PPIS13 — Plastics-processing fume','HSE plastics-processing fume guidance in web form.','https://www.hse.gov.uk/pubns/ppis13.htm'],
 ['BSI — BS EN ISO 20430','BSI catalogue page for the injection-moulding-machine safety standard; verify edition/status before formal use.','https://knowledge.bsigroup.com/products/plastics-and-rubber-machines-injection-moulding-machines-safety-requirements-1'],
 ['WorkSafe NZ — Injection and blow moulding','NZ plastics-machinery guidance covering guarding, isolation, heat, fumes and maintenance; page notes its legislation text is legacy and must be read with current law/standards.','https://www.worksafe.govt.nz/topic-and-industry/machinery/working-safely-with-plastic-production-machinery/injection-blow-moulding/'],
 ['OSHA — State Plans','Official OSHA information on approved State Plans and their relationship to federal OSHA.','https://www.osha.gov/stateplans'],
 ['PLASTICS — Machinery Safety Standards Committee','US plastics-industry machinery safety standards activity, including ANSI-accredited standards development.','https://www.plasticsindustry.org/advocacy/codes-standards/machinery-safety-standards-committee/']
]);

add('stats',[
 ['NIST — Full factorial designs','NIST Engineering Statistics Handbook guidance on full factorial experimental designs.','https://www.itl.nist.gov/div898/handbook/pri/section4/pri46.htm']
]);

add('sensors',[
 ['Liew et al. (2022), Sensors','Injection barrel/nozzle/mould-cavity real-time sensing and moulding-quality monitoring.','https://doi.org/10.3390/s22134792'],
 ['Araújo et al. (2023), IJAMT — DOI','In-cavity pressure measurement for injection-moulding failure diagnosis and simulation correlation.','https://doi.org/10.1007/s00170-023-11100-1'],
 ['Injection-pressure transfer study','Research source used by the advanced assessment to distinguish machine/nozzle pressure evidence from local cavity-pressure history.','https://doi.org/10.1515/ipp-2022-4281']
]);

add('materials',[
 ['Recycled-polymer rheology / mouldability study','Research source used where matching MFR does not imply identical high-shear moulding behaviour.','https://doi.org/10.1007/s13367-023-00081-y']
]);

add('process',[
 ['Gate-seal / packing study','Research evidence used for part-mass plateau and useful pressure-transmission reasoning during packing.','https://doi.org/10.1002/pen.10186']
]);

window.MM_ASSESSMENT_EVIDENCE_SOURCES={version:'2026.08.24.1',reviewed:'2026-08-24',links:16};
})();
