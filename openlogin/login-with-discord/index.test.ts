import { expect } from "@playwright/test";
import { test } from "./index.lib";
import { signInWithDiscord } from "../../index.utils";

test("Login with Discord+Device", async ({ page, openloginURL, user }) => {
  // Login with Discord
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');
  await page.click(".row:nth-child(2) div:nth-child(3) .app-btn"); // TODO: Select using aria-label
  test.fixme(!(await signInWithDiscord(page)));

  // Should be signed in in <2 minutes
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    timeout: 2 * 60 * 1000,
  });

  // Go to Account page
  await Promise.all([page.waitForNavigation(), page.click("text=Account")]);
  expect(await page.isVisible(`text=${user.email}`)).toBeTruthy();

  // Logout
  await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
  expect(page.url()).toBe(`${openloginURL}/`);
});
