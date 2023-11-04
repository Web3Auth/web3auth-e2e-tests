import { test, expect, Page } from "@playwright/test";
import { AccountsPage } from "../account-page/AccountsPage";
import Mailosaur from "mailosaur";
import { DEFAULT_PLATFORM, env_map } from "../utils/index";
import { generate } from "generate-password";
import { signInWithGitHub, signInWithMobileNumber, delay } from "../utils";
import { validateMnemonic } from "bip39";
import { readFileSync } from "fs";
import path from "path";
import {
  useAutoCancel2FASetup,
  signInWithEmail,
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

const openloginURL = env_map[process.env.PLATFORM || "prod"];
const user = {
  mobileNumberForLogin: "+358-4573986537",
  mobileNumberForSMS: "3584573986537",
};

const testEmail = "demo" + `@${process.env.MAILOSAUR_SERVER_DOMAIN}`;
const backupPhrase = process.env.BACKUP_PHRASE_PROD;

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
  await accountsPage.verifyWithFactor("Recovery factor");
  await accountsPage.verifyRecoveryPhrase(backupPhrase);
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    waitUntil: "load",
  });
  await page.waitForSelector(`text=Welcome, ${testEmail}`);
  await accountsPage.clickLogout();
  expect(page.url()).toContain(`${openloginURL}/`);
});

test("Login as an existing user with social factor as 2FA", async ({
  page,
  browser,
}) => {
  test.skip();
  test.slow();
  const accountsPage = new AccountsPage(page);
  await page.goto(openloginURL);
  await signInWithEmail(page, testEmail, browser);
  const shouldExit = await catchErrorAndExit(page);
  expect(shouldExit).toBeFalsy();
  await page.waitForSelector('button:has-text("Verify with other factors")');
  await accountsPage.clickVerifyWithOtherFactors();
  await accountsPage.verifyWithFactor("Social Factor");
  await accountsPage.verifySocialFactor();
  await signInWithMobileNumber({ page, user, browser });
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    waitUntil: "load",
  });
  await page.waitForSelector(`text=Welcome, ${testEmail}`);
  await accountsPage.clickLogout();
  expect(page.url()).toContain(`${openloginURL}/`);
});

test("Login as an existing user with password as 2FA", async ({
  page,
  browser,
}) => {
  test.skip();
  test.slow();
  const accountsPage = new AccountsPage(page);
  await page.goto(openloginURL);
  await signInWithEmail(page, testEmail, browser);
  const shouldExit = await catchErrorAndExit(page);
  expect(shouldExit).toBeFalsy();
  await page.waitForSelector('button:has-text("Verify with other factors")');
  await accountsPage.clickVerifyWithOtherFactors();
  await accountsPage.verifyWithFactor("Social Factor");
  await accountsPage.verifyPassword("Torus@1234");
  await signInWithMobileNumber({ page, user, browser });
  await page.waitForURL(`${openloginURL}/wallet/home`, {
    waitUntil: "load",
  });
  await page.waitForSelector(`text=Welcome, ${testEmail}`);
  await accountsPage.clickLogout();
  expect(page.url()).toContain(`${openloginURL}/`);
});
