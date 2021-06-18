import { test as baseTest } from "@playwright/test";

export interface TestArgs {
  openloginURL: string;
  user: {
    google?: {
      email: string;
      password: string;
    };
    openlogin?: {
      password: string;
    };
  };
}

export const test = baseTest.extend<TestArgs>({
  openloginURL: "https://app.openlogin.com",
  user: {},
});
