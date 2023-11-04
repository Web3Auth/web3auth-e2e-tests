import { chromium, expect, firefox, Page } from "@playwright/test";
import { test } from "./index.lib";
import { Client } from "@opensearch-project/opensearch";
import {
  useAutoCancel2FASetup,
  signInWithEmail,
  generateRandomEmail,
  slowOperation,
  catchError,
  catchErrorAndExit,
  generateEmailWithTag,
  signInWithEmailWithTestEmailApp,
  signInWithEmailWithTestEmailOnDemoApp,
  env_map,
} from "../utils";
import { readFileSync } from "fs";
import path from "path";
import { useAutoCancelShareTransfer, getBackUpPhrase } from "../utils/index";
import Mailosaur from "mailosaur";

process.env.APP_VERSION = "v3";
const eventPostURL =
  process.env.ES_ENDPOINT === undefined
    ? "search-sapphire-latency-stats-7n6qd4g6m3au5fpre3gwvwo6vm.eu-west-1.es.amazonaws.com"
    : process.env.ES_ENDPOINT;
const region =
  process.env.REGION === undefined ? "singapore" : process.env.REGION;
const username = "devops";
const password = process.env.PASSWORD;
const version = process.env.APP_VERSION;
const ci_mode = process.env.CI_MODE;
const demoAppUrl = env_map["demo"];

const testEmail = generateEmailWithTag();
const backupPhrase = process.env.BACKUP_PHRASE_PROD;
const consoleLogs: string[] = [];
const platform = process.env.PLATFORM || "";
const existingTestEmail = `demo@${process.env.MAILOSAUR_SERVER_DOMAIN}`;

test.describe.serial("Passwordless Login scenarios", () => {
  test("Login with email using passwordless login @smoke", async ({
    browser,
    openloginURL,
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
    await page.goto(openloginURL);
    await signInWithEmailWithTestEmailApp(
      page,
      testEmail,
      browser,
      testEmail.split("@")[0].split(".")[1]
    );
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy();
    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000,
    });

    expect(page.url()).toBe(`${openloginURL}/wallet/home`);
    const welcome = await page.waitForSelector(`text=Welcome`);
  });

  test("Login with email using passwordless login @demoApp", async ({
    browser,
    openloginURL,
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
    browser,
    openloginURL,
    page,
  }) => {
    // Verify environment variables
    test.setTimeout(3 * 60000); // adding more time to compensate high loading time
    expect(
      !!process.env.MAILOSAUR_SERVER_ID &&
        !!process.env.MAILOSAUR_API_KEY &&
        !!process.env.MAILOSAUR_SERVER_DOMAIN
    ).toBe(true);
    // Listen for all console events and handle errors
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`Error text: "${msg.text()}"`);
    });
    await page.goto(openloginURL);
    await signInWithEmail(page, existingTestEmail, browser);
    try {
      await page.waitForSelector('[placeholder="Enter backup phrase"]', {
        timeout: 1 * 60 * 1000,
      });
      await page.fill(
        '[placeholder="Enter backup phrase"]',
        getBackUpPhrase(process.env.PLATFORM)!
      );
      await page.click('button:has-text("Confirm")');
    } catch (err) {}
    await useAutoCancelShareTransfer(page);
    await useAutoCancel2FASetup(page);
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000,
    });

    expect(page.url()).toBe(`${openloginURL}/wallet/home`);
    const welcome = await page.waitForSelector(`text=Welcome`);
  });
  // eslint-disable-next-line no-empty-pattern
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
