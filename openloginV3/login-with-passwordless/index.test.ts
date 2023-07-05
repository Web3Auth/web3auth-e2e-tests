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
import { readFileSync } from "fs";
import path from "path";
import { useAutoCancelShareTransfer, getBackUpPhrase } from "../utils/index";
import Mailosaur from "mailosaur";

const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");

const testEmail = generateRandomEmail();
const backupPhrase = process.env.BACKUP_PHRASE_PROD;

const existingTestEmail = `demo@${process.env.MAILOSAUR_SERVER_DOMAIN}`;

test.describe.serial("Passwordless Login scenarios", () => {
  test("Login with email using passwordless login @smoke", async ({
    browser,
    openloginURL,
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
    await page.goto(openloginURL);
    await signInWithEmail(page, testEmail, browser);
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy();
    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000,
    });

    expect(page.url()).toBe(`${openloginURL}/wallet/home`);
    const welcome = await page.waitForSelector(`text=Welcome`);
  });

  test("Login as an existing user with recovery phrase as 2FA", async ({
    browser,
    openloginURL,
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
    await page.goto(openloginURL);
    await signInWithEmail(page, existingTestEmail, browser);
    try {
      await page.waitForSelector('[placeholder="Enter backup phrase"]', {
        timeout: 1 * 60 * 1000,
      });
      await page.fill(
        '[placeholder="Enter backup phrase"]',
        getBackUpPhrase(process.env.PLATFORM)!
      );
      await page.click('button:has-text("Confirm")');
    } catch (err) {}
    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000,
    });

    expect(page.url()).toBe(`${openloginURL}/wallet/home`);
    const welcome = await page.waitForSelector(`text=Welcome`);
  });
});
