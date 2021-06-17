import { PlaywrightTestConfig } from "@playwright/test";
import { TestArgs } from "./base";

const playwrightConfig: PlaywrightTestConfig<TestArgs> = {
  forbidOnly: !!process.env.CI,
  timeout: 5 * 60 * 1000,
  retries: 2,
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
      name: "A",
      use: {
        storageState: "state/a.json",
        browserName: "chromium",
        profile: {
          google: {
            email: "clyde.m.carter@gmail.com",
          },
          openlogin: {
            password: "A6vFtb*MLVW0W&rz",
          },
        },
      },
    },
  ],
};

export default playwrightConfig;
