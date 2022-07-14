import * as playwright from "@playwright/test";
import { env_map } from "../../utils/index";

export interface TestArgs {
  openloginURL: string;
  user: { emailSettings: string; emailLogin: string };
}

export const test = playwright.test.extend<TestArgs>({
  openloginURL: env_map[process.env.PLATFORM],
  user: [
    { emailSettings: "hello@tor.us", emailLogin: "hello@tor.us" },
    { option: true },
  ],
});
