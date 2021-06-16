import { PlaywrightTestConfig } from "@playwright/test";

const playwrightConfig: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  retries: 3,
};

export default playwrightConfig;
