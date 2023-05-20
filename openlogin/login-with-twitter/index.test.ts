import { test, expect , Page} from '@playwright/test';
import { DEFAULT_PLATFORM, env_map, signInWithTwitterWithoutLogin, useAutoCancel2FASetup } from "../../utils/index";
import { signInWithTwitter,authorizeWithGitHub } from "../../utils";
import { useAutoCancelShareTransfer } from "../../utils/index";
import { AccountsPage } from '../../openlogin/account-page/AccountsPage';

const openloginURL = env_map[process.env.PLATFORM || "prod"];
const twitter = {
  account: process.env.TWITTER_ACCOUNT || "",
  email: process.env.TWITTER_EMAIL || "",
  password: process.env.TWITTER_PASSWORD || "",
}

test("Login with twitter", async ({ page }) => {
  const accountsPage = new AccountsPage(page);
  await page.goto(openloginURL);
  await accountsPage.addSocialRecoveryFactor("twitter");
  await signInWithTwitterWithoutLogin({ page, twitter, openloginURL })
  await useAutoCancel2FASetup(page);
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    waitUntil: "load",
  });
  await page.waitForSelector(`text=Welcome, ${twitter.account}`);
  await page.click("text=Logout")
  expect(page.url()).toContain(`${openloginURL}/`);
});
