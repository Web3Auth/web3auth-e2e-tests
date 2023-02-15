import { expect, Page } from "@playwright/test";
import { test } from "./index.lib";
import {
  useAutoCancel2FASetup,
  signInWithEmail,
  generateRandomEmail,
  slowOperation,
  catchError,
  catchErrorAndExit,
} from "../../utils";

import { useAutoCancelShareTransfer } from "../../utils/index";
import Mailosaur from "mailosaur";

const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");

const testEmail = generateRandomEmail();

test.describe('Login with passwordless', () => {
  let page: Page;
  test.beforeAll(async ({ browser, openloginURL }) => {
    // test.setTimeout(60000); // adding more time to compensate high loading time
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto(openloginURL);
    await signInWithEmail(page, testEmail, browser);
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy()
    await slowOperation(async () => {
      await useAutoCancelShareTransfer(page);
      await useAutoCancel2FASetup(page);
      await page.waitForURL(`${openloginURL}/wallet/home`);
    })
  });

  test.afterAll(async ({ browser }) => {
    browser.close();
  });

  test("check login", async ({ browser, openloginURL }) => {
    // // Verify environment variables
    // expect(
    //   !!process.env.MAILOSAUR_SERVER_ID &&
    //   !!process.env.MAILOSAUR_API_KEY &&
    //   !!process.env.MAILOSAUR_SERVER_DOMAIN
    // ).toBe(true);

    expect(page.url()).toBe(`${openloginURL}/wallet/home`);
    const welcome = await page.waitForSelector(`text=Welcome`);
  });
})
