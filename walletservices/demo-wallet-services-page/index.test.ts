import { expect, test } from "@playwright/test";

import { AccountsPage } from "../../openloginV4/account-page/AccountsPage";
import { signInWithEmailWithTestEmailOnDemoApp } from "../../openloginV4/utils";
import { catchErrorAndExit, delay, signInWithEmailWithTestEmailAppInDemoApp } from "../utils";
import { WalletServicesPage } from "./WalletServicesPage";
const consoleLogs: string[] = [];
let sessionId: string = "";
const walletServiceLoginURL = "https://demo-wallet.web3auth.io";
const testEmail = "kelg8.j5s90ldb0b35@inbox.testmail.app";

test.describe.serial("Wallet Services Scenarios @demo", () => {
  test(`Verify user is able to login using passwordless option`, async ({ page, browser }) => {
    test.setTimeout(3 * 60000); // adding more time to compensate high loading time
    const accountsPage = new WalletServicesPage(page);
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`Error text: "${msg.text()}"`);
        consoleLogs.push(`${msg.text()}`);
      }
    });
    await page.goto(walletServiceLoginURL);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    await delay(5000);
    await page.locator(`xpath=.//button[text()='Login']`).click();
    await delay(5000);
    await signInWithEmailWithTestEmailAppInDemoApp(page, testEmail, browser, testEmail.split("@")[0].split(".")[1], currentTimestamp);
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy();
    await page.waitForURL(`${walletServiceLoginURL}`, {
      waitUntil: "load",
    });
    await accountsPage.verifyUserInfoInDemoApp("kelg8.j5s90ldb0b35@inbox.testmail.app");
    await accountsPage.switchChain(browser);
    await accountsPage.verifyAddressInDemoApp("0x0dB...d4e49F");
    await accountsPage.verifyBalanceInDemoApp("0.635632785708915");
    await accountsPage.verifyWalletInDemoApp("0x0dBa...4e49F");
    await accountsPage.verifySignedMessages("Personal Sign", browser);
    await accountsPage.verifySignedMessages("ETH Sign", browser);
    await accountsPage.verifySignedMessages("Typed data v1", browser);
    await accountsPage.verifySignedMessages("Typed data v3", browser);
    await accountsPage.verifySignedMessages("Typed data v4", browser);
    await accountsPage.verifyWalletConnect();
    await accountsPage.verifyGetEncryptionKey(browser);
    await accountsPage.verifyEncryptionAndDecryption(browser);
    //await accountsPage.verifyShowCheckout();
    await page.goto(`${walletServiceLoginURL}/logout`);
  });
  test(`Verify user is able to login using session id`, async ({ page, browser }) => {
    test.setTimeout(3 * 60000);
    await page.goto("https://demo-openlogin.web3auth.io/");
    await signInWithEmailWithTestEmailOnDemoApp(page, testEmail, browser, testEmail.split("@")[0].split(".")[1], "production", "mainnet");
    const accountsPage = new AccountsPage(page);
    const keys: string | null = await accountsPage.getOpenLoginState();
    if (keys !== null) {
      const jsonObject = JSON.parse(keys);
      sessionId = jsonObject.sessionId;
    }
    const walletServicesPage = new WalletServicesPage(page);
    await page.goto(walletServiceLoginURL);
    await page.locator(`xpath=.//input[@aria-placeholder='Enter Session Id...']`).fill(sessionId);
    await page.locator(`xpath=.//button[text()='Login with Session Id']`).click();
    await page.waitForURL(`${walletServiceLoginURL}`, {
      waitUntil: "load",
    });
    await walletServicesPage.verifyUserInfoInDemoApp("kelg8.j5s90ldb0b35@inbox.testmail.app");
  });
  //switching chain
});
