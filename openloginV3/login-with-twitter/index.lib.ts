import * as playwright from "@playwright/test";
import { DEFAULT_PLATFORM, env_map } from "../utils/index";
import * as dotenv from "dotenv";
dotenv.config();

export interface TestArgs {
  openloginURL: string;
  twitter: {
    account: string;
    email: string;
    password: string;
  }
}

export const test = playwright.test.extend<TestArgs>({
  openloginURL: env_map[process.env.PLATFORM || DEFAULT_PLATFORM],
  twitter: {
    account: process.env.TWITTER_ACCOUNT || "",
    email: process.env.TWITTER_EMAIL || "",
    password: process.env.TWITTER_PASSWORD || "",
  }
});
