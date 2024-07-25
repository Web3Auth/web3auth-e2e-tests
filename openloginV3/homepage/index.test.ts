import { expect, Page } from "@playwright/test";

import { catchErrorAndExit, generateRandomEmail, signInWithEmail, useAutoCancel2FASetup, useAutoCancelShareTransfer } from "../utils";
import { test } from "./index.lib";

const testEmail = generateRandomEmail();

test.describe.serial("Home page scenarios", () => {
  let page: Page;
  test.beforeAll(async ({ openloginURL, browser }) => {
    test.setTimeout(3 * 60000); // adding more time to compensate high loading time
    const context = await browser.newContext({});
    page = await context.newPage();
    await page.goto(openloginURL);
    await signInWithEmail(page, testEmail, browser);
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy();
    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000,
    });
  });

  // test.afterAll(async ({ browser }) => {
  //   await browser.close();
  // });

  test(`should display user email on top right`, async ({ openloginURL }) => {
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000,
    });
    expect(await page.isVisible(`text=${testEmail}`)).toBeTruthy();
  });
  test(`should display welcome message`, async () => {
    expect(await page.isVisible(`text=Welcome, ${testEmail}`)).toBeTruthy();
  });

  //checks if the support button routes to correct url
  test(`Clicking 'Support' button should redirect user to correct support page`, async () => {
    const popupPromise = page.waitForEvent("popup");
    await page.click(`text=Support`);
    const popup = await popupPromise;
    await popup.waitForLoadState();
    const URL = await popup.url();
    expect(URL === "https://help.web3auth.com/en/").toBeTruthy();
    await popup.close();
  });

  // checks if the learn more button routes to correct url
  test(`Clicking 'Learn more' button should redirect user to correct docs page`, async () => {
    const popupPromise = page.waitForEvent("popup");
    await page.click('a:has-text("Learn more")');
    const popup = await popupPromise;
    await popup.waitForLoadState();
    const URL = await popup.url();
    expect(URL === "https://docs.tor.us/open-login/what-is-openlogin").toBeTruthy();
    await popup.close();
  });

  test(`Clicking 'Logout' button should logout user`, async () => {
    await page.click(`text=Logout`);
    expect(await page.getByText("Manage all your web interactions in one place").isVisible());
    expect(await page.getByText("Click Get Started to continue").isVisible());
  });
});
