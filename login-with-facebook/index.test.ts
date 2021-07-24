import { expect } from "@playwright/test";
import { test } from "./index.base";
import { signInWithFacebook } from "../utils";

test("Login with Facebook+Device", async ({ page, openloginURL, user }) => {
  // Login with Facebook
  await page.goto(openloginURL);
  await page.click('button:has-text("Get Started")');
  await page.click(".row:nth-child(2) div:nth-child(1) .app-btn"); // TODO: Select using aria-label
  test.fixme(!(await signInWithFacebook({ page, name: user.name })));

  // Should be signed in in <2 minutes
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    timeout: 2 * 60 * 1000,
  });

  // Go to Account page
  await Promise.all([page.waitForNavigation(), page.click("text=Account")]);
  expect(await page.innerText(`text=${user.email}`)).toBe(user.email);

  // Logout
  await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
  expect(page.url()).toBe(`${openloginURL}/`);
});
