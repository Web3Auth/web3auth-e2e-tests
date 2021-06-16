import { PlaywrightTestConfig } from "@playwright/test";

const playwrightConfig: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  timeout: 5 * 60 * 1000,
  retries: 3,
  use: {
    locale: "en-US",
  },
};

export default playwrightConfig;
