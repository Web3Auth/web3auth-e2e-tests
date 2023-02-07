// import { expect } from "@playwright/test";
// import {
//   useAutoCancel2FASetup,
//   signInWithEmail,
//   generateRandomEmail,
// } from "../../utils";
// import { test } from "./index.lib";
// import { useAutoCancelShareTransfer } from "../../utils/index";
// import Mailosaur from "mailosaur";

// const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");

// const testEmail = generateRandomEmail();

// test("Login with passwordless", async ({ browser, page, openloginURL }) => {
//   page.setDefaultTimeout(8 * 60 * 1000);
//   page.setDefaultNavigationTimeout(8 * 60 * 1000);

//   // Verify environment variables
//   expect(
//     !!process.env.MAILOSAUR_SERVER_ID &&
//       !!process.env.MAILOSAUR_API_KEY &&
//       !!process.env.MAILOSAUR_SERVER_DOMAIN
//   ).toBe(true);

//   await page.goto(openloginURL);
//   await signInWithEmail(page, testEmail, browser);

//   // Successful login
//   await useAutoCancelShareTransfer(page);
//   await useAutoCancel2FASetup(page);

//   await page.waitForURL(`${openloginURL}/wallet/home`);
//   expect(page.url()).toBe(`${openloginURL}/wallet/home`);
//   const welcome = await page.waitForSelector(`text=Welcome`);
// });

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

test.describe.serial("Passwordless Login", () => {
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

  test(`should login with passwordless and reach home page`, async ({
    openloginURL,
  }) => {
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
    expect(await page.isVisible(`text=${testEmail}`)).toBeTruthy();
  });
});
