import { PlaywrightTestConfig } from "@playwright/test";

const indexConfig: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  timeout: process.env.CI ? 3 * 60 * 1000 : 0,
  retries: process.env.CI ? 3 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    // Emulate browsing in San Francisco, CA, USA
    locale: "en-US",
    timezoneId: "America/Los_Angeles",
    geolocation: { latitude: 37.773972, longitude: -122.431297 },

    // Report failure(s)
    screenshot: "only-on-failure",
    video: process.env.CI ? "retry-with-video" : "retain-on-failure",
    trace: process.env.CI ? "off" : "retain-on-failure",
    // trace: "on",
  },
};

export default indexConfig;
