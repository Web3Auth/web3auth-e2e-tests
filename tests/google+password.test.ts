import { test } from "../base";
import { signInWithGoogle } from "../utils";

test("Login with Google + Password", async ({ page, browserName, profile }) => {
  if (!profile.google || !profile.openlogin) return;

  // Login with Google
  await page.goto("https://app.openlogin.com");
  await page.click('button:has-text("Get Started")');
  await page.click('button:has-text("Continue with Google")');
  await signInWithGoogle({ email: profile.google.email, page, browserName });

  // Enter password
  await page.waitForURL("https://app.openlogin.com/tkey-input#**");
  await page.fill(
    '[placeholder="Account password"]',
    profile.openlogin.password
  );
  await page.click('button:has-text("Confirm")');

  // Should be signed in in <2 minutes
  await page.waitForURL("https://app.openlogin.com/wallet/home", {
    timeout: 2 * 60 * 1000,
  });
  await page.pause();
});
