import path from "path";
import {
  PlaywrightTestConfig,
  PlaywrightWorkerOptions,
} from "@playwright/test";
import { TestArgs } from "./index.base";
import indexConfig from "../index.config";

const projects: Array<
  Pick<PlaywrightWorkerOptions, "browserName"> & Omit<TestArgs, "openloginURL">
> = [
  {
    browserName: "chromium",
    user: {
      email: "woiovgalay_1624264537@tfbnw.net",
      name: "Elizabeth",
    },
  },
  {
    browserName: "firefox",
    user: {
      email: "dvpizamosb_1624264537@tfbnw.net",
      name: "Lisa",
    },
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
