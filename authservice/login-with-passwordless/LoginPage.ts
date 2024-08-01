// playwright-dev-page.ts
import { Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async gotoLoginPage(link: string) {
    await this.page.goto(link);
  }

  async clickLoginButton() {
    await this.page.click(`[data-testid="loginButton"]`);
  }

  async selectBuildEnv(build: string) {
    await selectSingleChoiceDropdown(this.page, "buildEnv", build);
  }

  async selectMFALevel(level: string) {
    await selectSingleChoiceDropdown(this.page, "mfaLevel", level);
  }

  async selectOpenloginNetwork(network: string) {
    await selectSingleChoiceDropdown(this.page, "openloginNetwork", network);
  }

  async selectUXMode(mode: string) {
    await selectSingleChoiceDropdown(this.page, "uxMode", mode);
  }

  async selectLoginProvider(provider: string) {
    await selectSingleChoiceDropdown(this.page, "loginProvider", provider);
  }

  async selectMFAFactor(mfaList: string[]) {
    await selectMultipleChoicesDropdown(this.page, "mfaFactors", mfaList);
  }

  async selectAllMFAFactor() {
    await this.page.locator(`[data-testid="mfaFactors"]`).waitFor({ state: "visible" });
    await this.page.click(`[data-testid="mfaFactors"] button`);

    const allOptions = await this.page.$$(`//*[@data-testid="mfaFactors"]//input`);

    for (const option of allOptions) {
      if ((await option.getAttribute("aria-checked")) === "false") await option.click();
    }

    await this.page.click(`[data-testid="mfaFactors"] button`);
  }

  async selectMFAMandantory(mfaList: string[]) {
    await selectMultipleChoicesDropdown(this.page, "mandatoryMfaFactors", mfaList);
  }

  async inputEmailPasswordless(email: string) {
    await this.page.fill(`input[data-testid="loginHint"]`, email);
  }
}

async function selectSingleChoiceDropdown(page: Page, dataTestId: string, option: string) {
  await page.locator(`[data-testid="${dataTestId}"]`).waitFor({ state: "visible" });
  await page.click(`[data-testid="${dataTestId}"] button`);

  await page.click(`//*[@data-testid="${dataTestId}"]//span[text()="${option}"]`);
  await page.locator(`//*[@data-testid="${dataTestId}"]//button[text()="${option}"]`).waitFor({ state: "visible" });
}

async function selectMultipleChoicesDropdown(page: Page, dataTestId: string, options: string[]) {
  await page.locator(`[data-testid="${dataTestId}"]`).waitFor({ state: "visible" });
  await page.click(`[data-testid="${dataTestId}"] button`);

  // Deselect default options
  const allOptions = await page.$$(`//*[@data-testid="${dataTestId}"]//input`);
  for (const option of allOptions) {
    if ((await option.getAttribute("aria-checked")) === "true") await option.click();
  }

  for (const option of options) {
    await page.click(`//*[@data-testid="${dataTestId}"]//span[text()="${option}"]`);
  }

  await page.click(`[data-testid="${dataTestId}"] button`);
}
