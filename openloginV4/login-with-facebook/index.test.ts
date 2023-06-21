import { test, expect , Page} from '@playwright/test';
import { DEFAULT_PLATFORM, env_map } from "../utils/index";
import { signInWithFacebook } from "../utils";
import { useAutoCancelShareTransfer } from "../utils/index";
import { AccountsPage } from '../account-page/AccountsPage';
import { readFileSync } from "fs";
import path from "path";

const FB = {
  name: "Torus Solana",
  email: process.env.FB_2FA_TEST_USER_EMAIL || "",
  password: process.env.GITHUB_USER_PASSWORD || "",
  firstName: "Torus",
  backupPhrase: ""
};
const openloginURL = env_map[process.env.PLATFORM || "prod"];

test("Login with Facebook", async ({ page }) => {
  test.skip()
  const accountsPage = new AccountsPage(page);
  await page.goto(openloginURL);
  await accountsPage.addSocialRecoveryFactor("facebook");
  await signInWithFacebook({ page, FB, openloginURL });
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    waitUntil: "load",
  });
  await page.waitForSelector(`text=Welcome, ${FB.name}`);
  await accountsPage.clickLogout();
  expect(page.url()).toContain(`${openloginURL}/`);
});
