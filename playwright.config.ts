import { PlaywrightTestConfig } from "@playwright/test";
import { TestArgs } from "./base";

const openloginURL =
  process.env.TEST_ENV === "beta"
    ? "https://beta.openlogin.com"
    : "https://app.openlogin.com";

const playwrightConfig: PlaywrightTestConfig<TestArgs> = {
  forbidOnly: !!process.env.CI,
  timeout: process.env.CI ? 5 * 60 * 1000 : 0,
  retries: process.env.CI ? 3 : 0,
  workers: 1,
  use: {
    // Emulate browsing in San Francisco, CA, USA
    locale: "en-US",
    timezoneId: "America/Los_Angeles",
    geolocation: { latitude: 37.773972, longitude: -122.431297 },
    // Report failure(s)
    screenshot: "only-on-failure",
    video: process.env.CI ? "retry-with-video" : "retain-on-failure",
    trace: process.env.CI ? "off" : "retain-on-failure",
  },
  projects: [
    {
      name: "carter",
      use: {
        storageState: "state/carter.json",
        browserName: "chromium",
        openloginURL,
        user: {
          google: {
            email: "clyde.m.carter@gmail.com",
            password: "ahshahX9Ki",
          },
          openlogin: {
            password: "A6vFtb*MLVW0W&rz",
          },
        },
      },
    },
    {
      name: "washington",
      use: {
        storageState: "state/washington.json",
        browserName: "webkit",
        openloginURL,
        user: {
          google: {
            email: "connie.washington.1981@gmail.com",
            password: "aeLici1ie",
          },
          openlogin: {
            password: "$gIv$uInnBpSh1Bc",
          },
        },
      },
    },
  ],
};

export default playwrightConfig;
