import { chromium, expect, firefox, Page } from "@playwright/test";
import { test } from "./index.lib";
import {
  useAutoCancel2FASetup,
  signInWithEmail,
  deleteCurrentDeviceShare,
  waitForTkeyRehydration,
  addPasswordShare,
  catchError,
  catchErrorAndExit,
  slowOperation,
} from "../utils";
import {
  useAutoCancelShareTransfer,
  generateRandomEmail,
} from "../utils/index";
import Mailosaur from "mailosaur";
import { generate } from "generate-password";

const testEmail = generateRandomEmail();

const backupEmail = "backup" + generateRandomEmail();

let emailBackupShare = "";

const passwordShare = generate({
  length: 12,
  numbers: true,
  uppercase: true,
  lowercase: true,
  strict: true,
});

test.describe.serial("tkey Input scenarios", () => {
  let page: Page;

  test.beforeAll(async ({ openloginURL }) => {
    test.setTimeout(3 * 60000); // adding more time to compensate high loading time

    const browser = await firefox.launch({
      args: ["--disable-gpu"],
    });
    const context = await browser.newContext();
    page = await context.newPage();

    // Useful for debugging
    // page.on("console", (message) => {
    //   console.log(message);
    // });

    await page.goto(openloginURL);
    await signInWithEmail(page, testEmail, browser);
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy();
    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000,
    });
  });

  // test.afterAll(async ({ browser }) => {
  //   await browser.close();
  // });

  test(`setup 2FA for running further tkey_input tests`, async ({
    openloginURL,
  }) => {
    test.setTimeout(3 * 60000); // adding more time to compensate high loading time
    // adding more time to compensate high loading time
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      timeout: 3 * 60 * 1000,
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
      },
      {
        timeout: 30 * 1000,
      }
    );
    await mailosaur.messages.del(seedEmail.id || ""); // Deleting emails in email server.
    let seedArray =
      seedEmail.html?.body
        ?.toString()
        .replace(/(\r\n|\n|\r)/gm, "")
        .slice(11084)
        .split("<")[0]
        .split(" ") || [];
    let seedString = "";
    for (let i = 0; i < 23; i++) {
      seedString += seedArray[i] + " ";
    }
    seedString += seedArray[23];

    emailBackupShare = seedString;

    await page.fill('[placeholder="Recovery phrase"]', seedString);

    await page.click('button:has-text("Verify")');

    await page.click('button:has-text("Done")');
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000,
    });
    await page.waitForTimeout(2000);
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      timeout: 3 * 60 * 1000,
    });
    expect(await page.isVisible("text=Recovery email")).toBeTruthy();
    expect(await page.isVisible("text=Device(s)")).toBeTruthy();
    expect(await page.isVisible("text=2 / 3")).toBeTruthy();

    await page.click(`text=Logout`);
    await page.goto(`${openloginURL}`);
    await page.waitForURL(`${openloginURL}`, {
      timeout: 3 * 60 * 1000,
    });

    expect(
      await page.isVisible(`text=Click Get Started to continue`)
    ).toBeTruthy();
  });

  test(`login with social + device and delete device share`, async ({
    openloginURL,
    browser,
  }) => {
    test.setTimeout(60000); // adding more time since test is depended on external websites.

    await signInWithEmail(page, testEmail, browser);
    // await catchError(page);
    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    let tkey = waitForTkeyRehydration(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000,
    });
    await page.waitForTimeout(2000);
    await tkey;

    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      timeout: 3 * 60 * 1000,
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    expect(await page.isVisible("text=Account")).toBeTruthy();
    expect(await page.isVisible("text=2 / 3")).toBeTruthy();

    // Deleting device share
    await deleteCurrentDeviceShare(page);

    expect(await page.isVisible("text=2 / 2")).toBeTruthy();

    // // logout the user
    await page.click(`text=Logout`);
    await page.goto(`${openloginURL}`);
    await page.waitForURL(`${openloginURL}`, {
      timeout: 3 * 60 * 1000,
    });
    expect(
      await page.isVisible(`text=Click Get Started to continue`)
    ).toBeTruthy();
  });

  test(`login with social + email backup`, async ({
    openloginURL,
    browser,
  }) => {
    test.setTimeout(100000); // adding more time.
    await signInWithEmail(page, testEmail, browser);
    // await catchError(page);
    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);

    await page.waitForURL(`${openloginURL}/tkey-input*`, {
      timeout: 3 * 60 * 1000,
    });
    expect(await page.isVisible("text=Verify your login")).toBeTruthy();
    await page.fill('[placeholder="Enter backup phrase"]', emailBackupShare);
    await page.click('button:has-text("Confirm")');

    let tkey = waitForTkeyRehydration(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000,
    });
    await tkey;
    await page.waitForTimeout(2000);

    // Delete device share to simulate tkey-input page
    let tkey2 = waitForTkeyRehydration(page);
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      timeout: 3 * 60 * 1000,
    });
    await tkey2;

    // Required to simulate tkeyinput page
    await deleteCurrentDeviceShare(page);

    expect(await page.isVisible("text=2 / 2")).toBeTruthy();

    await addPasswordShare(page, passwordShare);

    expect(await page.isVisible("text=2 / 3")).toBeTruthy();

    // logout the user
    await page.click(`text=Logout`);
    await page.goto(`${openloginURL}`);
    await page.waitForURL(`${openloginURL}`, {
      timeout: 3 * 60 * 1000,
    });
    expect(
      await page.isVisible(`text=Click Get Started to continue`)
    ).toBeTruthy();
  });

  test(`login with social account + password`, async ({
    openloginURL,
    browser,
  }) => {
    test.setTimeout(60000); // adding more time.
    await signInWithEmail(page, testEmail, browser);
    // await catchError(page);
    await page.waitForURL(`${openloginURL}/tkey-input*`, {
      timeout: 3 * 60 * 1000,
    });
    expect(await page.isVisible("text=Verify your login")).toBeTruthy();
    await page.fill('[placeholder="Account password"]', passwordShare);
    await page.click('button:has-text("Confirm")');
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000,
    });

    expect(page.url()).toBe(`${openloginURL}/wallet/home`);
    expect(await page.isVisible(`text=Welcome, ${testEmail}`)).toBeTruthy();
  });
});
