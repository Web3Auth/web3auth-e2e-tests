import { expect, Page } from "@playwright/test";
import { test } from "./index.lib";
import { useAutoCancel2FASetup, signInWithEmail, findLink, deleteCurrentDeviceShare } from "../../utils";
import {
  useAutoCancelShareTransfer,
  generateRandomEmail,
} from "../../utils/index";
import Mailosaur from "mailosaur";
import { generate } from "generate-password";

const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");

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

test.describe.serial("tkey Input test", () => {
  let page: Page;
  test.beforeAll(async ({ browser, openloginURL }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto(openloginURL);
    await signInWithEmail(page, testEmail, browser);

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
    await mailosaur.messages.del(seedEmail?.id || "");
    let seedArray = seedEmail?.text?.body?.slice(171).split(" ") || [];
    let seedString = "";
    for (let i = 0; i < 23; i++) {
      seedString += seedArray[i] + " ";
    }
    seedString += seedArray[23].split("\n")[0];

    emailBackupShare = seedString;

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

  test(`should login with social + device and delete device share`, async ({
    openloginURL,
    browser,
  }) => {
    await signInWithEmail(page, testEmail, browser);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    expect(await page.isVisible("text=Account")).toBeTruthy();

    // Make sure tkey is rehydrated here.
    // Deleting device share
    await deleteCurrentDeviceShare(page);

    // logout the user
    await page.click(`text=Logout`);
    await page.goto(`${openloginURL}`);
    await page.waitForURL(`${openloginURL}`, {
      waitUntil: "load",
    });
    expect(
      await page.isVisible(`text=Click Get Started to continue`)
    ).toBeTruthy();
  });

  test(`should login with social + email backup`, async ({
    openloginURL,
    browser,
  }) => {
    test.setTimeout(120000);
    await signInWithEmail(page, testEmail, browser);
    await page.waitForURL(`${openloginURL}/tkey-input*`, {
      waitUntil: "load",
    });
    expect(await page.isVisible("text=Verify your login")).toBeTruthy();
    await page.fill('[placeholder="Enter backup phrase"]', emailBackupShare);
    await page.click('button:has-text("Confirm")');
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/home`);
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    expect(await page.isVisible("text=Account")).toBeTruthy();

    // Delete device share to simulate tkey-input page
    await page.click(`button[aria-label='delete device share']`);
    await page.click('button:has-text("Remove share")');
    await page.waitForTimeout(4000);
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(await page.isVisible("text=2 / 2")).toBeTruthy();
    expect(await page.isVisible("text=No device shares found")).toBeTruthy();

    // setup password share
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    await page.fill('[placeholder="Set your password"]', passwordShare);
    await page.fill('[placeholder="Re-enter your password"]', passwordShare);
    await page.click('button:has-text("Confirm")');
    // TODO: find a better way to wait for password deletion

    expect(await page.isVisible("text=2 / 3")).toBeTruthy();

    // logout the user
    await page.click(`text=Logout`);
    await page.goto(`${openloginURL}`);
    await page.waitForURL(`${openloginURL}`, {
      waitUntil: "load",
    });
    expect(
      await page.isVisible(`text=Click Get Started to continue`)
    ).toBeTruthy();
  });

  test(`should login with social + password`, async ({
    openloginURL,
    browser,
  }) => {
    await signInWithEmail(page, testEmail, browser);
    await page.waitForURL(`${openloginURL}/tkey-input*`, {
      waitUntil: "load",
    });
    expect(await page.isVisible("text=Verify your login")).toBeTruthy();
    await page.fill('[placeholder="Account password"]', passwordShare);
    await page.click('button:has-text("Confirm")');
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/home`);
    expect(await page.isVisible(`text=Welcome, ${testEmail}`)).toBeTruthy();
  });
});
