import { expect, test } from "@playwright/test";

import { AccountsPage } from "../account-page/AccountsPage";
import { env_map, signInWithFacebook } from "../utils";

const FB = {
  name: "Torus Solana",
  email: process.env.FB_2FA_TEST_USER_EMAIL || "",
  password: process.env.GITHUB_USER_PASSWORD || "",
  firstName: "Torus",
  backupPhrase: process.env.BACKUP_PHRASE_PROD,
};
const openloginURL = env_map[process.env.PLATFORM || "prod"];

test("Login with Facebook", async ({ page }) => {
  test.skip();
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
