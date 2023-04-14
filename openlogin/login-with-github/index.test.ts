import { expect } from "@playwright/test";
import { test } from "./index.lib";
import { signInWithGitHub, useAutoCancelShareTransfer } from "../../utils/index";

test.skip("Login with Github+Device", async ({ page, openloginURL, github }) => {
    // Verify environment variables
    expect(
      !!process.env.GITHUB_USER_EMAIL &&
      !!process.env.GITHUB_USER_PASSWORD
    ).toBe(true);
  // Login with Github
  await signInWithGitHub({ page, github })
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');
  await page.click("text=View more options");
  await page.click('button[aria-label="login with GitHub"]');

  try {
    await page.waitForSelector("text=Reauthorization required", {
      timeout: 10 * 1000,
    });
    await page.click('button:has-text("Authorize TorusLabs")');
  } catch { }

  useAutoCancelShareTransfer(page);

  // Should be signed in in <2 minutes
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    timeout: 2 * 60 * 1000,
  });

  // Go to Account page
  await Promise.all([page.waitForNavigation(), page.click("text=Account")]);
  expect(await page.isVisible(`text=${github.email}`)).toBeTruthy();

  // Logout
  await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
  expect(page.url()).toBe(`${openloginURL}/`);
});

// Save signed-in state to storage
test.afterEach(async ({ page, browserName }) => {
  await page
    .context()
    .storageState({ path: `${__dirname}/${browserName}.json` });
});
