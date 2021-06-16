import { PlaywrightTestConfig } from "@playwright/test";

const playwrightConfig: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  use: {
    locale: "en-US",
  },
};

export default playwrightConfig;
