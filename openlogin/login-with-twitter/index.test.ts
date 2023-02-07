import { expect } from "@playwright/test";
import { test } from "./index.lib";
import { signInWithTwitter } from "../../utils";

test("Login with twitter", async ({
  page,
  openloginURL,
  twitter
}) => {
  // Verify environment variables
  expect(
    !!process.env.TWITTER_ACCOUNT &&
    !!process.env.TWITTER_PASSWORD
  ).toBe(true);
  // Login with twitter
  await signInWithTwitter({ page, twitter, openloginURL })
  await page.waitForSelector(`text=Welcome, ${twitter.email}`);
  // Logout
  await page.click("text=Logout")
  expect(page.url()).toBe(`${openloginURL}/`);
});