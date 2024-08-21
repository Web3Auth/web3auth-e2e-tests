// playwright-dev-page.ts
import { expect, Page } from "@playwright/test";

import { delay } from "../utils/index";
export class WalletServicesPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async verifyBalanceAndAddress(address: string, balance: string) {
    await delay(2000);
    expect(await this.page.locator(`xpath=.//div/button/span[contains(@class,'!text-xs')]`).first().textContent()).toContain(address);
    const walletBalance = await this.page.locator(`xpath=.//p[contains(text(),'Total Wallet Balance')]/parent::div/div/p`).first().textContent();
    expect(parseInt(walletBalance!)).toBeGreaterThanOrEqual(parseInt(balance));
  }

  async verifyNetworkName(name: string) {
    expect(await this.page.locator(`xpath=.//div[contains(@class,'!hidden @lg/wallet')]//button`).first().textContent()).toContain(name);
  }

  async verifyAvailableBalance(balance: string) {
    expect(await this.page.locator(`xpath=.//p[text()='Available Balance']/parent::div/p`).last().textContent()).toContain(balance);
  }

  async verifyTransferTokenAmount(content: string) {
    expect(await this.page.locator(`xpath=.//div[text()='Amount']/following-sibling::div`).first().textContent()).toContain(content);
  }

  async verifyTransferFromAddress(content: string) {
    expect(
      await this.page.locator(`xpath=.//p[text()='Sepolia Test Network']/parent::div/following-sibling::div//p`).first().textContent()
    ).toContain(content);
  }

  async verifyTransferToAddress(content: string) {
    expect(await this.page.locator(`xpath=.//p[text()='Sepolia Test Network']/parent::div/following-sibling::div//p`).last().textContent()).toContain(
      content
    );
  }

  async verifyTransferFee(transactionFee: string) {
    const fee = await this.page.locator(`xpath=.//p[text()='Transaction cost']/parent::div//div/p`).last().textContent();
    expect(parseInt(fee!)).toBeGreaterThanOrEqual(parseInt(transactionFee));
  }

  async verifyTransactionActivity(details: string) {
    console.log(details);
    const parts = details.split("|");
    const block = await this.page.locator(`xpath=.//ul/li/ul/li/div/div`);
    for (const part of parts) {
      console.log(part.trim());
      expect(await block.locator(`xpath=.//p[contains(text(),"${part.trim()}")]`).last().isVisible()).toBeTruthy();
    }
  }

  async navigateToSettingsWithOption(option: string) {
    await delay(5000);
    await this.page.goto("https://develop-wallet.web3auth.io/wallet/settings");
    await this.page.waitForSelector(`xpath=.//div[text()="${option}"]`);
    await this.page.locator(`xpath=.//div[text()="${option}"]`).click();
  }

  async enableTestNetwork() {
    await delay(5000);
    await this.page.locator(`xpath=.//div/p[text()='Test networks']/parent::div/parent::div/div`).first().click();
  }

  async inputPrivateKey(key: string) {
    await this.page.locator(`xpath=.//input[@aria-placeholder='Private Key']`).fill(key);
    await this.page.locator(`xpath=.//button/p[text()='Import']`).click();
  }

  async enableTestNetworks() {
    await this.page.locator(`xpath=.//*[contains(@class,'switch round')]`).first().click();
  }

  async selectNetwork(currentNetwork: string, newNetwork: string) {
    await this.page.locator(`xpath=.//p[text()='Select Default Network']/parent::div//button`).first().click();
    await this.page.waitForSelector(`xpath=.//li/div/div/p[text()='${newNetwork}']`);
    await this.page.locator(`xpath=.//li/div/div/p[text()='${newNetwork}']`).first().click();
    await delay(5000);
  }

  async verifyBuyOption() {
    expect(
      await this.page.frameLocator("iframe").first().locator(`xpath=.//input[@data-testid='buy-crypto-fiat-amount-input']`).isVisible()
    ).toBeTruthy();
  }

  async selectCurrency(currency: string) {
    await this.page.locator(`xpath=.//p[text()='Select Default Currency']/parent::div//button`).first().click();
    await this.page.waitForSelector(`xpath=.//div/span[text()='${currency}']`);
    await this.page.locator(`xpath=.//div/span[text()='${currency}']`).first().click();
    await delay(5000);
  }

  async selectSpeed(speed: string) {
    await this.page.locator(`xpath=.//label[text()='Transaction Fee ']/parent::div//button`).first().click();
    await this.page.waitForSelector(`xpath=.//span[text()='${speed}']`);
    await this.page.locator(`xpath=.//span[text()='${speed}']`).first().click();
    await delay(5000);
  }

  async clickOption(name: string) {
    await delay(2000);
    await this.page.locator(`xpath=.//p[text()="${name}"]`).first().click();
  }

  async clickLink(name: string) {
    await this.page.locator(`xpath=.//*[text()='${name}']`).first().click();
  }

  async clickHome() {
    await this.page.locator(`xpath=.//a[@href='/wallet/home']`).first().click();
  }

  async enterRecipientAddress(address: string) {
    await this.page.locator(`xpath=.//input[@placeholder='Enter recipient address']`).fill(address);
  }

  async enterTransactionAmount(amount: string) {
    await this.page.locator(`xpath=.//input[@type='number']`).first().fill(amount);
  }

  async registerUser(name: string) {
    await this.page.locator("xpath=.//input[@type='checkbox']").click();
    await this.page.locator('button:has-text("Next")').click();
    await this.page.locator(`xpath=.//input[@placeholder='Select an industry']`).first().click();
    await this.page.locator('span:has-text("Gaming")').click();
    await this.page.locator(`xpath=.//input[@placeholder='Select an organization size']`).first().click();
    await this.page.locator('span:has-text("1-9")').click();
    await this.page.locator(`xpath=.//input[@placeholder='e.g. Acme Corp / Bonnie Green']`).first().fill(name);
    await this.page.locator('button:has-text(" Next: Account Info ")').click();
    await this.page.locator('button:has-text("Next")').click();
  }

  async createProject(name: string, product: string, environment: string, platform: string) {
    await this.page.locator("#projectName").first().waitFor();
    await this.page.locator("#projectName").first().fill(name);
    await this.page.locator(`xpath=.//input[@placeholder='0 products selected']`).first().click();
    await this.page.locator(`span:has-text("${product}")`).first().click();
    await this.page.locator(`xpath=.//input[@placeholder='0 platforms selected']`).first().click();
    await this.page.locator(`span:has-text("${platform}")`).first().click();
    await this.page.locator("#projectName").first().click();
    await this.page.locator("#networkEnvironment").first().click();
    await this.page.waitForSelector(`div:has-text("${environment}")`);
    await this.page.locator(`xpath=.//div[text()="${environment}"]`).first().click();
    await this.page.locator('button:has-text(" Create Project ")').first().click();
  }

  async createVerifier(name: string, provider: string) {
    await this.page.locator(`xpath=.//input[@placeholder='Eg. ppp-custom-test']`).first().fill(name);
    await this.page.locator(`xpath=.//input[@placeholder='Select Login Provider*']`).first().click();
    await this.page.locator(`span:has-text("${provider}")`).first().click();
    await this.page.locator(`xpath=.//input[@placeholder='e.g. 123456789012345678']`).first().fill("1234567890");
    expect(await this.page.locator("xpath=.//p[text()='Client ID is invalid']").isVisible()).toBe(true);
    await this.page.locator(`xpath=.//input[@placeholder='e.g. 123456789012345678']`).first().fill("1234111111111111111");
    await this.page.click('button:has-text(" Create Verifier ")');
  }

  async createMainnetProject(name: string, environment: string) {
    await this.page.waitForSelector("#CreateProjectName");
    await this.page.locator("#CreateProjectName").fill(name);
    // await this.page.locator("#networkEnvironment").first().click();
    // await this.page.waitForSelector(`div:has-text("${environment}")`);
    // await this.page
    //   .locator(`xpath=.//div[text()="${environment}"]`)
    //   .first()
    //   .click();
    console.log(environment);
    await this.page.locator('button:has-text(" Create Mainnet Project ")').last().click();
  }

  async navigateTo(option: string) {
    await this.page.click(`span:has-text("${option}")`);
  }

  async navigateToTab(option: string) {
    await this.page.locator(`xpath=.//div[text()="${option}"]`).click();
  }

  async verifyUserRole(email: string, role: string) {
    expect(await this.page.locator(`xpath=.//p[text()="${email}"]/ancestor::td/following-sibling::td/div`).first().textContent()).toContain(role);
  }

  async searchAndSelectProject(name: string, environment: string) {
    await this.page.locator(`xpath=.//input[@aria-placeholder='Search for projects']`).first().fill(name);
    await this.page.locator(`xpath=.//h6[text()="${name}"]/parent::td/following-sibling::td[text()="${environment}"]`).first().click();
  }

  async verifyProject(name: string, environment: string, platform: string) {
    await this.page.waitForSelector(`h1:has-text("${name}")`);
    console.log(`text${await this.page.locator("#ProjectName").first().inputValue()}`);
    expect(await this.page.locator("#ProjectName").first().inputValue()).toContain(name);
    expect(await this.page.locator("#EnvironmentNetwork").first().inputValue()).toContain(environment);
    expect(await this.page.locator("xpath=.//input[@aria-placeholder='1 platforms selected']").first().inputValue()).toContain(platform);
  }

  async verifyTeamName(name: string) {
    expect(await this.page.locator('xpath=.//p[text()="Team Workspace"]/preceding-sibling::h6').textContent()).toEqual(name);
  }

  async verifyMessageIsDisplayed(message: string) {
    expect(await this.page.locator(`xpath=.//p[text()="${message}"]`).isVisible()).toBe(true);
  }

  async verifyInvoiceAndCardAddedIsDisplayed(message: string) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const d = new Date();
    const billName = `Plan: ${monthNames[d.getMonth()]}${d.getFullYear()}`;
    expect(await this.page.locator(`xpath=.//h2[text()="${message}"]`).isVisible()).toBe(true);
    expect(await this.page.locator(`xpath=.//td/a[text()="${billName}"]`).isVisible()).toBe(true);
  }

  async updateProject(chain: string) {
    await this.page.waitForSelector("#ChainId");
    await this.page.locator("#ChainId").click();
    await this.page.click(`span:has-text("${chain}")`);
    await this.page.locator(`xpath=.//textarea[@placeholder='Explain a bit about your project (optional)']`).first().fill("description");
  }

  async clickButton(name: string) {
    await this.page.locator(`xpath=.//button[text()='${name}']`).last().waitFor();
    await this.page.locator(`xpath=.//button[text()='${name}']`).last().click();
  }

  async verifyNftIsPresent(name: string) {
    await this.page.waitForSelector(`xpath=.//button/div[text()='NFT']`);
    await this.page.locator(`xpath=.//button/div[text()='NFT']`).last().click();
    expect(await this.page.locator(`xpath=.//div/p[text()='${name}']`).isVisible()).toBeTruthy();
  }

  async clickCreateVerifier() {
    await this.page.click('button:has-text(" Create Verifier ")');
  }

  async clickArchive(name: string) {
    await this.page.click('button:has-text(" Archive Project ")');
    await this.page.locator(`xpath=.//input[contains(@aria-label, 'Please type')]`).fill(name);
    await this.page.click('button:has-text(" I understand, archive this project ")');
  }

  async clickCreateMainnet() {
    await this.page.click('button:has-text(" Create Mainnet Project ")');
  }

  async addNewTeam(teamName: string, email: string) {
    await this.page.click('p:has-text("Personal Workspace")');
    await this.page.click('button:has-text("+ Add a new team")');
    await this.page.waitForSelector("xpath=.//input[contains(@aria-label, 'Enter a team name')]");
    await this.page.locator(`xpath=.//input[contains(@aria-label, 'Enter a team name')]`).fill(teamName);
    await this.page.locator(`xpath=.//input[contains(@aria-label, 'Enter a team email')]`).fill(email);
    await this.page.locator(`xpath=.//input[contains(@aria-label, 'Enter a team size')]`).fill("10");
    await this.page.click('button:has-text("Create Team")');
  }

  async upgradePlan() {
    await this.page.click('xpath=.//a[text()="upgrade your plan."]');
    await this.page.locator('button:has-text("Choose Plan")').first().click();
    await this.page.frameLocator('[title="Secure payment input frame"]').locator("#Field-numberInput").fill("4242 4242 4242 4242");
    await this.page.frameLocator('[title="Secure payment input frame"]').locator("#Field-expiryInput").fill("0245");
    await this.page.frameLocator('[title="Secure payment input frame"]').locator("#Field-cvcInput").fill("123");
    await this.page.locator("#agreePolicy").click();
    await this.page.locator('button:has-text("Change Plan")').last().click();
  }

  async inviteNewTeamMember(email: string) {
    await this.page.click('button:has-text("+ Add Member")');
    await this.page.waitForSelector("#EmailAddress");
    await this.page.locator("#EmailAddress").fill(email);
    await this.page.locator("#Role").click();
    await this.page.click('span:has-text("Admin")');
    await this.page.locator('button:has-text("Add Member")').last().click();
  }
}
