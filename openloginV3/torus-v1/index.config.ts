import { PlaywrightTestConfig } from "@playwright/test";

import indexConfig from "../../index.config";
import { TestArgs } from "./index.lib";

const config: PlaywrightTestConfig<TestArgs> = {
  ...indexConfig,
  testDir: __dirname,
};

export default config;
