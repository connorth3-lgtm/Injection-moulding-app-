const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'./qa',
 testMatch:[/feature-reachability\.spec\.js/],
 timeout:45000,
 expect:{timeout:10000},
 retries:0,
 workers:1,
 reporter:[['line'],['html',{outputFolder:'qa-artifacts/reachability-report',open:'never'}]],
 use:{browserName:'chromium',headless:true,trace:'retain-on-failure',serviceWorkers:'block'}
});
