import { chromium, expect, firefox, Page } from "@playwright/test";
import { test } from "./index.lib";
import {
  useAutoCancel2FASetup,
  signInWithEmail,
  generateRandomEmail,
  slowOperation,
  catchError,
  catchErrorAndExit,
  signInWithEmailIntoTorusWallet,
} from "../utils";

import { useAutoCancelShareTransfer } from "../utils/index";
import Mailosaur from "mailosaur";

const testEmail = generateRandomEmail();

test.describe.serial("Torus Wallet Login scenarios", () => {
  test("torus wallet passwordless login", async ({
    browser,
    torusLoginURL,
    page,
  }) => {
    // Verify environment variables
    test.setTimeout(3 * 60000); // adding more time to compensate high loading time
    expect(
      !!process.env.MAILOSAUR_SERVER_ID &&
        !!process.env.MAILOSAUR_API_KEY &&
        !!process.env.MAILOSAUR_SERVER_DOMAIN
    ).toBe(true);
    // Listen for all console events and handle errors
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`Error text: "${msg.text()}"`);
    });
    await page.goto(torusLoginURL);
    await signInWithEmailIntoTorusWallet(page, testEmail, browser);
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy();
    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`**/wallet/home`, {
      timeout: 3 * 60 * 1000,
    });

    expect(page.url()).toBe(`**/wallet/home`);
    const welcome = await page.waitForSelector(`text=Account Balance`);
  });
});
