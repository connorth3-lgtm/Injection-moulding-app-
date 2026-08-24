/* MouldMaster assessment answer-cue hardening — 2026-08-24 */
(function(){
'use strict';
const D=window.MM_DATA;
const row=D?.exams?.Advanced?.[7];
if(!Array.isArray(row)||!Array.isArray(row[1])||row[1].length!==4||row[2]!==2)throw new Error('Advanced process-transfer question shape changed');
row[1][2]='Match validated fill, pressure/transfer, thermal and part-quality outputs on a receiving machine capable of the approved process';
})();
