import * as playwright from "@playwright/test";
import {env_map } from "../utils/index";
import * as dotenv from "dotenv";
dotenv.config();

export interface TestArgs {
  torusLoginURL: string;
}

export const test = playwright.test.extend<TestArgs>({
  torusLoginURL: env_map["torusV1"],
});
