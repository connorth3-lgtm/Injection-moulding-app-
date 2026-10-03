const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./qa',
  testMatch:[/app-500-individual-runs\.spec\.js/],
  timeout:45000,
  expect:{timeout:10000},
  retries:0,
  fullyParallel:true,
  workers:4,
  reporter:[['line'],['html',{outputFolder:'qa-artifacts/app-500-report',open:'never'}]],
  use:{browserName:'chromium',headless:true,trace:'retain-on-failure',serviceWorkers:'allow'}
});
