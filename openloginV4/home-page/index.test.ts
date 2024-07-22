import { test, expect, Page } from "@playwright/test";
import { AccountsPage } from "../account-page/AccountsPage";
import { env_map } from "../utils/index";
import {
  signInWithEmail,
  generateRandomEmail,
  catchErrorAndExit,
} from "../utils";

const openloginURL = env_map[process.env.PLATFORM || "prod"];

const testEmail = generateRandomEmail();

test.describe.serial("Home page scenarios", () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    test.setTimeout(300000);
    await page.goto(openloginURL);
    await signInWithEmail(page, testEmail, browser);
    const shouldExit = await catchErrorAndExit(page);
    expect(shouldExit).toBeFalsy();
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000,
    });
  });

  test(`should display user email on top right`, async () => {
    await page.waitForURL(`${openloginURL}/wallet/home`, {
      timeout: 3 * 60 * 1000,
    });
    expect(await page.isVisible(`text=${testEmail}`)).toBeTruthy();
  });

  test(`should display welcome message`, async () => {
    expect(await page.isVisible(`text=Welcome, ${testEmail}`)).toBeTruthy();
  });

  test(`Clicking 'Support' button should redirect user to correct support page`, async () => {
    const accountsPage = new AccountsPage(page);
    const popupPromise = page.waitForEvent("popup");
    await accountsPage.clickSupport();
    const popup = await popupPromise;
    await popup.waitForLoadState();
    const URL = await popup.url();
    expect(URL === "https://help.web3auth.com/en/").toBeTruthy();
    await popup.close();
  });

  test(`Clicking 'Learn more' button should redirect user to correct docs page`, async () => {
    const accountsPage = new AccountsPage(page);
    const popupPromise = page.waitForEvent("popup");
    await accountsPage.clickLearnMore();
    const popup = await popupPromise;
    await popup.waitForLoadState();
    const URL = await popup.url();
    expect(
      URL === "https://docs.tor.us/open-login/what-is-openlogin"
    ).toBeTruthy();
    await popup.close();
  });

  test(`Clicking 'Logout' button should logout user`, async () => {
    const accountsPage = new AccountsPage(page);
    await accountsPage.clickLogout();
    expect(
      await page.getByText("Select how you would like to continue").isVisible()
    );
  });
});
