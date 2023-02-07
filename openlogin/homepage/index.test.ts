import { expect, Page } from "@playwright/test";
import { test } from "./index.lib";
import {
  useAutoCancel2FASetup,
  signInWithEmail,
  generateRandomEmail,
  catchError,
} from "../../utils";
import { useAutoCancelShareTransfer } from "../../utils/index";
import Mailosaur from "mailosaur";

const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");

const testEmail = generateRandomEmail();

test.describe.serial("Home page tests", () => {
  let page: Page;
  test.beforeAll(async ({ openloginURL, browser }) => {
    test.setTimeout(60000); // adding more time to compensate high loading time
    const context = await browser.newContext({});
    page = await context.newPage();
    await page.goto(openloginURL);
    await signInWithEmail(page, testEmail, browser);
    await catchError(page);
    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
  });
  test.afterAll(async ({ browser }) => {
    browser.close();
  });

  test(`should display user email on top right`, async ({ openloginURL }) => {
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
    expect(await page.isVisible(`text=${testEmail}`)).toBeTruthy();
  });
  test(`should display welcome message`, async ({ context }) => {
    expect(await page.isVisible(`text=Welcome, ${testEmail}`)).toBeTruthy();
  });
  // test(`Clicking language button should display language dropdown `, async ({
  //   context,
  // }) => {
  //   await page.click('button:has-text("English")');
  //   expect(await page.isVisible(`text=German (Deutsch)`)).toBeTruthy();
  // });

  //checks if the support button routes to correct url
  test(`Clicking 'Support' button should redirect user to correct support page`, async ({}) => {
    const popupPromise = page.waitForEvent("popup");
    await page.click(`text=Support`);
    const popup = await popupPromise;
    await popup.waitForLoadState();
    const URL = await popup.url();
    expect(URL === "https://help.web3auth.com/en/").toBeTruthy();
  });

  // checks if the learn more button routes to correct url
  test(`Clicking 'Learn more' button should redirect user to correct docs page`, async ({}) => {
    const popupPromise = page.waitForEvent("popup");
    await page.click('a:has-text("Learn more")');
    const popup = await popupPromise;
    await popup.waitForLoadState();
    const URL = await popup.url();
    expect(
      URL === "https://docs.tor.us/open-login/what-is-openlogin"
    ).toBeTruthy();
  });

  test(`Clicking 'Logout' button should logout user`, async ({}) => {
    await page.click(`text=Logout`);
    expect(
      await page.isVisible(`text=Manage all your web interactions in one place`)
    ).toBeTruthy();
    expect(
      await page.isVisible(`text=Click Get Started to continue`)
    ).toBeTruthy();
  });
});
