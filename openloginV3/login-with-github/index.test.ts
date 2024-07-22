import { expect } from "@playwright/test";
import { test } from "./index.lib";
import { signInWithGitHub, useAutoCancelShareTransfer, useAutoCancel2FASetup } from "../utils/index";

test("Login with Github+Device skipped since it requires captcha solving", async ({ page, openloginURL, github }) => {
   test.skip()
    // Verify environment variables
    expect(
      !!process.env.GITHUB_USER_EMAIL &&
      !!process.env.GITHUB_USER_PASSWORD
    ).toBe(true);
  // Login with Github
  await signInWithGitHub({ page, github })
  // await page.waitForURL('https://github.com/new', {
  //   timeout: 2 * 60 * 1000,
  // });

  await page.goto(openloginURL);
  await page.waitForSelector('span:has-text("Get Started")')
  await page.click('span:has-text("Get Started")');
  await page.click("text=View more options");
  await page.click('button[aria-label="login with GitHub"]');

  try {
    await page.waitForSelector("text=Authorize TorusLabs", {
      timeout: 10 * 1000,
    });
    await page.click('button:has-text("Authorize TorusLabs")',{timeout: 9000});
  } catch {console.log("timed out") }

  await useAutoCancelShareTransfer(page);
  await useAutoCancel2FASetup(page);
  // Should be signed in in <2 minutes
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    timeout: 2 * 60 * 1000,
  });

  // Go to Account page
  await Promise.all([page.waitForNavigation(), page.click("text=Account")]);
  expect(await page.isVisible(`text=${github.email}`)).toBeTruthy();

  // Logout
  await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
  expect(page.url()).toContain(`${openloginURL}/`);
});

// Save signed-in state to storage
test.afterEach(async ({ page, browserName }) => {
  await page
    .context()
    .storageState({ path: `${__dirname}/${browserName}.json` });
});
