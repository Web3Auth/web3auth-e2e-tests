import { expect, Page } from "@playwright/test";
import { test } from "./index.lib";
import {
  useAutoCancel2FASetup,
  signInWithEmail,
  deleteCurrentDeviceShare,
  waitForTkeyRehydration,
  addPasswordShare,
  changePasswordShare,
} from "../../utils";
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
    test.setTimeout(60000); // adding more time to compensate high loading time
    // Useful for debugging
    const context = await browser.newContext();
    page = await context.newPage();
    page.on("console", (message) => {
      console.log(message);
    });

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

  test(`should setup 2FA for running further tkey_input tests`, async ({
    openloginURL,
  }) => {
    test.setTimeout(60000); // adding more time to compensate high loading time
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
    await page.reload();
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(await page.isVisible("text=Recovery email")).toBeTruthy();
    expect(await page.isVisible("text=Device(s)")).toBeTruthy();
    expect(await page.isVisible("text=2 / 3")).toBeTruthy();

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
    test.setTimeout(60000); // adding more time since test is depended on external websites.

    await signInWithEmail(page, testEmail, browser);
    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);

    let tkey = waitForTkeyRehydration(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
    await tkey;

    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);
    expect(await page.isVisible("text=Account")).toBeTruthy();
    expect(await page.isVisible("text=2 / 3")).toBeTruthy();

    // Deleting device share
    await deleteCurrentDeviceShare(page);

    // // logout the user
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
    test.setTimeout(60000); // adding more time since test is depended on external websites.
    await signInWithEmail(page, testEmail, browser);
    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);

    await page.waitForURL(`${openloginURL}/tkey-input*`, {
      waitUntil: "load",
    });
    expect(await page.isVisible("text=Verify your login")).toBeTruthy();
    await page.fill('[placeholder="Enter backup phrase"]', emailBackupShare);
    await page.click('button:has-text("Confirm")');

    let tkey = waitForTkeyRehydration(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
    await tkey;

    // Delete device share to simulate tkey-input page
    let tkey2 = waitForTkeyRehydration(page);
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    await tkey2;

    // Required to simulate tkeyinput page
    await deleteCurrentDeviceShare(page);

    await addPasswordShare(page, passwordShare);
    await changePasswordShare(page, passwordShare);

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
