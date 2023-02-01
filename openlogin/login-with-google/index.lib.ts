import * as playwright from "@playwright/test";
import { DEFAULT_PLATFORM, env_map } from "../../utils/index";
import * as dotenv from "dotenv";
dotenv.config();

export interface TestArgs {
  openloginURL: string;
  google: {
    email: string;
    password: string;
    name: string;
  }
}

export const test = playwright.test.extend<TestArgs>({
  openloginURL: env_map[process.env.PLATFORM || DEFAULT_PLATFORM],
  google: {
    email: process.env.GOOGLE_ACCOUNT || "",
    password: process.env.GOOGLE_PASSWORD || "",
    name: process.env.GOOGLE_NAME || ""
  }
});
