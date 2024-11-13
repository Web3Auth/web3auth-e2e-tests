// playwright-dev-page.ts
import { Page } from "@playwright/test";

import { getRecoveryPhase } from "../utils";

function validateDate(dateTime: string) {
  const regex = /^([0-2]\d|3[01])\/(0\d|1[0-2])\/\d{2} ([0-1]\d|2[0-3]):[0-5]\d$/;
  return regex.test(dateTime);
}

export class AuthDashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async verifyStrongSecurity() {
    const imageDisplay = await this.page.locator(`img[alt="Strong Security"]`).isVisible();
    const titleAlertDisplay = await this.page.locator(`text="Strong Security"`).isVisible();
    const descriptionAlertDisplay = await this.page
      .locator(`text="Your account is secured with at least three recovery factors. You can still add more for added protection."`)
      .isVisible();

    return imageDisplay && titleAlertDisplay && descriptionAlertDisplay;
  }

  async verifyAuthenticatorSetup(email: string) {
    return this.page.locator(`//div[*/div[text()='Authenticator App']]//div[text()='Web3Auth-${email}']`).isVisible();
  }

  async verifyEmailPasswordlessSetup(email: string) {
    return this.page.locator(`//div[text()='email account']/following-sibling::div[text()='${email}']`).first().isVisible();
  }

  async verifyDeviceSetup(browserType: string) {
    const browserRecord = await this.page.locator(`//div[*/div[text()='Device(s)']]//div[contains(text(),'${browserType}')]`).isVisible();
    const currentTag = await this.page.locator(`//div[*/div[text()='Device(s)']]//div[contains(text(),'Current')]`).isVisible();

    const timeFortmat = validateDate(
      (await this.page.locator(`//div[*/div[text()='Device(s)']]//span[contains(text(),'Created: ')]`).textContent()).replace("Created: ", "")
    );
    return browserRecord && currentTag && timeFortmat;
  }

  async addPasswordFactor() {
    await this.page.click(`text=" Setup Password"`);
    await this.page.fill(`input[aria-placeholder="Set your password"]`, "Testing@123");
    await this.page.fill(`input[aria-placeholder="Re-enter your password"]`, "Testing@123");
    await this.page.click(`button[aria-label="Confirm"][type="submit"]`);
  }

  async addRecoverPhrase(emailRecovery: string, tag: string) {
    await this.page.click(`text=" Generate recovery phrase"`);
    await this.page.fill(`input[aria-placeholder="name@example.com"]`, emailRecovery);
    await this.page.click(`button[data-testid="send-recovery-factor"]`);

    const recoveryPhrase = await getRecoveryPhase({
      email: emailRecovery,
      tag,
      timestamp: Math.floor(Date.now() / 1000),
    });

    await this.page.fill(`textarea[placeholder="Paste your recovery phrase"]`, recoveryPhrase);
    await this.page.click(`button[data-testid="verify"]`);

    await this.page.locator(`text="Recovery phrase sent to Email"`).waitFor({ state: "visible" });

    return recoveryPhrase;
  }

  async verifyPasswordSetup() {
    return !this.page.locator(`text=" Setup Password"`).isVisible() && this.page.locator(`text="Change Password"`).isVisible();
  }

  async verifyPasswordNotSetupYet() {
    return this.page.locator(`text=" Setup Password"`).isVisible();
  }

  async changePasswordSetup() {
    await this.page.click(`text="Change Password"`);
    await this.page.fill(`input[aria-placeholder="Set your password"]`, "Testing@123");
    await this.page.fill(`input[aria-placeholder="Re-enter your password"]`, "Testing@123");
    await this.page.click(`button[aria-label="Confirm"][type="submit"]`);
  }

  async deletePasswordSetup() {
    await this.page.click(`button[aria-label="Delete Password"]`);

    await this.page.locator(`text="Remove Password"`).waitFor({ state: "visible" });

    const lisEle = await this.page.$$(`button[aria-label="Confirm"]`);
    for (const element of lisEle) {
      if (await element.isVisible()) {
        await element.click();
        break;
      }
    }

    await this.page.locator(`text=" Setup Password"`).waitFor({ state: "visible" });
  }

  async deleteRecoveryPhrase() {
    await this.page.click(`button[aria-label="Delete Recovery Share"]`);

    await this.page.locator(`text="Delete Recovery Phrase"`).waitFor({ state: "visible" });

    const lisEle = await this.page.$$(`button[aria-label="Confirm"]`);
    for (const element of lisEle) {
      if (await element.isVisible()) {
        await element.click();
        break;
      }
    }

    await this.page.locator(`text=" Generate recovery phrase"`).waitFor({ state: "visible" });
  }

  async verifyRecoverPhraseSetup(phrase: string, bkEmail: string) {
    const content = await this.page.locator(`//div[text()='Recovery phrase']/parent::div/parent::div`).first().textContent();

    const containPhrase = content.includes(phrase);
    const containBkEmail = content.includes(bkEmail);
    const dateTimeFormat = validateDate(content.split("Generated on: ")[1]);

    return containBkEmail && containPhrase && dateTimeFormat;
  }
}
