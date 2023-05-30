import { test, expect , Page} from '@playwright/test';
import { DEFAULT_PLATFORM, env_map } from "../utils/index";
import { signInWithDiscord, useAutoCancel2FASetup } from "../utils";
import { useAutoCancelShareTransfer } from "../utils/index";
import { AccountsPage } from '../account-page/AccountsPage';

const discord = {
  email: process.env.DISCORD_EMAIL || '',
  password: process.env.DISCORD_PASSWORD || ''
};
const openloginURL = env_map[process.env.PLATFORM || "prod"];

test.skip("Login with Discord - skipped since it requires captcha solving", async ({ page }) => {
  const accountsPage = new AccountsPage(page);
  await page.goto(openloginURL);
  await accountsPage.addSocialRecoveryFactor("discord");
  test.fixme(!(await signInWithDiscord({ page, discord })));
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    timeout: 3 * 60 * 1000
  });
  expect(page.url()).toBe(`${openloginURL}/wallet/home`);
  await page.waitForSelector(`text=Welcome, ${discord.email}`);
  await accountsPage.clickLogout();
  expect(page.url()).toBe(`${openloginURL}/`);
});
