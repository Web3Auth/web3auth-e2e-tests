import * as playwright from "@playwright/test";
import { DEFAULT_PLATFORM, env_map } from "../utils/index";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";
import path from "path";
dotenv.config();

export interface TestArgs {
  openloginURL: string;
  FB: {
    password: string;
    email: string;
    name: string;
    firstName: string;
    backupPhrase: string;
  };
}

export const test = playwright.test.extend<TestArgs>({
  openloginURL: env_map[process.env.PLATFORM || DEFAULT_PLATFORM],
  FB: {
    name: "Torus Solana",
    email: process.env.FB_2FA_TEST_USER_EMAIL || "",
    password: process.env.GITHUB_USER_PASSWORD || "",
    firstName: "Torus",
    backupPhrase: process.env.BACKUP_PHRASE_PROD,
  },
});
