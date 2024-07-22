import { expect, Page, test } from "@playwright/test";

import { AccountsPage } from "../account-page/AccountsPage";
import {
  authorizeWithGitHub,
  DEFAULT_PLATFORM,
  env_map,
  signInWithTwitter,
  signInWithTwitterWithoutLogin,
  useAutoCancel2FASetup,
  useAutoCancelShareTransfer,
} from "../utils";

const openloginURL = env_map[process.env.PLATFORM || "prod"];
const twitter = {
  account: process.env.TWITTER_ACCOUNT || "",
  email: process.env.TWITTER_EMAIL || "",
  password: process.env.TWITTER_PASSWORD || "",
};

test.skip("Login with twitter", async ({ page }) => {
  const accountsPage = new AccountsPage(page);
  await page.goto(openloginURL);
  await accountsPage.addSocialRecoveryFactor("twitter");
  await signInWithTwitterWithoutLogin({ page, twitter, openloginURL });
  await useAutoCancel2FASetup(page);
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    waitUntil: "load",
  });
  await page.waitForSelector(`text=Welcome, ${twitter.account}`);
  await accountsPage.clickLogout();
  expect(page.url()).toContain(`${openloginURL}/`);
});
