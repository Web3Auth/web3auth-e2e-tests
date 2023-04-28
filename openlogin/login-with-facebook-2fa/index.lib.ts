import * as playwright from "@playwright/test";
import { DEFAULT_PLATFORM, env_map } from "../../utils/index";
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
    email: "torus.e2e.gb@gmail.com",
    password: process.env.GITHUB_USER_PASSWORD || "",
    firstName: "Torus",
    backupPhrase: readFileSync(path.resolve(__dirname, "backup-phrase.txt")).toString(),
  },
});
