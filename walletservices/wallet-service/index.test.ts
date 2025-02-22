import { expect, Page, test } from "@playwright/test";

import { catchErrorAndExit, delay, signInWithEmailWithTestEmailAppInCoreWalletServicesApp } from "../utils";
import { WalletServicesPage } from "./WalletServicesPage";

const walletServiceLoginURL = "https://develop-wallet.web3auth.io";

const testEmail = "kelg8.wallet@inbox.testmail.app";

test.describe.serial("Core Wallet Services Scenarios @smoke", () => {
  test.setTimeout(3 * 60000);
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    test.setTimeout(3000000);
    await page.goto(walletServiceLoginURL);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    await signInWithEmailWithTestEmailAppInCoreWalletServicesApp(page, testEmail, browser, testEmail.split("@")[0].split(".")[1], currentTimestamp);
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy();
    await page.waitForURL(`${walletServiceLoginURL}/wallet/home`, {
      waitUntil: "load",
    });
  });

  test(`Verify token address and balance is displayed as expected`, async () => {
    const accountsPage = new WalletServicesPage(page);
    await accountsPage.navigateToSettingsWithOption("General");
    await accountsPage.enableTestNetworks();
    await accountsPage.selectNetwork("Ethereum", "Ethereum");
    await accountsPage.clickHome();
    await accountsPage.verifyBalanceAndAddress("0xed21...f4C0a7", "0");
  });

  test(`Verify network switch and balance on wallet services`, async () => {
    const accountsPage = new WalletServicesPage(page);
    await accountsPage.verifyNetworkName("Ethereum");
    await accountsPage.navigateToSettingsWithOption("General");
    await accountsPage.selectNetwork("Ethereum", "Polygon Amoy");
    await accountsPage.selectCurrency("USD");
    await accountsPage.clickHome();
    await accountsPage.verifyNetworkName("Polygon Amoy");
    await accountsPage.verifyBalanceAndAddress("0xed21...f4C0a7", "0.08");
  });

  test(`Verify validations on send transaction screen`, async () => {
    const accountsPage = new WalletServicesPage(page);
    await accountsPage.clickOption("Send");
    await accountsPage.enterRecipientAddress("0x9904Bf11C69233454162B72d7289ccBb295ADE6");
    await accountsPage.verifyMessageIsDisplayed("Invalid address");
    await accountsPage.enterRecipientAddress("0x9904Bf11C69233454162B72d7289ccBb295ADE6A");
    await accountsPage.enterTransactionAmount("10");
    await accountsPage.verifyMessageIsDisplayed("Insufficient balance for transaction");
  });

  test(`Verify transaction fee is updated on selection of different speed levels`, async () => {
    const accountsPage = new WalletServicesPage(page);
    await accountsPage.selectSpeed("Slow");
    await accountsPage.verifyTransferFee("0.00002");
    await accountsPage.selectSpeed("Medium");
    await accountsPage.verifyTransferFee("0.00003");
    await accountsPage.selectSpeed("Fast");
    await accountsPage.verifyTransferFee("0.00004");
  });

  test(`Verify details displayed on send transaction screen`, async () => {
    const accountsPage = new WalletServicesPage(page);
    await accountsPage.verifyAvailableBalance("0.1899 POL");
    await accountsPage.enterTransactionAmount("0.0001");
    await accountsPage.clickButton("Submit");
    await accountsPage.verifyTransferTokenAmount("0.0001 POL");
    await accountsPage.verifyTransferFromAddress("0xed2...4C0a7");
    await accountsPage.verifyTransferToAddress("0x990...ADE6A");
  });

  test.skip(`Verify existing assets are displayed`, async () => {
    const accountsPage = new WalletServicesPage(page);
    await accountsPage.clickHome();
    await accountsPage.navigateToSettingsWithOption("General");
    await accountsPage.selectNetwork("Main Ethereum Network", "Polygon Mumbai");
    await accountsPage.clickHome();
    await accountsPage.verifyNftIsPresent("SampleERC721");
  });

  test(`Verify user is able to view the sent transaction activity`, async () => {
    const accountsPage = new WalletServicesPage(page);
    await accountsPage.navigateToSettingsWithOption("General");
    await accountsPage.selectNetwork("Main Ethereum Network", "Polygon Amoy");
    await accountsPage.clickHome();
    await accountsPage.clickLink(" Activity");
    await page.waitForURL(`${walletServiceLoginURL}/wallet/activity`, {
      waitUntil: "load",
    });
    await accountsPage.verifyTransactionActivity("Sent MATIC|to 0x9904bf11c69233454162b72d7289ccbb295ade6a|20:12:44 | 19 Sept 2024");
    await accountsPage.verifyTransactionActivity("Received POL|to 0xed2130dd79960a00be8abe75962c75678af4c0a7|19:57:52 | 19 Sept 2024");
  });

  test(`Verify user is able to switch currency`, async () => {
    const accountsPage = new WalletServicesPage(page);
    await accountsPage.clickLink(" Home");
    await accountsPage.navigateToSettingsWithOption("General");
    await accountsPage.selectNetwork("Main Ethereum Network", "Polygon Amoy");
    await accountsPage.selectCurrency("SGD");
    await accountsPage.clickHome();
    await accountsPage.verifyBalanceAndAddress("0xed21...f4C0a7", "0.08");
  });

  test(`Verify user is able to connect via wallet connect`, async () => {
    const accountsPage = new WalletServicesPage(page);
    await accountsPage.navigateToSettingsWithOption("General");
    await accountsPage.selectNetwork("Main Ethereum Network", "Ethereum");
    await accountsPage.clickHome();
    await accountsPage.clickButton(" Wallet connect");
    await page.waitForSelector('[aria-placeholder="Paste QR link here"]');
    expect(await page.locator('[aria-placeholder="Paste QR link here"]').first().isVisible()).toBeTruthy();
  });

  test(`Verify user is able to buy tokens`, async () => {
    const accountsPage = new WalletServicesPage(page);
    await accountsPage.clickHome();
    await accountsPage.clickOption("Buy");
    await page.waitForURL(`${walletServiceLoginURL}/wallet/checkout`, {
      waitUntil: "load",
    });
    await delay(5000);
    await accountsPage.verifyBuyOption();
  });
});
