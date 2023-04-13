import * as playwright from "@playwright/test";
import { env_map } from "../../utils/index";

export interface TestArgs {
  openloginURL: string;
  user: { email: string };
}

export const test = playwright.test.extend<TestArgs>({
  openloginURL: env_map[process.env.PLATFORM || "prod"],
  user: [{ email: "hello@tor.us" }, { option: true }],
});
