import * as playwright from "@playwright/test";
import * as dotenv from "dotenv";

import { DEFAULT_PLATFORM, env_map } from "../utils/index";
dotenv.config();

export interface TestArgs {
  openloginURL: string;
}

export const test = playwright.test.extend<TestArgs>({
  openloginURL: env_map[process.env.PLATFORM || DEFAULT_PLATFORM],
});
