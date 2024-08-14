import { expect, test } from "@playwright/test";

import { authServiceURL, generateEmailWithTag, verifyEmailPasswordlessWithVerificationCode } from "../utils";
import { DashboardPage } from "./DashboardPage";
import { LoginPage } from "./LoginPage";

test.describe.serial("Passwordless Login scenarios", () => {
  test.setTimeout(90000);

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

    await verifyEmailPasswordlessWithVerificationCode(page, browser, {
      email: testEmail,
      tag,
      timestamp: Math.floor(Date.now() / 1000),
      redirectMode: true,
      previousCode: "",
    });

    // Check the privatekey, tKey is not empty
    const dashboardPage = new DashboardPage(page);
    const userInfoObject = await dashboardPage.getUserInfoObject();
    const idToken = userInfoObject.idToken as string;
    expect(idToken).not.toBe("");

    // The idtoken should not be empty
    const openloginStateObject = await dashboardPage.getOpenloginStateObject();
    const privateKey = openloginStateObject.privKey as string;
    const tKey = openloginStateObject.tKey as string;
    const keyMode = openloginStateObject.keyMode as string;
    expect(privateKey).not.toBe("");
    expect(tKey).not.toBe("");
    expect(keyMode).toBe("1/1");
  });
});
