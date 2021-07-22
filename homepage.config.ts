import { PlaywrightTestConfig } from "@playwright/test";
import { TestArgs } from "./base";

const playwrightConfig: PlaywrightTestConfig<TestArgs> = {
  testDir: "tests/homepage",
  forbidOnly: !!process.env.CI,
  timeout: process.env.CI ? 5 * 60 * 1000 : 0,
  retries: process.env.CI ? 3 : 0,
  use: {
    // Emulate browsing in San Francisco, CA, USA
    locale: "en-US",
    timezoneId: "America/Los_Angeles",
    geolocation: { latitude: 37.773972, longitude: -122.431297 },

    // Report failure(s)
    screenshot: "only-on-failure",
    video: process.env.CI ? "retry-with-video" : "retain-on-failure",
    trace: process.env.CI ? "off" : "retain-on-failure",

    // Custom context
    openloginURL: "https://app.openlogin.com",
  },
};

export default playwrightConfig;
