import {
  PlaywrightTestConfig,
} from "@playwright/test";
import { TestArgs } from "./index.lib";
import indexConfig from "../../index.config";


const config: PlaywrightTestConfig<TestArgs> = {
  ...indexConfig,
  testDir: __dirname,
};

export default config;
