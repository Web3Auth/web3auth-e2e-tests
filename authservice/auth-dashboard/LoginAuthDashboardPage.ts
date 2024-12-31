// playwright-dev-page.ts
import { Page } from "@playwright/test";

export class LoginAuthDashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async gotoLoginAuthDashboardPage() {
    await this.page.goto("https://develop-account.web3auth.io/");
  }

  async clickLoginButton() {
    await this.page.click(`text="Connect with Phone or Email"`);
  }

  async inputEmailPasswordless(email: string) {
    await this.page.fill(`input[aria-labelledby="Phone or Email"]`, email);
  }

  async verifyLogout() {
    await this.page.locator(`input[aria-labelledby="Phone or Email"]`).waitFor({ state: "visible", timeout: 5000 });
  }

  async logout() {
    await this.page.click(`button[aria-label="Logout"]`);
    await this.page.locator(`input[aria-labelledby="Phone or Email"]`).waitFor({ state: "visible" });
  }
}
