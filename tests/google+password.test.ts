import { test } from "@playwright/test";
import creds from "../creds";

test.use({
  storageState: "state/0-signed-in-google.json",
});

test.only("Login with Google + Password", async ({ page }) => {
  // Login with Google
  await page.goto("https://app.openlogin.com");
  await page.click('button:has-text("Get Started")');
  await page.click('button:has-text("Continue with Google")');
  await page.waitForURL("https://accounts.google.com/**");
  await page.click(`text=${creds.google.email}`);

  // Enter password
  await page.waitForURL("https://app.openlogin.com/tkey-input#**");
  await page.fill('[placeholder="Account password"]', creds.openlogin.password);
  await page.click('button:has-text("Confirm")');

  // Should be signed in now in less than 2 minutes
  await page.waitForURL("https://app.openlogin.com/wallet/home", {
    timeout: 2 * 60 * 1000,
  });
});
