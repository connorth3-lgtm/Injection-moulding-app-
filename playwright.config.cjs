const { defineConfig } = require('@playwright/test');
module.exports=defineConfig({
  testDir:'./qa',
  testMatch:[/mobile-viewport\.spec\.js/,/material-grade-detail\.spec\.js/,/measured-evidence-decision\.spec\.js/,/read-aloud\.spec\.js/,/pwa-lifecycle\.spec\.js/],
  timeout:45000,
  expect:{timeout:10000},
  retries:1,
  workers:1,
  reporter:[['line'],['html',{outputFolder:'qa-artifacts/playwright-report',open:'never'}]],
  use:{browserName:'chromium',headless:true,trace:'retain-on-failure',serviceWorkers:'allow'}
});
