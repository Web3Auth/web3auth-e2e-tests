import { expect } from "@playwright/test";

import { signInWithTwitter } from "../utils";
import { test } from "./index.lib";

test.skip("Login with twitter", async ({ page, openloginURL, twitter }) => {
  // Verify environment variables
  expect(!!process.env.TWITTER_ACCOUNT && !!process.env.TWITTER_PASSWORD && !!process.env.TWITTER_EMAIL).toBe(true);
  // Login with twitter
  await signInWithTwitter({ page, twitter, openloginURL });
  await page.waitForSelector(`text=Welcome, ${twitter.account}`);
  // Logout
  await page.click("text=Logout");
  expect(page.url()).toContain(`${openloginURL}/`);
});
