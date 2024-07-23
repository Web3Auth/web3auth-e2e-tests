import { Client } from "@opensearch-project/opensearch";
import { expect, test } from "@playwright/test";

import { AccountsPage } from "../account-page/AccountsPage";
import { signInWithEmail, signInWithMobileNumber, useAutoCancel2FASetup ,
  catchErrorAndExit,
  env_map,
  generateEmailWithTag,
  getBackUpPhrase,
  signInWithEmailWithTestEmailApp,
  signInWithEmailWithTestEmailOnDemoApp,
, useAutoCancelShareTransfer } from "../utils";
const demoAppUrl = env_map.demo;
const demoAppUrlV4 = env_map.demoV6;
const eventPostURL =
  process.env.ES_ENDPOINT === undefined
    ? "search-sapphire-latency-stats-7n6qd4g6m3au5fpre3gwvwo6vm.eu-west-1.es.amazonaws.com"
    : process.env.ES_ENDPOINT;
const region = process.env.REGION === undefined ? "singapore" : process.env.REGION;
const username = "devops";
const platform = process.env.PLATFORM || "";
const password = process.env.PASSWORD;
const version = process.env.APP_VERSION;
const ci_mode = process.env.CI_MODE;
const openloginURL = env_map[process.env.PLATFORM || "prod"];
const user = {
  mobileNumberForLogin: process.env.LOGIN_MOBILE_NUMBER || "",
  mobileNumberForSMS: process.env.SMS_MOBILE_NUMBER || "",
};
const consoleLogs: string[] = [];
const testEmail = generateEmailWithTag();
let oAuthPrivateKey: string = "";
let privKey: string = "";
let tkey: string = "";
let oAuthPrivateKeyV4: string = "";
let privKeyV4: string = "";
let tkeyV4: string = "";
let idToken: string = "";

test.describe.serial("Passwordless Login scenarios", () => {
  test("Login with mobile number using passwordless login", async ({ page, browser }) => {
    test.slow();
    const accountsPage = new AccountsPage(page);
    // Listen for all console events and handle errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`Error text: "${msg.text()}"`);
        consoleLogs.push(`${msg.text()}`);
      }
    });
    await page.goto(openloginURL);
    await page.fill("#passwordless-email", user.mobileNumberForLogin);
    await page.getByLabel("Connect with Phone or Email").click();
    await signInWithMobileNumber({ page, user, browser });
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
    await accountsPage.clickLogout();
    expect(page.url()).toContain(`${openloginURL}/`);
  });

  test("Login with email using passwordless login V4 @smoke", async ({ browser, page }) => {
    // Verify environment variables
    const accountsPage = new AccountsPage(page);
    test.setTimeout(3 * 60000); // adding more time to compensate high loading time
    // Listen for all console events and handle errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`Error text: "${msg.text()}"`);
        consoleLogs.push(`${msg.text()}`);
      }
    });
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(openloginURL);
    await signInWithEmailWithTestEmailApp(page, testEmail, browser, testEmail.split("@")[0].split(".")[1]);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
    await accountsPage.clickLogout();
    expect(page.url()).toContain(`${openloginURL}/`);
  });

  test("Login with email using passwordless login @demoauth service", async ({ browser, page }) => {
    // Verify environment variables
    test.setTimeout(3 * 60000); // adding more time to compensate high loading time
    // Listen for all console events and handle errors
    // page.on("console", (msg) => {
    //   if (msg.type() === "error") {
    //     console.log(`Error text: "${msg.text()}"`);
    //     consoleLogs.push(`${msg.text()}`);
    //   }
    // });
    await page.goto(demoAppUrl);
    await signInWithEmailWithTestEmailOnDemoApp(page, testEmail, browser, testEmail.split("@")[0].split(".")[1], "production", platform);
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy();
    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${demoAppUrl}`, {
      timeout: 3 * 60 * 1000,
    });
    expect(page.url()).toBe(`${demoAppUrl}`);
    const accountsPage = new AccountsPage(page);
    const keys: string | null = await accountsPage.getOpenLoginState();
    if (keys !== null) {
      const jsonObject = JSON.parse(keys);
      privKey = jsonObject.privKey;
      idToken = jsonObject.userInfo.idToken;
      tkey = jsonObject.tkey;
      oAuthPrivateKey = jsonObject.oAuthPrivateKey;
    }
    expect(idToken).not.toBeNull();
    expect(idToken).not.toBeUndefined();
    expect(privKey).not.toBeNull();
    expect(privKey).not.toBeUndefined();
    if (platform == "mainnet") {
      await page.goto(demoAppUrlV4);
      await signInWithEmailWithTestEmailOnDemoApp(page, testEmail, browser, testEmail.split("@")[0].split(".")[1], "production", platform);
      const shouldExit = await catchErrorAndExit(page);
      expect(shouldExit).toBeFalsy();
      await useAutoCancelShareTransfer(page);
      await useAutoCancel2FASetup(page);
      await page.waitForURL(`${demoAppUrlV4}`, {
        timeout: 3 * 60 * 1000,
      });

      expect(page.url()).toBe(`${demoAppUrlV4}`);
      await page.waitForSelector(`text=Get openlogin state`);
      if (keys !== null) {
        const jsonObject = JSON.parse(keys);
        tkeyV4 = jsonObject.tkey;
        privKeyV4 = jsonObject.privKey;
        oAuthPrivateKeyV4 = jsonObject.oAuthPrivateKey;
      }
      expect(tkeyV4).toEqual(tkey);
      expect(privKeyV4).toEqual(privKey);
      expect(oAuthPrivateKeyV4).toEqual(oAuthPrivateKey);
    }
  });

  //id token key present and not empty ->
  // priv key ->

  test("Login as an existing user with recovery phrase as 2FA", async ({ page, browser }) => {
    test.slow();
    const accountsPage = new AccountsPage(page);
    await page.goto(openloginURL);
    await signInWithEmail(page, testEmail, browser);
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy();
    await page.waitForSelector('button:has-text("Verify with other factors")');
    await accountsPage.clickVerifyWithOtherFactors();
    await accountsPage.verifyWithFactor("Recovery password");
    await accountsPage.verifyRecoveryPhrase(getBackUpPhrase(process.env.PLATFORM)!);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
    await page.waitForSelector(`text=Welcome, ${testEmail}`);
    await accountsPage.clickLogout();
    expect(page.url()).toContain(`${openloginURL}/`);
  });

  test.afterEach(async ({}, testInfo) => {
    if (ci_mode == "AWS") {
      const client = new Client({
        node: `https://${username}:${password}@${eventPostURL}`,
      });
      console.log(testInfo.stderr);
      const { title, status, errors } = testInfo;
      let errorMessage = "";
      errors.forEach((element) => {
        errorMessage += `${element.message}\n`;
      });
      const timestamp = new Date().toISOString();

      const document = {
        title,
        status,
        errorMessage,
        region,
        timestamp,
        version,
        ci_mode,
        consoleLogs,
        platform,
      };

      try {
        await client.index({
          index: `${version}-${platform}`,
          body: document,
        });
        console.log(`Pushed test information to Elasticsearch: ${JSON.stringify(document)}`);
      } catch (er) {
        console.error(`Failed to push failed test information to Elasticsearch: ${er}`);
      }
    }
  });
});
