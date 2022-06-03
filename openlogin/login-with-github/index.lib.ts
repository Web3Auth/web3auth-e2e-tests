import * as playwright from "@playwright/test";

export interface TestArgs {
  openloginURL: string;
  user: { email: string };
}

const env_map = {
  PROD: "https://app.openlogin.com",
  STAGING: "https://beta.openlogin.com",
};

export const test = playwright.test.extend<TestArgs>({
  openloginURL: env_map[process.env.PLATFORM],
  user: { email: "hello@tor.us" },
});
