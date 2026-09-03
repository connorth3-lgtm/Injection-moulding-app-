const {defineConfig,devices}=require('@playwright/test');

module.exports=defineConfig({
  testDir:'./qa',
  testMatch:[
    /mobile-viewport\.spec\.js/,
    /material-grade-detail\.spec\.js/,
    /measured-evidence-decision\.spec\.js/,
    /read-aloud\.spec\.js/,
    /engineering-case-store\.spec\.js/,
    /inline-handler-bridge\.spec\.js/,
    /inline-style-csp\.spec\.js/
  ],
  timeout:60000,
  expect:{timeout:15000},
  retries:1,
  workers:1,
  reporter:[['line'],['html',{outputFolder:'qa-artifacts/webkit-full-report',open:'never'}]],
  use:{
    ...devices['Desktop Safari'],
    browserName:'webkit',
    headless:true,
    trace:'retain-on-failure',
    serviceWorkers:'block',
    viewport:{width:1440,height:900}
  }
});
