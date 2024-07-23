import * as playwright from "@playwright/test";
import * as dotenv from "dotenv";

import { DEFAULT_PLATFORM, env_map } from "../utils/index";
dotenv.config();

export interface TestArgs {
  openloginURL: string;
  google: {
    email: string;
    password: string;
    name: string;
  };
}

export const test = playwright.test.extend<TestArgs>({
  openloginURL: env_map[process.env.PLATFORM || DEFAULT_PLATFORM],
  google: {
    email: process.env.GITHUB_USER_EMAIL || "",
    password: process.env.GITHUB_USER_PASSWORD || "",
    name: process.env.GOOGLE_NAME || "",
  },
});
