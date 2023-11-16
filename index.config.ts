import { PlaywrightTestConfig, devices } from "@playwright/test";
const RPClient = require("@reportportal/client-javascript");
// const RPconfig = {
//   token: '4311671d-eb96-4d46-aba8-16afc95cc015',
//   endpoint: 'http://54.179.212.129:8080/api/v1',
//   project: 'web3auth_e2e_tests',
//   launch: 'Web3auth E2E Tests',
//   attributes: [
//     {
//       key: 'Environment',
//       value: process.env.PLATFORM,
//     },
//     {
//       key: 'Version',
//       value: process.env.APP_VERSION,
//     }
//   ],
//   description: 'Web3auth e2e test run',
//   isLaunchMergeRequired: true
// };

const indexConfig: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  //  timeout: process.env.CI ? 5 * 6 * 1000 : 0,
  globalTimeout: process.env.CI ? 12 * 100 * 1000 : undefined,
  retries: process.env.CI ? 0 : 0,
  // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : 1,
  // reporter: process.env.CI
  //   ? [["@reportportal/agent-js-playwright", RPconfig]]
  //   : [["html"]],
  reporter: process.env.CI ? [["html"]] : [["html"]],
  use: {
    // Emulate browsing in San Francisco, CA, USA
    locale: "en-GB",
    timezoneId: "IST",
    geolocation: { latitude: 13.081585811267423, longitude: 80.27697382248456 },

    // Report failure(s)
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "retain-on-failure",
    // trace: {
    //   mode: "retain-on-failure",
    // },
  },
  projects: [
    {
      name: "chromium",

      use: {
        ...devices["Desktop Chromium"],
        viewport: null,

        launchOptions: {
          args: ["--start-maximized"],
        },
      },
    },
  ],
};

export default indexConfig;
