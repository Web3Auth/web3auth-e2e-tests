// playwright-dev-page.ts
import { Page } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async clickEnableMFA() {
    await this.page.click(`button[data-testid="btnEnableMFA"]`);
  }

  async getOpenLoginPrivateKey() {
    return (await this.page.locator("text=Openlogin Private key").textContent()).split(" : ")[1];
  }

  async getUserInfoObject() {
    await this.page.locator('[data-testid="btnGetUserInfo"]').click();
    const content = await this.page.locator(".card-container pre").textContent();
    return JSON.parse(content);
  }

  async getOpenloginStateObject() {
    await this.page.locator('[data-testid="btnGetOpenloginState"]').click();
    const content = await this.page.locator(".card-container pre").textContent();
    return JSON.parse(content);
  }
}
