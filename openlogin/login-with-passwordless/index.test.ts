import { expect } from "@playwright/test";
import {
  useAutoCancel2FASetup,
  signInWithEmail,
  generateRandomEmail,
} from "../../utils";
import { test } from "./index.lib";
import { useAutoCancelShareTransfer } from "../../utils/index";
import Mailosaur from "mailosaur";

const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");

const testEmail = generateRandomEmail();

test("Login with passwordless", async ({ browser, page, openloginURL }) => {
  page.setDefaultTimeout(8 * 60 * 1000);
  page.setDefaultNavigationTimeout(8 * 60 * 1000);

  // Verify environment variables
  expect(
    !!process.env.MAILOSAUR_SERVER_ID &&
      !!process.env.MAILOSAUR_API_KEY &&
      !!process.env.MAILOSAUR_SERVER_DOMAIN
  ).toBe(true);

  await page.goto(openloginURL);
  await signInWithEmail(page, testEmail, browser);

  // Successful login
  await useAutoCancelShareTransfer(page);
  await useAutoCancel2FASetup(page);

  await page.waitForNavigation();

  await page.waitForURL(`${openloginURL}/wallet/home`);
  expect(page.url()).toBe(`${openloginURL}/wallet/home`);
  const welcome = await page.waitForSelector(`text=Welcome`);
});
