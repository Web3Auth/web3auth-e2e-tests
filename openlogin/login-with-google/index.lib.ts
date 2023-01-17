import * as playwright from "@playwright/test";
import { env_map } from "../../utils/index";

export interface TestArgs {
  openloginURL: string;
  google: {
    email: string;
    password: string;
    name: string;
  }
}

export const test = playwright.test.extend<TestArgs>({
  openloginURL: env_map[process.env.PLATFORM || 'cyan'],
  google: {
    email: process.env.GOOGLE_ACCOUNT || "",
    password: process.env.GOOGLE_PASSWORD || "",
    name: process.env.GOOGLE_NAME || ""
  }
});
