import { test, expect, Page } from "@playwright/test";
import { WalletServicesPage } from "./WalletServicesPage";
import Mailosaur from "mailosaur";
import { DEFAULT_PLATFORM, delay, env_map } from "../utils/index";
import { generate } from "generate-password";
import { signInWithGitHub, signInWithMobileNumber } from "../utils";
import { validateMnemonic } from "bip39";
import {
  useAutoCancel2FASetup,
  signInWithEmailWithTestEmailApp,
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
} from "../utils";
import { generateEmailWithTag } from "../../openloginV3/utils";

const walletServiceLoginURL = "https://lrc-wallet.web3auth.io";

const user = {
  mobileNumberForLogin: process.env.LOGIN_MOBILE_NUMBER || "",
  mobileNumberForSMS: process.env.SMS_MOBILE_NUMBER || "",
};

const testEmail = "kelg8.j5s90ldb0b35@inbox.testmail.app";
const backupEmail = generateRandomEmail() || "";
var organizationName = "";
const randomPassword = generate({
  length: 15,
  numbers: true,
  uppercase: true,
  lowercase: true,
  strict: true,
  symbols: "@",
});

test.describe.serial("Wallet Services Scenarios @smoke", () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    test.setTimeout(3000000);
    await page.goto(walletServiceLoginURL);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    await signInWithEmailWithTestEmailApp(
      page,
      testEmail,
      browser,
      testEmail.split("@")[0].split(".")[1],
      currentTimestamp
    );
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy();
    await page.waitForURL(`${walletServiceLoginURL}/wallet/home`, {
      waitUntil: "load",
    });
  });

  test(`Verify token address and balance is displayed as expected`, async ({}) => {
    const accountsPage = new WalletServicesPage(page);
    await accountsPage.verifyBalanceAndAddress(
      "0x6e825ddBDf...C183184117d1",
      "0"
    );
  });

  test(`Verify network switch and balance on wallet services`, async ({}) => {
    const accountsPage = new WalletServicesPage(page);
    await accountsPage.verifyNetworkName("Main Ethereum Network");
    await accountsPage.navigateToSettingsWithOption("General");
    await accountsPage.selectNetwork("Main Ethereum Network", "Polygon Mumbai");
    await accountsPage.clickLink(" Home");
    await accountsPage.verifyNetworkName("Polygon Mumbai");
    await accountsPage.verifyBalanceAndAddress(
      "0x6e825ddBDf...C183184117d1",
      "0.000074"
    );
  });

  test(`Verify validations on send transaction screen`, async ({}) => {
    const accountsPage = new WalletServicesPage(page);
    await accountsPage.clickOption("Send");
    await accountsPage.enterRecipientAddress(
      "0x9904Bf11C69233454162B72d7289ccBb295ADE6"
    );
    await accountsPage.verifyMessageIsDisplayed("Invalid ETH address");
    await accountsPage.enterRecipientAddress(
      "0x9904Bf11C69233454162B72d7289ccBb295ADE6A"
    );
    await accountsPage.enterTransactionAmount("10");
    await accountsPage.verifyMessageIsDisplayed(
      "Insufficient balance for transaction"
    );
  });

  test(`Verify transaction fee is updated on selection of different speed levels`, async ({}) => {
    const accountsPage = new WalletServicesPage(page);
    await accountsPage.selectSpeed("Slow");
    await accountsPage.verifyTransferFee("0.00002");
    await accountsPage.selectSpeed("Medium");
    await accountsPage.verifyTransferFee("0.00003");
    await accountsPage.selectSpeed("Fast");
    await accountsPage.verifyTransferFee("0.00004");
  });

  test(`Verify details displayed on send transaction screen`, async ({}) => {
    const accountsPage = new WalletServicesPage(page);
    await accountsPage.verifyAvailableBalance("0.2 MATIC");
    await accountsPage.enterTransactionAmount("0.0001");
    await accountsPage.clickButton(" Submit ");
    await accountsPage.verifyTransferTokenAmount("0.0001MATIC");
    await accountsPage.verifyTransferAddress("0x6e82...117d10x9904...ADE6A");
  });

  test.skip(`Verify user is able to view the sent transaction activity`, async ({}) => {
    const accountsPage = new WalletServicesPage(page);
    await page.goto(`${walletServiceLoginURL}/wallet/home`);
    await accountsPage.clickLink(" Home");
    await accountsPage.clickLink(" Activity");
    await page.waitForURL(`${walletServiceLoginURL}/wallet/activity`, {
      waitUntil: "load",
    });
    await accountsPage.verifyTransactionActivity(
      "Sent MATIC|to 0x3e3cd73f7619bab0d09aa28d46c44d4e6853413a|13:34:43|1 Nov 2023"
    );
  });

  test(`Verify user is able to switch currency`, async ({}) => {
    const accountsPage = new WalletServicesPage(page);
    await page.goto(`${walletServiceLoginURL}/wallet/home`);
    await accountsPage.clickLink(" Home");
    await accountsPage.navigateToSettingsWithOption("General");
    await accountsPage.selectCurrency("ETH");
    await accountsPage.clickLink(" Home");
    await accountsPage.verifyBalanceAndAddress(
      "0x6e825ddBDf...C183184117d1",
      "0.000073"
    );
  });

  test.skip(`Verify user is able to import account`, async ({}) => {
    const accountsPage = new WalletServicesPage(page);
    await accountsPage.navigateToSettingsWithOption("Manage Wallets");
    await accountsPage.clickButton(" Import Account");
    await accountsPage.inputPrivateKey(
      "18a6aa7e43a8f7f57c4cfb8d322cc9c12cd4cc573ea137c9bcd6d2b5d060a90a"
    );
    await accountsPage.clickLink(" Home");
    await accountsPage.verifyBalanceAndAddress(
      "0x2b7f47e9bb...B99a8a33151c",
      "0.00013"
    );
  });
});
