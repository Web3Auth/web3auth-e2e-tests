import { expect, Page } from "@playwright/test";
import { test } from "./index.lib";
import { useAutoCancel2FASetup, signInWithEmail, findLink } from "../../utils";
import {
  useAutoCancelShareTransfer,
  generateRandomEmail,
} from "../../utils/index";
import Mailosaur from "mailosaur";
import { generate } from "generate-password";

const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");

const testEmail = generateRandomEmail();

const backupEmail = "backup" + generateRandomEmail();

const passwordShare = generate({
  length: 18,
  numbers: true,
  uppercase: true,
  lowercase: true,
  strict: true,
});

let backupPhrase = "";

test.describe.serial.only("tkey Input test", () => {
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

  test(`should setup 2FA and password for running further tkey_input tests`, async ({
    openloginURL,
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

    // logout the user after setting up 2FA
    await page.click(`text=Logout`);
    await page.goto(`${openloginURL}`);
    await page.waitForURL(`${openloginURL}`, {
      waitUntil: "load",
    });
    expect(
      await page.isVisible(`text=Click Get Started to continue`)
    ).toBeTruthy();
  });

  test(`should login with social + device share`, async ({
    openloginURL,
    browser,
  }) => {
    const startTime = new Date();
    await page.goto(openloginURL);
    await page.click('button:has-text("Get Started")');
    await page.fill('[placeholder="Email"]', testEmail);
    await page.click('button:has-text("Continue with Email")');
    await page.waitForSelector("text=email has been sent");
    const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");
    const mailBox = await mailosaur.messages.get(
      process.env.MAILOSAUR_SERVER_ID || "",
      {
        sentTo: testEmail,
      },
      {
        receivedAfter: startTime,
      }
    );
    const link = findLink(mailBox.html?.links || [], "Confirm my email");
    const href = link?.href || "";
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto(href);
    await page2.waitForSelector(
      "text=Close this and return to your previous window",
      {
        timeout: 10000,
      }
    );
    await page2.close();
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    expect(await page.isVisible("text=Account")).toBeTruthy();

    // deleting device share
    await page.click(`button[aria-label='delete device share']`);

    expect(
      await page.isVisible("text=Delete authentication factor")
    ).toBeTruthy();
    await page.click('button:has-text("Remove share")');
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    await page.waitForTimeout(4000);
    await page.reload();
    expect(await page.isVisible("text=2 / 2")).toBeTruthy();
    expect(await page.isVisible("text=No device shares found")).toBeTruthy();
  });
});
