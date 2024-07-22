import { expect, Page, test } from "@playwright/test";
import { validateMnemonic } from "bip39";
import { generate } from "generate-password";
import Mailosaur from "mailosaur";

import { generateEmailWithTag } from "../../openloginV3/utils";
import { AccountsPage } from "../../openloginV4/account-page/AccountsPage";
import { signInWithEmailWithTestEmailOnDemoApp } from "../../openloginV4/utils";
import { signInWithGitHub, signInWithMobileNumber ,
  addPasswordShare,
  catchError,
  catchErrorAndExit,
  changePasswordShare,
  deleteCurrentDeviceShare,
  generateRandomEmail,
  signInWithEmailWithTestEmailApp,
  slowOperation,
  useAutoCancel2FASetup,
  useAutoCancelShareTransfer,
  waitForSessionStorage,
  waitForTkeyRehydration,
,
  DEFAULT_PLATFORM,
  delay,
  env_map,
  signInWithEmailWithTestEmailAppInDemoApp} from "../utils";
import { WalletServicesPage } from "./WalletServicesPage";
const consoleLogs: string[] = [];
let sessionId: string = "";
const walletServiceLoginURL = "https://demo-wallet.web3auth.io";
const demoAppUrl = env_map.demo;
const user = {
  mobileNumberForLogin: process.env.LOGIN_MOBILE_NUMBER || "",
  mobileNumberForSMS: process.env.SMS_MOBILE_NUMBER || "",
};
const platform = process.env.PLATFORM || "";
const testEmail = "kelg8.j5s90ldb0b35@inbox.testmail.app";
const backupEmail = generateRandomEmail() || "";
const organizationName = "";
const randomPassword = generate({
  length: 15,
  numbers: true,
  uppercase: true,
  lowercase: true,
  strict: true,
  symbols: "@",
});

test.describe.serial("Wallet Services Scenarios @demo", () => {
  test(`Verify user is able to login using passwordless option`, async ({ page, browser }) => {
    test.setTimeout(3 * 60000); // adding more time to compensate high loading time
    const walletServicesPage = new WalletServicesPage(page);
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`Error text: "${msg.text()}"`);
        consoleLogs.push(`${msg.text()}`);
      }
    });
    await page.goto(walletServiceLoginURL);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("load");

    const currentTimestamp = Math.floor(Date.now() / 1000);
    await page.locator(walletServicesPage.loginBtn).waitFor({ state: "visible" });
    await page.locator(walletServicesPage.loginBtn).click();
    await signInWithEmailWithTestEmailAppInDemoApp(page, testEmail, browser, testEmail.split("@")[0].split(".")[1], currentTimestamp);
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy();
    await page.waitForURL(`${walletServiceLoginURL}`, {
      waitUntil: "load",
    });
    await walletServicesPage.verifyUserInfoInDemoApp("kelg8.j5s90ldb0b35@inbox.testmail.app");
    await walletServicesPage.switchChain(browser);
    await walletServicesPage.verifyAddressInDemoApp("0x0dB...d4e49F");
    await walletServicesPage.verifyBalanceInDemoApp("0.635632785708915");
    await walletServicesPage.verifyWalletInDemoApp("0x0dBa...4e49F");
    await walletServicesPage.verifySignedMessages("Personal Sign", browser);
    await walletServicesPage.verifySignedMessages("ETH Sign", browser);
    await walletServicesPage.verifySignedMessages("Typed data v1", browser);
    await walletServicesPage.verifySignedMessages("Typed data v3", browser);
    await walletServicesPage.verifySignedMessages("Typed data v4", browser);
    await walletServicesPage.verifyWalletConnect();
    await walletServicesPage.verifyGetEncryptionKey(browser);
    await walletServicesPage.verifyEncryptionAndDecryption(browser);
    //await accountsPage.verifyShowCheckout();
    await page.goto(`${walletServiceLoginURL}/logout`);
  });

  test(`Verify user is able to login using session id`, async ({ page, browser }) => {
    test.setTimeout(3 * 60000);
    await page.goto("https://demo-openlogin.web3auth.io/");
    await signInWithEmailWithTestEmailOnDemoApp(page, testEmail, browser, testEmail.split("@")[0].split(".")[1], "production", "mainnet");
    const welcome = await page.waitForSelector(`text=Get openlogin state`);
    const accountsPage = new AccountsPage(page);
    const keys: string | null = await accountsPage.getOpenLoginState();
    if (keys !== null) {
      const jsonObject = JSON.parse(keys);
      sessionId = jsonObject.sessionId;
    }
    const walletServicesPage = new WalletServicesPage(page);
    await page.goto(walletServiceLoginURL);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    await page.locator(`xpath=.//input[@aria-placeholder='Enter Session Id...']`).fill(sessionId);
    await page.locator(`xpath=.//button[text()='Login with Session Id']`).click();
    await page.waitForURL(`${walletServiceLoginURL}`, {
      waitUntil: "load",
    });
    await walletServicesPage.verifyUserInfoInDemoApp("kelg8.j5s90ldb0b35@inbox.testmail.app");
  });
  //switching chain
});
