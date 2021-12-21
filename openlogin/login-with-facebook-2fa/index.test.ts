import { expect } from "@playwright/test";
import { test } from "./index.lib";
import { signInWithFacebook } from "../../index.utils";

test("Login with Facebook+2FA", async ({ page, openloginURL, user }) => {
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');
  await page.click('[aria-label="login with facebook"]');
  test.fixme(!(await signInWithFacebook({ page, name: user.name })));

  await page.waitForURL(`${openloginURL}/tkey-input*`, {
    timeout: 2 * 60 * 1000,
  });

  // fill and submit backup phrase
  await page.fill("[placeholder='Enter backup phrase']", user.backupPhrase);
  await page.click('button:has-text("Confirm")');

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
