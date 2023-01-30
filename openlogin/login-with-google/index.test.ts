import { expect } from "@playwright/test";
import { test } from "./index.lib";
import { signInWithGoogle, useAutoCancel2FASetup } from "../../utils";
import { useAutoCancelShareTransfer } from "../../utils/index";

test("Login with Google+Device", async ({
  page,
  browserName,
  openloginURL,
  google,
}) => {
  page.setDefaultTimeout(8 * 60 * 1000);
  page.setDefaultNavigationTimeout(8 * 60 * 1000);

  // Verify environment variables
  expect(
    !!process.env.GOOGLE_ACCOUNT &&
    !!process.env.GOOGLE_PASSWORD &&
    !!process.env.GOOGLE_NAME
  ).toBe(true);


  // Login with Google
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');
  await page.click("[aria-label='login with google']");

  await signInWithGoogle({ page, google })

  useAutoCancelShareTransfer(page);
  useAutoCancel2FASetup(page);

  // Should be signed in in <2 minutes
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    waitUntil: "load",
  });

  expect(page.url()).toBe(`${openloginURL}/wallet/home`);

  await page.waitForSelector(`text=Welcome, ${google.name}`);

  // Logout
  await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
  expect(page.url()).toBe(`${openloginURL}/`);
});
