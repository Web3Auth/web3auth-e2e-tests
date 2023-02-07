import { expect } from "@playwright/test";
import { test } from "./index.lib";
import { signInWithFacebook, useAutoCancel2FASetup } from "../../utils";
import { useAutoCancelShareTransfer } from "../../utils/index";

test.skip("Login with Facebook+Device", async ({ page, openloginURL, FB }) => {
  page.setDefaultTimeout(8 * 60 * 1000);
  page.setDefaultNavigationTimeout(8 * 60 * 1000);

  // Login with Facebook
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');
  await page.click('[aria-label="login with facebook"]');
  await signInWithFacebook({ page, FB });

  await useAutoCancelShareTransfer(page);
  await useAutoCancel2FASetup(page);

  await page.waitForURL(`${openloginURL}/wallet/home`, {
    waitUntil: "load",
  });

  expect(page.url()).toBe(`${openloginURL}/wallet/home`);

  await page.waitForSelector(`text=Welcome, ${FB.name}`);

  // Logout;
  await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
  expect(page.url()).toBe(`${openloginURL}/`);
});
