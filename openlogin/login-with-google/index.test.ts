import { expect } from "@playwright/test";
import { test } from "./index.lib";
import { signInWithGoogle, useAutoCancel2FASetup } from "../../utils";
import { useAutoCancelShareTransfer } from "../../utils/index";
import { url } from "inspector";

test.skip("Login with Google - skipped bcz it requires captcha solving", async ({
  page,
  browserName,
  openloginURL,
  google,
}) => {
  page.setDefaultTimeout(8 * 60 * 1000);
  page.setDefaultNavigationTimeout(8 * 60 * 1000);

  // Verify environment variables
  expect(
    !!process.env.GITHUB_USER_EMAIL &&
    !!process.env.GITHUB_USER_PASSWORD &&
    !!process.env.GOOGLE_NAME
  ).toBe(true);


  // Login with Google
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');
  await page.click("[aria-label='login with google']");

  await signInWithGoogle({ page, google })
  await useAutoCancelShareTransfer(page)
  await useAutoCancel2FASetup(page)
  console.log(page,url())
  await page.waitForNavigation();
  // Should be signed in in <2 minutes
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    timeout: 3 * 60 * 1000
  });
  
  console.log(page,url())
  expect(page.url()).toBe(`${openloginURL}/wallet/home`);
  console.log(page,url())
  await page.waitForSelector(`text=Welcome, ${google.name}`);
  // Logout
  await page.click("text=Logout")
  expect(page.url()).toContain(`${openloginURL}/`);
});
