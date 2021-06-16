import { PlaywrightTestConfig } from "@playwright/test";

const playwrightConfig: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
};

export default playwrightConfig;
