import { test } from "@playwright/test";

import { signInWithEmailWithTestEmailAppInDemoApp } from "../utils";
import { DemoWalletServicesPage } from "./DemoWalletServicesPage";

const demoWalletServiceLoginURL = "https://demo-wallet.web3auth.io";
const testEmail = "kelg8.j5s90ldb0b35@inbox.testmail.app";
const currentTimestamp = Math.floor(Date.now() / 1000);
const address = "0x0dB...d4e49F";
const walletAddress = "0x0dBa...d4e49F";
const signAddress = "0x0dBa2cE4784849FA4e42936cA0c5d8bC1Cd4e49F";
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
    await demoWalletServicesPage.switchChain(browser, "(0x13882)");
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

  test(`Verify user is able to login into wallet services using session id from auth service`, async ({ browser }) => {
    test.slow();
    test.setTimeout(3 * 60000);

    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    const demoWalletServicesPage = new DemoWalletServicesPage(page1);
    await page1.goto(demoWalletServiceLoginURL);
    await page1.waitForLoadState();

    await page1.locator(demoWalletServicesPage.loginBtn).waitFor({ state: "visible" });
    await page1.locator(demoWalletServicesPage.loginBtn).click();

    await signInWithEmailWithTestEmailAppInDemoApp(page1, testEmail, browser, testEmail.split("@")[0].split(".")[1], currentTimestamp);
    await page1.waitForURL(`${demoWalletServiceLoginURL}`, {
      waitUntil: "load",
    });
    await demoWalletServicesPage.verifyUserInfoInDemoApp(testEmail);

    // Get sessionId from localStorage
    const storageStateData = await context1.storageState();
    const { origins } = storageStateData;
    const sessionData = origins.flatMap((origin) => origin.localStorage).find((item) => item.name === "auth_store_demo-wallet.web3auth.io");

    const { sessionId } = JSON.parse(sessionData.value);

    const context = await browser.newContext();
    const page2 = await context.newPage();
    const secondDemoWalletServicesPage = new DemoWalletServicesPage(page2);
    await page2.goto(demoWalletServiceLoginURL);
    await page2.waitForLoadState();
    await page2.locator(`xpath=.//input[@aria-placeholder='Enter Session Id...']`).fill(sessionId);
    await page2.locator(`xpath=.//button[text()='Login with Session Id']`).click();
    await page2.waitForLoadState();
    await secondDemoWalletServicesPage.verifyUserInfoInDemoApp(testEmail);
  });
});
