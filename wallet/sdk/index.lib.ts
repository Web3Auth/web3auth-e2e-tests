import * as playwright from "@playwright/test";
import { HOST, PORT } from "./index.setup";

export interface TestArgs {
  appURL: string;
}

export const test = playwright.test.extend<TestArgs>({
  appURL: `http://${HOST}:${PORT}`,
});
