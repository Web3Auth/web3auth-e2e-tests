import { expect } from "@playwright/test";
import { test } from "./index.lib";
import { signInWithFacebook, useAutoCancel2FASetup } from "../../utils";
import { useAutoCancelShareTransfer } from "../../utils/index";

test.describe("On accounts page,", () => {
  test.beforeEach(async ({ page, openloginURL }) => {
    await page.goto(openloginURL);
  });

  test(`page title should be "Account" for account page`, async ({
    page,
    openloginURL,
    FB,
  }) => {
    page.setDefaultTimeout(8 * 60 * 1000);
    page.setDefaultNavigationTimeout(8 * 60 * 1000);

    // Login with Facebook
    await page.goto(openloginURL);
    await page.click('button:has-text("Get Started")');
    await page.click('[aria-label="login with facebook"]');
    await signInWithFacebook({ page, FB });

    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);

    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });

    expect(page.url()).toBe(`${openloginURL}/wallet/home`);

    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    expect(await page.isVisible("text=Account")).toBeTruthy();

    await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
    expect(page.url()).toBe(`${openloginURL}/`);
  });

  test(`should display 2FA enable window for single factor account `, async ({
    page,
    openloginURL,
    FB,
  }) => {
    page.setDefaultTimeout(8 * 60 * 1000);
    page.setDefaultNavigationTimeout(8 * 60 * 1000);

    // Login with Facebook
    await page.goto(openloginURL);
    await page.click('button:has-text("Get Started")');
    await page.click('[aria-label="login with facebook"]');
    await signInWithFacebook({ page, FB });

    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);

    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });

    expect(page.url()).toBe(`${openloginURL}/wallet/home`);

    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    expect(
      await page.isVisible(
        "text=We strongly recommend you to enable 2FA on your account"
      )
    ).toBeTruthy();

    await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
    expect(page.url()).toBe(`${openloginURL}/`);
  });

  //   test(`should change account password successfully`, async ({
  //     page,
  //     openloginURL,
  //     FB,
  //   }) => {
  //     page.setDefaultTimeout(8 * 60 * 1000);
  //     page.setDefaultNavigationTimeout(8 * 60 * 1000);

  //     // Login with a google account
  //     await page.goto(openloginURL);
  //     await page.click('button:has-text("Get Started")');
  //     await page.click('[aria-label="Continue with Google"]');
  //     await signInWithFacebook({ page, FB });

  //     await useAutoCancelShareTransfer(page);
  //     await useAutoCancel2FASetup(page);

  //     await page.waitForURL(`${openloginURL}/wallet/home`, {
  //       waitUntil: "load",
  //     });

  //     expect(page.url()).toBe(`${openloginURL}/wallet/home`);

  //     await page.goto(`${openloginURL}/wallet/account`);
  //     await page.waitForURL(`${openloginURL}/wallet/account`, {
  //       waitUntil: "load",
  //     });
  //     expect(page.url()).toBe(`${openloginURL}/wallet/account`);
  //     expect(
  //       await page.isVisible(
  //         "text=We strongly recommend you to enable 2FA on your account"
  //       )
  //     ).toBeTruthy();

  //     await Promise.all([page.waitForNavigation(), page.click("text=Logout")]);
  //     expect(page.url()).toBe(`${openloginURL}/`);
  //   });
});
