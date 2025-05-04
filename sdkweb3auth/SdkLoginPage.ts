import { FrameLocator, Page } from "@playwright/test";

import { selectMultipleChoicesDropdown, selectSingleChoiceDropdown } from "../authservice/login-with-passwordless/LoginPage";
import { delay } from "../authservice/utils";

export async function checkVisible(page: Page, locator: string, timeout = 5000) {
  try {
    await page.waitForSelector(locator, { state: "visible", timeout });
    return true;
  } catch (error) {
    return false;
  }
}

export async function switchOnOff(page: Page, nameSwitch: string, turnOn = true) {
  const isOn = await page.locator(`//div[div/span[text()="${nameSwitch}"]]/label/input`).isChecked();

  if (isOn !== turnOn) await page.click(`//div[div/span[text()="${nameSwitch}"]]/label`);
}

export async function checkVisibleIframe(frame: FrameLocator, locator: string, timeout = 5000) {
  try {
    await frame.locator(locator).waitFor({ state: "visible", timeout });
    return true;
  } catch (error) {
    return false;
  }
}

export class SdkLoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async gotoSdkLoginPage(link: string) {
    await this.page.goto(link);
  }

  async clickConnectButton() {
    await delay(1000);
    await this.page.click(`[data-testid="loginButton"]`);
  }

  async clickTab(tabName: string) {
    await this.page.click(`//li[contains(@class,'tab-container')]/div[text()='${tabName}']`);
    await checkVisible(this.page, `//li[@aria-selected="true" and contains(@class,'tab-container')]/div[text()='${tabName}']`);
  }

  async selectNetwork(network: string) {
    await selectSingleChoiceDropdown(this.page, "selectNetwork", network);
  }

  async selectChainNamespace(chainNamespace: string) {
    await selectSingleChoiceDropdown(this.page, "selectChainNamespace", chainNamespace);
  }

  async selectChain(chain: string) {
    await selectSingleChoiceDropdown(this.page, "selectChain", chain);
  }

  async selectLoginProvider(provider: string) {
    await selectSingleChoiceDropdown(this.page, "selectLoginProviders", provider, true);
  }

  async selectSmartAccountType(type: string) {
    await selectSingleChoiceDropdown(this.page, "smartAccountType", type, true);
  }

  async selectAdapters(adapterList: string[]) {
    await selectMultipleChoicesDropdown(this.page, "selectAdapters", adapterList);
  }

  async selectTab(tabName: string) {
    await this.page.click(`//li[@role="tab"]/div[text()="${tabName}"]`);
  }

  async turnOnOffMainOption(turnOn = true) {
    await switchOnOff(this.page, "Main Option", turnOn);
  }

  async turnOnOffonModal(turnOn = true) {
    await switchOnOff(this.page, "on Modal?", turnOn);
  }

  async turnOnOffAccountAbstractionProvider(turnOn = true) {
    await switchOnOff(this.page, "Account Abstraction Provider", turnOn);
  }

  async turnOnOffUseAccountAbstractionProviderWithExternalWallet(turnOn = true) {
    await switchOnOff(this.page, "Use Account Abstraction Provider with external wallet", turnOn);
  }

  async inputEmailW3Modal(email: string) {
    await this.page.fill(`#w3a-modal input[name="passwordless-input"]`, email);
  }

  async clickContinueBtnW3Modal() {
    await this.page.click(`//div[@id="w3a-modal"]//button[text()="Continue"]`);
  }

  async clickConnectWalletsBtnW3Modal() {
    await this.page.click(`//div[@id="w3a-modal"]//button[text()="Continue with a wallet"]`);
  }

  async clickClosebtnW3Modal() {
    await this.page.click(`#w3a-modal button.w3ajs-close-btn`);
  }

  async clickWalletW3Modal(walletName: string) {
    await this.page.click(`button[title="${walletName}"]`);
  }

  async clickBackBtnW3Modal() {
    await this.page.click(`#w3a-modal button.w3ajs-external-back`);
  }

  async isQRCodeW3ModalDisplay(walletName: string) {
    return checkVisible(this.page, `text="${walletName}"`) && checkVisible(this.page, `.w3ajs-wallet-connect-qr`);
  }

  async isWalletInstallationW3ModalDisplay(walletName: string) {
    const isTitleDisplay = await checkVisible(this.page, `text="Get ${walletName}"`);
    const isChromeXtensionDisplay = await checkVisible(this.page, 'text="Install Chrome extension"');
    const isAndroidDisplay = await checkVisible(this.page, 'text="Install Android app"');
    const isiOSDisplay = await checkVisible(this.page, 'text="Install iOS app"');
    return isTitleDisplay && isChromeXtensionDisplay && isAndroidDisplay && isiOSDisplay;
  }

  async isWalletInfoInW3ModalDisplay(walletName: string) {
    const isQRDisplay = await checkVisible(this.page, `text="${walletName}"`);

    if (isQRDisplay) return checkVisible(this.page, `.w3ajs-wallet-connect-qr`);

    const isTitleDisplay = await checkVisible(this.page, `text="Get ${walletName}"`);
    const isChromeXtensionDisplay = await checkVisible(this.page, 'text="Install Chrome extension"');
    const isAndroidDisplay = await checkVisible(this.page, 'text="Install Android app"');
    const isiOSDisplay = await checkVisible(this.page, 'text="Install iOS app"');
    return isTitleDisplay && isChromeXtensionDisplay && isAndroidDisplay && isiOSDisplay;
  }

  async isTorusEmailLoginW3ModalDisplay() {
    const iframe = this.page.frameLocator("#torusIframe");
    return checkVisibleIframe(iframe, "button.gmt-login-email");
  }

  async isLoginW3ModalDisplay() {
    const iframe = this.page.frameLocator("#torusIframe");
    return checkVisibleIframe(iframe, `.login-dialog-container`);
  }

  async isAdapterListW3ModalDisplay() {
    return checkVisible(this.page, `div#w3a-modal .w3a-modal__content_external_wallet`);
  }

  async closeLoginW3Modal() {
    const iframe = this.page.frameLocator("#torusIframe");
    await iframe.locator(`.login-dialog-container .close-btn`).click();
  }

  async logout() {
    await this.page.click('text="Logout"');
  }
}
