// playwright-dev-page.ts
import { expect, Locator, Page } from "@playwright/test";
import axios from "axios";
import Mailosaur from "mailosaur";
const testEmailAppApiKey = process.env.TESTMAIL_APP_APIKEY;
export class AccountsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async enableandStartSettingUp2FA() {
    await this.page.locator('button:has-text("Enable 2FA")').click();
    await this.page.getByLabel("Set up 2FA").click();
  }

  async verify2FARecommdation() {
    return await this.page.isVisible(
      "text=We strongly recommend you to enable 2FA on your account"
    );
  }
  async enableDeviceShare() {
    await this.page
      .locator(
        "text=I understand that clearing browser history and cookies will delete this factor on my browser."
      )
      .click();
    await this.page.click('button:has-text("Save this device")');
  }

  async enableBackUpEmail(backupEmail: string) {
    console.log("Backup Email:" + backupEmail);
    await this.page.fill('[placeholder="Email"]', backupEmail);
    await this.page.click('button:has-text("Send me my recovery factor")');
  }

  async seedEmail(backupEmail: string) {
    let seedArray: string[];
    let seedEmail;
    let seedString = "";
    if (process.env.MAIL_APP == "mailosaur") {
      const seedEmail = await mailosaur.messages.get(
        process.env.MAILOSAUR_SERVER_ID || "",
        {
          sentTo: backupEmail,
        },
        { timeout: 30 * 1000 }
      );
      seedArray =
        seedEmail.html?.body
          ?.toString()
          .replace(/(\r\n|\n|\r)/gm, "")
          .slice(11084)
          .split("<")[0]
          .split(" ") || [];
      for (let i = 0; i < 23; i++) {
        seedString += seedArray[i] + " ";
      }
      seedString += seedArray[23];
      await mailosaur.messages.del(seedEmail?.id || "");
    }
    if (process.env.MAIL_APP == "testmail") {
      // Setup our JSON API endpoint
      const ENDPOINT = `https://api.testmail.app/api/json?apikey=${testEmailAppApiKey}&namespace=kelg8`;
      const res = await axios.get(
        `${ENDPOINT}&tag=${
          backupEmail.split("@")[0].split(".")[1]
        }&livequery=true`
      );
      seedEmail = await res.data;
      seedArray =
        String(seedEmail.emails[0].html)
          .replace(/(\r\n|\n|\r)/gm, "")
          .slice(11084)
          .split("<")[0]
          .split(" ") || [];
      for (let i = 0; i < 23; i++) {
        seedString += seedArray[i] + " ";
      }
      seedString += seedArray[23];
    }
    return seedString;
  }

  async seedEmailWithTestMailApp(backupEmail: string) {
    let seedEmail;
    // Setup our JSON API endpoint
    const ENDPOINT = `https://api.testmail.app/api/json?apikey=${testEmailAppApiKey}&namespace=kelg8`;
    const res = await axios.get(
      `${ENDPOINT}&tag=${
        backupEmail.split("@")[0].split(".")[1]
      }&livequery=true`
    );
    seedEmail = await res.data;
    let seedArray =
      String(seedEmail.emails[0].html)
        .replace(/(\r\n|\n|\r)/gm, "")
        .slice(11084)
        .split("<")[0]
        .split(" ") || [];
    let seedString = "";
    for (let i = 0; i < 23; i++) {
      seedString += seedArray[i] + " ";
    }
    seedString += seedArray[23];
    return seedString;
  }

  async verifyRecoveryPhrase(seedString: string) {
    await this.page
      .locator('[placeholder="Paste your Recovery Factor"]')
      .clear();
    await this.page.fill(
      '[placeholder="Paste your Recovery Factor"]',
      seedString
    );
    await this.page.click('button:has-text("Verify")');
  }

  async verifyPassword(password: string) {
    await this.page.locator("#openlogin-password").clear();
    await this.page.fill("#openlogin-password", password);
    await this.page.click('button:has-text("Verify")');
  }

  async verifySocialFactor() {
    await this.page.waitForSelector('xpath=.//*[text()="Continue with sms"]');
    await this.page.click('xpath=.//*[text()="Continue with sms"]');
  }

  async setRecoveryPassword(password: string) {
    await this.page.fill("#openlogin-password", password);
    await this.page.fill("#openlogin-confirm-password", password);
    await this.page.click('button:has-text("Confirm")');
  }

  async addSocialRecoveryFactor(factor: string) {
    await this.page.locator("xpath=.//button[@aria-label='View more']").click();
    await this.page
      .locator(`xpath=.//img[@alt='${factor} Icon']/parent::button`)
      .click();
  }

  async skip2FASetUp() {
    await this.page.locator("xpath=.//button[text()='Skip for Now']").click();
  }

  async clickDone() {
    await this.page.locator("xpath=.//button[text()='Done']").click();
  }

  async clickSupport() {
    await this.page.locator("xpath=.//span[text()='Support']").last().click();
  }

  async clickLearnMore() {
    await this.page.click('span:has-text("Learn more ")');
  }

  async clickLogout() {
    await this.page.locator("xpath=.//span[text()='Logout']").last().click();
  }

  async clickTorusLogout(email: string) {
    await this.page.locator(`xpath=.//span[text()='${email}']`).first().click();
    await this.page.locator(`xpath=.//span[text()='Log Out']`).last().click();
  }

  async clickLastClose() {
    await this.page.locator("xpath=.//button[text()='Close']").last().click();
  }

  async clickFirstClose() {
    await this.page.locator("xpath=.//button[text()='Close']").first().click();
  }

  async verifyWithFactor(factorName: string) {
    await this.page
      .locator(
        `xpath=.//p[text()='${factorName}']/parent::div/following-sibling::button`
      )
      .first()
      .click();
  }

  async clickVerifyWithOtherFactors() {
    await this.page.click('button:has-text("Verify with other factors")');
  }

  async clickVerify() {
    await this.page.click('button:has-text("Verify")');
  }

  async clickConfirm() {
    await this.page.click('button:has-text("Confirm")');
  }

  async enterRecoveryEmail(testEmail: string) {
    await this.page.fill('[placeholder="Enter recovery email"]', testEmail);
  }

  async verifyErrorMessage(message: string) {
    expect(
      await this.page.isVisible(`xpath=.//*[text()='${message}']`)
    ).toBeTruthy();
  }

  async verifyFactorsSetUp(factorcount: string) {
    expect(
      await this.page.isVisible("text=Factor 1: Social Login")
    ).toBeTruthy();
    expect(await this.page.isVisible("text=Factor 2: Device (s)")).toBeTruthy();
    expect(
      await this.page.isVisible("text=Factor 3: Social Recovery")
    ).toBeTruthy();
    expect(await this.page.isVisible("text=Recovery email")).toBeTruthy();
    expect(
      await this.page.isVisible("text=Other Factors : Password")
    ).toBeTruthy();
    expect(await this.page.isVisible(`text=${factorcount}`)).toBeTruthy();
  }

  async resendRecoveryEmail() {
    await this.page.click('button:has-text("Resend")');
    await this.page.waitForTimeout(5000);
  }

  async verifyRecoveryEmailDetails(email: string) {
    expect(
      await this.page
        .locator(`xpath=.//input[@aria-placeholder='TextField Placeholder']`)
        .inputValue()
    ).toContain(email);
  }

  async verifySocialFactorDetails(details: string) {
    expect(await this.page.isVisible(`text=${details}`)).toBeTruthy();
  }

  async copyEmailRecoveryShare() {
    await this.page.click('button[aria-label="copy recovery phrase"]');
  }

  async verifyPasswordRequirements(password: string) {
    await this.page.locator("#openlogin-password").clear();
    await this.page.locator("#openlogin-password").fill(password);
    await this.page.locator("#openlogin-confirm-password").clear();
    await this.page.locator("#openlogin-confirm-password").fill(password);
    expect(
      await this.page.locator('button:has-text("Confirm")').isDisabled()
    ).toBeTruthy();
  }

  async addPasswordShare(password: string) {
    await this.page.locator("#openlogin-password").clear();
    await this.page.locator("#openlogin-password").fill(password);
    await this.page.locator("#openlogin-confirm-password").clear();
    await this.page.locator("#openlogin-confirm-password").fill(password);
    await this.page.click('button:has-text("Confirm")');
    await this.page.waitForSelector('button:has-text("Change Password")');
    await this.page.locator("text=Password successfully changed").isVisible();
  }

  async changeSocialFactor() {
    await this.page.locator('span:has-text("Change Social Factor")').click();
  }

  async clickChangePassword() {
    await this.page.locator('button:has-text("Change Password")').click();
  }

  async deleteRecoveryShare() {
    await this.page
      .locator('button[aria-label="delete device share"]')
      .first()
      .click();
    await this.page.waitForSelector("text=Recovery share deleted successfully");
    await this.page
      .locator("text=Recovery share deleted successfully")
      .isVisible();
  }

  async copyDeviceShare() {
    await this.page.locator("text=Copy Recovery Phrase").click();
  }

  async deleteDeviceShare() {
    await this.page.locator('button:has-text("Revoke")').click();
  }
}
