const { defineConfig } = require('@playwright/test');
module.exports=defineConfig({
  testDir:'./qa',
  testMatch:[/mobile-viewport\.spec\.js/,/visual-regression\.spec\.js/,/lesson-detail-simplicity\.spec\.js/,/learner-ux-repair\.spec\.js/,/learn-practice-mobile-style\.spec\.js/,/material-grade-detail\.spec\.js/,/material-search-scale\.spec\.js/,/measured-evidence-decision\.spec\.js/,/read-aloud\.spec\.js/,/pwa-lifecycle\.spec\.js/,/pwa-two-release-transition\.spec\.js/,/engineering-case-store\.spec\.js/,/inline-handler-bridge\.spec\.js/,/inline-style-csp\.spec\.js/],
  timeout:45000,
  expect:{timeout:10000},
  retries:1,
  workers:1,
  reporter:[['line'],['html',{outputFolder:'qa-artifacts/playwright-report',open:'never'}]],
  use:{browserName:'chromium',headless:true,trace:'retain-on-failure',serviceWorkers:'allow'}
});
