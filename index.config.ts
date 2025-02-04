import { devices, PlaywrightTestConfig } from "@playwright/test";

const indexConfig: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  //  timeout: process.env.CI ? 5 * 6 * 1000 : 0,
  globalTimeout: process.env.CI ? 15 * 100 * 1000 : undefined,
  retries: process.env.CI ? 0 : 0,
  // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : 1,
  reporter: process.env.CI ? [["html"]] : [["html"]],
  use: {
    // Emulate browsing in San Francisco, CA, USA
    locale: "en-GB",
    timezoneId: "IST",
    geolocation: { latitude: 13.081585811267423, longitude: 80.27697382248456 },

    // Report failure(s)
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "retain-on-failure",
    trace: {
      mode: "retain-on-failure",
    },
  },
  projects: [
    {
      name: "Chrome",

      use: {
        ...devices["Desktop Chromium"],
        viewport: null,

        launchOptions: {
          args: ["--start-maximized"],
        },
      },
    },
    {
      name: "Safari",
      use: { ...devices["Desktop Safari"] },
    },
  ],
};

export default indexConfig;
