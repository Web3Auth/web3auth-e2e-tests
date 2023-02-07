import { expect } from "@playwright/test";
import { test } from "./index.lib";
import { deleteCurrentDeviceShare, signInWithFacebook } from "../../utils";
import { useAutoCancelShareTransfer } from "../../utils/index";

test.skip("Login with Facebook+2FA", async ({ page, openloginURL, user }) => {
  test.setTimeout(process.env.CI ? 15 * 60 * 1000 : 0);

  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');
  await page.click('[aria-label="login with facebook"]');
  test.fixme(!(await signInWithFacebook({ page, name: user.name })));

  await page.waitForURL(`${openloginURL}/tkey-input*`, {
    timeout: 2 * 60 * 1000,
  });

  // fill and submit backup phrase
  await page.fill(
    "[placeholder='Enter backup phrase']",
    user.backupPhrase.trim()
  );
  await page.click('button:has-text("Confirm")');
  useAutoCancelShareTransfer(page);
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    timeout: 10 * 60 * 1000,
  });

  // Go to Account page
  await Promise.all([page.waitForNavigation(), page.click("text=Account")]);
  expect(await page.isVisible(`text=${user.email}`)).toBeTruthy();

  /**
   * Delete current device share
   * This prevents new device shares being added on every test run,
   * slowing down our tests
   */
  await deleteCurrentDeviceShare(page);

  // Logout
  await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
  expect(page.url()).toBe(`${openloginURL}/`);
});
