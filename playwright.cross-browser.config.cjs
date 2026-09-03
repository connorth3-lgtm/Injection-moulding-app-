const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./qa',
  testMatch:[/cross-browser-smoke\.spec\.js/],
  timeout:60000,
  expect:{timeout:15000},
  retries:1,
  workers:1,
  reporter:[['line'],['html',{outputFolder:'qa-artifacts/cross-browser-report',open:'never'}]],
  use:{headless:true,trace:'retain-on-failure'},
  projects:[
    {name:'chromium-desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900}}},
    {name:'firefox-desktop',use:{...devices['Desktop Firefox'],viewport:{width:1440,height:900}}},
    {name:'webkit-tablet',use:{...devices['iPad (gen 7)'],viewport:{width:810,height:1080}}}
  ]
});
