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
    browserName: "firefox",
    user: { email: "connie.washington.1981@gmail.com" },
  },
  {
    browserName: "chromium",
    user: { email: "testuser.existing1@openlogin.com" },
  },
  {
    browserName: "webkit",
    user: { email: "connie.washington.1981@gmail.com" },
  },
];

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
