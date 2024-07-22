import { expect, Page, test } from "@playwright/test";

import { AccountsPage } from "../account-page/AccountsPage";
import { authorizeWithGitHub, DEFAULT_PLATFORM, env_map, signInWithGitHub, useAutoCancel2FASetup, useAutoCancelShareTransfer } from "../utils";

const openloginURL = env_map[process.env.PLATFORM || "prod"];
const github = {
  email: process.env.GITHUB_USER_EMAIL || "",
  password: process.env.GITHUB_USER_PASSWORD || "",
};

test.skip("Login with Github+Device skipped since it requires captcha solving", async ({ page }) => {
  const accountsPage = new AccountsPage(page);
  await signInWithGitHub({ page, github });
  await page.goto(openloginURL);
  await accountsPage.addSocialRecoveryFactor("GitHub");
  await authorizeWithGitHub({ page });
  await useAutoCancel2FASetup(page);
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    waitUntil: "load",
  });
  await accountsPage.clickLogout();
  expect(page.url()).toContain(`${openloginURL}/`);
});
