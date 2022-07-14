import * as playwright from "@playwright/test";

export interface TestArgs {
  openloginURL: string;
  user: {
    email: string;
    name: string;
    backupPhrase: string
  };
}

export const test = playwright.test.extend<TestArgs>({
  openloginURL: "https://app.openlogin.com",
  user: [{
    email: "hello@tor.us",
    name: "Torus Labs",
    backupPhrase: ""
  }, { option: true }],
});
