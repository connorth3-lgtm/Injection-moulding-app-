'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..','..','..');
const OUT=path.resolve(__dirname,'..','generated','integrity.json');
const FILES=[
  'index.html','MouldMaster_Core_App.html','MouldMaster_Academy_App.html','manifest.webmanifest','mouldmaster-192.png','mouldmaster-512.png','version.json',
  'reading-patch.css','reading-patch.js','read-aloud.js','training-upgrade.js','training-qa-fix.js',
  'assessment-100-pass.js','assessment-deep-dive.js','assessment-answer-cue-fix.js','assessment-storage-scope.js','assessment-quality-suite.js','assessment-stable-review-bridge.js','assessment-analytics-ui.js','assessment-final-hardening.js','runtime-v2.js','assessment-runtime-v2.js','assessment-ux.js',
  'source-library.js','measured-evidence-integration.js','measured-evidence-decision.js',
  'research-evidence-engine.js','research-evidence-adapter.js','research-evidence-workspace.js','research-evidence-microlearning.js','adaptive-learning.js','learning-effectiveness.js','specialist-learning-quality.js','research-utilisation-analytics.js','research-gap-feedback.js','research-claim-freshness.js','research-evidence-ui.js','research-data-context.js','research-evidence-runtime-health.js',
  'assessment-evidence-sources.js','evidence-maturity-deep-dive.js','evidence-maturity-formal-bridge.js','assessment-psychometric-hardening.js','assessment-evidence-integrity-upgrade.js','lesson-evidence-depth.js','lesson-deep-authoring-v2.js','assessment-evidence-approval.js','assessment-psychometric-approval.js',
  'app-shell-registry.js','assessment-multimodal.js','pwa-shell.js','learning-experience.js','process-data-diagnostics.js','real-measured-data-assessment.js','process-data-deep-dive-machine.js','process-data-deep-dive-tooling.js','process-data-deep-dive-material.js','process-data-deep-dive-scientific.js','process-data-deep-dive-quality.js','process-data-deep-dive-50.js','process-data-20-pass-01-05.js','process-data-20-pass-06-10.js','process-data-20-pass-11-15.js','process-data-20-pass-16-20.js','process-data-20-pass-atlas.js','process-data-local-intake.js',
  'curriculum-integration.js','specialist-curriculum.js','specialist-evidence-gap-extension.js','mould-master-workspace.js','app-shell-finalize.js','production-health.js',
  'data-integration-runtime.js','process-data-intelligence-ui.js','process-data-semantic-registry.json','current-data-manifest.json','research-utilisation-manifest.json',
  'learning-analytics.js','accessibility-hardening.js','reference-data.js','reference-data.html','reference-deep-dive.js','reference-research-extension.js','reference-20x-extension.js','reference-2026-expansion.js','reference-sources.js','reference-browser-ui.js','diagnostic-learning-labs.js','material-behaviour-labs.js','service-worker.js','privacy.html','support.html'
];
function sha(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}
const version=JSON.parse(fs.readFileSync(path.join(ROOT,'version.json'),'utf8'));
const files={};for(const name of FILES){const f=path.join(ROOT,name);if(!fs.existsSync(f))throw new Error(`Missing required asset: ${name}`);files[name]=sha(f)}
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,JSON.stringify({schema:1,release:version.desktop_release||version.android_release||version.content_version,content_version:version.content_version,generated_from:'repository source tree',files},null,2)+'\n');
console.log(`Wrote ${OUT} with ${FILES.length} SHA-256 entries`);