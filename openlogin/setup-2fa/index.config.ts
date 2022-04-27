import path from "path";
import {
  PlaywrightTestConfig,
  PlaywrightWorkerOptions,
} from "@playwright/test";
import { TestArgs } from "./index.lib";
import indexConfig from "../../index.config";
import { randomString, randomNumber } from "../../utils/index";

const projects: Array<
  Pick<PlaywrightWorkerOptions, "browserName"> & Omit<TestArgs, "openloginURL">
> = [
  {
    browserName: "chromium",
    user: {
      email_2fa_login: `testuser${
        randomString(randomNumber()) + randomString(randomNumber())
      }@openlogin.com`,
      email_2fa_settings: `testuser${
        randomString(randomNumber()) + randomString(randomNumber())
      }@openlogin.com`,
    },
  },
  {
    browserName: "firefox",
    user: {
      email_2fa_login: `testuser${
        randomString(randomNumber()) + randomString(randomNumber())
      }@openlogin.com`,
      email_2fa_settings: `testuser${
        randomString(randomNumber()) + randomString(randomNumber())
      }@openlogin.com`,
    },
  },
  {
    browserName: "webkit",
    user: {
      email_2fa_login: `testuser${
        randomString(randomNumber()) + randomString(randomNumber())
      }@openlogin.com`,
      email_2fa_settings: `testuser${
        randomString(randomNumber()) + randomString(randomNumber())
      }@openlogin.com`,
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
