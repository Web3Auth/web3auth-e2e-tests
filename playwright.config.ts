import { PlaywrightTestConfig } from "@playwright/test";
import { TestArgs } from "./base";

const playwrightConfig: PlaywrightTestConfig<TestArgs> = {
  forbidOnly: !!process.env.CI,
  timeout: 5 * 60 * 1000,
  retries: 2,
  workers: 1,
  use: {
    // Emulate browsing in San Francisco, CA, USA
    locale: "en-US",
    timezoneId: "America/Los_Angeles",
    geolocation: { latitude: 37.773972, longitude: -122.431297 },
    // Report failure(s)
    screenshot: "only-on-failure",
    video: "retry-with-video",
  },
  projects: [
    {
      name: "google-on-chrome",
      use: {
        storageState: "state/google-on-chrome.json",
        browserName: "chromium",
        profile: {
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
      name: "google-on-safari",
      use: {
        storageState: "state/google-on-safari.json",
        browserName: "webkit",
        profile: {
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
