import { expect, test } from "@playwright/test";

import { authServiceURL, delay, generateEmailWithTag, verifyEmailPasswordlessWithVerificationCode } from "../utils";
import { DashboardPage } from "./DashboardPage";
import { LoginPage } from "./LoginPage";

const passwordTestingFactor = "Testing@123";

test.describe.serial("Passwordless Login scenarios", () => {
  test.setTimeout(150000);

  test("Login email passwordless case 3, mandatory MFA then setup 2FA @mandatorymfa", async ({ page, browser }) => {
    const testEmail = generateEmailWithTag();
    const loginPage = new LoginPage(page);

    // LOGIN TO THE DASHBOARD

    await loginPage.gotoLoginPage(authServiceURL);
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

    const code = await verifyEmailPasswordlessWithVerificationCode(page, browser, {
      email: testEmail,
      tag,
      timestamp: Math.floor(Date.now() / 1000),
      redirectMode: true,
      previousCode: "",
    });

    // ENABLE MFA

    const dashboardPage = new DashboardPage(page);

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
      tag,
      timestamp: Math.floor(Date.now() / 1000),
      redirectMode: true,
      previousCode: code,
    });

    const privateKeyAfterReLogin = await dashboardPage.getOpenLoginPrivateKey();
    expect(privateKeyAfterReLogin).toBe(privateKey);
  });
});
