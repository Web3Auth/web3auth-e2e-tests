import { expect, Page } from "@playwright/test";
import { test } from "./index.lib";
import {
  useAutoCancel2FASetup,
  signInWithEmail,
  deleteCurrentDeviceShare,
  waitForTkeyRehydration,
  addPasswordShare,
  changePasswordShare,
  useAutoCancelShareTransfer,
  generateRandomEmail,
  catchError,
  waitForSessionStorage,
  catchErrorAndExit,
  slowOperation,
} from "../../utils";
import Mailosaur from "mailosaur";
import { generate } from "generate-password";
import { validateMnemonic } from "bip39";

const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");

const testEmail = generateRandomEmail();

const backupEmail = "backup" + generateRandomEmail();

const randomPassword = generate({
  length: 15,
  numbers: true,
  uppercase: true,
  lowercase: true,
  strict: true,
});
const newRandomPassword = generate({
  length: 13,
  numbers: true,
  uppercase: true,
  lowercase: true,
  strict: true,
});

test.describe.serial("Account page scenarios", () => {
  let page: Page;
  test.beforeAll(async ({ browser, openloginURL }) => {
    test.setTimeout(300000)
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto(openloginURL);
    await signInWithEmail(page, testEmail, browser);
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy()
    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000
    });
  });

  // test.afterAll(async ({ browser }) => {
  //   await browser.close();
  // });

  test(`page title should be "Account" for account page`, async ({
    openloginURL,
  }) => {
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(await page.isVisible("text=Account")).toBeTruthy();
  });
  test(`should display 2FA enable window for single factor account`, async ({ }) => {
    expect(
      await page.isVisible(
        "text=We strongly recommend you to enable 2FA on your account"
      )
    ).toBeTruthy();
  });
  test(`should setup 2FA account from account page`, async ({
    openloginURL,
  }) => {
    test.setTimeout(60000); // adding more time to compensate high loading time
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
      { timeout: 30 * 1000 }
    );
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
    await mailosaur.messages.del(seedEmail?.id || "");

    await page.fill('[placeholder="Recovery phrase"]', seedString);

    await page.click('button:has-text("Verify")');

    await page.click('button:has-text("Done")');
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000
    });
    await page.waitForTimeout(3000);
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      timeout: 3 * 60 * 1000
    });

    expect(await page.isVisible("text=Recovery email")).toBeTruthy();
    expect(await page.isVisible("text=Device(s)")).toBeTruthy();
    expect(await page.isVisible("text=2 / 3")).toBeTruthy();
  });

  test(`should resend recovery email share`, async ({ openloginURL }) => {
    await waitForSessionStorage(page, openloginURL);
    await page.click('button:has-text("Resend")');
    await page.waitForTimeout(5000);

    const resentBackup = await mailosaur.messages.get(
      process.env.MAILOSAUR_SERVER_ID || "",
      {
        sentTo: backupEmail,
      },
      { timeout: 30 * 1000 }
    );
    expect(resentBackup.subject === "Your Web3Auth backup phrase").toBeTruthy();

    let seedArray =
      resentBackup.html?.body
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
    expect(validateMnemonic(seedString)).toBeTruthy();
  });

  test(`emailed backup phrase and phrase from UI should match`, async ({
    openloginURL,
  }) => {
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    await waitForSessionStorage(page, openloginURL);
    await page.click('button[aria-label="export email share"]');
    const resentBackup = await mailosaur.messages.get(
      process.env.MAILOSAUR_SERVER_ID || "",
      {
        sentTo: backupEmail,
      },
      { timeout: 30 * 1000 }
    );
    expect(resentBackup.subject === "Your Web3Auth backup phrase").toBeTruthy();

    let seedArray =
      resentBackup.html?.body
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
    expect(validateMnemonic(seedString)).toBeTruthy();
    expect(
      await page.isVisible("text=Save a copy of your backup phrase")
    ).toBeTruthy();
    expect(await page.isVisible(`text=${seedString}`)).toBeTruthy(); // check if the backup phrase on email matches the one on UI.
    await page.click('button:has-text("Close")');
  });

  test(`should be able to delete email share`, async ({ openloginURL }) => {
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(page.url()).toBe(`${openloginURL}/wallet/account`);

    // not reliable, either rewrite or await for some other marker
    await waitForSessionStorage(page, openloginURL);
    expect(await page.isVisible("text=2 / 3")).toBeTruthy();

    // No need to rely on API response, its incorrect.
    // because state changes locally aren't guaranteed
    // checkout how await for delete share works in utils
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/metadata.tor.us/bulk_set_stream") &&
          resp.status() === 200
      ),
      page.click('button[aria-label="delete email share"]'),
    ]);
    await page.reload();
    await page.goto(`${openloginURL}/wallet/home`);
    await page.goto(`${openloginURL}/wallet/account`);
    expect(await page.getByText('2 / 2').isVisible());

  });

  test(`should show a popup with copy option while clicking download device share`, async ({
    openloginURL,
  }) => {
    await waitForSessionStorage(page, openloginURL);
    await Promise.all([
      expect(
        page.isVisible("text=Save a copy of your backup phrase")
      ).toBeTruthy(),
      page.click(`button[aria-label='export device share']`),
    ]);
    await page.click('button:has-text("Close")');
  });

  // should test setting up email backup again after deleting email share.
  test(`should be able to setup email backup again`, async ({
    openloginURL,
  }) => {
    await waitForSessionStorage(page, openloginURL);
    expect(await page.isVisible("text=2 / 2")).toBeTruthy();
    await page.fill('[placeholder="Enter recovery email"]', testEmail);
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/metadata.tor.us/get") &&
          resp.status() === 200
      ),
      page.click('button:has-text("Confirm")'),
    ]);
    //await page.reload(); Recovery share deleted successfully 
    await expect(page.getByText('Backup Phrase successfully sent', { exact: false })).toBeVisible();
    expect(await page.getByText('2 / 3').isVisible());
  });

  // below test check password share setup.
  test(`should setup account password`, async ({ openloginURL }) => {
    await waitForSessionStorage(page, openloginURL);
    let tkey = waitForTkeyRehydration(page);
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    await tkey;

    await addPasswordShare(page, randomPassword);
    await page.reload();
    expect(await page.getByText('2 / 4').isVisible());
  });

  test(`should change/update account password`, async ({ openloginURL }) => {
    let tkey = waitForTkeyRehydration(page);
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    await tkey;
    await waitForSessionStorage(page, openloginURL);

    await changePasswordShare(page, newRandomPassword);
    await page.reload();
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(await page.getByText('2 / 4').isVisible());
  });

  test(`should be able to delete device share`, async ({ openloginURL }) => {
    let tkey = waitForTkeyRehydration(page);
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    await tkey;
    await waitForSessionStorage(page, openloginURL);
    await deleteCurrentDeviceShare(page);
    await page.reload();
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
  });
});
