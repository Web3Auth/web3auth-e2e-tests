// playwright-dev-page.ts
import { Page } from "@playwright/test";
import * as speakeasy from "speakeasy";

import { delay } from "../utils";

export class AuthServicePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async clickSetup2FA() {
    await this.page.click(`[data-testid="start-mfa-setup"]`);
  }

  async saveTheDevice() {
    await this.page.click(`input[type="checkbox"]`);
    await this.page.click(`[data-testid="add-device-factor"]`);
  }

  async skipTheFactorSetup() {
    await this.page.click(`[data-testid="skip"]`);
  }

  async skipMFASetup() {
    await this.page.click(`[data-testid="skip"]`);
  }

  async skipPasskeySetup() {
    await this.page.click(`[data-testid="skipPasskey"]`);
  }

  async inputPasswordFactor(password: string) {
    await this.page.fill(`#openlogin-password`, password);
    await this.page.fill(`#openlogin-confirm-password`, password);
    await this.page.click(`[data-testid="confirmPassword"]`);
  }

  async inputPasswordFactorNewMFAFlow(password: string) {
    await this.page.click(`[data-testid="passwordFactor"]`);

    await this.page.fill(`input[data-testid="auth-password"]`, password);
    await this.page.fill(`input[data-testid="auth-confirm-password"]`, password);
    await this.page.click(`[data-testid="confirmPassword"]`);
  }

  async finishSetupNewMFAList() {
    await this.page.click(`[data-testid="finish-setup"]`);
  }

  async setupPasskeyLater(browserName?: string) {
    if (process.env.CI !== "true" || browserName === "Safari") await this.page.click(`[data-testid="setupLater"]`);
  }

  async confirmDone2FASetup() {
    await this.page.click(`[data-testid="done"]`);
  }

  async donotSaveDevice() {
    await this.page.click('text="Do not save"');
  }

  async verifyAuthenticatorFactor(secret: string) {
    await this.page.click(`[data-testid="authenticator"]`);
    await delay(30000);

    const token = speakeasy.totp({
      secret,
      encoding: "base32",
      step: 30,
    });

    await this.page.locator(`xpath=.//input[@data-test='single-input']`).first().type(token);

    await delay(2000);
    if (await this.page.locator('text="Invalid OTP, please try again"').isVisible()) {
      await this.page.locator(`xpath=.//input[@data-test='single-input']`).last().click();

      for (let index = 0; index < 6; index++) {
        await this.page.keyboard.press("Delete");
      }

      await delay(15000);
      const newToken = speakeasy.totp({
        secret,
        encoding: "base32",
        step: 30,
      });

      await this.page.locator(`xpath=.//input[@data-test='single-input']`).first().type(newToken);
    }
  }

  async setupAuthenticator() {
    await this.page.locator('text="Enter code manually"').click();

    const secret = await this.page.locator(`div>span`).textContent();
    await this.page.click(`button[aria-label="Next"]`);

    // Generate TOTP token
    const token = speakeasy.totp({
      secret,
      encoding: "base32",
    });
    await this.page.locator(`xpath=.//input[@data-test='single-input']`).first().type(token);
    return secret;
  }

  async setupAuthenticatorNewMFAFlow() {
    await this.page.locator('[data-testid="authenticatorFactor"]').click();
    await this.page.locator('text="Enter code manually"').click();

    const secret = await this.page.locator(`div>span`).textContent();
    await this.page.click(`button[aria-label="Next"]`);

    // Generate TOTP token
    const token = speakeasy.totp({
      secret,
      encoding: "base32",
    });
    await this.page.locator(`xpath=.//input[@data-test='single-input']`).first().type(token);
    return secret;
  }
}
