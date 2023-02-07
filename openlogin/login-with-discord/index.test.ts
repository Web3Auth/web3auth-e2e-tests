import { expect } from "@playwright/test";
import { test } from "./index.lib";
import { signInWithDiscord, useAutoCancel2FASetup } from "../../utils";
import { useAutoCancelShareTransfer } from "../../utils/index";

<<<<<<< HEAD
test.skip("Login with Discord+Device", async ({ page, openloginURL, user }) => {
=======
test.skip("Login with Discord - skipped bcz it requires captcha solving", async ({ page, openloginURL, discord }) => {
  // Verify environment variables
  expect(
    !!process.env.DISCORD_EMAIL &&
    !!process.env.DISCORD_PASSWORD
  ).toBe(true);

>>>>>>> develop
  // Login with Discord
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');
  await page.click('[aria-label="login with discord"]');
  test.fixme(!(await signInWithDiscord({ page, discord })));

  useAutoCancelShareTransfer(page);
  useAutoCancel2FASetup(page);

  // Should be signed in in <2 minutes
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    waitUntil: "load",
  });

  expect(page.url()).toBe(`${openloginURL}/wallet/home`);

  await page.waitForSelector(`text=Welcome, ${discord.email}`);

  // Logout
  await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
  expect(page.url()).toBe(`${openloginURL}/`);
});
