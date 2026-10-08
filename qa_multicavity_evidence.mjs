import assert from 'node:assert/strict';
import { multiCavityFlowPathGeometry, multiCavityEvidenceCoverage } from './src/domains/process/multi-cavity-flowpath.mjs';

// Synthetic references only: valid metadata does not prove physical measurement.
const geometry = multiCavityFlowPathGeometry({
  mouldConfigurationId: 'test-mould', geometryBasisRef: 'test-cad',
  topologyBasisRef: 'test-paths',
  segments: [
    { segmentId:'shared',crossSectionArea:{value:20,unit:'mm2'},channelLength:{value:20,unit:'mm'} },
    { segmentId:'a',crossSectionArea:{value:10,unit:'mm2'},channelLength:{value:30,unit:'mm'} },
    { segmentId:'b',crossSectionArea:{value:10,unit:'mm2'},channelLength:{value:40,unit:'mm'} },
  ],
  cavityPaths:[{cavityId:'A',segmentIds:['shared','a']},{cavityId:'B',segmentIds:['shared','b']}],
});
assert.equal(geometry.ok,true);
const record = id => ({
  cavityId:id,cavityPressureLocationId:'sensor-'+id,
  cavityPressureSignalRef:'trace-'+id,sensorCalibrationRef:'cal-'+id,
  shotWindowRef:'shots-1-to-5',timebaseSynchronisationRef:'clock-A',
});
const sample = { geometryResult:geometry,measurementCampaignId:'campaign-A',
  acquisitionBasisRef:'acquisition-A',shotWindowRef:'shots-1-to-5',
  timebaseSynchronisationRef:'clock-A',cavityTraces:[record('A'),record('B')] };
const evaluate = delta => multiCavityEvidenceCoverage({...sample,...delta});
const ok = evaluate({});
assert.equal(ok.ok,true);
assert.equal(ok.status,'reference-coverage-complete-unverified');
assert.equal(ok.validatedBalance,false);
assert.equal(ok.productionAuthority,false);
assert.equal(ok.gateSealCoverage,'not-provided');
assert.deepEqual(ok.cavityTraces.map(x=>x.cavityId),['A','B']);

const withGate = evaluate({gateSealStudies:[
  {cavityId:'B',gateSealStudyRef:'gate-B'},
  {cavityId:'A',gateSealStudyRef:'gate-A'},
]});
assert.equal(withGate.gateSealCoverage,'references-present-not-validated');
assert.deepEqual(withGate.gateSealStudies.map(x=>x.cavityId),['A','B']);

const reject = (changes,why) => assert.equal(evaluate(changes).reason,why);
reject({geometryResult:{ok:false}},'valid-multi-cavity-geometry-candidate-required');
reject({measurementCampaignId:{}},'measurement-campaign-id-required');
reject({acquisitionBasisRef:''},'acquisition-basis-required');
reject({shotWindowRef:''},'common-shot-window-required');
reject({timebaseSynchronisationRef:''},'timebase-synchronisation-reference-required');
reject({cavityTraces:[record('A')]},'missing-cavity-traces');
reject({cavityTraces:[record('A'),record('A')]},'duplicate-cavity-trace');
reject({cavityTraces:[record('A'),record('X')]},'trace-unknown-cavity-id');
reject({cavityTraces:[{...record('A'),sensorCalibrationRef:''},record('B')]},'sensor-calibration-reference-required');
reject({cavityTraces:[{...record('A'),shotWindowRef:'different'},record('B')]},'trace-shot-window-mismatch');
reject({cavityTraces:[{...record('A'),timebaseSynchronisationRef:'different'},record('B')]},'trace-timebase-mismatch');
reject({gateSealStudies:{}},'gate-seal-studies-must-be-array');
reject({gateSealStudies:[{cavityId:'A',gateSealStudyRef:'gate-A'}]},'missing-gate-seal-studies');
reject({gateSealStudies:[{cavityId:'A',gateSealStudyRef:'gate-A'},{cavityId:'A',gateSealStudyRef:'gate-X'}]},'duplicate-gate-seal-cavity-id');
reject({gateSealStudies:[{cavityId:'X',gateSealStudyRef:'gate-X'}]},'gate-seal-unknown-cavity-id');
reject({gateSealStudies:[{cavityId:'A',gateSealStudyRef:''}]},'gate-seal-study-reference-required');
console.log('New2 multi-cavity pressure/gate-seal evidence reference QA passed');
