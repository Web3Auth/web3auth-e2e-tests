import { expect, test } from "@playwright/test";

import { AuthServicePage } from "../login-with-passwordless/AuthServicePage";
import { delay, generateEmailWithTag, verifyEmailPasswordlessWithVerificationCode } from "../utils";
import { AuthDashboardPage } from "./AuthDashboardPage";
import { LoginAuthDashboardPage } from "./LoginAuthDashboardPage";

test.describe("Passwordless Login scenarios", () => {
  test.setTimeout(150000);

  test("Login and set up Auth Dashboard, @authdashboard", async ({ page, browser }, testInfo) => {
    const testEmail = generateEmailWithTag();
    const testBackupEmail = generateEmailWithTag();
    const loginPage = new LoginAuthDashboardPage(page);

    // LOGIN TO THE DASHBOARD

    await loginPage.gotoLoginAuthDashboardPage();
    await loginPage.inputEmailPasswordless(testEmail);
    await loginPage.clickLoginButton();

    const tag = testEmail.split("@")[0].split(".")[1];
    const tagBk = testBackupEmail.split("@")[0].split(".")[1];

    await verifyEmailPasswordlessWithVerificationCode(page, browser, {
      email: testEmail,
      tag,
      timestamp: Math.floor(Date.now() / 1000),
      redirectMode: false,
      previousCode: "",
    });

    await delay(2000);
    const pages = browser.contexts()[0].pages();

    const authServicePage = new AuthServicePage(pages[1]);
    await pages[1].bringToFront();

    await authServicePage.clickSetup2FA();
    await authServicePage.setupAuthenticatorNewMFAFlow();
    await authServicePage.finishSetupNewMFAList();
    await authServicePage.setupPasskeyLater();
    await authServicePage.confirmDone2FASetup();

    const authDashboardPage = new AuthDashboardPage(page);
    await delay(5000);
    expect(await authDashboardPage.verifyEmailPasswordlessSetup(testEmail)).toBeTruthy();
    expect(await authDashboardPage.verifyAuthenticatorSetup(testEmail)).toBeTruthy();
    expect(await authDashboardPage.verifyAuthenticatorCannotBeDeleted()).toBeFalsy();
    expect(await authDashboardPage.verifyDeviceSetup(testInfo.project.name)).toBeTruthy();

    await authDashboardPage.addPasswordFactor();
    await authDashboardPage.verifyPasswordSetup();

    await authDashboardPage.changePasswordSetup();
    await authDashboardPage.verifyPasswordSetup();

    await authDashboardPage.deletePasswordSetup();
    expect(await authDashboardPage.verifyPasswordNotSetupYet()).toBeTruthy();

    const phrase = await authDashboardPage.addRecoverPhrase(testBackupEmail, tagBk);
    await authDashboardPage.verifyRecoverPhraseSetup(phrase, testBackupEmail);
    await authDashboardPage.deleteRecoveryPhrase();

    await authDashboardPage.addSMSSocialFactor(browser);
    await authDashboardPage.verifySMSSocialFactorSetup();
    await authDashboardPage.deleteSocialFactor();

    await authDashboardPage.verifyMultipleLanguages();

    await authDashboardPage.changeDarkLightMode();
    await authDashboardPage.verifyDarkMode();
    await authDashboardPage.changeDarkLightMode();
    await authDashboardPage.verifyLightMode();

    await authDashboardPage.changeLanguage("English");
    await loginPage.logout();
    await loginPage.verifyLogout();
  });
});
