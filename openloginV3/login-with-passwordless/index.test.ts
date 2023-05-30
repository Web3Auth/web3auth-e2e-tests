import { chromium, expect, firefox, Page } from "@playwright/test";
import { test } from "./index.lib";
import {
  useAutoCancel2FASetup,
  signInWithEmail,
  generateRandomEmail,
  slowOperation,
  catchError,
  catchErrorAndExit,
} from "../utils";

import { useAutoCancelShareTransfer } from "../utils/index";
import Mailosaur from "mailosaur";

const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");

const testEmail = `automation@${process.env.MAILOSAUR_SERVER_DOMAIN}`;

test.describe.serial('Passwordless Login scenarios', () => {
  test("check passwordless login @smoke", async ({ browser, openloginURL, page }) => {
    // Verify environment variables
    test.setTimeout(3 * 60000); // adding more time to compensate high loading time
    expect(
      !!process.env.MAILOSAUR_SERVER_ID &&
      !!process.env.MAILOSAUR_API_KEY &&
      !!process.env.MAILOSAUR_SERVER_DOMAIN
    ).toBe(true);
    await page.goto(openloginURL);
    await signInWithEmail(page, testEmail, browser);
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy()
    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000
    });

    expect(page.url()).toBe(`${openloginURL}/wallet/home`);
    const welcome = await page.waitForSelector(`text=Welcome`);
  });
})
