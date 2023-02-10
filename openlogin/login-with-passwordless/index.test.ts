import { expect } from "@playwright/test";
import { test } from "./index.lib";
import {
  useAutoCancel2FASetup,
  signInWithEmail,
  generateRandomEmail,
  slowOperation,
} from "../../utils";

import { useAutoCancelShareTransfer } from "../../utils/index";
import Mailosaur from "mailosaur";

const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");

const testEmail = generateRandomEmail();

test("Login with passwordless", async ({ browser, page, openloginURL }) => {
  // Verify environment variables
  expect(
    !!process.env.MAILOSAUR_SERVER_ID &&
    !!process.env.MAILOSAUR_API_KEY &&
    !!process.env.MAILOSAUR_SERVER_DOMAIN
  ).toBe(true);

  await page.goto(openloginURL);
  await signInWithEmail(page, testEmail, browser);

  await slowOperation(async () => {
    await useAutoCancelShareTransfer(page)
    await useAutoCancel2FASetup(page)
    await page.waitForURL(`${openloginURL}/wallet/home`)
  })

  expect(page.url()).toBe(`${openloginURL}/wallet/home`);
  const welcome = await page.waitForSelector(`text=Welcome`);
});
