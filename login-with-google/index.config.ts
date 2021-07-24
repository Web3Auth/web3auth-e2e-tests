import path from "path";
import {
  PlaywrightTestConfig,
  PlaywrightWorkerOptions,
} from "@playwright/test";
import { TestArgs } from "./index.base";

const projects: Array<
  Pick<PlaywrightWorkerOptions, "browserName"> & Omit<TestArgs, "openloginURL">
> = [
  {
    browserName: "chromium",
    user: { email: "clyde.m.carter@gmail.com" },
  },
  {
    browserName: "webkit",
    user: { email: "clyde.m.carter@gmail.com" },
  },
];

const config: PlaywrightTestConfig<TestArgs> = {
  testDir: __dirname,
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
  },
  projects: projects.map(({ browserName, user }) => ({
    name: browserName,
    use: {
      browserName,
      storageState: path.resolve(__dirname, `${browserName}.json`),
      user,
    },
  })),
};

export default config;
