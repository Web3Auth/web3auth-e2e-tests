import { confirmEmail, signInWithGoogle } from "../utils";
import { test } from "./index.lib";
import { useAutoCancelShareTransfer } from "../utils/index";
import { expect } from "@playwright/test";
test.describe.serial("Existing user login scenarios", () => {
test.skip("existing v2 user can log in correctly - skipped since it requires captcha solving", async ({
  context,
  page,
  openloginURL,
  google,
}) => {
  //test.skip()
  await page.goto("https://accounts.google.com/");
  await signInWithGoogle({ page, google })
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started1")');

  // Login with Passwordless
  const timestamp = Math.floor(Date.now() / 1000);

  await page.fill('[placeholder="Email"]', google.email);
  await page.click('button:has-text("Continue with Email")');
  await page.waitForSelector("text=email has been sent");
  expect(await page.isVisible(`text=${google.email}`)).toBeTruthy();

  // Confirm email
    test.fixme!(await confirmEmail({
      context,
      timestamp,
      to: google.email,
      resend: () => page.click("text=Resend"),
    }))

  try {
    await page.waitForSelector("text=Enable 2 Factor Authentication (2FA)", {
      timeout: 10000,
    });
    await page.click('button:has-text("Maybe next time")');
  } catch { console.log("timed out")}

  useAutoCancelShareTransfer(page);

  // Should be signed in in <2 minutes
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    timeout: 3 * 60 * 1000,
  });

  // Go to Account page
  await Promise.all([page.waitForNavigation(), page.click("text=Account")]);
  expect(await page.isVisible(`text=${google.email}`)).toBeTruthy();

  // Logout
  await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
  expect(page.url()).toContain(`${openloginURL}`);
});

// Save signed-in state to storage
test.afterEach(async ({ page, browserName }) => {
  await page
    .context()
    .storageState({ path: `${__dirname}/${browserName}.json` });
});
});
