const { defineConfig } = require('@playwright/test');
module.exports=defineConfig({
  testDir:'./qa',
  testMatch:[/cross-browser-accessibility\.spec\.js/],
  timeout:60000,
  expect:{timeout:15000},
  retries:1,
  workers:1,
  reporter:[['line'],['html',{outputFolder:'qa-artifacts/cross-browser-report',open:'never'}]],
  use:{headless:true,trace:'retain-on-failure'},
  projects:[
    {name:'chromium',use:{browserName:'chromium'}},
    {name:'firefox',use:{browserName:'firefox'}},
    {name:'webkit',use:{browserName:'webkit'}}
  ]
});
