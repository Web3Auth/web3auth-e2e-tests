import { expect } from "@playwright/test";
import { test } from "./index.lib";
import { signInWithGoogle } from "../../utils";

test("Login with Google+Device", async ({
  page,
  browserName,
  openloginURL,
  user,
}) => {
  // Login with Google
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');
  await page.click('[aria-label="Continue with existing Google"]');
  test.fixme(
    !(await signInWithGoogle({ page, browserName, email: user.email }))
  );

  // Should be signed in in <2 minutes
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    timeout: 2 * 60 * 1000,
  });

  // Save signed-in state to storage
  await page
    .context()
    .storageState({ path: "openlogin/refresh-state/chromium.json" });
});
