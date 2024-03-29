import * as playwright from "@playwright/test";
import { DEFAULT_PLATFORM, env_map } from "../utils/index";
import * as dotenv from "dotenv";
dotenv.config();

export interface TestArgs {
  openloginURL: string;
  FB: {
    password: string;
    email: string;
    name: string;
    firstName: string;
  };
}

export const test = playwright.test.extend<TestArgs>({
  openloginURL: env_map[process.env.PLATFORM || DEFAULT_PLATFORM],
  FB: {
    name: process.env.FB_TEST_USER_NAME || "",
    email: process.env.FB_TEST_USER_EMAIL || "",
    password: process.env.FB_TEST_USER_PASS || "",
    firstName: (process.env.FB_TEST_USER_NAME || "").split(" ")[0],
  },
});
