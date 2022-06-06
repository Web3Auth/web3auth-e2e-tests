import { expect } from "@playwright/test";
import { test } from "./index.lib";
import { signInWithFacebook } from "../../utils";
import { useAutoCancelShareTransfer } from "../../utils/index";

test("Login with Facebook+Device", async ({ page, openloginURL, user }) => {
  // Login with Facebook
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');
  await page.click('[aria-label="login with facebook"]');
  test.fixme(!(await signInWithFacebook({ page, name: user.name })));

  useAutoCancelShareTransfer(page);
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
