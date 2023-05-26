import { test, expect , Page} from '@playwright/test';
import { DEFAULT_PLATFORM, env_map } from "../../utils/index";
import { signInWithFacebook } from "../../utils";
import { useAutoCancelShareTransfer } from "../../utils/index";
import { AccountsPage } from '../../openlogin/account-page/AccountsPage';
import { readFileSync } from "fs";
import path from "path";

const FB = {
  name: "Torus Solana",
  email: "torus.e2e.gb@gmail.com",
  password: process.env.GITHUB_USER_PASSWORD || "",
  firstName: "Torus",
  backupPhrase: readFileSync(path.resolve(__dirname, "backup-phrase.txt")).toString(),
};
const openloginURL = env_map[process.env.PLATFORM || "prod"];

test.skip("Login with Facebook 2FA", async ({ page }) => {
  const accountsPage = new AccountsPage(page);
  await page.goto(openloginURL);
  await accountsPage.addSocialRecoveryFactor("facebook");
  await signInWithFacebook({ page, FB, openloginURL });
  await accountsPage.clickVerifyWithOtherFactors();
  await accountsPage.verifyWithFactor("Recovery factor");
  await accountsPage.verifyRecoveryPhrase(FB.backupPhrase);
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    waitUntil: "load",
  });
  await page.waitForSelector(`text=Welcome, ${FB.name}`);
  await accountsPage.clickLogout();
  expect(page.url()).toContain(`${openloginURL}/`);
});
