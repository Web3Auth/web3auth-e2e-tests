import { test, expect, Page } from "@playwright/test";
import {
  DEFAULT_PLATFORM,
  catchErrorAndExit,
  env_map,
  generateEmailWithTag,
  getBackUpPhrase,
  signInWithEmailWithTestEmailApp,
  signInWithEmailWithTestEmailOnDemoApp,
} from "../utils/index";
import {
  signInWithMobileNumber,
  useAutoCancel2FASetup,
  signInWithEmail,
} from "../utils";
import { useAutoCancelShareTransfer } from "../utils/index";
import { AccountsPage } from "../account-page/AccountsPage";
import { readFileSync } from "fs";
import path from "path";
import { Client } from "@opensearch-project/opensearch";
const demoAppUrl = env_map["demo"];
const eventPostURL =
  process.env.ES_ENDPOINT === undefined
    ? "search-sapphire-latency-stats-7n6qd4g6m3au5fpre3gwvwo6vm.eu-west-1.es.amazonaws.com"
    : process.env.ES_ENDPOINT;
const region =
  process.env.REGION === undefined ? "singapore" : process.env.REGION;
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
const backupPhrase = process.env.BACKUP_PHRASE_PROD;

test.describe.serial("Passwordless Login scenarios", () => {
  test("Login with mobile number using passwordless login", async ({
    page,
    browser,
  }) => {
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

  test("Login with email using passwordless login V4 @smoke", async ({
    browser,
    page,
  }) => {
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
    await signInWithEmailWithTestEmailApp(
      page,
      testEmail,
      browser,
      testEmail.split("@")[0].split(".")[1]
    );
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      waitUntil: "load",
    });
    await accountsPage.clickLogout();
    expect(page.url()).toContain(`${openloginURL}/`);
  });

  test("Login with email using passwordless login @demoApp", async ({
    browser,
    page,
  }) => {
    // Verify environment variables
    test.setTimeout(3 * 60000); // adding more time to compensate high loading time
    // Listen for all console events and handle errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`Error text: "${msg.text()}"`);
        consoleLogs.push(`${msg.text()}`);
      }
    });
    await page.goto(demoAppUrl);
    await signInWithEmailWithTestEmailOnDemoApp(
      page,
      testEmail,
      browser,
      testEmail.split("@")[0].split(".")[1],
      platform
    );
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy();
    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${demoAppUrl}`, {
      timeout: 3 * 60 * 1000,
    });

    expect(page.url()).toBe(`${demoAppUrl}`);
    const welcome = await page.waitForSelector(`text=Get openlogin state`);
  });

  test("Login as an existing user with recovery phrase as 2FA", async ({
    page,
    browser,
  }) => {
    test.slow();
    const accountsPage = new AccountsPage(page);
    await page.goto(openloginURL);
    await signInWithEmail(page, testEmail, browser);
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy();
    await page.waitForSelector('button:has-text("Verify with other factors")');
    await accountsPage.clickVerifyWithOtherFactors();
    await accountsPage.verifyWithFactor("Recovery password");
    await accountsPage.verifyRecoveryPhrase(
      getBackUpPhrase(process.env.PLATFORM)!
    );
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
        console.log(
          `Pushed test information to Elasticsearch: ${JSON.stringify(
            document
          )}`
        );
      } catch (er) {
        console.error(
          `Failed to push failed test information to Elasticsearch: ${er}`
        );
      }
    }
  });
});
