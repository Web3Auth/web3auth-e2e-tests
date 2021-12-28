import path from "path";
import {
  PlaywrightTestConfig,
  PlaywrightWorkerOptions,
} from "@playwright/test";
import { TestArgs } from "./index.lib";
import indexConfig from "../../index.config";
import { readFileSync } from "fs";

const user = {
  email: "hosdyduxvg_1640060261@tfbnw.net",
  name: "Sharon",
  backupPhrase: readFileSync(path.resolve(__dirname, "backup-phrase.txt")).toString()
}

const projects: Array<
  Pick<PlaywrightWorkerOptions, "browserName"> & Omit<TestArgs, "openloginURL">
> = [
  {
    browserName: "firefox",
    user
  }
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
