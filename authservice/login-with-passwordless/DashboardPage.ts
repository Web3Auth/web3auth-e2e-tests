// playwright-dev-page.ts
import { Page } from "@playwright/test";
import otpauth from "otpauth";

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

  async setupAuthenticator() {
    await this.page.locator('text="Enter code manually"').click();

    const secret = await this.page.locator(`div>span`).textContent();
    await this.page.click(`button[aria-label="Next"]`);

    // Generate TOTP token
    const totp = new otpauth.TOTP({
      secret: otpauth.Secret.fromBase32(secret),
      algorithm: "SHA-1",
      digits: 6,
      period: 30,
    });
    const token = totp.generate();
    await this.page.locator(`xpath=.//input[@data-test='single-input']`).first().type(token);
  }
}
