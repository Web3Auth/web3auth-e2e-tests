import { expect } from "@playwright/test";
import { test } from "./index.lib";
import { deleteCurrentDeviceShare, signInWithFacebook } from "../utils/index";
import { useAutoCancelShareTransfer } from "../utils/index";

test("Login using Facebook with 2FA enabled", async ({ page, openloginURL, FB }) => {
  test.skip()
  await signInWithFacebook({ page, FB, openloginURL });

  // Go to Account page
  await Promise.all([page.waitForNavigation(), page.click("text=Account")]);
  expect(await page.isVisible(`text=${FB.email}`)).toBeTruthy();

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
