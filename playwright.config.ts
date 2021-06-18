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
      name: "carter-0",
      use: {
        storageState: "state/carter-0.json",
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
      name: "washington-0",
      use: {
        storageState: "state/washington-0.json",
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
    {
      name: "carter-1",
      use: {
        storageState: "state/carter-1.json",
        browserName: "firefox",
        openloginURL,
        user: {
          discord: {
            email: "clyde.m.carter@gmail.com",
            password: "ahshahX9Ki",
          },
          openlogin: {
            password: "sR0D2s@AV@4z",
          },
        },
      },
    },
    {
      name: "washington-1",
      use: {
        storageState: "state/washington-1.json",
        browserName: "chromium",
        openloginURL,
        user: {
          discord: {
            email: "connie.washington.1981@gmail.com",
            password: "aeLici1ie",
          },
          openlogin: {
            password: "WIw0pkR!P$G9",
          },
        },
      },
    },
    {
      name: "rick-0",
      use: {
        storageState: "state/rick-0.json",
        browserName: "chromium",
        openloginURL,
        user: {
          facebook: {
            name: "Rick",
            email: "lweycjnfml_1623990130@tfbnw.net",
            password: "Hello123@",
          },
          openlogin: {
            password: "-RKEu8x2L.)rmbH",
          },
        },
      },
    },
    {
      name: "tyler-0",
      use: {
        storageState: "state/tyler-0.json",
        browserName: "firefox",
        openloginURL,
        user: {
          facebook: {
            name: "Tyler",
            email: "cwmaykrxgq_1623990130@tfbnw.net",
            password: "Hello123@",
          },
          openlogin: {
            password: "S}Q7j+[vrPLxZ98",
          },
        },
      },
    },
  ],
};

export default playwrightConfig;
