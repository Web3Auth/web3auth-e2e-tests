import { test } from "@playwright/test";

import { AccountsPage } from "../../authservice/openlogin-account-page/AccountsPage";
import { signInWithEmailWithTestEmailApp, signInWithEmailWithTestEmailAppInDemoApp } from "../utils";
import { DemoWalletServicesPage } from "./DemoWalletServicesPage";

const demoWalletServiceLoginURL = "https://demo-wallet.web3auth.io";
const testEmail = "kelg8.j5s90ldb0b35@inbox.testmail.app";
const currentTimestamp = Math.floor(Date.now() / 1000);
const address = "0x0dB...d4e49F";
const walletAddress = "0x0dBa...4e49F";
const signAddress = "0x0dBa2cE4784849FA4e42936cA0c5d8bC1Cd4e49F";
const expectedBalance = "0.635632785708915";
let sessionId: string = "";
test.describe.serial("Demo Wallet Services Scenarios @demo", () => {
  test.skip(`Verify demo wallet services functionalities using passwordless login`, async ({ page, browser }) => {
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
    await demoWalletServicesPage.switchChain(browser, "Switch Chain 0x13882");
    await demoWalletServicesPage.switchChain(browser, "Switch Chain 0xaa36a7");
    await demoWalletServicesPage.verifyAddressInDemoApp(address);
    await demoWalletServicesPage.verifyBalanceInDemoApp(expectedBalance);
    await demoWalletServicesPage.verifyWalletInDemoApp(walletAddress);
    await demoWalletServicesPage.verifySignedMessages("Personal Sign", browser, signAddress);
    await demoWalletServicesPage.verifySignedMessages("ETH Sign", browser, signAddress);
    await demoWalletServicesPage.verifySignedMessages("Typed data v4", browser, signAddress);
    await demoWalletServicesPage.verifyWalletConnect();
    await demoWalletServicesPage.clickLogOut();
  });

  test(`Verify user is able to login into wallet services using session id from auth service`, async ({ page, browser }) => {
    test.slow();
    test.setTimeout(3 * 60000);
    await page.goto("https://demo-openlogin.web3auth.io/");
    await signInWithEmailWithTestEmailApp(page, testEmail, browser, testEmail.split("@")[0].split(".")[1], currentTimestamp);
    const accountsPage = new AccountsPage(page);
    const keys: string | null = await accountsPage.getOpenLoginState();
    if (keys !== null) {
      const jsonObject = JSON.parse(keys);
      sessionId = jsonObject.sessionId;
    }
    const demoWalletServicesPage = new DemoWalletServicesPage(page);
    await page.goto(demoWalletServiceLoginURL);
    await page.waitForLoadState();
    await page.locator(`xpath=.//input[@aria-placeholder='Enter Session Id...']`).fill(sessionId);
    await page.locator(`xpath=.//button[text()='Login with Session Id']`).click();
    await page.waitForLoadState();
    await demoWalletServicesPage.verifyUserInfoInDemoApp(testEmail);
  });
});
