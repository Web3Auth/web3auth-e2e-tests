import { expect, test } from "@playwright/test";

import { authServiceURL, generateEmailWithTag, verifyEmailPasswordlessWithVerificationCode } from "../utils";
import { DashboardPage } from "./DashboardPage";
import { LoginPage } from "./LoginPage";

const passwordTestingFactor = "Testing@123";

test.describe.serial("Passwordless Login scenarios", () => {
  test.setTimeout(150000);

  test("Login email passwordless case 1, none MFA then setup 2FA @nomfa", async ({ page, browser }) => {
    const testEmail = generateEmailWithTag();
    const loginPage = new LoginPage(page);

    // LOGIN TO THE DASHBOARD

    await loginPage.gotoLoginPage(authServiceURL);
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
      tag,
      timestamp: Math.floor(Date.now() / 1000),
      redirectMode: true,
      previousCode: "",
    });

    // ENABLE MFA

    const dashboardPage = new DashboardPage(page);
    const privateKey = await dashboardPage.getOpenLoginPrivateKey();

    await dashboardPage.clickEnableMFA();
    await page.locator(`text="Continue with ${testEmail}"`).click();
    code = await verifyEmailPasswordlessWithVerificationCode(page, browser, {
      email: testEmail,
      tag,
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
      tag,
      timestamp: Math.floor(Date.now() / 1000),
      redirectMode: true,
      previousCode: code,
    });

    const privateKeyAfterReLogin = await dashboardPage.getOpenLoginPrivateKey();
    expect(privateKeyAfterReLogin).toBe(privateKey);
  });
});
