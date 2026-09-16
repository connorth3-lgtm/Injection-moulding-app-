const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./qa',
  testMatch:/premium-ui\.spec\.js/,
  timeout:30000,
  expect:{timeout:8000},
  retries:1,
  workers:1,
  reporter:[['line'],['html',{outputFolder:'qa-artifacts/premium-playwright-report',open:'never'}]],
  use:{baseURL:'http://127.0.0.1:4173',headless:true,trace:'retain-on-failure',serviceWorkers:'block'},
  projects:[
    {name:'chromium-premium',use:{...devices['Desktop Chrome']}},
    {name:'webkit-premium',use:{...devices['Desktop Safari']}}
  ]
});
