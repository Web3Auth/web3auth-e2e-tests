import { expect } from "@playwright/test";
import { test } from "./index.lib";
import { signInWithFacebook } from "../../utils";

test("Login with Facebook", async ({ page, openloginURL, FB }) => {
  if (process.env.PLATFORM !== "prod") {
    return
  }
  // Verify environment variables
  expect(
    !!process.env.FB_TEST_USER_NAME &&
    !!process.env.FB_TEST_USER_EMAIL &&
    !!process.env.FB_TEST_USER_PASS
  ).toBe(true);

  // Login with Facebook
  await signInWithFacebook({ page, FB, openloginURL });
  await page.waitForSelector(`text=Welcome, ${FB.name}`);

  // Logout;
  await page.click("text=Logout");
  expect(page.url()).toBe(`${openloginURL}/`);
});
