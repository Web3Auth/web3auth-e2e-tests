import { test as baseTest } from "@playwright/test";

export interface TestArgs {
  openloginURL: string;
  user: { email: string };
}

export const test = baseTest.extend<TestArgs>({
  openloginURL: "https://app.openlogin.com",
  user: { email: "hello@tor.us" },
});
