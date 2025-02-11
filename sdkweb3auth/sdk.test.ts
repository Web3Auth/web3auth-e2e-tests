import { expect, test } from "@playwright/test";

import { DashboardPage } from "../authservice/login-with-passwordless/DashboardPage";
import { delay, generateEmailWithTag, verifyEmailPasswordlessWithVerificationCode } from "../authservice/utils";
import { SdkLoginPage } from "./SdkLoginPage";

test.describe("SDK demo web3auth scenarios", () => {
  test.setTimeout(120000);

  test("Can show wallet list @walletList", async ({ page, browser }) => {
    const testEmail = generateEmailWithTag();
    const loginPage = new SdkLoginPage(page);

    await loginPage.gotoSdkLoginPage("https://demo-sdk.web3auth.io/");
    await loginPage.clickTab("General");
    await loginPage.selectNetwork("sapphire_mainnet");

    // ETH
    await loginPage.selectChainNamespace("eip155");
    await loginPage.selectChain("0x1 Ethereum");
    await loginPage.selectAdapters(["coinbase-adapter", "torus-evm-adapter", "wallet-connect-v2-adapter", "injected-adapters"]);
    await loginPage.clickConnectButton();

    await loginPage.clickConnectWalletsBtnW3Modal();

    await loginPage.clickWalletW3Modal("metamask");
    expect(await loginPage.isWalletInfoInW3ModalDisplay("MetaMask")).toBeTruthy();
    await loginPage.clickBackBtnW3Modal();

    await loginPage.clickWalletW3Modal("phantom");
    expect(await loginPage.isWalletInstallationW3ModalDisplay("Phantom")).toBeTruthy();
    await loginPage.clickBackBtnW3Modal();

    await loginPage.clickWalletW3Modal("torus-evm");
    expect(await loginPage.isTorusEmailLoginW3ModalDisplay()).toBeTruthy();
    await loginPage.closeLoginW3Modal();
    await loginPage.clickClosebtnW3Modal();

    // LOGIN BY EMAIL PASSWORDLESS
    await loginPage.clickConnectButton();
    await loginPage.inputEmailW3Modal(testEmail);
    await loginPage.clickContinueBtnW3Modal();

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const tag = testEmail.split("@")[0].split(".")[1];

    await verifyEmailPasswordlessWithVerificationCode(page, browser, {
      email: testEmail,
      tag,
      timestamp: currentTimestamp,
      redirectMode: false,
      previousCode: "",
    });

    await delay(2000);

    const dashboardPage = new DashboardPage(page);
    expect(await dashboardPage.getUserInfoObjectByText()).not.toBeUndefined();
    expect(await dashboardPage.getAccountValueByText()).not.toBe("");
    expect(await dashboardPage.getBalanceValueByText()).not.toBe("");
    expect(await dashboardPage.getSignTransactionValueByText()).not.toBe("");
    expect(await dashboardPage.getSignETHMessageValueByText()).not.toBe("");
    expect(await dashboardPage.getGetConnectedChainIDValueByText()).not.toBe("");
    expect((await dashboardPage.getSignTypedDatav4ValueByText()).signedMessage as string).not.toBe("");
    expect((await dashboardPage.getSignPersonalMessageValueByText()).signedMessage as string).not.toBe("");
    expect((await dashboardPage.getGetIdTokenValueByText()).idToken as string).not.toBe("");
    await loginPage.logout();

    // SOLANA
    await loginPage.selectChainNamespace("solana");
    await loginPage.selectChain("0x1 Solana Mainnet");
    await loginPage.selectAdapters(["torus-solana-adapter", "wallet-connect-v2-adapter", "injected-adapters"]);
    await loginPage.clickConnectButton();

    await loginPage.clickConnectWalletsBtnW3Modal();

    await loginPage.clickWalletW3Modal("trust");
    expect(await loginPage.isWalletInfoInW3ModalDisplay("Trust Wallet")).toBeTruthy();
    await loginPage.clickBackBtnW3Modal();

    await loginPage.clickWalletW3Modal("phantom");
    expect(await loginPage.isWalletInstallationW3ModalDisplay("Phantom")).toBeTruthy();
    await loginPage.clickBackBtnW3Modal();
    await loginPage.clickClosebtnW3Modal();

    // OTHER TABS
    await loginPage.selectChainNamespace("eip155");
    await loginPage.selectChain("0x1 Ethereum");
    await loginPage.selectAdapters(["coinbase-adapter", "torus-evm-adapter", "wallet-connect-v2-adapter", "injected-adapters"]);

    await loginPage.clickTab("WhiteLabel");
    await loginPage.clickConnectButton();
    await loginPage.clickConnectWalletsBtnW3Modal();
    expect(await loginPage.isAdapterListW3ModalDisplay()).toBeTruthy();

    await loginPage.clickClosebtnW3Modal();

    await loginPage.clickTab("Login Provider");
    await loginPage.selectLoginProvider("wechat");
    await loginPage.turnOnOffMainOption();
    await loginPage.turnOnOffonModal();
    await delay(2000);
    await loginPage.clickConnectButton();
    await delay(5000);
    expect((await page.$$("#w3a-modal .w3ajs-socials-adapters li")).length).toBe(1);
    expect(await page.locator("#w3a-modal .w3ajs-socials-adapters button").getAttribute("title")).toBe("Wechat login");
    await loginPage.clickConnectWalletsBtnW3Modal();
    expect(await loginPage.isAdapterListW3ModalDisplay()).toBeTruthy();

    await loginPage.clickClosebtnW3Modal();

    await loginPage.clickTab(" Wallet Plugin ");
    await loginPage.clickConnectButton();
    await loginPage.clickConnectWalletsBtnW3Modal();
    expect(await loginPage.isAdapterListW3ModalDisplay()).toBeTruthy();

    await loginPage.clickClosebtnW3Modal();

    await loginPage.clickTab(" Account Abstraction Provider ");
    await loginPage.turnOnOffAccountAbstractionProvider();
    await loginPage.selectSmartAccountType("Safe");
    await loginPage.clickConnectButton();
    await loginPage.clickConnectWalletsBtnW3Modal();
    expect(await loginPage.isAdapterListW3ModalDisplay()).toBeTruthy();
  });
});
