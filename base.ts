import { test as baseTest } from "@playwright/test";

export interface TestArgs {
  profile: {
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
  profile: {},
});
