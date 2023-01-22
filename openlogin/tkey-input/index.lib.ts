import * as playwright from "@playwright/test";
import { env_map } from "../../utils/index";
import * as dotenv from "dotenv";
dotenv.config();

export interface TestArgs {
  openloginURL: string;
}

export const test = playwright.test.extend<TestArgs>({
  openloginURL: env_map[process.env.PLATFORM || "prod"],
});
