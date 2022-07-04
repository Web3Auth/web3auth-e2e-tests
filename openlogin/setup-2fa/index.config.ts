import path from "path";
import {
  PlaywrightTestConfig,
  PlaywrightWorkerOptions,
} from "@playwright/test";
import { TestArgs } from "./index.lib";
import indexConfig from "../../index.config";

const projects: Array<
  Pick<PlaywrightWorkerOptions, "browserName"> & Omit<TestArgs, "openloginURL">
> = [
  {
    browserName: "chromium",
    user: {
      emailSettings: `testuser${process.env.TEST_RUN_ID}@openlogin.com`,
      emailLogin: `testuser${process.env.TEST_RUN_ID.split("")
        .reverse()
        .join("")}@openlogin.com`,
    },
  },
  {
    browserName: "firefox",
    user: {
      emailSettings: `testuser${process.env.TEST_RUN_ID}@openlogin.com`,
      emailLogin: `testuser${process.env.TEST_RUN_ID.split("")
        .reverse()
        .join("")}@openlogin.com`,
    },
  },
  {
    browserName: "webkit",
    user: {
      emailSettings: `testuser${process.env.TEST_RUN_ID}@openlogin.com`,
      emailLogin: `testuser${process.env.TEST_RUN_ID.split("")
        .reverse()
        .join("")}@openlogin.com`,
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
