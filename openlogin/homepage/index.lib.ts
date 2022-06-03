import * as playwright from "@playwright/test";

export interface TestArgs {
  openloginURL: string;
}

export const test = playwright.test.extend<TestArgs>({
  openloginURL: "https://app.openlogin.com",
});
