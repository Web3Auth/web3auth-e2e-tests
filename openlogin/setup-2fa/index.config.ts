import path from "path";
import {
  PlaywrightTestConfig,
  PlaywrightWorkerOptions,
} from "@playwright/test";
import { TestArgs } from "./index.lib";
import indexConfig from "../../index.config";
import { randomString } from "../../utils/index";

const projects: Array<
  Pick<PlaywrightWorkerOptions, "browserName"> & Omit<TestArgs, "openloginURL">
> = [
  {
    browserName: "chromium",
    user: {
      email: `testuser${randomString(10) + randomString(10)}@openlogin.com`,
    },
  },
  {
    browserName: "firefox",
    user: {
      email: `testuser${randomString(10) + randomString(10)}@openlogin.com`,
    },
  },
  {
    browserName: "webkit",
    user: {
      email: `testuser${randomString(10) + randomString(10)}@openlogin.com`,
    },
  },
];

const config: PlaywrightTestConfig = {
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