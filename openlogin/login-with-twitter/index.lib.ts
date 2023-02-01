import * as playwright from "@playwright/test";
import { env_map } from "../../utils/index";
import * as dotenv from "dotenv";
dotenv.config();

export interface TestArgs {
  openloginURL: string;
  twitter: {
    email: string;
    password: string;
  }
}

export const test = playwright.test.extend<TestArgs>({
  openloginURL: env_map[process.env.PLATFORM || 'cyan'],
  twitter: {
    email: process.env.TWITTER_ACCOUNT || "",
    password: process.env.TWITTER_PASSWORD || "",
  }
});
