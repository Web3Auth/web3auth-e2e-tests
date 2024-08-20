import { expect, test } from "@playwright/test";

import { authServiceURL, generateEmailWithTag, verifyEmailPasswordlessWithVerificationCode } from "../utils";
import { AuthServicePage } from "./AuthServicePage";
import { DashboardPage } from "./DashboardPage";
import { LoginPage } from "./LoginPage";

const passwordTestingFactor = "Testing@123";

test.describe.serial("Passwordless Login scenarios", () => {
  test.setTimeout(120000);

  test("Login email passwordless case 3, mandatory MFA then setup 2FA @mandatorymfa", async ({ page, browser }) => {
    const testEmail = generateEmailWithTag();
    const loginPage = new LoginPage(page);

    // LOGIN TO THE DASHBOARD

    await loginPage.gotoLoginPage(authServiceURL);
    await loginPage.selectBuildEnv("staging");
    await loginPage.selectAllMFAFactor();
    await loginPage.selectMFALevel("mandatory");
    await loginPage.selectMFAMandantory(["PASSWORD", "AUTHENTICATOR"]);
    await loginPage.selectOpenloginNetwork("mainnet");
    await loginPage.selectUXMode("redirect");
    await loginPage.selectLoginProvider("email passwordless");
    await loginPage.inputEmailPasswordless(testEmail);

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

    const authServicePage = new AuthServicePage(page);
    const dashboardPage = new DashboardPage(page);

    await authServicePage.clickSetup2FA();

    // SKIP DEVICE FACTOR

    await authServicePage.skipTheFactorSetup();

    // SKIP SOCIAL FACTOR

    await authServicePage.skipTheFactorSetup();

    // SETUP AUTHENTICATOR FACTOR

    const secret = await authServicePage.setupAuthenticator();

    // SKIP RECOVERY FACTOR

    await authServicePage.skipTheFactorSetup();

    // SETUP PASSWORD

    await authServicePage.inputPasswordFactor(passwordTestingFactor);

    // SKIP PASSKEY

    await authServicePage.skipPasskeySetup();
    await authServicePage.confirmDone2FASetup();

    const privateKey = await dashboardPage.getOpenLoginPrivateKey();
    // Check the privatekey, tKey is not empty
    const userInfoObject = await dashboardPage.getUserInfoObject();
    const idToken = userInfoObject.idToken as string;
    expect(idToken).not.toBe("");

    // The idtoken should not be empty
    const openloginStateObject = await dashboardPage.getOpenloginStateObject();
    const tKey = openloginStateObject.tKey as string;
    const keyMode = openloginStateObject.keyMode as string;
    const ed25519PrivKey = openloginStateObject.ed25519PrivKey as string;
    expect(privateKey).not.toBe("");
    expect(tKey).not.toBe("");
    expect(keyMode).toBe("2/n");

    // LOGOUT
    await loginPage.logout();
    await loginPage.clickLoginButton();

    await verifyEmailPasswordlessWithVerificationCode(page, browser, {
      email: testEmail,
      tag,
      timestamp: Math.floor(Date.now() / 1000),
      redirectMode: true,
      previousCode: code,
    });

    // Handle for factor authenticator
    await authServicePage.verifyAuthenticatorFactor(secret);

    // Select Do not save the device
    await authServicePage.donotSaveDevice();

    const privateKeyAfterReLogin = await dashboardPage.getOpenLoginPrivateKey();
    expect(privateKeyAfterReLogin).toBe(privateKey);

    const openloginStateObjectAfterLogin = await dashboardPage.getOpenloginStateObject();
    const tKeyAfterLogin = openloginStateObjectAfterLogin.tKey as string;
    const keyModeAfterLogin = openloginStateObjectAfterLogin.keyMode as string;
    const ed25519PrivKeyAfterLogin = openloginStateObjectAfterLogin.ed25519PrivKey as string;
    expect(ed25519PrivKeyAfterLogin).toBe(ed25519PrivKey);
    expect(tKeyAfterLogin).toBe(tKey);
    expect(keyModeAfterLogin).toBe("2/n");
  });
});
