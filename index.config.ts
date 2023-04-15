import { PlaywrightTestConfig } from "@playwright/test";
// const RPconfig = {
//   token: '47eaf491-bfef-4c68-8f47-820211dacbc5',
//   endpoint: 'http://localhost:8080/api/v1',
//   project: 'superadmin_personal',
//   launch: 'superadmin_TEST_EXAMPLE',
//   // attributes: [
//   //   {
//   //     key: 'key',
//   //     value: 'value',
//   //   },
//   //   {
//   //     value: 'value',
//   //   },
//   // ],
//   description: 'Your launch description',
// };


const indexConfig: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  timeout: process.env.CI ? 5 * 60 * 1000 : 0,
  globalTimeout: process.env.CI ? 6 * 60 * 1000 : undefined,
  retries: process.env.CI ? 3 : 0,
  // reporter: [['@reportportal/agent-js-playwright', RPconfig]],
  reporter: process.env.CI ? 'github' : [['list'],['html',{  outputFile: 'test-results.html' }]],
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
