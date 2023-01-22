import { expect, Page } from "@playwright/test";
import { test } from "./index.lib";
import { useAutoCancel2FASetup, signInWithEmail } from "../../utils";
import {
  useAutoCancelShareTransfer,
  generateRandomEmail,
} from "../../utils/index";
import Mailosaur from "mailosaur";
import { generate } from "generate-password";
import { validateMnemonic } from "bip39";

const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");

const testEmail = generateRandomEmail();

const backupEmail = "backup" + generateRandomEmail();

const passwordShare = "ExamplePassword123";

let backupPhrase = "";

test.describe.serial("tkey Input test", () => {
  let page: Page;
  test.beforeAll(async ({ browser, openloginURL }) => {
    // this will get a fresh email login and setup 2FA for the account
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto(openloginURL);
    await signInWithEmail(page, testEmail, browser);
    await mailosaur.messages.deleteAll(process.env.MAILOSAUR_SERVER_ID || ""); // Deleting emails in email server.

    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
  });

  test.afterAll(async ({ browser }) => {
    browser.close();
  });

  test(`should login with social + password`, async ({
    openloginURL,
    browser,
  }) => {
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    await page.click('button:has-text("Enable 2FA")');
    page
      .locator(
        "text=I understand that clearing browser history and cookies will delete this factor on my browser."
      )
      .click();
    await page.click('button:has-text("Save current device")');

    await page.fill('[placeholder="Email"]', backupEmail);

    await page.click('button:has-text("Continue")');

    const seedEmail = await mailosaur.messages.get(
      process.env.MAILOSAUR_SERVER_ID || "",
      {
        sentTo: backupEmail,
      }
    );
    let seedArray = seedEmail?.text?.body?.slice(171).split(" ") || [];
    let seedString = "";
    for (let i = 0; i < 23; i++) {
      seedString += seedArray[i] + " ";
    }
    seedString += seedArray[23].split("\n")[0];

    await page.fill('[placeholder="Recovery phrase"]', seedString);

    await page.click('button:has-text("Verify")');

    await page.click('button:has-text("Done")');
    await page.reload();
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });

    expect(await page.isVisible("text=Recovery email")).toBeTruthy();
    expect(await page.isVisible("text=Device(s)")).toBeTruthy();
    expect(await page.isVisible("text=2 / 3")).toBeTruthy();

    // set password share
    await page.fill('[placeholder="Set your password"]', passwordShare);
    await page.fill('[placeholder="Re-enter your password"]', passwordShare);
    await page.click('button:has-text("Confirm")');
    await page.waitForTimeout(4000);
    expect(await page.isVisible("text=2 / 4")).toBeTruthy();

    // logout the user after setting up 2FA
    await page.click(`text=Logout`);
    expect(
      await page.isVisible(`text=Click Get Started to continue`)
    ).toBeTruthy();

    // user login with email+ device password via tkey input page
    await signInWithEmail(page, testEmail, browser);
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);

    // deleting device share
    await page.click(`button[aria-label='delete device share']`);

    expect(
      await page.isVisible("text=Delete authentication factor")
    ).toBeTruthy();
    await page.click('button:has-text("Remove Share")');
    await page.waitForTimeout(4000);
    expect(await page.isVisible("text=2 / 3")).toBeTruthy();
    expect(await page.isVisible("text=No device shares found")).toBeTruthy();
    await mailosaur.messages.deleteAll(process.env.MAILOSAUR_SERVER_ID || ""); // Deleting emails in email server.

    // logout the user again
    await page.click(`text=Logout`);
    expect(
      await page.isVisible(`text=Click Get Started to continue`)
    ).toBeTruthy();
  });

  //   test(`should login with social + password`, async ({
  //     openloginURL,
  //     browser,
  //   }) => {
  //     await page.goto(openloginURL);
  //     await signInWithEmail(page, testEmail, browser);
  //   });
});
