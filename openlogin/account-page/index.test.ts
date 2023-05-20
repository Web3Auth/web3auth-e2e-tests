import { test, expect , Page} from '@playwright/test';
import { AccountsPage } from './AccountsPage';
import Mailosaur from "mailosaur";
import { DEFAULT_PLATFORM, env_map } from "../../utils/index";
import { generate } from "generate-password";
import { signInWithGitHub } from "../../utils";
import { validateMnemonic } from "bip39";
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

const mailosaur = new Mailosaur(process.env.MAILOSAUR_API_KEY || "");
const openloginURL = env_map[process.env.PLATFORM || "prod"];
const twitter = {
  account: process.env.TWITTER_ACCOUNT || "",
  email: process.env.TWITTER_EMAIL || "",
  password: process.env.TWITTER_PASSWORD || "",
};
const github = {
  email: process.env.GITHUB_USER_EMAIL || "",
  password: process.env.GITHUB_USER_PASSWORD || ""
};

const testEmail =  generateRandomEmail();
const backupEmail = "backup" + generateRandomEmail();

const randomPassword = generate({
  length: 15,
  numbers: true,
  uppercase: true,
  lowercase: true,
  strict: true,
  symbols: '@'
});

test.describe.serial("Account page scenarios", () => {
  let page: Page;
  test.beforeAll(async ({ browser, }) => {
    page = await browser.newPage();
    test.setTimeout(300000)
    await signInWithGitHub({ page, github })
    await page.goto(openloginURL);
    await signInWithEmail(page, testEmail, browser);
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy()
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000
    });
  });


test(`page title should be "Account" for account page`, async ({  }) => {
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(await page.isVisible("text=Account")).toBeTruthy();
  });

test(`should display 2FA enable window for single factor account`, async ({  }) => {
  const accountsPage = new AccountsPage(page);
  expect(await accountsPage.verify2FARecommdation()).toBeTruthy();
  });

  test(`should setup 2FA account from account page`, async ({  }) => {
    const accountsPage = new AccountsPage(page);
    test.setTimeout(60000);
    await accountsPage.enableandStartSettingUp2FA();
    await accountsPage.enableDeviceShare();
    await accountsPage.addSocialRecoveryFactor("GitHub");
    await accountsPage.enableBackUpEmail(backupEmail);
    const seedString =  await accountsPage.seedEmail(backupEmail);
    await accountsPage.verifyRecoveryPhrase(seedString);
    await accountsPage.skip2FASetUp();
    await accountsPage.clickDone();
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000
    });
    await page.waitForTimeout(3000);
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      timeout: 3 * 60 * 1000
    });
    await accountsPage.verifyFactorsSetUp("2/4");

  });

  test(`should resend recovery email share`, async ({  }) => {
    const accountsPage = new AccountsPage(page);
    await accountsPage.resendRecoveryEmail();
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

  test(`emailed backup phrase and phrase from UI should match`, async ({  }) => {
    const accountsPage = new AccountsPage(page);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    await accountsPage.copyEmailRecoveryShare();
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
    console.log("Recovery phrase" + seedString)
    expect(await page.isVisible(`text=${seedString}`)).toBeTruthy(); // check if the backup phrase on email matches the one on UI.
    await accountsPage.clickLastClose();
  });

  test(`should setup account password`, async ({  }) => {
    const accountsPage = new AccountsPage(page);
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    await accountsPage.addPasswordShare(randomPassword);
    await page.reload();
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(await page.getByText('2 / 5').isVisible());
  });

  test(`should change/update account password`, async ({ }) => {
    const accountsPage = new AccountsPage(page);
    await page.goto(`${openloginURL}/wallet/account`);
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    await accountsPage.clickChangePassword();
    await accountsPage.addPasswordShare(randomPassword);
    await page.reload();
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(await page.getByText('2 / 5').isVisible());
  });

  test(`should be able to delete email share`, async ({  }) => {
    const accountsPage = new AccountsPage(page);
    await page.goto(`${openloginURL}/wallet/account`);
    await accountsPage.deleteRecoveryShare()
    await page.reload();
    await page.waitForURL(`${openloginURL}/wallet/account`, {
      waitUntil: "load",
    });
    expect(await page.getByText('2 / 4').isVisible());
});

  test(`should show a popup with copy option while clicking download device share`, async ({  }) => {
    const accountsPage = new AccountsPage(page);
    await accountsPage.copyDeviceShare()
      expect(
        await page.locator("text=Save a copy of your recovery phrase").first().isVisible()
      ).toBeTruthy(),
     await accountsPage.clickFirstClose();
  });

  test(`should be able to setup email backup again`, async ({  }) => {
    const accountsPage = new AccountsPage(page);
    expect(await page.getByText('2 / 4').isVisible());
    await accountsPage.enterRecoveryEmail(testEmail);
    await accountsPage.clickConfirm()
    await expect(page.getByText('Backup Phrase successfully sent', { exact: false })).toBeVisible();
    expect(await page.getByText('2 / 5').isVisible());
  });

  test(`should be able to delete device share`, async ({  }) => {
    const accountsPage = new AccountsPage(page);
    await accountsPage.deleteDeviceShare();
    await page.reload();
    await page.goto(`${openloginURL}/wallet/home`);
    await page.goto(`${openloginURL}/wallet/account`);
    expect(await page.getByText('2 / 4').isVisible());
  });
});
