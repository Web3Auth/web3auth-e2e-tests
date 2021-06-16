import { test } from "@playwright/test";
import creds from "../creds";

test.use({
  storageState: "state/0-signed-in-google.json",
});

test.only("Login with Google + Password", async ({ page }) => {
  // Login with Google
  await page.goto("https://app.openlogin.com/");
  await page.click('button:has-text("Get Started")');
  await page.click('button:has-text("Continue with Google")');
  await page.waitForNavigation({
    url: "https://accounts.google.com/**",
    waitUntil: "networkidle",
  });

  // Select signed-in Google account
  await page.click(`text=${creds.google.email}`);
  await page.waitForNavigation({
    url: "https://app.openlogin.com/tkey-input**",
    waitUntil: "networkidle",
  });

  // Enter password
  await page.fill('[placeholder="Account password"]', creds.openlogin.password);
  await page.press('[placeholder="Account password"]', "Enter");

  // Should be signed in now
  await page.waitForNavigation({
    url: "https://app.openlogin.com/wallet/home",
    waitUntil: "networkidle",
    timeout: 2 * 60 * 1000,
  });
});
