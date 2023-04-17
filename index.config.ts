import { PlaywrightTestConfig } from "@playwright/test";
const RPconfig = {
  token: '4311671d-eb96-4d46-aba8-16afc95cc015',
  endpoint: 'http://54.179.212.129:8080/api/v1',
  project: 'web3auth_e2e_tests',
  launch: 'Web3auth E2E Tests',
  attributes: [
    {
      key: 'Launch_Id',
      value: '123',
    }
  ],
  description: 'Web3auth e2e test run',
};


const indexConfig: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  timeout: process.env.CI ? 5 * 60 * 1000 : 0,
  globalTimeout: process.env.CI ? 5 * 60 * 1000 : undefined,
  retries: process.env.CI ? 3 : 0,
   // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : 1,
  reporter: process.env.CI ? [['github'],['@reportportal/agent-js-playwright', RPconfig]] : [['list'],['html',{  outputFile: 'test-results.html' }]],
  use: {
    // Emulate browsing in San Francisco, CA, USA
    locale: "en-US",
    timezoneId: "America/Los_Angeles",
    geolocation: { latitude: 37.773972, longitude: -122.431297 },

    // Report failure(s)
    screenshot: "only-on-failure",
    video: process.env.CI ? "retry-with-video" : "retain-on-failure",
    trace: {
      mode: "retain-on-failure",
    },
  },
};

export default indexConfig;
