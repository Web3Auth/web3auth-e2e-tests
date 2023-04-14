import * as playwright from "@playwright/test";
import { env_map } from "../../utils/index";

export interface TestArgs {
  openloginURL: string;
  github: {
    password: string;
    email: string;
  };
}

export const test = playwright.test.extend<TestArgs>({
  openloginURL: env_map[process.env.PLATFORM || "prod"],
  github: {
    email: process.env.GITHUB_USER_EMAIL || "",
    password: process.env.GITHUB_USER_PASSWORD || ""
  },
});
