// playwright-dev-page.ts
import { Page } from "@playwright/test";
import * as speakeasy from "speakeasy";

import { delay } from "../utils";

export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async clickEnableMFA() {
    await this.page.click(`button[data-testid="btnEnableMFA"]`);
  }

  async clickSetup2FA() {
    await this.page.click(`button[aria-label="Set up 2FA"]`);
  }

  async logout() {
    await this.page.click(`button.dashboard-action-logout`);
  }

  async getOpenLoginPrivateKey() {
    return (await this.page.locator("text=Openlogin Private key").textContent()).split(" : ")[1];
  }

  async getUserInfoObject() {
    await this.page.locator('text=" Get user info "').click();
    const content = await this.page.locator(".card-container pre").textContent();
    return JSON.parse(content);
  }

  async getOpenloginStateObject() {
    await this.page.locator('text=" Get openlogin state "').click();
    const content = await this.page.locator(".card-container pre").textContent();
    return JSON.parse(content);
  }

  async saveTheDevice() {
    await this.page.click(`input[type="checkbox"]`);
    await this.page.click(`button[aria-label="Save this device"]`);
  }

  async skipTheFactorSetup() {
    await this.page.click(`button[aria-label="Skip for Now"]`);
  }

  async inputPasswordFactor(password: string) {
    await this.page.fill(`#openlogin-password`, password);
    await this.page.fill(`#openlogin-confirm-password`, password);
    await this.page.click(`button[aria-label="Confirm"]`);
  }

  async confirmDone2FASetup() {
    await this.page.click(`button[aria-label="Done"]`);
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
    return { secret, token };
  }
}
