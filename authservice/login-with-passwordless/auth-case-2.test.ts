import { expect, test } from "@playwright/test";

import { authServiceURL, delay, generateEmailWithTag, verifyEmailPasswordlessWithVerificationCode } from "../utils";
import { AuthServicePage } from "./AuthServicePage";
import { DashboardPage } from "./DashboardPage";
import { LoginPage } from "./LoginPage";

const passwordTestingFactor = "Testing@123";

test.describe.serial("Passwordless Login scenarios", () => {
  test.setTimeout(90000);

  test("Login email passwordless case 2, 1st none MFA then mandatory MFA then setup 2FA @nonemandatorymfa", async ({ page, browser }) => {
    const testEmail = generateEmailWithTag();
    const loginPage = new LoginPage(page);

    // LOGIN TO THE DASHBOARD

    await loginPage.gotoLoginPage(authServiceURL);
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

    const code = await verifyEmailPasswordlessWithVerificationCode(page, browser, {
      email: testEmail,
      tag,
      timestamp: currentTimestamp,
      redirectMode: false,
      previousCode: "",
    });

    // GET INFO KEY BEFORE 2FA SETUP

    const dashboardPage = new DashboardPage(page);
    const privateKey = await dashboardPage.getOpenLoginPrivateKey();
    const openloginStateObject = await dashboardPage.getOpenloginStateObject();
    const tKey = openloginStateObject.tKey as string;
    const keyMode = openloginStateObject.keyMode as string;
    const ed25519PrivKey = openloginStateObject.ed25519PrivKey as string;
    expect(keyMode).toBe("1/1");

    // LOGOUT & CHANGE TO MANDATORY
    await loginPage.logout();
    await loginPage.selectMFALevel("mandatory");
    // To avoid the 429 Too many requests error
    await delay(5000);

    await loginPage.clickLoginButton();
    await verifyEmailPasswordlessWithVerificationCode(page, browser, {
      email: testEmail,
      tag,
      timestamp: currentTimestamp,
      redirectMode: false,
      previousCode: code,
    });

    await delay(2000);
    const pages = browser.contexts()[0].pages();

    const authServicePage = new AuthServicePage(pages[1]);
    await pages[1].bringToFront();

    await authServicePage.clickSetup2FA();

    // SETUP AUTHENTICATOR FACTOR

    await authServicePage.setupAuthenticatorNewMFAFlow();

    // SETUP PASSWORD

    await authServicePage.inputPasswordFactorNewMFAFlow(passwordTestingFactor);

    // SKIP PASSKEY

    await authServicePage.finishSetupNewMFAList();
    await authServicePage.confirmDone2FASetup();

    // GET INFO KEY AFTER 2FA SETUP AND VERIFY

    const dashboardPage2 = new DashboardPage(pages[1]);
    const privateKeyAfterSetupMFA = await dashboardPage2.getOpenLoginPrivateKey();
    expect(privateKeyAfterSetupMFA).toBe(privateKey);

    const openloginStateObjectAfterSetupMFA = await dashboardPage2.getOpenloginStateObject();
    const tKeyAfterSetupMFA = openloginStateObjectAfterSetupMFA.tKey as string;
    const keyModeAfterSetupMFA = openloginStateObjectAfterSetupMFA.keyMode as string;
    const ed25519PrivKeyAfterSetupMFA = openloginStateObjectAfterSetupMFA.ed25519PrivKey as string;
    expect(ed25519PrivKeyAfterSetupMFA).toBe(ed25519PrivKey);
    expect(tKeyAfterSetupMFA).toBe(tKey);
    expect(keyModeAfterSetupMFA).toBe("2/n");
  });
});
