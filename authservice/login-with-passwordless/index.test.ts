import { Browser, expect, Page, test } from "@playwright/test";

import { delay, generateEmailWithTag, verifyEmailPasswordlessWithVerificationCode } from "../utils";
import { LoginPage } from "./LoginPage";
import { DashboardPage } from "./DashboardPage";

const openloginURL = "https://demo-openlogin.web3auth.io/";

const passwordTestingFactor = "Testing@123";

test.describe.serial("Passwordless Login scenarios", () => {
  test.setTimeout(150000);

  test("Login email passwordless case 2, 1st none MFA then mandatory MFA then setup 2FA @passwordless", async ({ page, browser }) => {
    const testEmail = generateEmailWithTag();
    const loginPage = new LoginPage(page);

    // LOGIN TO THE DASHBOARD

    await loginPage.gotoLoginPage(openloginURL);
    await loginPage.selectBuildEnv("testing");
    await loginPage.selectAllMFAFactor();
    await loginPage.selectMFALevel("none");
    await loginPage.selectMFAMandantory(["DEVICE", "PASSWORD", "AUTHENTICATOR"]);
    await loginPage.selectOpenloginNetwork("sapphire_devnet");
    await loginPage.selectUXMode("popup");
    await loginPage.selectLoginProvider("email passwordless");
    await loginPage.inputEmailPasswordless(testEmail);

    // To avoid the 429 Too many requests error
    await delay(5000);
    await loginPage.clickLoginButton();

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const tag = testEmail.split("@")[0].split(".")[1];

    let code = await verifyEmailPasswordlessWithVerificationCode(page, browser, {
      email: testEmail,
      tag: tag,
      timestamp: currentTimestamp,
      redirectMode: false,
      previousCode: "",
    });

    // GET PRIV KEY

    let dashboardPage = new DashboardPage(page);
    const privateKey = await dashboardPage.getOpenLoginPrivateKey();

    // LOGOUT & CHANGE TO MANDATORY
    await dashboardPage.logout();
    await loginPage.selectMFALevel("mandatory");
    // To avoid the 429 Too many requests error
    await delay(5000);

    await loginPage.clickLoginButton();
    await verifyEmailPasswordlessWithVerificationCode(page, browser, {
      email: testEmail,
      tag: tag,
      timestamp: currentTimestamp,
      redirectMode: false,
      previousCode: code,
    });

    await delay(2000);
    const pages = browser.contexts()[0].pages();

    let dashboardPage2 = new DashboardPage(pages[1]);
    await pages[1].bringToFront();

    await dashboardPage2.clickSetup2FA();

    // SETUP DEVICE FACTOR

    await dashboardPage2.saveTheDevice();

    // SKIP SOCIAL FACTOR

    await dashboardPage2.skipTheFactorSetup();

    // SETUP AUTHENTICATOR FACTOR

    await dashboardPage2.setupAuthenticator();

    // SKIP RECOVERY FACTOR

    await dashboardPage2.skipTheFactorSetup();

    // SETUP PASSWORD

    await dashboardPage2.inputPasswordFactor(passwordTestingFactor);

    // SKIP PASSKEY

    await dashboardPage2.skipTheFactorSetup();
    await dashboardPage2.confirmDone2FASetup();

    // pages[1].close();

    const privateKeyAfterSetupMFA = await dashboardPage2.getOpenLoginPrivateKey();
    expect(privateKeyAfterSetupMFA).toBe(privateKey);
  });

  test("Login email passwordless case 1, none MFA then setup 2FA @passwordless", async ({ page, browser }) => {
    // To avoid the 429 Too many requests error
    await delay(60000);
    const testEmail = generateEmailWithTag();
    const loginPage = new LoginPage(page);

    // LOGIN TO THE DASHBOARD

    await loginPage.gotoLoginPage(openloginURL);
    await loginPage.selectBuildEnv("production");
    await loginPage.selectAllMFAFactor();
    await loginPage.selectMFALevel("none");
    await loginPage.selectMFAMandantory(["DEVICE", "PASSWORD", "AUTHENTICATOR"]);
    await loginPage.selectOpenloginNetwork("sapphire_mainnet");
    await loginPage.selectUXMode("redirect");
    await loginPage.selectLoginProvider("email passwordless");
    await loginPage.inputEmailPasswordless(testEmail);
    await loginPage.clickLoginButton();

    const tag = testEmail.split("@")[0].split(".")[1];

    let code = await verifyEmailPasswordlessWithVerificationCode(page, browser, {
      email: testEmail,
      tag: tag,
      timestamp: Math.floor(Date.now() / 1000),
      redirectMode: true,
      previousCode: "",
    });

    // ENABLE MFA

    let dashboardPage = new DashboardPage(page);
    const privateKey = await dashboardPage.getOpenLoginPrivateKey();

    await dashboardPage.clickEnableMFA(testEmail);
    await page.locator(`text="Continue with ${testEmail}"`).click();
    code = await verifyEmailPasswordlessWithVerificationCode(page, browser, {
      email: testEmail,
      tag: tag,
      timestamp: Math.floor(Date.now() / 1000),
      redirectMode: true,
      previousCode: code,
    });

    await dashboardPage.clickSetup2FA();

    // SETUP DEVICE FACTOR

    await dashboardPage.saveTheDevice();

    // SKIP SOCIAL FACTOR

    await dashboardPage.skipTheFactorSetup();

    // SETUP AUTHENTICATOR FACTOR

    await dashboardPage.setupAuthenticator();

    // SKIP RECOVERY FACTOR

    await dashboardPage.skipTheFactorSetup();

    // SETUP PASSWORD

    await dashboardPage.inputPasswordFactor(passwordTestingFactor);

    // SKIP PASSKEY

    await dashboardPage.skipTheFactorSetup();
    await dashboardPage.confirmDone2FASetup();

    const privateKeyAfterSetupMFA = await dashboardPage.getOpenLoginPrivateKey();
    expect(privateKeyAfterSetupMFA).toBe(privateKey);

    // LOGOUT
    await dashboardPage.logout();
    await loginPage.clickLoginButton();
    await verifyEmailPasswordlessWithVerificationCode(page, browser, {
      email: testEmail,
      tag: tag,
      timestamp: Math.floor(Date.now() / 1000),
      redirectMode: true,
      previousCode: code,
    });

    const privateKeyAfterReLogin = await dashboardPage.getOpenLoginPrivateKey();
    expect(privateKeyAfterReLogin).toBe(privateKey);
  });

  test("Login email passwordless case 3, mandatory MFA then setup 2FA @passwordless", async ({ page, browser }) => {
    // To avoid the 429 Too many requests error
    await delay(60000);
    const testEmail = generateEmailWithTag();
    const loginPage = new LoginPage(page);

    // LOGIN TO THE DASHBOARD

    await loginPage.gotoLoginPage(openloginURL);
    await loginPage.selectBuildEnv("staging");
    await loginPage.selectAllMFAFactor();
    await loginPage.selectMFALevel("mandatory");
    await loginPage.selectMFAMandantory(["DEVICE", "PASSWORD", "AUTHENTICATOR"]);
    await loginPage.selectOpenloginNetwork("mainnet");
    await loginPage.selectUXMode("redirect");
    await loginPage.selectLoginProvider("email passwordless");
    await loginPage.inputEmailPasswordless(testEmail);

    // To avoid the 429 Too many requests error
    await delay(5000);
    await loginPage.clickLoginButton();

    const tag = testEmail.split("@")[0].split(".")[1];

    let code = await verifyEmailPasswordlessWithVerificationCode(page, browser, {
      email: testEmail,
      tag: tag,
      timestamp: Math.floor(Date.now() / 1000),
      redirectMode: true,
      previousCode: "",
    });

    // ENABLE MFA

    let dashboardPage = new DashboardPage(page);

    await dashboardPage.clickSetup2FA();

    // SETUP DEVICE FACTOR

    await dashboardPage.saveTheDevice();

    // SKIP SOCIAL FACTOR

    await dashboardPage.skipTheFactorSetup();

    // SETUP AUTHENTICATOR FACTOR

    await dashboardPage.setupAuthenticator();

    // SKIP RECOVERY FACTOR

    await dashboardPage.skipTheFactorSetup();

    // SETUP PASSWORD

    await dashboardPage.inputPasswordFactor(passwordTestingFactor);

    // SKIP PASSKEY

    await dashboardPage.skipTheFactorSetup();
    await dashboardPage.confirmDone2FASetup();

    const privateKey = await dashboardPage.getOpenLoginPrivateKey();

    // LOGOUT
    await dashboardPage.logout();
    await loginPage.clickLoginButton();
    // To avoid the 429 Too many requests error
    await delay(5000);

    await verifyEmailPasswordlessWithVerificationCode(page, browser, {
      email: testEmail,
      tag: tag,
      timestamp: Math.floor(Date.now() / 1000),
      redirectMode: true,
      previousCode: code,
    });

    const privateKeyAfterReLogin = await dashboardPage.getOpenLoginPrivateKey();
    expect(privateKeyAfterReLogin).toBe(privateKey);
  });
});
