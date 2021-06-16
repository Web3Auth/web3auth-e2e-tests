import { PlaywrightTestConfig } from "@playwright/test";

const playwrightConfig: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  timeout: 5 * 60 * 1000,
  retries: 3,
  use: {
    // Emulate browsing in San Francisco, CA, USA
    locale: "en-US",
    timezoneId: "America/Los_Angeles",
    geolocation: { latitude: 37.773972, longitude: -122.431297 },
  },
};

export default playwrightConfig;
