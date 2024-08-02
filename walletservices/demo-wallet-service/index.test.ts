import { expect, test } from "@playwright/test";

import { AccountsPage } from "../../authservice/openlogin-account-page/AccountsPage";
import { signInWithEmailWithTestEmailOnDemoApp } from "../../authservice/utils";
import { catchErrorAndExit, signInWithEmailWithTestEmailApp, signInWithEmailWithTestEmailAppInDemoApp } from "../utils";
import { DemoWalletServicesPage } from "./DemoWalletServicesPage";
let sessionId: string = "";
const demoWalletServiceLoginURL = "https://demo-wallet.web3auth.io";
const authServiceLoginURL = "https://demo-openlogin-v8.web3auth.io/";
const testEmail = "kelg8.j5s90ldb0b35@inbox.testmail.app";
const currentTimestamp = Math.floor(Date.now() / 1000);
const address = "0x0dB...d4e49F";
const walletAddress = "0x0dBa...4e49F";
const expectedBalance = "0.635632785708915";

test.describe.serial("Demo Wallet Services Scenarios @demo", () => {
  test(`Verify demo wallet services functionalities using passwordless login`, async ({ page, browser }) => {
    test.setTimeout(3 * 60000); // adding more time to compensate high loading time test.slow() does not help in this case
    const demoWalletServicesPage = new DemoWalletServicesPage(page);
    await page.goto(demoWalletServiceLoginURL);
    await page.waitForLoadState();

    await page.locator(demoWalletServicesPage.loginBtn).waitFor({ state: "visible" });
    await page.locator(demoWalletServicesPage.loginBtn).click();

    await signInWithEmailWithTestEmailAppInDemoApp(page, testEmail, browser, testEmail.split("@")[0].split(".")[1], currentTimestamp);
    await page.waitForURL(`${demoWalletServiceLoginURL}`, {
      waitUntil: "load",
    });
    await demoWalletServicesPage.verifyUserInfoInDemoApp(testEmail);
    await demoWalletServicesPage.switchChain(browser);
    await demoWalletServicesPage.verifyAddressInDemoApp(address);
    await demoWalletServicesPage.verifyBalanceInDemoApp(expectedBalance);
    await demoWalletServicesPage.verifyWalletInDemoApp(walletAddress);
    await demoWalletServicesPage.verifySignedMessages("Personal Sign", browser);
    await demoWalletServicesPage.verifySignedMessages("ETH Sign", browser);
    await demoWalletServicesPage.verifySignedMessages("Typed data v1", browser);
    await demoWalletServicesPage.verifySignedMessages("Typed data v3", browser);
    await demoWalletServicesPage.verifySignedMessages("Typed data v4", browser);
    await demoWalletServicesPage.verifyWalletConnect();
    await demoWalletServicesPage.verifyGetEncryptionKey(browser);
    await demoWalletServicesPage.verifyEncryptionAndDecryption(browser);
    await page.goto(`${demoWalletServiceLoginURL}/logout`);
  });
  test(`Verify user is able to login into wallet services using session id from auth service`, async ({ page, browser }) => {
    test.slow();
    const demoWalletServicesPage = new DemoWalletServicesPage(page);
    await page.goto(authServiceLoginURL);
    await signInWithEmailWithTestEmailApp(page, testEmail, browser, testEmail.split("@")[0].split(".")[1], currentTimestamp);
    const accountsPage = new AccountsPage(page);
    const keys: string | null = await accountsPage.getOpenLoginState();
    if (keys !== null) {
      const jsonObject = JSON.parse(keys);
      sessionId = jsonObject.sessionId;
    }
    await page.goto(demoWalletServiceLoginURL);
    await page.waitForLoadState();
    await page.locator(`xpath=.//input[@aria-placeholder='Enter Session Id...']`).fill(sessionId);
    await page.locator(`xpath=.//button[text()='Login with Session Id']`).click();
    await page.waitForLoadState();
    await demoWalletServicesPage.verifyUserInfoInDemoApp(testEmail);
  });
});
