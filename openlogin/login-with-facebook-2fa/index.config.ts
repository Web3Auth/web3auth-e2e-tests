import path from "path";
import {
  PlaywrightTestConfig,
  PlaywrightWorkerOptions,
} from "@playwright/test";
import { TestArgs } from "./index.lib";
import indexConfig from "../../index.config";
import { readFileSync } from "fs";

const projects: Array<
  Pick<PlaywrightWorkerOptions, "browserName"> & Omit<TestArgs, "openloginURL">
> = [
  {
    browserName: "chromium",
    user: {
      email: "npqlzgpcyx_1624264537@tfbnw.net",
      name: "Rick",
      backupPhrase: readFileSync(path.resolve(__dirname, "backup-phrase.txt")).toString()
    },
  },
  {
    browserName: "firefox",
    user: {
      email: "npqlzgpcyx_1624264537@tfbnw.net",
      name: "Rick",
      backupPhrase: readFileSync(path.resolve(__dirname, "backup-phrase.txt")).toString()
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
