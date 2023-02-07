import * as playwright from "@playwright/test";
import { env_map, DEFAULT_PLATFORM } from "../../utils/index";
import * as dotenv from "dotenv";
dotenv.config();

export interface TestArgs {
  openloginURL: string;
  discord: {
    email: string;
    password: string;
  }
}

export const test = playwright.test.extend<TestArgs>({
  openloginURL: env_map[process.env.PLATFORM || DEFAULT_PLATFORM],
  discord: {
    email: process.env.DISCORD_EMAIL || '',
    password: process.env.DISCORD_PASSWORD || ''
  },
});
