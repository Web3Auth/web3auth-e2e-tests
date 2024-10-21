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
    return (await this.page.locator("text=Web3Auth Private key").textContent()).split(" : ")[1];
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

  async getUserInfoObjectByText() {
    await this.page.locator("text=Get User Info").click();
    const content = await this.page.locator(".card-container pre").textContent();
    return JSON.parse(content);
  }

  async getAccountValueByText() {
    await this.page.locator("text=Get Accounts").click();
    const content = await this.page.locator(".card-container pre").textContent();
    return content.trim();
  }

  async getBalanceValueByText() {
    await this.page.locator("text=Get Balance").click();
    const content = await this.page.locator(".card-container pre").textContent();
    return content.trim();
  }

  async getSignTransactionValueByText() {
    await this.page.locator("text=Sign Transaction").click();
    const content = await this.page.locator(".card-container pre").textContent();
    return content.trim();
  }

  async getSignETHMessageValueByText() {
    await this.page.locator("text=Sign ETH Message").click();
    const content = await this.page.locator(".card-container pre").textContent();
    return content.trim();
  }

  async getGetConnectedChainIDValueByText() {
    await this.page.locator("text=Get Connected Chain ID").click();
    const content = await this.page.locator(".card-container pre").textContent();
    return content.trim();
  }

  async getSignTypedDatav4ValueByText() {
    await this.page.locator("text=Sign Typed Data v4").click();
    const content = await this.page.locator(".card-container pre").textContent();
    return JSON.parse(content);
  }

  async getSignPersonalMessageValueByText() {
    await this.page.locator("text=Sign Personal Message").click();
    const content = await this.page.locator(".card-container pre").textContent();
    return JSON.parse(content);
  }

  async getGetIdTokenValueByText() {
    await this.page.locator("text=Get id token").click();
    const content = await this.page.locator(".card-container pre").textContent();
    return JSON.parse(content);
  }
}
