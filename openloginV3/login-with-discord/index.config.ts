import { PlaywrightTestConfig, PlaywrightWorkerOptions } from "@playwright/test";
import path from "path";

import indexConfig from "../../index.config";
import { TestArgs } from "./index.lib";

const projects: Array<Pick<PlaywrightWorkerOptions, "browserName"> & Omit<TestArgs, "openloginURL">> = [];

const config: PlaywrightTestConfig<TestArgs> = {
  ...indexConfig,
  testDir: __dirname,
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
