import { expect } from "@playwright/test";
import { test } from "./index.lib";
import { signInWithFacebook } from "../../utils";
import { useAutoCancelShareTransfer } from "../../utils/index";

test("Login with Facebook+Device", async ({ page, openloginURL, user, FB }) => {
  // Login with Facebook
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');
  await page.click('[aria-label="login with facebook"]');
  await signInWithFacebook({ page, FB });

  useAutoCancelShareTransfer(page);

  try {
    // Skip setting up 2FA popup if its visible
    await page.waitForSelector("text=secure your account");
    await page.click(`button:has-text("Maybe next time")`);
  } catch (e) {}

  // Should be signed in in <2 minutes
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    timeout: 2 * 60 * 1000,
    // waitUntil: "domcontentloaded",
  });

  await page.waitForNavigation();
  await page.waitForSelector(`text=Welcome, ${FB.name}`);

  // Logout
  // await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
  // expect(page.url()).toBe(`${openloginURL}/`);
});
