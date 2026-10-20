const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({testDir:'./qa',testMatch:[/app-5000-adversarial-journeys\.spec\.js/],timeout:45000,expect:{timeout:10000},retries:0,workers:4,reporter:[['line'],['html',{outputFolder:'qa-artifacts/adversarial-report',open:'never'}]],use:{browserName:'chromium',headless:true,trace:'retain-on-failure',serviceWorkers:'block'}});
